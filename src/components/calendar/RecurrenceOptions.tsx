import { useState, useEffect } from 'react';
// Removed 'Calendar as CalendarIcon'
import { Repeat1, X } from 'lucide-react';
// Removed 'addDays', 'addWeeks', 'addMonths'
import { format } from 'date-fns';

// Define a more comprehensive type for recurrence patterns
export type RecurrencePatternType = 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'custom' 
  | 'weekday' 
  | 'weekend' 
  | 'nth-day';

interface RecurrenceOptionsProps {
  isRecurring: boolean;
  pattern: RecurrencePatternType; // Use the new comprehensive type
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  onUpdate: (options: {
    isRecurring: boolean;
    pattern: RecurrencePatternType; // Use the new comprehensive type
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
  startDate,
}: RecurrenceOptionsProps) {
  const [isEnabled, setIsEnabled] = useState(isRecurring);
  const [selectedPattern, setSelectedPattern] = useState<RecurrencePatternType>(pattern); // Use the new type for state
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [selectedEndDate, setSelectedEndDate] = useState(endDate);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState(daysOfWeek || []);
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(dayOfMonth || (startDate ? startDate.getDate() : 1));

  const getRecurrencePreview = () => {
    if (!isEnabled) return 'Does not repeat';
    let baseText = '';
    switch (selectedPattern) {
      case 'daily':
        baseText = selectedInterval === 1 ? 'Every day' : `Every ${selectedInterval} days`;
        break;
      case 'weekly':
        if (selectedInterval === 1) {
          if (selectedDaysOfWeek.length === 0 && startDate) { baseText = `Weekly on ${format(startDate, 'EEEE')}`; }
          else if (selectedDaysOfWeek.length === 7) { baseText = 'Every day'; }
          else if (selectedDaysOfWeek.length > 0) {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const sortedSelectedDays = [...selectedDaysOfWeek].sort((a,b) => a-b);
            baseText = `Weekly on ${sortedSelectedDays.map((day) => days[day]).join(', ')}`;
          } else { baseText = 'Weekly'; }
        } else {
          baseText = `Every ${selectedInterval} weeks${startDate ? ` on ${format(startDate, 'EEEE')}` : ''}`;
        }
        break;
      case 'monthly':
        baseText = selectedInterval === 1 ? `Monthly on day ${selectedDayOfMonth}` : `Every ${selectedInterval} months on day ${selectedDayOfMonth}`;
        break;
      case 'weekday':
        baseText = selectedInterval === 1 ? 'Every weekday' : `Every ${selectedInterval} weeks on weekdays`;
        break;
      case 'weekend':
        baseText = selectedInterval === 1 ? 'Every weekend' : `Every ${selectedInterval} weeks on weekends`;
        break;
      case 'nth-day': // This would need more logic to be truly descriptive
        baseText = `On the Nth day of the month (pattern not fully descriptive yet)`;
        break;
      case 'custom':
        baseText = 'Custom recurrence pattern';
        break;
      default:
        // This ensures exhaustiveness for the switch with the new types
        const _exhaustiveCheck: never = selectedPattern;
        return _exhaustiveCheck; 
    }
    if (selectedEndDate) {
      baseText += ` until ${format(new Date(selectedEndDate), 'MMM d, yyyy')}`;
    }
    return baseText;
  };

  useEffect(() => {
    let effectiveDaysOfWeek = selectedDaysOfWeek;
    if (selectedPattern === 'weekday') {
        effectiveDaysOfWeek = [1,2,3,4,5]; // Mon, Tue, Wed, Thu, Fri
    } else if (selectedPattern === 'weekend') {
        effectiveDaysOfWeek = [0,6]; // Sun, Sat
    }

    onUpdate({
      isRecurring: isEnabled,
      pattern: selectedPattern,
      interval: selectedInterval,
      endDate: selectedEndDate,
      daysOfWeek: (selectedPattern === 'weekly' || selectedPattern === 'weekday' || selectedPattern === 'weekend') ? effectiveDaysOfWeek : undefined,
      dayOfMonth: (selectedPattern === 'monthly' || selectedPattern === 'nth-day') ? selectedDayOfMonth : undefined,
    });
  }, [
    isEnabled,
    selectedPattern,
    selectedInterval,
    selectedEndDate,
    selectedDaysOfWeek,
    selectedDayOfMonth,
    onUpdate,
    startDate // startDate is used in onUpdate logic for default daysOfWeek
  ]);

  useEffect(() => {
    if (selectedPattern === 'weekly' && selectedDaysOfWeek.length === 0 && startDate) {
      setSelectedDaysOfWeek([startDate.getDay()]);
    } else if (selectedPattern === 'weekday') {
        setSelectedDaysOfWeek([1,2,3,4,5]);
    } else if (selectedPattern === 'weekend') {
        setSelectedDaysOfWeek([0,6]);
    }
    // Clear daysOfWeek if pattern is not weekly/weekday/weekend
    if (selectedPattern !== 'weekly' && selectedPattern !== 'weekday' && selectedPattern !== 'weekend') {
        setSelectedDaysOfWeek([]);
    }
    // Clear dayOfMonth if pattern is not monthly/nth-day
    if (selectedPattern !== 'monthly' && selectedPattern !== 'nth-day') {
        setSelectedDayOfMonth(startDate ? startDate.getDate() : 1);
    }

  }, [selectedPattern, startDate]);

  const toggleDayOfWeek = (day: number) => {
    setSelectedDaysOfWeek(prevDays => 
        prevDays.includes(day) 
        ? prevDays.filter((d) => d !== day) 
        : [...prevDays, day].sort((a,b) => a-b) // Keep it sorted
    );
  };

  return (
    <div className="mt-4 mb-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Repeat1 size={18} className="text-indigo-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Repeat</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} className="sr-only peer" />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {isEnabled && (
        <div className="pl-6 space-y-4 border-l-2 border-indigo-100 dark:border-indigo-900/30">
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {getRecurrencePreview()}
          </div>
          <div>
            <label htmlFor="recurrencePatternSelect" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Recurrence Pattern</label>
            <select
              id="recurrencePatternSelect"
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value as RecurrencePatternType)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
            >
              <option value="daily">Daily</option>
              <option value="weekday">Weekdays (Mon-Fri)</option>
              <option value="weekend">Weekends (Sat-Sun)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="nth-day">Nth Day of Month (logic pending)</option>
              <option value="custom">Custom (logic pending)</option>
            </select>
          </div>
          <div>
            <label htmlFor="recurrenceIntervalInput" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Repeat Every</label>
            <div className="flex items-center space-x-2">
              <input id="recurrenceIntervalInput" type="number" min="1" max="99" value={selectedInterval} onChange={(e) => setSelectedInterval(Number(e.target.value))}
                className="w-16 px-2 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedPattern === 'daily' ? 'day(s)'
                  : (selectedPattern === 'weekly' || selectedPattern === 'weekday' || selectedPattern === 'weekend') ? 'week(s)'
                  : (selectedPattern === 'monthly' || selectedPattern === 'nth-day') ? 'month(s)'
                  : 'interval(s)'}
              </span>
            </div>
          </div>
          {selectedPattern === 'weekly' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Repeat On</label>
              <div className="flex flex-wrap gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <button key={index} type="button" onClick={() => toggleDayOfWeek(index)}
                    className={`w-7 h-7 flex items-center justify-center text-xs rounded-full transition-colors ${selectedDaysOfWeek.includes(index) ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  >{day}</button>
                ))}
              </div>
            </div>
          )}
          {(selectedPattern === 'monthly' || selectedPattern === 'nth-day') && ( // Show for monthly & nth-day
            <div>
              <label htmlFor="dayOfMonthSelect" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Day of Month</label>
              <select id="dayOfMonthSelect" value={selectedDayOfMonth} onChange={(e) => setSelectedDayOfMonth(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (<option key={day} value={day}>{day}</option>))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="endDateInput" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date (Optional)</label>
            <div className="flex items-center space-x-2">
              <input id="endDateInput" type="date" value={selectedEndDate || ''} min={format(startDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedEndDate(e.target.value || undefined)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
              />
              {selectedEndDate && (<button type="button" onClick={() => setSelectedEndDate(undefined)} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" title="Clear end date"><X size={16} /></button>)}
            </div>
            {!selectedEndDate && (<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Event will repeat indefinitely</p>)}
          </div>
        </div>
      )}
    </div>
  );
}