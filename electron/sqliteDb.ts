import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export class SqliteDatabaseManager {
  private db: Database | null = null;
  private dbFilePath: string;
  private isInitialized = false;

  constructor() {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.dbFilePath = path.join(userDataPath, 'lankahr.sqlite');
    console.log(`[SqliteDB] SQLite Database file path: ${this.dbFilePath}`);
  }

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    try {
      const SQL = await initSqlJs();
      if (fs.existsSync(this.dbFilePath)) {
        const fileBuffer = fs.readFileSync(this.dbFilePath);
        this.db = new SQL.Database(fileBuffer);
        console.log('[SqliteDB] Loaded existing SQLite database from disk.');
      } else {
        this.db = new SQL.Database();
        console.log('[SqliteDB] Created new in-memory SQLite database.');
      }

      this.createTables();
      this.saveToDisk();
      this.isInitialized = true;
    } catch (err: any) {
      console.error('[SqliteDB] Failed to initialize SQLite database:', err);
      throw err;
    }
  }

  private createTables(): void {
    if (!this.db) return;

    const schema = `
      CREATE TABLE IF NOT EXISTS system_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS company_settings (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        code TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS designations (
        id TEXT PRIMARY KEY,
        code TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS payroll_categories (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS allowance_rules (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS leave_types (
        id TEXT PRIMARY KEY,
        code TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        employee_code TEXT UNIQUE,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        ip_address TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS raw_punches (
        id TEXT PRIMARY KEY,
        device_id TEXT,
        user_id TEXT,
        punch_timestamp TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS processed_attendance (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        date TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS employee_leaves (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        start_date TEXT,
        end_date TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS incentives (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        month_year TEXT,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS payroll_periods (
        id TEXT PRIMARY KEY,
        month_year TEXT UNIQUE,
        data TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        action TEXT,
        data TEXT NOT NULL
      );
    `;

    this.db.exec(schema);
  }

  public saveToDisk(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbFilePath, buffer);
      // Also write atomic json snapshot in userData as dual protection
      const userDataPath = app.getPath('userData');
      const backupJsonPath = path.join(userDataPath, 'lankahr_data_snapshot.json');
      const state = this.getFullState();
      fs.writeFileSync(backupJsonPath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[SqliteDB] Error saving SQLite database to disk:', err);
    }
  }

  public getFullState(): any {
    if (!this.db) return null;

    const readTable = (tableName: string): any[] => {
      try {
        const stmt = this.db!.prepare(`SELECT data FROM ${tableName}`);
        const rows: any[] = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          if (row.data) {
            try {
              rows.push(JSON.parse(row.data as string));
            } catch {}
          }
        }
        stmt.free();
        return rows;
      } catch (err) {
        console.error(`[SqliteDB] Error reading table ${tableName}:`, err);
        return [];
      }
    };

    const readSingle = (tableName: string): any => {
      const rows = readTable(tableName);
      return rows.length > 0 ? rows[0] : null;
    };

    const settings = readSingle('company_settings');
    const departments = readTable('departments');
    const designations = readTable('designations');
    const payrollCategories = readTable('payroll_categories');
    const allowanceRules = readTable('allowance_rules');
    const leaveTypes = readTable('leave_types');
    const employees = readTable('employees');
    const devices = readTable('devices');
    const rawPunches = readTable('raw_punches');
    const processedAttendance = readTable('processed_attendance');
    const employeeLeaves = readTable('employee_leaves');
    const incentives = readTable('incentives');
    const payrollPeriods = readTable('payroll_periods');
    const auditLogs = readTable('audit_logs');

    // Read system metadata
    let version = 3;
    let lastUpdated = new Date().toISOString();
    try {
      const stmt = this.db.prepare(`SELECT key, value FROM system_metadata`);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        if (row.key === 'version') version = parseInt(row.value as string, 10) || 3;
        if (row.key === 'lastUpdated') lastUpdated = (row.value as string) || lastUpdated;
      }
      stmt.free();
    } catch {}

    return {
      version,
      lastUpdated,
      companySettings: settings,
      departments,
      designations,
      payrollCategories,
      allowanceRules,
      leaveTypes,
      employees,
      devices,
      rawPunches,
      processedAttendance,
      employeeLeaves,
      incentives,
      payrollPeriods,
      auditLogs
    };
  }

  public saveFullState(state: any): { success: boolean; error?: string } {
    if (!this.db) return { success: false, error: 'Database not initialized' };

    try {
      this.db.exec('BEGIN TRANSACTION');

      // Update metadata
      this.db.run('INSERT OR REPLACE INTO system_metadata (key, value, updated_at) VALUES (?, ?, ?)', [
        'version',
        String(state.version || 3),
        new Date().toISOString()
      ]);
      this.db.run('INSERT OR REPLACE INTO system_metadata (key, value, updated_at) VALUES (?, ?, ?)', [
        'lastUpdated',
        state.lastUpdated || new Date().toISOString(),
        new Date().toISOString()
      ]);

      // Company Settings
      if (state.companySettings) {
        this.db.run('DELETE FROM company_settings');
        this.db.run('INSERT INTO company_settings (id, data, updated_at) VALUES (?, ?, ?)', [
          state.companySettings.id || 'company-01',
          JSON.stringify(state.companySettings),
          new Date().toISOString()
        ]);
      }

      // Helper to replace table contents
      const replaceTable = (tableName: string, items: any[], getId: (item: any) => string) => {
        this.db!.run(`DELETE FROM ${tableName}`);
        if (Array.isArray(items) && items.length > 0) {
          items.forEach(item => {
            const id = getId(item) || `${tableName}-${Date.now()}-${Math.random()}`;
            this.db!.run(`INSERT INTO ${tableName} (id, data, updated_at) VALUES (?, ?, ?)`, [
              id,
              JSON.stringify(item),
              new Date().toISOString()
            ]);
          });
        }
      };

      replaceTable('departments', state.departments, i => i.id);
      replaceTable('designations', state.designations, i => i.id);
      replaceTable('payroll_categories', state.payrollCategories, i => i.id);
      replaceTable('allowance_rules', state.allowanceRules, i => i.id);
      replaceTable('leave_types', state.leaveTypes, i => i.id);
      replaceTable('employees', state.employees, i => i.id);
      replaceTable('devices', state.devices, i => i.id);
      replaceTable('raw_punches', state.rawPunches, i => i.id);
      replaceTable('processed_attendance', state.processedAttendance, i => i.id);
      replaceTable('employee_leaves', state.employeeLeaves, i => i.id);
      replaceTable('incentives', state.incentives, i => i.id);
      replaceTable('payroll_periods', state.payrollPeriods, i => i.id);

      // Audit logs (preserve or replace)
      if (Array.isArray(state.auditLogs)) {
        this.db.run('DELETE FROM audit_logs');
        state.auditLogs.slice(0, 500).forEach((log: any) => {
          this.db!.run('INSERT INTO audit_logs (id, timestamp, action, data) VALUES (?, ?, ?, ?)', [
            log.id || `audit-${Date.now()}`,
            log.timestamp || new Date().toISOString(),
            log.action || 'LOG',
            JSON.stringify(log)
          ]);
        });
      }

      this.db.exec('COMMIT');
      this.saveToDisk();
      return { success: true };
    } catch (err: any) {
      if (this.db) {
        try { this.db.exec('ROLLBACK'); } catch {}
      }
      console.error('[SqliteDB] Error saving full state to SQLite:', err);
      return { success: false, error: err.message };
    }
  }

  public clearDatabase(): { success: boolean; error?: string } {
    if (!this.db) return { success: false, error: 'Database not initialized' };
    try {
      this.db.exec(`
        DELETE FROM company_settings;
        DELETE FROM departments;
        DELETE FROM designations;
        DELETE FROM payroll_categories;
        DELETE FROM allowance_rules;
        DELETE FROM leave_types;
        DELETE FROM employees;
        DELETE FROM devices;
        DELETE FROM raw_punches;
        DELETE FROM processed_attendance;
        DELETE FROM employee_leaves;
        DELETE FROM incentives;
        DELETE FROM payroll_periods;
        DELETE FROM audit_logs;
      `);
      this.saveToDisk();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public getDbPath(): string {
    return this.dbFilePath;
  }
}
