import {
  Employee,
  RawAttendancePunch,
  ProcessedAttendance,
  AttendanceStatus,
  CompanySettings,
  EmployeeLeave
} from '../types';

export interface AttendanceProcessingResult {
  processedCount: number;
  records: ProcessedAttendance[];
  warnings: string[];
}

export class AttendanceProcessor {
  /**
   * Processes raw punches for a given month and set of employees
   */
  public static processMonthAttendance(
    month: string, // YYYY-MM e.g. '2026-01'
    employees: Employee[],
    rawPunches: RawAttendancePunch[],
    leaves: EmployeeLeave[],
    existingProcessed: ProcessedAttendance[],
    settings: CompanySettings
  ): AttendanceProcessingResult {
    const warnings: string[] = [];
    const results: ProcessedAttendance[] = [];

    // Parse year & month to get total days
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    // Map existing manual corrections to preserve them!
    const manualCorrectionsMap = new Map<string, ProcessedAttendance>();
    existingProcessed.forEach(p => {
      if (p.isManualCorrection) {
        manualCorrectionsMap.set(`${p.employeeId}_${p.date}`, p);
      }
    });

    const normalizeId = (idStr?: string | number): string => {
      if (idStr === undefined || idStr === null) return '';
      return String(idStr).trim().toLowerCase().replace(/^emp[-_]?/, '').replace(/^0+/, '');
    };

    // Group raw punches by employeeId (or fingerprintUserId / employeeCode) and date
    const punchesByEmpDate = new Map<string, RawAttendancePunch[]>();
    rawPunches.forEach(punch => {
      // Find employee if not set
      let empId = punch.employeeId;
      if (!empId && punch.deviceUserId) {
        const normDeviceUserId = normalizeId(punch.deviceUserId);
        const found = employees.find(e =>
          normalizeId(e.fingerprintUserId) === normDeviceUserId ||
          normalizeId(e.employeeCode) === normDeviceUserId ||
          normalizeId(e.id) === normDeviceUserId
        );
        empId = found?.id;
      }
      if (empId) {
        const key = `${empId}_${punch.punchDate}`;
        const list = punchesByEmpDate.get(key) || [];
        list.push(punch);
        punchesByEmpDate.set(key, list);
      }
    });

    // Shift settings
    const [shiftStartH, shiftStartM] = settings.shiftStartTime.split(':').map(Number);
    const [shiftEndH, shiftEndM] = settings.shiftEndTime.split(':').map(Number);
    const shiftStartMinutes = shiftStartH * 60 + shiftStartM;
    const shiftEndMinutes = shiftEndH * 60 + shiftEndM;
    const graceMinutes = settings.lateGraceMinutes || 15;

    // Process each active employee for every day of the month
    employees.forEach(emp => {
      if (!emp.isActive) return;

      const empNormalHours = emp.normalWorkingHours || settings.normalWorkingHoursPerDay;
      if (!empNormalHours || empNormalHours <= 0) {
        throw new Error('Daily working hours are not configured.');
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const dateStr = `${month}-${dayStr}`;
        const dateObj = new Date(year, monthNum - 1, day);
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
        const empDateKey = `${emp.id}_${dateStr}`;

        // Check if there is an existing manual correction
        if (manualCorrectionsMap.has(empDateKey)) {
          results.push(manualCorrectionsMap.get(empDateKey)!);
          continue;
        }

        // Check for approved leaves on this date
        const approvedLeaves = leaves.filter(
          l =>
            l.employeeId === emp.id &&
            l.status === 'APPROVED' &&
            dateStr >= l.startDate &&
            dateStr <= l.endDate
        );

        const getLeaveDurationType = (leave: EmployeeLeave): 'FULL_DAY' | 'HALF_DAY' | 'SHORT_LEAVE' => {
          if (leave.durationType) {
            return leave.durationType;
          }
          // Legacy fallback for old records without durationType
          if (leave.durationMinutes && leave.durationMinutes > 0) return 'SHORT_LEAVE';
          if (leave.daysCount === 0.5) return 'HALF_DAY';
          const reasonLower = (leave.reason || '').toLowerCase();
          if (reasonLower.includes('half')) return 'HALF_DAY';
          if (reasonLower.includes('short')) return 'SHORT_LEAVE';
          const leaveTypeLower = (leave.leaveTypeId || '').toLowerCase();
          if (leaveTypeLower.includes('half')) return 'HALF_DAY';
          if (leaveTypeLower.includes('short')) return 'SHORT_LEAVE';
          return leave.daysCount >= 1.0 ? 'FULL_DAY' : 'SHORT_LEAVE';
        };

        const isFullDayLeave = (leave: EmployeeLeave): boolean => {
          return getLeaveDurationType(leave) === 'FULL_DAY';
        };

        const fullDayLeave = approvedLeaves.find(isFullDayLeave);

        if (fullDayLeave) {
          const isNoPay =
            fullDayLeave.leaveTypeId === 'lt-04' ||
            fullDayLeave.leaveTypeId === 'lt-4' ||
            fullDayLeave.reason?.toLowerCase().includes('no pay') ||
            fullDayLeave.reason?.toLowerCase().includes('unpaid');
          results.push({
            id: `att-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            date: dateStr,
            totalHours: 0,
            normalHours: 0,
            otHours: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            shortLeaveMinutes: 0,
            timeLossMinutes: 0,
            status: isNoPay ? 'NO_PAY' : 'LEAVE',
            leaveTypeId: fullDayLeave.leaveTypeId,
            isManualCorrection: false,
            remarks: fullDayLeave.reason || 'Approved Leave'
          });
          continue;
        }

        // Sunday Weekend check
        if (dayOfWeek === 0) {
          results.push({
            id: `att-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            date: dateStr,
            totalHours: 0,
            normalHours: 0,
            otHours: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            shortLeaveMinutes: 0,
            timeLossMinutes: 0,
            status: 'WEEKEND',
            isManualCorrection: false,
            remarks: 'Sunday Holiday'
          });
          continue;
        }

        // Check raw biometric punches for this employee & date
        const dayPunches = punchesByEmpDate.get(empDateKey) || [];

        if (dayPunches.length === 0) {
          // No punches recorded -> Absent
          results.push({
            id: `att-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            date: dateStr,
            totalHours: 0,
            normalHours: 0,
            otHours: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            shortLeaveMinutes: 0,
            timeLossMinutes: 0,
            status: 'ABSENT',
            isManualCorrection: false,
            remarks: 'No biometric punch records detected'
          });
          continue;
        }

        // Sort punches chronologically
        dayPunches.sort((a, b) => a.punchTime.localeCompare(b.punchTime));

        const inPunches = dayPunches.filter(p => p.punchType === 'IN');
        const outPunches = dayPunches.filter(p => p.punchType === 'OUT');

        const firstPunch = inPunches.length > 0 ? inPunches[0] : dayPunches[0];
        const lastPunch = outPunches.length > 0 
          ? outPunches[outPunches.length - 1] 
          : (dayPunches.length > 1 ? dayPunches[dayPunches.length - 1] : undefined);

        const firstInTime = firstPunch.punchTime.substring(0, 5); // HH:mm
        const lastOutTime = lastPunch && lastPunch !== firstPunch ? lastPunch.punchTime.substring(0, 5) : undefined;

        if (!lastOutTime || firstInTime === lastOutTime) {
          warnings.push(`Employee ${emp.employeeCode} (${emp.fullName}) on ${dateStr} has only one punch at ${firstInTime} (Missing OUT punch).`);
        }

        // Calculate hours
        let totalHours = 0;
        let otHours = 0;
        let lateMins = 0;
        let earlyMins = 0;

        const [inH, inM] = firstInTime.split(':').map(Number);
        const inTotalMinutes = inH * 60 + inM;

        if (inTotalMinutes > shiftStartMinutes + graceMinutes) {
          lateMins = inTotalMinutes - shiftStartMinutes;
        }

        if (lastOutTime) {
          const [outH, outM] = lastOutTime.split(':').map(Number);
          const outTotalMinutes = outH * 60 + outM;

          if (outTotalMinutes > inTotalMinutes) {
            const workedMinutes = outTotalMinutes - inTotalMinutes;
            totalHours = +(workedMinutes / 60).toFixed(1);

            // Deduct break duration if breakTimeMinutes is configured and worked duration exceeds 5 hours (300 mins)
            const breakTime = settings.breakTimeMinutes !== undefined ? settings.breakTimeMinutes : 60;
            const netMinutes = (breakTime > 0 && workedMinutes > 300) ? workedMinutes - breakTime : workedMinutes;
            const netHours = +(netMinutes / 60).toFixed(1);

            if (netHours > empNormalHours) {
              otHours = +(netHours - empNormalHours).toFixed(1);
            }

            if (outTotalMinutes < shiftEndMinutes) {
              earlyMins = shiftEndMinutes - outTotalMinutes;
            }
          }
        } else {
          // Assume standard day if single punch
          totalHours = empNormalHours;
        }

        // Calculate partial-day leave minutes (Approved Short Leave)
        const shortLeavesOnDate = approvedLeaves.filter(l => getLeaveDurationType(l) === 'SHORT_LEAVE');
        const uniqueShortLeaveMins = new Set<number>();
        let shortLeaveFallbackMins = 0;

        shortLeavesOnDate.forEach(l => {
          if (l.startTime && l.endTime) {
            const [sH, sM] = l.startTime.split(':').map(Number);
            const [eH, eM] = l.endTime.split(':').map(Number);
            const sTotal = sH * 60 + sM;
            const eTotal = eH * 60 + eM;
            if (eTotal > sTotal) {
              for (let m = sTotal; m < eTotal; m++) {
                uniqueShortLeaveMins.add(m);
              }
            }
          } else {
            shortLeaveFallbackMins += l.durationMinutes || Math.round((l.daysCount || 0) * 480);
          }
        });
        const shortLeaveMins = uniqueShortLeaveMins.size + shortLeaveFallbackMins;

        // Calculate unique time loss minutes with overlap protection
        const uniqueMins = new Set<number>();
        if (lateMins > 0) {
          for (let m = shiftStartMinutes; m < inTotalMinutes; m++) {
            uniqueMins.add(m);
          }
        }
        if (earlyMins > 0 && lastOutTime) {
          const [outH, outM] = lastOutTime.split(':').map(Number);
          const outTotalMinutes = outH * 60 + outM;
          for (let m = outTotalMinutes; m < shiftEndMinutes; m++) {
            uniqueMins.add(m);
          }
        }
        shortLeavesOnDate.forEach(l => {
          if (l.startTime && l.endTime) {
            const [sH, sM] = l.startTime.split(':').map(Number);
            const [eH, eM] = l.endTime.split(':').map(Number);
            const sTotal = sH * 60 + sM;
            const eTotal = eH * 60 + eM;
            if (eTotal > sTotal) {
              for (let m = sTotal; m < eTotal; m++) {
                uniqueMins.add(m);
              }
            }
          } else {
            const fallbackMins = l.durationMinutes || Math.round((l.daysCount || 0) * 480);
            for (let m = shiftStartMinutes; m < shiftStartMinutes + fallbackMins; m++) {
              uniqueMins.add(m);
            }
          }
        });

        // Calculate total unique time loss for the day
        const dayTimeLoss = uniqueMins.size;

        const hasHalfDayLeave = approvedLeaves.some(l => getLeaveDurationType(l) === 'HALF_DAY');

        results.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          firstIn: firstInTime,
          lastOut: lastOutTime,
          totalHours,
          normalHours: Math.min(totalHours, empNormalHours),
          otHours,
          lateMinutes: lateMins,
          earlyLeaveMinutes: earlyMins,
          shortLeaveMinutes: shortLeaveMins,
          timeLossMinutes: dayTimeLoss,
          status: hasHalfDayLeave ? 'HALF_DAY' : 'PRESENT',
          isManualCorrection: false,
          remarks: otHours > 0 ? `Normal Shift + ${otHours} hrs OT` : (lateMins > 0 ? `Late by ${lateMins}m` : 'Normal Shift')
        });
      }
    });

    return {
      processedCount: results.length,
      records: results,
      warnings
    };
  }
}
