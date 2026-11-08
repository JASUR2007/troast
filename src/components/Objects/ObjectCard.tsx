// src/components/Objects/ObjectCard.tsx
import React from 'react';
import { BuildingObject, Task } from '../../types';
import { Building2, MapPin, ArrowRight } from 'lucide-react';

interface ObjectCardProps {
  obj: BuildingObject;
  tasks: Task[];
  onClick: () => void;
}

export const ObjectCard: React.FC<ObjectCardProps> = ({ obj, tasks, onClick }) => {
  const objTasks = tasks.filter((t) => t.object_id === obj.id);
  const inProgressCount = objTasks.filter((t) => t.status === 'in_progress').length;
  const reviewCount = objTasks.filter((t) => t.status === 'review').length;
  const reworkCount = objTasks.filter((t) => t.status === 'rework').length;
  const acceptedCount = objTasks.filter((t) => t.status === 'accepted').length;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {objTasks.length} {objTasks.length === 1 ? 'задача' : 'задач'}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
          {obj.name}
        </h3>

        <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1.5 mb-4 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>{obj.address}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
          {inProgressCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
              {inProgressCount} в работе
            </span>
          )}
          {reviewCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-100">
              {reviewCount} на проверке
            </span>
          )}
          {reworkCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-100">
              {reworkCount} на доработке
            </span>
          )}
          {acceptedCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
              {acceptedCount} принято
            </span>
          )}
          {objTasks.length === 0 && <span className="text-slate-400 italic">Нет назначенных задач</span>}
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-sky-600 pt-1 group-hover:translate-x-0.5 transition-transform">
          <span>Открыть карточку объекта</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
