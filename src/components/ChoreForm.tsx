import { useState } from 'react';
import { Chore, FamilyMember, SubChore } from '../types';
import { GripVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SubChoreManager from './SubChoreManager';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ------------------------------------------------------------------ */
/*  props                                                             */
/* ------------------------------------------------------------------ */
interface ChoreFormProps {
  chore?: Chore;
  familyMembers: FamilyMember[];
  onSubmit: (chore: Omit<Chore, 'id'>) => void; // now sends `completed`
  onCancel: () => void;
}

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */
export default function ChoreForm({
  chore,
  familyMembers,
  onSubmit,
  onCancel,
}: ChoreFormProps) {
  const [title, setTitle] = useState(chore?.title || '');
  const [description, setDescription] = useState(chore?.description || '');
  const [assignedTo, setAssignedTo] = useState<string[]>(chore?.assignedTo || []);
  const [isRotating, setIsRotating] = useState(chore?.isRotating || false);

  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'once'>(
    chore?.frequency || 'daily',
  );

  const [rotationFrequency, setRotationFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | undefined
  >(chore?.rotationFrequency || undefined);

  const [rotationDay, setRotationDay] = useState<number | undefined>(
    chore?.rotationDay || undefined,
  );

  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | undefined>(
    chore?.timeOfDay,
  );

  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(chore?.daysOfWeek || []);
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(chore?.dayOfMonth);
  const [showSubChores, setShowSubChores] = useState(true);
  const [subChores, setSubChores] = useState<SubChore[]>(chore?.subChores || []);

  const handleAssignToggle = (memberId: string) => {
    setAssignedTo((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  /* ------------------------------ dnd-kit ------------------------------ */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setAssignedTo((prev) => {
        const oldIndex = prev.indexOf(active.id.toString());
        const newIndex = prev.indexOf(over.id.toString());
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  /* --------------------------- small helpers --------------------------- */
  const toggleDayOfWeek = (d: number) =>
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const getMember = (id: string) => familyMembers.find((m) => m.id === id);

  /* --------------------------- handle submit --------------------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      console.error('Title is required');
      return;
    }
    
    if (assignedTo.length === 0) {
      console.error('At least one family member must be assigned');
      return;
    }
    
    if (frequency === 'weekly' && daysOfWeek.length === 0) {
      console.error('At least one day of the week must be selected');
      return;
    }
    
    if (frequency === 'monthly' && !dayOfMonth) {
      console.error('Day of month is required');
      return;
    }

    // If rotating, ensure a default day is chosen
    let finalRotationDay = rotationDay;
    if (isRotating) {
      if (rotationFrequency === 'weekly' && rotationDay === undefined) {
        finalRotationDay = 0;
        setRotationDay(0);
      } else if (rotationFrequency === 'monthly' && rotationDay === undefined) {
        finalRotationDay = 1;
        setRotationDay(1);
      }
    }

    // Build completed status map
    const completed: Record<string, boolean> = {};
    assignedTo.forEach((id) => (completed[id] = false));

    // Update parent chore completion if all sub-chores are completed
    const allSubChoresCompleted = subChores.length > 0 && subChores.every(sc => sc.completed);
    if (allSubChoresCompleted) {
      Object.keys(completed).forEach(key => {
        completed[key] = true;
      });
    }

    // Prepare the chore data
    const choreData: Omit<Chore, 'id'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      assignedTo: [...assignedTo], // Create a new array to avoid reference issues
      completed,
      isRotating,
      frequency,
      rotationFrequency: isRotating ? rotationFrequency : undefined,
      rotationDay: isRotating && rotationFrequency !== 'daily' ? finalRotationDay : undefined,
      timeOfDay,
      daysOfWeek: frequency === 'weekly' ? [...daysOfWeek] : undefined, // New array to avoid reference
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      subChores: subChores.length > 0 ? [...subChores] : undefined, // New array to avoid reference
    };

    try {
      onSubmit(choreData);
    } catch (error) {
      console.error('Error saving chore:', error);
    }
  };

  /* ------------------------------- JSX ---------------------------------- */
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-md max-w-md mx-auto border border-gray-50 dark:border-slate-800"
    >
      {/* ────────────────── header ────────────────── */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {chore ? 'Edit Chore' : 'Add Chore'}
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <X size={20} />
        </button>
      </div>

      {/* ────────────────── form ────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto w-full"
      >
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-2 -mr-2">
          <div className="space-y-5">
            {/* Title and Description */}
            <div className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Title *
              </label>
              <input
                id="title"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter chore title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                id="description"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this chore (optional)"
              />
            </div>

            {/* Sub-tasks section */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sub-tasks (Optional)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSubChores(!showSubChores)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showSubChores ? 'Hide' : 'Show'}
                </button>
              </div>
              
              <AnimatePresence>
                {showSubChores && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <SubChoreManager
                      subChores={subChores}
                      familyMembers={familyMembers}
                      onSubChoresChange={setSubChores}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>

            {/* Assigned To */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Assign To *
            </label>
            <div className="space-y-2">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`assign-${member.id}`}
                    checked={assignedTo.includes(member.id)}
                    onChange={() => handleAssignToggle(member.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`assign-${member.id}`}
                    className="ml-2 flex items-center text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span
                      className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-xs shadow-sm"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initial}
                    </span>
                    {member.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

            </div>

            {/* rotation --------------------------------------------------------- */}
            {assignedTo.length > 1 && (
          <div className="mb-5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
            {/* toggle ----------------------------------------------------- */}
            <div className="flex items-center">
              <input
                id="rotating"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={isRotating}
                onChange={() => setIsRotating((p) => !p)}
              />
              <label htmlFor="rotating" className="ml-2 block text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Rotate among assigned members
              </label>
            </div>

            {/* rotation settings ------------------------------------------ */}
            {isRotating && (
              <div className="mt-3 pl-6 space-y-3">
                {/* rotation frequency ----------------------------------- */}
                <div>
                  <label htmlFor="rotationFrequency" className="block text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                    Rotation Frequency
                  </label>
                  <select
                    id="rotationFrequency"
                    value={rotationFrequency || ''}
                    onChange={(e) => {
                      const val = e.target.value as 'daily' | 'weekly' | 'monthly' | '';
                      setRotationFrequency(val === '' ? undefined : val);
                      if (val === 'weekly') setRotationDay(0);
                      if (val === 'monthly') setRotationDay(1);
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-indigo-900/30"
                  >
                    <option value="">Use global settings</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* rotation day (weekly) --------------------------------- */}
                {rotationFrequency === 'weekly' && (
                  <div>
                    <label htmlFor="rotationDay" className="block text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                      Rotation Day
                    </label>
                    <select
                      id="rotationDay"
                      value={rotationDay ?? 0}
                      onChange={(e) => setRotationDay(parseInt(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-indigo-900/30"
                    >
                      {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=>(
                        <option key={d} value={i}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* rotation day (monthly) -------------------------------- */}
                {rotationFrequency === 'monthly' && (
                  <div>
                    <label htmlFor="rotationDayMonth" className="block text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                      Day of Month
                    </label>
                    <select
                      id="rotationDayMonth"
                      value={rotationDay ?? 1}
                      onChange={(e) => setRotationDay(parseInt(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-indigo-900/30"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}
                          {d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* rotation explanation ---------------------------------- */}
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  {rotationFrequency
                    ? `This chore will rotate ${
                        rotationFrequency === 'daily'
                          ? 'daily'
                          : rotationFrequency === 'weekly'
                          ? `every ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][rotationDay ?? 0]}`
                          : `on day ${rotationDay} each month`
                      }`
                    : 'This chore will use the global rotation settings configured in Settings'}
                </p>

                {/* drag-and-drop rotation order -------------------------- */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                    Rotation Order
                  </label>

                  {assignedTo.length > 0 ? (
                    <>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                        Drag members to change order. The first person will be initially assigned.
                      </p>

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext items={assignedTo} strategy={verticalListSortingStrategy}>
                          <div className="bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                            {assignedTo.map((id, idx) => {
                              const m = getMember(id);
                              if (!m) return null;
                              return (
                                <SortableItem
                                  key={id}
                                  id={id}
                                  member={m}

                                  isFirst={idx === 0}
                                  isLast={idx === assignedTo.length - 1}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                        Click and hold the grip handle <GripVertical size={12} className="inline-block mx-0.5" /> to drag
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-orange-500 dark:text-orange-400">
                      Please select at least one family member
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

            {/* frequency -------------------------------------------------------- */}
            <div className="mb-5">
              <label htmlFor="frequency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Frequency
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="once">One-time</option>
              </select>
            </div>

            {/* weekly days ------------------------------------------------------ */}
            {frequency === 'weekly' && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDayOfWeek(i)}
                      className={`px-3 py-1.5 text-xs rounded-lg ${
                        daysOfWeek.includes(i)
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* monthly day ------------------------------------------------------- */}
            {frequency === 'monthly' && (
              <div className="mb-5">
                <label htmlFor="dayOfMonth" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Day of Month
                </label>
                <input
                  id="dayOfMonth"
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth ?? ''}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800"
                  required
                />
              </div>
            )}

            {/* time of day ------------------------------------------------------ */}
            <div className="mb-6">
              <label htmlFor="timeOfDay" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Time of Day (optional)
              </label>
              <select
                id="timeOfDay"
                value={timeOfDay || ''}
                onChange={(e) => setTimeOfDay(e.target.value as any)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800"
              >
                <option value="">Any time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            {/* footer ----------------------------------------------------------- */}
            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={familyMembers.length === 0 || assignedTo.length === 0}
              >
                {chore ? 'Update' : 'Add'}
              </button>
            </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Sortable Item                                                     */
/* ================================================================== */
interface SortableItemProps {
  id: string;
  member: FamilyMember;
  isFirst: boolean;
  isLast: boolean;
}

function SortableItem({ id, member, isFirst, isLast }: SortableItemProps) {
  try {
    // Ensure member is defined and has required properties
    if (!member || typeof member !== 'object') {
      console.error('Invalid member prop in SortableItem:', member);
      return null;
    }

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    // Ensure valid transform and transition
    const style = {
      transform: transform ? CSS.Transform.toString(transform) : undefined,
      transition: transition || undefined,
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.8 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center p-2 ${
          isFirst
            ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
            : !isLast
            ? 'border-b border-indigo-50 dark:border-indigo-800/30'
            : ''
        } ${isDragging ? 'shadow-md bg-blue-50 dark:bg-blue-900/20' : ''}`}
        {...attributes}
      >
        <button
          type="button"
          {...listeners}
          className="mr-2 text-gray-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={`Drag to reorder ${member.name || 'item'}`}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
        {member.color && (
          <div
            className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-xs"
            style={{ backgroundColor: member.color }}
            aria-hidden="true"
          >
            {member.initial || '?'}
          </div>
        )}
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {member.name || 'Unknown Member'}
        </span>
        {isFirst && (
          <span className="ml-auto text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
            Currently Assigned
          </span>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in SortableItem:', error);
    return null;
  }
}
