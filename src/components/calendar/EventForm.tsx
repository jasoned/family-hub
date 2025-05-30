import { useState, useEffect } from 'react';
import { CalendarEvent, FamilyMember } from '../../types';
import { Calendar as CalendarIcon, Clock, MapPin, Repeat, Tag, Users, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addHours, parseISO } from 'date-fns';
import RecurrenceOptions from './RecurrenceOptions';

interface EventFormProps {
  event?: CalendarEvent;
  date?: Date;
  familyMembers: FamilyMember[];
  onSubmit: (event: Omit<CalendarEvent, 'id'>) => void;
  onCancel: () => void;
}

const EVENT_TYPES = [
  { value: 'School', label: 'School', color: '#3B82F6' },
  { value: 'Work', label: 'Work', color: '#6366F1' },
  { value: 'Fun', label: 'Fun', color: '#EC4899' },
  { value: 'Appointment', label: 'Appointment', color: '#10B981' },
  { value: 'Meal', label: 'Meal', color: '#F59E0B' },
  { value: 'Chores', label: 'Chores', color: '#9333EA' },
  { value: 'Sports', label: 'Sports', color: '#EF4444' },
  { value: 'Birthday', label: 'Birthday', color: '#F97316' },
  { value: 'Holiday', label: 'Holiday', color: '#14B8A6' },
  { value: 'FamilyTime', label: 'Family Time', color: '#8B5CF6' },
  { value: 'Other', label: 'Other', color: '#6B7280' },
];

