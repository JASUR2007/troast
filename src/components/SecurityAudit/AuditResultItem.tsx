// src/components/SecurityAudit/AuditResultItem.tsx
import React from 'react';
import { TestResult } from '../../hooks/useSecurityAudit';
import { CheckCircle2, XCircle } from 'lucide-react';

export const AuditResultItem: React.FC<{ res: TestResult }> = ({ res }) => {
  return (
    <div
      className={`p-3.5 rounded-xl border text-xs transition-all ${
        res.passed
          ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
          : 'bg-rose-50/40 border-rose-200 text-rose-950'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          {res.passed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-bold text-slate-900">{res.title}</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            res.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {res.passed ? 'PASSED' : 'FAILED'}
        </span>
      </div>
      {res.description && <div className="text-slate-500 ml-6 mb-1">{res.description}</div>}
      <div
        className={`ml-6 p-2 rounded-lg font-mono text-[11px] ${
          res.passed ? 'bg-white/80 text-emerald-800' : 'bg-white/80 text-rose-800'
        }`}
      >
        {res.message}
      </div>
    </div>
  );
};
