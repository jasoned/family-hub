import { Pencil, Trash2 } from 'lucide-react';
import { Chore, FamilyMember, AppSettings } from '../types';

interface ChoreRowProps {
  chore: Chore;
  familyMembers: FamilyMember[];
  settings: AppSettings;          // ← still passed ; keep if you’ll use later
  onEdit: () => void;
  onDelete: () => void;
}

export default function ChoreRow({
  chore,
  familyMembers,
  onEdit,
  onDelete,
}: ChoreRowProps) {
  /** Helper: find member by id */
  const getMember = (id: string) => familyMembers.find((m) => m.id === id);

  /** First person in assignedTo array is the “currently assigned” one */
  const current = getMember(chore.assignedTo[0]);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
      {/* ─── Title column ──────────────────────────────────────────────── */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">
        <div className="font-medium">{chore.title}</div>
        {chore.timeOfDay && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {chore.timeOfDay.charAt(0).toUpperCase() + chore.timeOfDay.slice(1)}
          </div>
        )}
      </td>

      {/* ─── Assigned-to column ───────────────────────────────────────── */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-row space-x-1 items-center">
          {chore.assignedTo.map((id) => {
            const member = getMember(id);
            if (!member) return null;
            return (
              <span
                key={id}
                className="w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center text-white ring-2 ring-white shadow"
                style={{ backgroundColor: member.color }}
                title={member.name}
              >
                {member.initial}
              </span>
            );
          })}
          {chore.isRotating && (
            <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">→ Rotates</span>
          )}
        </div>

        {chore.isRotating && current && (
  <div className="mt-1">
    <span className="inline-block bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[11px] px-2 py-[1px] rounded-full">
      Currently:&nbsp;{current.name}
    </span>
  </div>
)}
      </td>

      {/* ─── Frequency column ─────────────────────────────────────────── */}
      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
        {chore.frequency.charAt(0).toUpperCase() + chore.frequency.slice(1)}
      </td>

      {/* ─── Rotation column ──────────────────────────────────────────── */}
      <td className="px-4 py-3 whitespace-nowrap">
        {chore.isRotating ? (
          <>
            <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-[1px] rounded-full">
              Rotating
            </span>
            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              {chore.rotationFrequency
                ? `${chore.rotationFrequency.charAt(0).toUpperCase()}${chore.rotationFrequency.slice(
                    1,
                  )}${
                    chore.rotationFrequency === 'weekly'
                      ? ` (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][chore.rotationDay ?? 0]})`
                      : ''
                  }`
                : 'Manual'}
            </div>
          </>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">—</span>
        )}
      </td>

      {/* ─── Actions column ──────────────────────────────────────────── */}
      <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
        <button
          onClick={onEdit}
          className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          title="Edit chore"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
          title="Delete chore"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}