export default function EventForm({
  event,
  date,
  familyMembers,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [memberId, setMemberId] = useState(
    event?.memberId || (familyMembers.length > 0 ? familyMembers[0].id : ''),
  );
  const [startDate, setStartDate] = useState(
    event?.start ? new Date(event.start) : date ? new Date(date) : new Date(),
  );
  const [endDate, setEndDate] = useState(
    event?.end ? new Date(event.end) : date ? addHours(new Date(date), 1) : addHours(new Date(), 1),
  );
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [location, setLocation] = useState(event?.location || '');
  const [description, setDescription] = useState(event?.description || '');
  const [eventType, setEventType] = useState(event?.eventType || 'Other');
  const [endTimeManuallySet, setEndTimeManuallySet] = useState(!!event);

  // Recurrence options
  const [isRecurring, setIsRecurring] = useState(event?.isRecurring || false);
  const [recurrencePattern, setRecurrencePattern] = useState(event?.recurrencePattern || 'weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(event?.recurrenceInterval || 1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(event?.recurrenceEndDate);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState(
    event?.recurrenceDaysOfWeek || startDate ? [startDate.getDay()] : [0],
  );
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(
    event?.recurrenceDayOfMonth || (startDate ? startDate.getDate() : 1),
  );

  // Edit mode for recurring events
  const [editMode, setEditMode] = useState<'single' | 'all' | 'future'>('single');

  // Format dates for input fields
  const formatDateForInput = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  // Auto-fill end time when start time changes
  useEffect(() => {
    if (!endTimeManuallySet) {
      const newEndDate = addHours(startDate, 1);
      setEndDate(newEndDate);
    }
  }, [startDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !memberId) return;

    // Ensure end date is after start date
    let finalEndDate = endDate;
    if (endDate <= startDate) {
      finalEndDate = addHours(startDate, 1);
    }

    // Handle "All Family Members" option
    if (memberId === 'all') {
      // Create an event for each family member
      familyMembers.forEach((member) => {
        onSubmit({
          title: title.trim(),
          memberId: member.id,
          start: startDate.toISOString(),
          end: finalEndDate.toISOString(),
          allDay,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          eventType: eventType as any,
          isRecurring,
          recurrencePattern,
          recurrenceInterval,
          recurrenceEndDate,
          recurrenceDaysOfWeek:
            isRecurring && recurrencePattern === 'weekly' ? recurrenceDaysOfWeek : undefined,
          recurrenceDayOfMonth:
            isRecurring && recurrencePattern === 'monthly' ? recurrenceDayOfMonth : undefined,
          editMode: event?.isRecurring ? editMode : undefined,
        });
      });
    } else {
      // Submit for the selected member
      onSubmit({
        title: title.trim(),
        memberId,
        start: startDate.toISOString(),
        end: finalEndDate.toISOString(),
        allDay,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        eventType: eventType as any,
        isRecurring,
        recurrencePattern,
        recurrenceInterval,
        recurrenceEndDate,
        recurrenceDaysOfWeek:
          isRecurring && recurrencePattern === 'weekly' ? recurrenceDaysOfWeek : undefined,
        recurrenceDayOfMonth:
          isRecurring && recurrencePattern === 'monthly' ? recurrenceDayOfMonth : undefined,
        editMode: event?.isRecurring ? editMode : undefined,
      });
    }
  };

  // Handle recurrence options update
  const handleRecurrenceUpdate = (options: {
    isRecurring: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  }) => {
    setIsRecurring(options.isRecurring);
    setRecurrencePattern(options.pattern);
    setRecurrenceInterval(options.interval);
    setRecurrenceEndDate(options.endDate);
    setRecurrenceDaysOfWeek(options.daysOfWeek || []);
    setRecurrenceDayOfMonth(options.dayOfMonth || 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-md max-w-md mx-auto border border-gray-50 dark:border-slate-800"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2
            className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {event ? 'Edit Event' : 'Add Event'}
          </h2>
          {event && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              <CalendarIcon size={12} className="inline mr-1" />
              {format(parseISO(event.start), 'MMMM d, yyyy')}
            </p>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            required
            placeholder="Enter event title"
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="eventType"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center"
          >
            <Tag size={16} className="mr-1 text-slate-400" />
            Event Type
          </label>
          <div className="relative">
            <select
              id="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors appearance-none"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label
            htmlFor="memberId"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Family Member
          </label>
          <div className="relative">
            <select
              id="memberId"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors appearance-none"
              required
            >
              {familyMembers.length === 0 ? (
                <option value="">No family members added</option>
              ) : (
                <>
                  <option value="all">All Family Members</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Users size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          {memberId === 'all' && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded">
              This event will appear on everyone's calendar
            </p>
          )}
        </div>

        <div className="mb-5">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="allDay"
              className="ml-2 block text-sm text-slate-700 dark:text-slate-300"
            >
              All-day event
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Start
              </label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                id="startDate"
                value={formatDateForInput(startDate)}
                onChange={(e) => {
                  const newStartDate = new Date(e.target.value);
                  setStartDate(newStartDate);

                  // Auto-adjust end time to be 1 hour after start time if end time is before start time
                  if (endDate <= newStartDate) {
                    setEndDate(addHours(newStartDate, 1));
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
                required
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                End
              </label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                id="endDate"
                value={formatDateForInput(endDate)}
                onChange={(e) => {
                  const newEndDate = new Date(e.target.value);
                  setEndTimeManuallySet(true);

                  // Ensure end date is not before start date
                  if (newEndDate <= startDate) {
                    alert('End time must be after start time');
                    setEndDate(addHours(startDate, 1));
                  } else {
                    setEndDate(newEndDate);
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
                required
                min={formatDateForInput(startDate)}
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Duration: {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))}{' '}
                minutes
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label
            htmlFor="location"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center"
          >
            <MapPin size={16} className="mr-1 text-slate-400" />
            Location (optional)
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
            placeholder="Enter location"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
            rows={3}
            placeholder="Enter description"
          />
        </div>

        {/* Recurrence Options */}
        <RecurrenceOptions
          isRecurring={isRecurring}
          pattern={recurrencePattern}
          interval={recurrenceInterval}
          endDate={recurrenceEndDate}
          daysOfWeek={recurrenceDaysOfWeek}
          dayOfMonth={recurrenceDayOfMonth}
          onUpdate={handleRecurrenceUpdate}
          startDate={startDate}
        />

        {/* Edit mode for recurring events */}
        {event?.isRecurring && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
              <Repeat size={16} className="mr-1 text-slate-400" />
              Edit Mode
            </label>
            <div className="space-y-2 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="editSingle"
                  name="editMode"
                  value="single"
                  checked={editMode === 'single'}
                  onChange={() => setEditMode('single')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editSingle"
                  className="ml-2 block text-sm text-slate-700 dark:text-slate-300"
                >
                  Edit only this event
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="editAll"
                  name="editMode"
                  value="all"
                  checked={editMode === 'all'}
                  onChange={() => setEditMode('all')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editAll"
                  className="ml-2 block text-sm text-slate-700 dark:text-slate-300"
                >
                  Edit entire series
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="editFuture"
                  name="editMode"
                  value="future"
                  checked={editMode === 'future'}
                  onChange={() => setEditMode('future')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editFuture"
                  className="ml-2 block text-sm text-slate-700 dark:text-slate-300"
                >
                  Edit this and future events
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={familyMembers.length === 0}>
            {event ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
