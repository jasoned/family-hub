import { Check, ChevronDown, ChevronRight, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Chore, FamilyMember } from '../types';
import { useAppContext } from '../context';

interface ChoreRowProps {
  chore: Chore;
  familyMembers: FamilyMember[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function ChoreRow({
  chore,
  familyMembers,
  onEdit,
  onDelete,
}: ChoreRowProps) {
  const { toggleSubChoreCompletion } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);

  /* helpers ----------------------------------------------------------- */
  const getMember = (id: string) => familyMembers.find((m) => m.id === id);
  const current = getMember(chore.assignedTo[0]);

  const hasSubChores = !!chore.subChores?.length;
  const completedSub = chore.subChores?.filter((s) => s.completed).length ?? 0;
  const allSubDone =
    hasSubChores && chore.subChores!.every((s) => s.completed);

  const handleToggleSubChore = async (
    subChoreId: string,
    currentStatus: boolean,
  ) => {
    try {
      await toggleSubChoreCompletion(chore.id, subChoreId, !currentStatus);
    } catch (err) {
      console.error('Error toggling sub-chore:', err);
    }
  };

  /* render ------------------------------------------------------------ */
  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
        {/* title */}
        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">
          <div className="font-medium">{chore.title}</div>
          {chore.timeOfDay && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {chore.timeOfDay[0].toUpperCase() + chore.timeOfDay.slice(1)}
            </div>
          )}
        </td>

        {/* assignees */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center space-x-1">
            {chore.assignedTo.map((id) => {
              const m = getMember(id);
              if (!m) return null;
              return (
                <span
                  key={id}
                  className="w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center text-white ring-2 ring-white shadow"
                  style={{ backgroundColor: m.color }}
                  title={m.name}
                >
                  {m.initial}
                </span>
              );
            })}
            {chore.isRotating && (
              <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                → Rotates
              </span>
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

        {/* frequency */}
        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
          {chore.frequency[0].toUpperCase() + chore.frequency.slice(1)}
        </td>

        {/* rotation info */}
        <td className="px-4 py-3 whitespace-nowrap">
          {chore.isRotating ? (
            <>
              <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-[1px] rounded-full">
                Rotating
              </span>
              <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                {chore.rotationFrequency
                  ? `${chore.rotationFrequency[0].toUpperCase()}${chore.rotationFrequency.slice(
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
            <span className="text-xs text-slate-500 dark:text-slate-400">
              -
            </span>
          )}
        </td>

        {/* actions */}
        <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
          {hasSubChores && (
            <button
              onClick={() => setIsExpanded((x) => !x)}
              className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              title={isExpanded ? 'Hide sub-tasks' : 'Show sub-tasks'}
            >
              {isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            title="Edit chore"
          >
            <Edit size={18} />
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

      {/* sub-chores */}
      {hasSubChores && (
        <tr>
          <td
            colSpan={5}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800/30 border-t-0"
          >
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pl-8 pr-2 py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {completedSub} of {chore.subChores!.length} sub-tasks
                      completed
                      {allSubDone && (
                        <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                          All done! 🎉
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {chore.subChores!.map((sc) => (
                        <div key={sc.id} className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleToggleSubChore(sc.id, sc.completed)
                            }
                            className={`w-5 h-5 rounded flex items-center justify-center ${
                              sc.completed
                                ? 'bg-green-500 text-white'
                                : 'border border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {sc.completed && <Check size={14} />}
                          </button>

                          <span
                            className={`text-sm ${
                              sc.completed
                                ? 'line-through text-gray-400 dark:text-gray-500'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {sc.title}
                          </span>

                          {sc.assignedTo?.length > 0 && (
                            <div className="ml-2 flex items-center">
                              {sc.assignedTo.map((id) => {
                                const m = getMember(id);
                                if (!m) return null;
                                return (
                                  <span
                                    key={id}
                                    className="w-4 h-4 rounded-full text-[8px] font-semibold flex items-center justify-center text-white ml-1"
                                    style={{ backgroundColor: m.color }}
                                    title={m.name}
                                  >
                                    {m.initial}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </td>
        </tr>
      )}
    </>
  );
}
