import { useState } from 'react';
import { Chore, FamilyMember } from '../types';
import { GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
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

  /* ------------------------------ dnd-kit ------------------------------ */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
  const toggleAssignee = (id: string) =>
    setAssignedTo((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleDayOfWeek = (d: number) =>
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const getMember = (id: string) => familyMembers.find((m) => m.id === id);

  /* --------------------------- handle submit --------------------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || assignedTo.length === 0) return;
    if (frequency === 'weekly' && daysOfWeek.length === 0) return;
    if (frequency === 'monthly' && !dayOfMonth) return;

    /* if rotating, ensure a default day is chosen */
    if (isRotating && rotationFrequency === 'weekly' && rotationDay === undefined) setRotationDay(0);
    if (isRotating && rotationFrequency === 'monthly' && rotationDay === undefined) setRotationDay(1);

    /* 🔑 build fresh completed map */
    const completed: Record<string, boolean> = {};
    assignedTo.forEach((id) => (completed[id] = false));

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      assignedTo,
      completed, // <-- HERE
      isRotating,
      frequency,
      rotationFrequency: isRotating ? rotationFrequency : undefined,
      rotationDay: isRotating && rotationFrequency !== 'daily' ? rotationDay : undefined,
      timeOfDay,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
    });
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
      <form onSubmit={handleSubmit}>
        {/* title ------------------------------------------------------------ */}
        <div className="mb-5">
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Title
          </label>
          <input
            id="title"
            className="input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* description ------------------------------------------------------ */}
        <div className="mb-5">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Description (optional)
          </label>
          <textarea
            id="description"
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* assign to -------------------------------------------------------- */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Assign&nbsp;To
          </label>
          {familyMembers.length === 0 ? (
            <p className="text-sm text-red-500">Please add family members first</p>
          ) : (
            <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
              {familyMembers.map((m) => (
                <div key={m.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`member-${m.id}`}
                    checked={assignedTo.includes(m.id)}
                    onChange={() => toggleAssignee(m.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`member-${m.id}`} className="ml-2 flex items-center text-sm">
                    <span
                      className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-xs shadow-sm"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.initial}
                    </span>
                    {m.name}
                  </label>
                </div>
              ))}
            </div>
          )}
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
                                  index={idx}
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
        <div className="flex justify-end space-x-3">
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
  );
}

/* ================================================================== */
/*  Sortable Item                                                     */
/* ================================================================== */
interface SortableItemProps {
  id: string;
  member: FamilyMember;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}
function SortableItem({ id, member, isFirst, isLast }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
      <div
        {...listeners}
        className="mr-2 text-gray-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>
      <div
        className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-xs"
        style={{ backgroundColor: member.color }}
      >
        {member.initial}
      </div>
      <span className="text-sm text-slate-700 dark:text-slate-300">{member.name}</span>
      {isFirst && (
        <span className="ml-auto text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
          Currently Assigned
        </span>
      )}
    </div>
  );
}
