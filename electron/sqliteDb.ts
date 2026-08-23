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

      CREATE TABLE IF NOT EXISTS holidays (
        id TEXT PRIMARY KEY,
        holiday_date TEXT,
        holiday_name TEXT,
        holiday_type TEXT,
        year INTEGER,
        created_at TEXT,
        updated_at TEXT,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS monthly_working_days (
        id TEXT PRIMARY KEY,
        year INTEGER,
        month TEXT,
        auto_working_days INTEGER,
        manual_override INTEGER,
        manual_working_days INTEGER,
        final_working_days INTEGER,
        updated_by TEXT,
        updated_at TEXT,
        data TEXT NOT NULL
      );
    `;

    this.db.exec(schema);
  }

  public saveToDisk(): { success: boolean; error?: string } {
    if (!this.db) return { success: false, error: 'Database not initialized' };
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbFilePath, buffer);
      // Also write atomic json snapshot in userData as dual protection
      const userDataPath = app.getPath('userData');
      const backupJsonPath = path.join(userDataPath, 'lankahr_data_snapshot.json');
      const state = this.getFullState();
      fs.writeFileSync(backupJsonPath, JSON.stringify(state, null, 2), 'utf-8');
      return { success: true };
    } catch (err: any) {
      console.error('[SqliteDB] Error saving SQLite database to disk:', err);
      return { success: false, error: err.message };
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
    const holidays = readTable('holidays');
    const monthlyWorkingDays = readTable('monthly_working_days');

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
      auditLogs,
      holidays,
      monthlyWorkingDays
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
        this.db.run('INSERT OR REPLACE INTO company_settings (id, data, updated_at) VALUES (?, ?, ?)', [
          state.companySettings.id || 'company-01',
          JSON.stringify(state.companySettings),
          new Date().toISOString()
        ]);
      }

      // Helper to perform ID-based UPSERT / ON CONFLICT(id) DO UPDATE SET
      const upsertRecord = (tableName: string, item: any, id: string) => {
        if (tableName === 'holidays') {
          this.db!.run(
            `INSERT INTO holidays (id, holiday_date, holiday_name, holiday_type, year, created_at, updated_at, data)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               holiday_date = excluded.holiday_date,
               holiday_name = excluded.holiday_name,
               holiday_type = excluded.holiday_type,
               year = excluded.year,
               updated_at = excluded.updated_at,
               data = excluded.data`,
            [
              id,
              item.date || '',
              item.name || '',
              item.type || 'Poya',
              item.year || 0,
              item.createdAt || new Date().toISOString(),
              new Date().toISOString(),
              JSON.stringify(item)
            ]
          );
        } else if (tableName === 'monthly_working_days') {
          this.db!.run(
            `INSERT INTO monthly_working_days (id, year, month, auto_working_days, manual_override, manual_working_days, final_working_days, updated_by, updated_at, data)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               year = excluded.year,
               month = excluded.month,
               auto_working_days = excluded.auto_working_days,
               manual_override = excluded.manual_override,
               manual_working_days = excluded.manual_working_days,
               final_working_days = excluded.final_working_days,
               updated_by = excluded.updated_by,
               updated_at = excluded.updated_at,
               data = excluded.data`,
            [
              id,
              item.year || 0,
              item.month || '',
              item.autoWorkingDays || 0,
              item.manualOverride ? 1 : 0,
              item.manualWorkingDays || 0,
              item.finalWorkingDays || 0,
              item.updatedBy || '',
              item.updatedAt || new Date().toISOString(),
              JSON.stringify(item)
            ]
          );
        } else if (tableName === 'departments') {
          this.db!.run(
            `INSERT INTO departments (id, code, data, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               code = excluded.code,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.code || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else if (tableName === 'designations') {
          this.db!.run(
            `INSERT INTO designations (id, code, data, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               code = excluded.code,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.code || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else if (tableName === 'leave_types') {
          this.db!.run(
            `INSERT INTO leave_types (id, code, data, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               code = excluded.code,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.code || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else if (tableName === 'employees') {
          this.db!.run(
            `INSERT INTO employees (id, employee_code, data, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               employee_code = excluded.employee_code,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.employeeCode || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else if (tableName === 'devices') {
          this.db!.run(
            `INSERT INTO devices (id, ip_address, data, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               ip_address = excluded.ip_address,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.ipAddress || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else if (tableName === 'raw_punches') {
          this.db!.run(
            `INSERT INTO raw_punches (id, device_id, user_id, punch_timestamp, data, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               device_id = excluded.device_id,
               user_id = excluded.user_id,
               punch_timestamp = excluded.punch_timestamp,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.deviceId || '',
              item.userId || '',
              item.timestamp || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else if (tableName === 'processed_attendance') {
          this.db!.run(
            `INSERT INTO processed_attendance (id, employee_id, date, data, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               employee_id = excluded.employee_id,
               date = excluded.date,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.employeeId || '',
              item.date || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else if (tableName === 'employee_leaves') {
          this.db!.run(
            `INSERT INTO employee_leaves (id, employee_id, start_date, end_date, data, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               employee_id = excluded.employee_id,
               start_date = excluded.start_date,
               end_date = excluded.end_date,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.employeeId || '',
              item.startDate || '',
              item.endDate || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else if (tableName === 'incentives') {
          this.db!.run(
            `INSERT INTO incentives (id, employee_id, month_year, data, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               employee_id = excluded.employee_id,
               month_year = excluded.month_year,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.employeeId || '',
              item.payrollMonth || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else if (tableName === 'payroll_periods') {
          this.db!.run(
            `INSERT INTO payroll_periods (id, month_year, data, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               month_year = excluded.month_year,
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              item.monthYear || item.month || '',
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        } else {
          this.db!.run(
            `INSERT INTO ${tableName} (id, data, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               data = excluded.data,
               updated_at = excluded.updated_at`,
            [
              id,
              JSON.stringify(item),
              new Date().toISOString()
            ]
          );
        }
      };

      const upsertTable = (tableName: string, items: any[], getId: (item: any) => string) => {
        if (Array.isArray(items) && items.length > 0) {
          items.forEach(item => {
            const id = getId(item) || `${tableName}-${Date.now()}-${Math.random()}`;
            upsertRecord(tableName, item, id);
          });
        }
      };

      upsertTable('departments', state.departments, i => i.id);
      upsertTable('designations', state.designations, i => i.id);
      upsertTable('payroll_categories', state.payrollCategories, i => i.id);
      upsertTable('allowance_rules', state.allowanceRules, i => i.id);
      upsertTable('leave_types', state.leaveTypes, i => i.id);
      upsertTable('employees', state.employees, i => i.id);
      upsertTable('devices', state.devices, i => i.id);
      upsertTable('raw_punches', state.rawPunches, i => i.id);
      upsertTable('processed_attendance', state.processedAttendance, i => i.id);
      upsertTable('employee_leaves', state.employeeLeaves, i => i.id);
      upsertTable('incentives', state.incentives, i => i.id);
      upsertTable('payroll_periods', state.payrollPeriods, i => i.id);
      upsertTable('holidays', state.holidays || [], i => i.id);
      upsertTable('monthly_working_days', state.monthlyWorkingDays || [], i => i.id);

      // Process explicit deletions if sent from frontend
      if (state.deletedIds) {
        const deletedMap = state.deletedIds;
        const tablesToClean = [
          { key: 'employees', table: 'employees' },
          { key: 'employeeLeaves', table: 'employee_leaves' },
          { key: 'holidays', table: 'holidays' },
          { key: 'departments', table: 'departments' },
          { key: 'designations', table: 'designations' },
          { key: 'devices', table: 'devices' },
          { key: 'rawPunches', table: 'raw_punches' },
          { key: 'processedAttendance', table: 'processed_attendance' },
          { key: 'incentives', table: 'incentives' },
          { key: 'payrollCategories', table: 'payroll_categories' },
          { key: 'payrollPeriods', table: 'payroll_periods' },
          { key: 'allowanceRules', table: 'allowance_rules' },
          { key: 'leaveTypes', table: 'leave_types' },
          { key: 'monthlyWorkingDays', table: 'monthly_working_days' }
        ];

        tablesToClean.forEach(({ key, table }) => {
          const ids: string[] = deletedMap[key];
          if (Array.isArray(ids) && ids.length > 0) {
            ids.forEach(id => {
              if (id) {
                this.db!.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
                console.log(`[SqliteDB] Explicitly deleted record with ID ${id} from table ${table}.`);
              }
            });
          }
        });
      }

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
      const diskRes = this.saveToDisk();
      if (!diskRes.success) {
        return { success: false, error: diskRes.error };
      }
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
