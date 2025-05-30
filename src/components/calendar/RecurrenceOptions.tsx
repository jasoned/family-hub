import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Repeat1, X } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

interface RecurrenceOptionsProps {
  isRecurring: boolean;
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  onUpdate: (options: {
    isRecurring: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  }) => void;
  startDate: Date;
}

export default function RecurrenceOptions({
  isRecurring,
  pattern,
  interval,
  endDate,
  daysOfWeek,
  dayOfMonth,
  onUpdate,
  startDate
}: RecurrenceOptionsProps) {
  const [isEnabled, setIsEnabled] = useState(isRecurring);
  const [selectedPattern, setSelectedPattern] = useState(pattern);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [selectedEndDate, setSelectedEndDate] = useState(endDate);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState(daysOfWeek || []);
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(dayOfMonth || startDate.getDate());

  // Preview text for the recurrence
  const getRecurrencePreview = () => {
    if (!isEnabled) return 'Does not repeat';
    
    let baseText = '';
    
    switch (selectedPattern) {
      case 'daily':
        baseText = selectedInterval === 1 
          ? 'Every day' 
          : `Every ${selectedInterval} days`;
        break;
      case 'weekly':
        if (selectedInterval === 1) {
          if (selectedDaysOfWeek.length === 0) {
            baseText = `Weekly on ${format(startDate, 'EEEE')}`;
          } else if (selectedDaysOfWeek.length === 7) {
            baseText = 'Every day';
          } else {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const selectedDays = selectedDaysOfWeek.map(day => days[day]).join(', ');
            baseText = `Weekly on ${selectedDays}`;
          }
        } else {
          baseText = `Every ${selectedInterval} weeks on ${format(startDate, 'EEEE')}`;
        }
        break;
      case 'monthly':
        baseText = selectedInterval === 1 
          ? `Monthly on day ${selectedDayOfMonth}` 
          : `Every ${selectedInterval} months on day ${selectedDayOfMonth}`;
        break;
      case 'custom':
        baseText = 'Custom recurrence pattern';
        break;
    }
    
    if (selectedEndDate) {
      baseText += ` until ${format(new Date(selectedEndDate), 'MMM d, yyyy')}`;
    }
    
    return baseText;
  };

  // Update parent when local state changes
  useEffect(() => {
    onUpdate({
      isRecurring: isEnabled,
      pattern: selectedPattern,
      interval: selectedInterval,
      endDate: selectedEndDate,
      daysOfWeek: selectedDaysOfWeek,
      dayOfMonth: selectedDayOfMonth
    });
  }, [
    isEnabled, 
    selectedPattern, 
    selectedInterval, 
    selectedEndDate, 
    selectedDaysOfWeek, 
    selectedDayOfMonth
  ]);

  // Initialize days of week from start date if not set
  useEffect(() => {
    if (selectedPattern === 'weekly' && selectedDaysOfWeek.length === 0) {
      setSelectedDaysOfWeek([startDate.getDay()]);
    }
  }, [selectedPattern, startDate]);

  const toggleDayOfWeek = (day: number) => {
    if (selectedDaysOfWeek.includes(day)) {
      setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== day));
    } else {
      setSelectedDaysOfWeek([...selectedDaysOfWeek, day]);
    }
  };

  return (
    <div className="mt-4 mb-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Repeat1 size={18} className="text-indigo-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Repeat
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={() => setIsEnabled(!isEnabled)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {isEnabled && (
        <div className="pl-6 space-y-4 border-l-2 border-indigo-100 dark:border-indigo-900/30">
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {getRecurrencePreview()}
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Recurrence Pattern
            </label>
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
              <option value="weekday">Weekdays (Mon-Fri)</option>
              <option value="weekend">Weekends (Sat-Sun)</option>
              <option value="nth-day">Nth Day of Month</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Repeat Every
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="99"
                value={selectedInterval}
                onChange={(e) => setSelectedInterval(Number(e.target.value))}
                className="w-16 px-2 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedPattern === 'daily' ? 'day(s)' : 
                 selectedPattern === 'weekly' ? 'week(s)' : 'month(s)'}
              </span>
            </div>
          </div>
          
          {selectedPattern === 'weekly' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Repeat On
              </label>
              <div className="flex flex-wrap gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDayOfWeek(index)}
                    className={`w-7 h-7 flex items-center justify-center text-xs rounded-full transition-colors ${
                      selectedDaysOfWeek.includes(index)
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {selectedPattern === 'monthly' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Day of Month
              </label>
              <select
                value={selectedDayOfMonth}
                onChange={(e) => setSelectedDayOfMonth(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              End Date (Optional)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={selectedEndDate || ''}
                min={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedEndDate(e.target.value || undefined)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
              />
              {selectedEndDate && (
                <button
                  type="button"
                  onClick={() => setSelectedEndDate(undefined)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Clear end date"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {!selectedEndDate && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Event will repeat indefinitely
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
