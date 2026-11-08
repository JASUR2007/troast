// src/components/TaskDetail/TaskHistoryTimeline.tsx
import React from 'react';
import { TaskHistoryItem } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { History, MessageSquare } from 'lucide-react';

export const TaskHistoryTimeline: React.FC<{ history: TaskHistoryItem[] }> = ({ history }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-400" />
          <span>История изменений статусов ({history.length})</span>
        </h4>
        <span className="text-[11px] text-slate-400">Защищена RLS</span>
      </div>

      {history.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
          История пуста
        </div>
      ) : (
        <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 space-y-4">
          {history.map((item, idx) => {
            const dateStr = new Date(item.created_at).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={item.id || idx} className="relative group">
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white bg-sky-500 shadow-xs" />
                <div className="bg-slate-50 hover:bg-slate-100/70 transition-colors p-3 rounded-xl border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900">{item.actor?.display_name || 'Пользователь'}</span>
                      {item.actor?.role && (
                        <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {item.actor.role === 'manager' ? 'Руководитель' : 'Исполнитель'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-2 my-1 text-[11px]">
                    {item.from_status ? (
                      <>
                        <StatusBadge status={item.from_status} />
                        <span className="text-slate-400 font-bold">→</span>
                        <StatusBadge status={item.to_status} />
                      </>
                    ) : (
                      <StatusBadge status={item.to_status} />
                    )}
                  </div>

                  {item.comment && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-700 flex items-start gap-2 shadow-2xs">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <p className="whitespace-pre-wrap">{item.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
