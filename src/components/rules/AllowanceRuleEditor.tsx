import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  Calculator,
  HelpCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { AllowanceDeductionRule, AllowanceDeductionTier, Language } from '../../types';
import { BackButton } from '../common/NavigationButtons';
import { translations } from '../../i18n/translations';
import { PayrollEngine } from '../../services/payrollEngine';

interface AllowanceRuleEditorProps {
  language: Language;
  rules: AllowanceDeductionRule[];
  onSaveRule: (rule: AllowanceDeductionRule) => void;
  onBack?: () => void;
}

export const AllowanceRuleEditor: React.FC<AllowanceRuleEditorProps> = ({
  language,
  rules,
  onSaveRule,
  onBack
}) => {
  const t = translations[language];

  const [activeRule, setActiveRule] = useState<AllowanceDeductionRule>(
    rules[0] || {
      id: 'rule-standard-tiered',
      name: 'Sri Lanka Factory Attendance Incentive Tier Rule',
      description: 'Tiered daily reduction for unpaid leave days (e.g. Day 1: 1500, Day 2: 1500, Day 3: 1000...)',
      ruleType: 'TIERED',
      tiers: [
        { dayNumber: 1, deductionAmount: 1500, description: 'First unpaid day penalty' },
        { dayNumber: 2, deductionAmount: 1500, description: 'Second unpaid day penalty' },
        { dayNumber: 3, deductionAmount: 1000, description: 'Third unpaid day penalty' },
        { dayNumber: 4, deductionAmount: 1000, description: 'Fourth unpaid day penalty' }
      ],
      defaultDeductionBeyondTiers: 1000,
      capAtTotalAllowance: true,
      isActive: true
    }
  );

  // Live Test Sandbox state
  const [testAllowance, setTestAllowance] = useState<number>(5000);
  const [testUnpaidDays, setTestUnpaidDays] = useState<number>(3);

  const handleAddTier = () => {
    const nextDay = activeRule.tiers.length + 1;
    const newTier: AllowanceDeductionTier = {
      dayNumber: nextDay,
      deductionAmount: 1000,
      description: `Day ${nextDay} unpaid deduction`
    };
    setActiveRule({
      ...activeRule,
      tiers: [...activeRule.tiers, newTier]
    });
  };

  const handleUpdateTier = (index: number, amount: number, desc?: string) => {
    const updated = [...activeRule.tiers];
    updated[index] = {
      ...updated[index],
      deductionAmount: amount,
      description: desc !== undefined ? desc : updated[index].description
    };
    setActiveRule({ ...activeRule, tiers: updated });
  };

  const handleRemoveTier = (index: number) => {
    const updated = activeRule.tiers
      .filter((_, idx) => idx !== index)
      .map((tier, idx) => ({ ...tier, dayNumber: idx + 1 }));
    setActiveRule({ ...activeRule, tiers: updated });
  };

  const handleSave = () => {
    onSaveRule(activeRule);
    alert('Allowance Deduction Rule saved successfully!');
  };

  // Test simulation using PayrollEngine
  const testResult = PayrollEngine.calculateAllowanceDeduction(
    testAllowance,
    testUnpaidDays,
    [activeRule]
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] text-[#111827] space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && <BackButton onClick={onBack} />}
          </div>
          <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#005a9e]" />
            {t.allowanceRules}
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Configure customizable allowance deduction matrix for unpaid leave days. The allowance is automatically capped at Rs. 0 and never becomes negative.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Save Rule Configuration
        </button>
      </div>

      {/* Main Grid: Left = Rule Configurator, Right = Interactive Live Test Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tiers Editor (8 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#111827]">Configurable Deduction Tiers</h2>
                <p className="text-[11px] text-[#6b7280]">
                  Define exact Sri Lankan Rupee (LKR) deduction applied per cumulative unpaid day.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTier}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#005a9e] hover:bg-[#004880] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Next Day Tier
              </button>
            </div>

            {/* Rule Name & Description */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#4b5563] mb-1 font-medium">Rule Name</label>
                <input
                  type="text"
                  value={activeRule.name}
                  onChange={e => setActiveRule({ ...activeRule, name: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] focus:border-[#005a9e] focus:outline-none"
                />
              </div>

              {/* Tiers List */}
              <div className="space-y-2 pt-2">
                <label className="block text-[#4b5563] font-medium">Daily Deduction Matrix</label>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {activeRule.tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]"
                    >
                      <div className="w-16 shrink-0 font-bold text-[#005a9e] font-mono text-xs">
                        Day {tier.dayNumber}:
                      </div>

                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-[#9ca3af] font-mono text-[11px]">Rs.</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={tier.deductionAmount}
                          onChange={e => handleUpdateTier(idx, Number(e.target.value))}
                          className="w-full bg-white border border-[#d1d5db] rounded pl-9 pr-3 py-1.5 text-[#111827] font-mono font-bold text-xs focus:border-[#005a9e] focus:outline-none"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Description / note"
                        value={tier.description || ''}
                        onChange={e => handleUpdateTier(idx, tier.deductionAmount, e.target.value)}
                        className="flex-1 bg-white border border-[#d1d5db] rounded px-2.5 py-1.5 text-[#374151] text-xs focus:border-[#005a9e] focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        disabled={activeRule.tiers.length <= 1}
                        className="p-1.5 text-[#9ca3af] hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Beyond Tiers Fallback */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#e5e7eb]">
                <div>
                  <label className="block text-[#4b5563] mb-1 font-medium">
                    Deduction for Extra Days Beyond Tiers
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[#9ca3af] font-mono text-[11px]">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      value={activeRule.defaultDeductionBeyondTiers}
                      onChange={e =>
                        setActiveRule({
                          ...activeRule,
                          defaultDeductionBeyondTiers: Number(e.target.value)
                        })
                      }
                      className="w-full bg-white border border-[#d1d5db] rounded-lg pl-9 pr-3 py-2 text-[#111827] font-mono focus:border-[#005a9e] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-[#374151]">
                    <input
                      type="checkbox"
                      checked={activeRule.capAtTotalAllowance}
                      onChange={e =>
                        setActiveRule({ ...activeRule, capAtTotalAllowance: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="font-semibold text-xs">Cap Deduction at Rs. 0 (Never Negative)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Test Calculator (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#d1d5db] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#005a9e]">
              <Zap className="w-4 h-4" />
              <h2 className="text-sm font-bold text-[#111827]">Live Rule Simulation Sandbox</h2>
            </div>
            <p className="text-xs text-[#6b7280]">
              Test how the rule executes in real-time for any allowance and unpaid leave count.
            </p>

            <div className="space-y-3 bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0] text-xs">
              <div>
                <label className="block text-[#4b5563] mb-1">Employee Fixed Allowance Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#9ca3af] font-mono">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={testAllowance}
                    onChange={e => setTestAllowance(Number(e.target.value))}
                    className="w-full bg-white border border-[#d1d5db] rounded-lg pl-9 pr-3 py-2 text-[#111827] font-mono font-bold focus:border-[#005a9e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4b5563] mb-1">Unpaid Leave Days in Month</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={testUnpaidDays}
                  onChange={e => setTestUnpaidDays(Number(e.target.value))}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-3 py-2 text-[#111827] font-mono font-bold focus:border-[#005a9e] focus:outline-none"
                />
              </div>

              {/* Live Calculation Output Card */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3.5 space-y-2 mt-4">
                <div className="text-[10px] uppercase font-bold text-[#005a9e]">Calculation Result:</div>
                <div className="flex justify-between text-[#4b5563]">
                  <span>Initial Allowance:</span>
                  <span className="font-mono font-bold text-[#111827]">Rs. {(testAllowance ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Total Deduction Applied:</span>
                  <span className="font-mono">-Rs. {(testResult?.deductionAmount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-blue-200 pt-1 text-sm">
                  <span>Net Payable Allowance:</span>
                  <span className="font-mono">Rs. {(testResult?.remainingAllowance ?? 0).toLocaleString()}</span>
                </div>

                <div className="mt-2 text-[11px] font-mono text-[#1e293b] bg-white p-2 rounded border border-blue-200">
                  {testResult.breakdown}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
