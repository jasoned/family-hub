import { useState, useEffect } from 'react';
import { Chore, FamilyMember } from '../types';
import { ArrowDown, GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ChoreFormProps {
  chore?: Chore;
  familyMembers: FamilyMember[];
  onSubmit: (chore: Omit<Chore, 'id' | 'completed'>) => void;
  onCancel: () => void;
}

export default function ChoreForm({ chore, familyMembers, onSubmit, onCancel }: ChoreFormProps) {
  const [title, setTitle] = useState(chore?.title || '');
  const [description, setDescription] = useState(chore?.description || '');
  const [assignedTo, setAssignedTo] = useState<string[]>(chore?.assignedTo || []);
  const [isRotating, setIsRotating] = useState(chore?.isRotating || false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'once'>(
    chore?.frequency || 'daily'
  );
  const [rotationFrequency, setRotationFrequency] = useState<'daily' | 'weekly' | 'monthly' | undefined>(
    chore?.rotationFrequency || undefined
  );
  const [rotationDay, setRotationDay] = useState<number | undefined>(
    chore?.rotationDay || undefined
  );
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | undefined>(
    chore?.timeOfDay
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(chore?.daysOfWeek || []);
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(chore?.dayOfMonth);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAssigneeToggle = (memberId: string) => {
    if (assignedTo.includes(memberId)) {
      setAssignedTo(assignedTo.filter((id) => id !== memberId));
    } else {
      setAssignedTo([...assignedTo, memberId]);
    }
  };

  const handleDayOfWeekToggle = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  const getFamilyMember = (id: string) => {
    return familyMembers.find(member => member.id === id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setAssignedTo((items) => {
        const oldIndex = items.indexOf(active.id.toString());
        const newIndex = items.indexOf(over.id.toString());
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || assignedTo.length === 0) return;

    // Validate frequency-specific fields
    if (frequency === 'weekly' && daysOfWeek.length === 0) return;
    if (frequency === 'monthly' && !dayOfMonth) return;
    
    // Validate rotation frequency-specific fields
    if (isRotating && rotationFrequency === 'weekly' && rotationDay === undefined) {
      setRotationDay(0); // Default to Sunday
    }
    if (isRotating && rotationFrequency === 'monthly' && rotationDay === undefined) {
      setRotationDay(1); // Default to 1st day of month
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      assignedTo,
      isRotating,
      frequency,
      rotationFrequency: isRotating ? rotationFrequency : undefined,
      rotationDay: isRotating && rotationFrequency !== 'daily' ? rotationDay : undefined,
      timeOfDay,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-md max-w-md mx-auto border border-gray-50 dark:border-slate-800"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {chore ? 'Edit Chore' : 'Add Chore'}
        </h2>
        <button 
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            required
          />
        </div>
        
        <div className="mb-5">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
            rows={2}
          />
        </div>
        
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Assign To
          </label>
          {familyMembers.length === 0 ? (
            <p className="text-sm text-red-500 dark:text-red-400">
              Please add family members first
            </p>
          ) : (
            <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`member-${member.id}`}
                    checked={assignedTo.includes(member.id)}
                    onChange={() => handleAssigneeToggle(member.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`member-${member.id}`}
                    className="ml-2 block text-sm text-slate-700 dark:text-slate-300 flex items-center"
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
          )}
        </div>
        
        {assignedTo.length > 1 && (
          <div className="mb-5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rotating"
                checked={isRotating}
                onChange={() => setIsRotating(!isRotating)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="rotating"
                className="ml-2 block text-sm text-indigo-700 dark:text-indigo-300 font-medium"
              >
                Rotate among assigned members
              </label>
            </div>
            
            {isRotating && (
              <div className="mt-3 pl-6 space-y-3">
                <div>
                  <label htmlFor="rotationFrequency" className="block text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                    Rotation Frequency
                  </label>
                  <select
                    id="rotationFrequency"
                    value={rotationFrequency || ''}
                    onChange={(e) => {
                      const value = e.target.value as 'daily' | 'weekly' | 'monthly' | '';
                      setRotationFrequency(value === '' ? undefined : value);
                      // Reset rotation day when changing frequency
                      if (value === 'weekly') setRotationDay(0);
                      else if (value === 'monthly') setRotationDay(1);
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-indigo-900/30 transition-colors"
                  >
                    <option value="">Use global settings</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                {rotationFrequency === 'weekly' && (
                  <div>
                    <label htmlFor="rotationDay" className="block text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                      Rotation Day
                    </label>
                    <select
                      id="rotationDay"
                      value={rotationDay || 0}
                      onChange={(e) => setRotationDay(parseInt(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-indigo-900/30 transition-colors"
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                )}
                
                {rotationFrequency === 'monthly' && (
                  <div>
                    <label htmlFor="rotationDayMonth" className="block text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                      Day of Month
                    </label>
                    <select
                      id="rotationDayMonth"
                      value={rotationDay || 1}
                      onChange={(e) => setRotationDay(parseInt(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-indigo-900/30 transition-colors"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  {rotationFrequency ? 
                    `This chore will rotate ${rotationFrequency === 'daily' ? 'daily' : 
                      rotationFrequency === 'weekly' ? `every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][rotationDay || 0]}` : 
                      `on day ${rotationDay} monthly`}` : 
                    "This chore will use the global rotation settings configured in Settings"
                  }
                </p>
                
                {/* Drag and drop for rotation order */}
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
                        <SortableContext 
                          items={assignedTo}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                            {assignedTo.map((memberId, index) => {
                              const member = getFamilyMember(memberId);
                              if (!member) return null;
                              
                              return (
                                <SortableItem 
                                  key={memberId}
                                  id={memberId}
                                  member={member}
                                  index={index}
                                  isFirst={index === 0}
                                  isLast={index === assignedTo.length - 1}
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
        
        <div className="mb-5">
          <label htmlFor="frequency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Frequency
          </label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'once')}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="once">One-time</option>
          </select>
        </div>
        
        {frequency === 'weekly' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Days of Week
            </label>
            <div className="flex flex-wrap gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayOfWeekToggle(index)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    daysOfWeek.includes(index)
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {frequency === 'monthly' && (
          <div className="mb-5">
            <label htmlFor="dayOfMonth" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Day of Month
            </label>
            <input
              type="number"
              id="dayOfMonth"
              min={1}
              max={31}
              value={dayOfMonth || ''}
              onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
              required={frequency === 'monthly'}
            />
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="timeOfDay" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Time of Day (optional)
          </label>
          <select
            id="timeOfDay"
            value={timeOfDay || ''}
            onChange={(e) => setTimeOfDay(e.target.value as 'morning' | 'afternoon' | 'evening' | undefined)}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
          >
            <option value="">Any time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
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

interface SortableItemProps {
  id: string;
  member: FamilyMember;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

function SortableItem({ id, member, index, isFirst, isLast }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative' as const,
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
      } ${
        isDragging ? 'shadow-md bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      {...attributes}
    >
      <div 
        {...listeners}
        className="mr-2 text-gray-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing touch-manipulation"
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
      <span className="text-sm text-slate-700 dark:text-slate-300">
        {member.name}
      </span>
      {isFirst && (
        <span className="ml-auto text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
          Currently Assigned
        </span>
      )}
    </div>
  );
}
