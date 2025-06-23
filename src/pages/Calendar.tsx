import { useState, useEffect, useMemo, useRef } from 'react'; // React default import removed
import { useAppContext } from "../context";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  parseISO,
  addMonths,
  subMonths,
  isWithinInterval,
  addWeeks,
  subWeeks,
  differenceInCalendarDays,
  isBefore,
  isAfter,
} from 'date-fns';
import { CalendarEvent } from '../types'; 
import { WeatherData, fetchWeather } from '../services/weatherService'; // Corrected WeatherData import
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  ListFilter, 
  Plus,
  Repeat,
  Tag,
  Users,
  MapPin,
  // X, // X icon was unused
} from 'lucide-react';
import EventForm from '../components/calendar/EventForm';
import EventPopover from '../components/calendar/EventPopover';
import MemberLegend from '../components/calendar/MemberLegend';

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

const HOUR_HEIGHT = 64; 
const EARLIEST_HOUR_DISPLAY = 6;

export default function CalendarPage() {
  const {
    familyMembers,
    calendarEvents,
    calendarSettings,
    addCalendarEvent,
    updateCalendarEvent,
    removeCalendarEvent,
    settings,
  } = useAppContext();

  const scrollableContainerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month' | 'dayGrid'>(calendarSettings.defaultView);

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [selectedEventData, setSelectedEventData] = useState<CalendarEvent | null>(null);

  const [memberFilter, setMemberFilter] = useState<string[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null); 
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false); 

  const [nowIndicator, setNowIndicator] = useState(new Date());

  useEffect(() => {
    if (!settings.showWeather || !calendarSettings.showWeatherInCalendar) {
      setCurrentWeather(null); 
      return;
    }
    const getWeather = async () => {
      setIsLoadingWeather(true); 
      setWeatherError(null);
      try {
        if (!settings.weatherApiKey) throw new Error('API key is required. Set in Settings.');
        const data = await fetchWeather(settings.weatherLocation, settings.weatherApiKey);
        setCurrentWeather(data);
      } catch (error: any) { 
        console.error('Weather fetch failed:', error); 
        setWeatherError(error.message || 'Could not fetch weather data.');
        setCurrentWeather(null); 
      }
      finally { setIsLoadingWeather(false); }
    };
    getWeather();
  }, [settings.weatherLocation, settings.showWeather, settings.weatherApiKey, calendarSettings.showWeatherInCalendar]);

  useEffect(() => {
    const interval = setInterval(() => setNowIndicator(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ((view === 'dayGrid' || view === 'week') && scrollableContainerRef.current) {
      const now = new Date();
      let shouldScrollToCurrentHour = false;

      if (view === 'dayGrid' && isSameDay(now, currentDate)) {
        shouldScrollToCurrentHour = true;
      } else if (view === 'week') {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek as 0 | 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek as 0 | 1 });
        if (isWithinInterval(now, { start: weekStart, end: weekEnd }) && isSameDay(now, currentDate)) {
            shouldScrollToCurrentHour = true;
        } else if (!isSameDay(now, currentDate) && isWithinInterval(now, { start: weekStart, end: weekEnd })){
            scrollableContainerRef.current.scrollTop = 0; 
            return;
        }
      }

      if (shouldScrollToCurrentHour) {
        const currentHour = now.getHours();
        let scrollPosition = 0;
        if (currentHour >= EARLIEST_HOUR_DISPLAY) {
            const minutesPastEarliest = (currentHour - EARLIEST_HOUR_DISPLAY) * 60 + now.getMinutes();
            scrollPosition = (minutesPastEarliest / 60) * HOUR_HEIGHT;
            const offset = HOUR_HEIGHT * 1; 
            scrollPosition = Math.max(0, scrollPosition - offset);
        }
        scrollableContainerRef.current.scrollTop = scrollPosition;
      } else if (view === 'dayGrid') { 
        scrollableContainerRef.current.scrollTop = 0;
      }
    }
  }, [view, currentDate, calendarSettings.firstDayOfWeek]);

  const getMember = (memberId: string) => familyMembers.find((member) => member.id === memberId);
  const goToToday = () => setCurrentDate(new Date());

  const goToPrevious = () => {
    if (view === 'day' || view === 'dayGrid') setCurrentDate((prev) => subDays(prev, 1));
    else if (view === 'week') setCurrentDate((prev) => subWeeks(prev, 1));
    else if (view === 'month') setCurrentDate((prev) => subMonths(prev, 1));
  };

  const goToNext = () => {
    if (view === 'day' || view === 'dayGrid') setCurrentDate((prev) => addDays(prev, 1));
    else if (view === 'week') setCurrentDate((prev) => addWeeks(prev, 1));
    else if (view === 'month') setCurrentDate((prev) => addMonths(prev, 1));
  };
  
  const handleAddEvent = (date?: Date) => {
    setSelectedDateForModal(date || currentDate); 
    setIsAddingEvent(true);
    setEditingEvent(null);
  };

  const handleEditEvent = (event: CalendarEvent) => { setEditingEvent(event); setIsAddingEvent(true); setSelectedEventData(null); };
  const handleDeleteEvent = (id: string) => { if (confirm('Are you sure?')) { removeCalendarEvent(id); setSelectedEventData(null); }};
  const handleEventClick = (event: CalendarEvent) => setSelectedEventData(event);
  const closeEventPopover = () => setSelectedEventData(null);

  const toggleMemberFilter = (memberId: string) => setMemberFilter(current => current.includes(memberId) ? current.filter(id => id !== memberId) : [...current, memberId]);
  const selectAllMembers = () => setMemberFilter(prev => prev.length === familyMembers.length ? [] : familyMembers.map(m => m.id));
  const resetFilters = () => { setMemberFilter([]); setEventTypeFilter([]); };
  const toggleEventTypeFilter = (eventType: string) => setEventTypeFilter(current => current.includes(eventType) ? current.filter(type => type !== eventType) : [...current, eventType]);
  const toggleAllEventTypes = () => setEventTypeFilter(prev => prev.length === EVENT_TYPES.length ? [] : EVENT_TYPES.map(t => t.value));

  const filteredEvents = useMemo(() => {
    let currentFilteredEvents = calendarEvents; 
    if (memberFilter.length > 0) currentFilteredEvents = currentFilteredEvents.filter(event => memberFilter.includes(event.memberId));
    if (eventTypeFilter.length > 0) currentFilteredEvents = currentFilteredEvents.filter(event => event.eventType ? eventTypeFilter.includes(event.eventType) : false);
    return currentFilteredEvents;
  }, [calendarEvents, memberFilter, eventTypeFilter]);

  const getDaysForView = () => {
    if (view === 'day' || view === 'dayGrid') return [currentDate];
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek as 0 | 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek as 0 | 1 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfMonth(currentDate); const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => { 
      const startDateValue = parseISO(event.start); // Renamed
      const endDateValue = parseISO(event.end); // Renamed
      if (event.isRecurring) {
        const dayOfWeek = day.getDay(); const dayOfMonth = day.getDate();
        if (isBefore(day, startDateValue) && !isSameDay(day, startDateValue)) return false;
        if (event.recurrenceEndDate && isAfter(day, parseISO(event.recurrenceEndDate))) return false;
        if (event.recurrenceExceptions?.some(ex => isSameDay(day, parseISO(ex)))) return false;

        switch (event.recurrencePattern) {
          case 'daily':
            return differenceInCalendarDays(day, startDateValue) % (event.recurrenceInterval || 1) === 0;
          case 'weekly': {
            const weeksSinceStart = Math.floor(differenceInCalendarDays(day, startDateValue) / 7);
            if (weeksSinceStart % (event.recurrenceInterval || 1) !== 0) return false;
            return event.recurrenceDaysOfWeek?.includes(dayOfWeek) ?? startDateValue.getDay() === dayOfWeek;
          }
          case 'monthly': {
            const monthsSinceStart = (day.getFullYear() - startDateValue.getFullYear()) * 12 + (day.getMonth() - startDateValue.getMonth());
            if (monthsSinceStart % (event.recurrenceInterval || 1) !== 0) return false;
            return (event.recurrenceDayOfMonth ?? startDateValue.getDate()) === dayOfMonth;
          }
          default: return false; 
        }
      }
      if (event.allDay) return isSameDay(day, startDateValue);
      return isWithinInterval(day, { start: startDateValue, end: endDateValue }) || isSameDay(day, startDateValue) || isSameDay(day, endDateValue);
    });
  };
  
  const getDateRangeText = () => {
    // CORRECTED FORMATTING STRINGS to use yyyy instead of YYYY
    if (view === 'day' || view === 'dayGrid') return format(currentDate, 'MMMM d, yyyy');
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek as 0 | 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek as 0 | 1 });
      return `${format(start, 'MMM d')} - ${format(end, isSameMonth(start, end) ? 'd, yyyy' : 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  const formatEventTime = (event: CalendarEvent) => {
    const eventStartDate = parseISO(event.start); 
    if (event.allDay) return 'All day';
    return `${format(eventStartDate, 'h:mm a')}`;
  };

  const renderTimeLabels = () => (
    <div className="col-span-1 text-xs text-right pr-2 text-slate-500 dark:text-slate-400">
      {Array.from({ length: 24 - EARLIEST_HOUR_DISPLAY }, (_, i) => i + EARLIEST_HOUR_DISPLAY).map(hour => (
        <div key={`time-${hour}`} className="h-16 flex items-start justify-end pt-1 border-t border-slate-100 dark:border-slate-700/50 first:border-t-0">
          {hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
        </div>
      ))}
    </div>
  );

  const getEventPositionAndHeight = (event: CalendarEvent, dayStartHour: number = EARLIEST_HOUR_DISPLAY) => {
    const eventStartDate = parseISO(event.start); 
    const eventEndDate = parseISO(event.end); 
    if (event.allDay) return { top: 0, height: 28, marginTop: 2 };

    const startMinutesOffset = (eventStartDate.getHours() - dayStartHour) * 60 + eventStartDate.getMinutes();
    const endMinutesOffset = (eventEndDate.getHours() - dayStartHour) * 60 + eventEndDate.getMinutes();
    
    const top = (startMinutesOffset / 60) * HOUR_HEIGHT;
    const height = Math.max(32, ((endMinutesOffset - startMinutesOffset) / 60) * HOUR_HEIGHT);

    return { top, height, marginTop: 0 };
  };
  
  const renderHourLines = () => (
    <>
      {Array.from({ length: 24 - EARLIEST_HOUR_DISPLAY }, (_, i) => i + EARLIEST_HOUR_DISPLAY).map(hour => (
        <div key={`line-${hour}`} className="h-16 border-t border-slate-200 dark:border-slate-700/80"></div>
      ))}
    </>
  );

  const renderDailyAgenda = () => {
    const dayEvents = getEventsForDay(currentDate).sort((a,b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-50 dark:border-slate-800 overflow-hidden h-[calc(100vh-260px)]">
        <div className="p-4 text-center font-semibold border-b border-gray-100 dark:border-slate-800">
          {format(currentDate, 'EEEE, MMMM d, yyyy')} {/* FIXED YYYY to yyyy */}
        </div>
        <div ref={scrollableContainerRef} className="h-full overflow-y-auto">
          {dayEvents.length === 0 ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400">No events for this day</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {dayEvents.map((event) => {
                const member = getMember(event.memberId); if (!member) return null;
                const eventTypeInfo = event.eventType ? EVENT_TYPES.find(t => t.value === event.eventType) : null;
                return (
                  <div key={event.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => handleEventClick(event)}>
                    <div className="flex items-start">
                      <div className="w-20 text-sm text-slate-500 dark:text-slate-400 pt-0.5">
                        {event.allDay ? "All day" : `${format(parseISO(event.start), 'h:mm a')}`}
                      </div>
                      <div className="flex-1 ml-3">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: event.color || member.color }}></span>
                          <h3 className="font-medium text-slate-900 dark:text-white">{event.title}</h3>
                          {event.isRecurring && <Repeat size={14} className="ml-2 text-indigo-500 dark:text-indigo-400 shrink-0" />}
                        </div>
                        {!event.allDay && <div className="text-xs text-slate-400">{`${format(parseISO(event.start), 'h:mm a')} - ${format(parseISO(event.end), 'h:mm a')}`}</div>}
                        {event.location && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center"><MapPin size={12} className="mr-1 shrink-0"/>{event.location}</div>}
                        {eventTypeInfo && <div className="mt-1.5 text-xs px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${eventTypeInfo.color}20`, color: eventTypeInfo.color }}>{eventTypeInfo.label}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const daysInView = getDaysForView(); 

    if (view === 'day') return renderDailyAgenda();

    if (view === 'dayGrid') { 
      const dayEvents = getEventsForDay(currentDate);
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden h-[calc(100vh-260px)] flex flex-col">
          <div className="p-4 text-center font-semibold border-b border-slate-100 dark:border-slate-800">
            {format(currentDate, 'EEEE, MMMM d, yyyy')} {/* FIXED YYYY to yyyy */}
          </div>
          <div ref={scrollableContainerRef} className="flex-1 overflow-y-auto p-1.5 md:p-2 grid grid-cols-[auto_1fr]" style={{ gridTemplateRows: 'auto 1fr' }}>
            <div className="pt-[28px]">
                 {renderTimeLabels()}
            </div>
            <div className="relative border-l border-slate-100 dark:border-slate-700/50">
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 py-1 border-b border-slate-200 dark:border-slate-700 min-h-[30px]">
                {dayEvents.filter(e => e.allDay).map(event => {
                    const member = getMember(event.memberId); if (!member) return null;
                    return <div key={event.id} onClick={() => handleEventClick(event)} style={{ backgroundColor: `${event.color || member.color}30`, borderLeft: `3px solid ${event.color || member.color}`}} className="p-1 text-xs rounded mx-1 mb-0.5 truncate cursor-pointer">{event.title}</div>;
                })}
              </div>
              <div className="relative">
                {renderHourLines()}
                {isSameDay(nowIndicator, currentDate) && (
                  <div className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none" style={{ top: `${(((nowIndicator.getHours() - EARLIEST_HOUR_DISPLAY) * 60 + nowIndicator.getMinutes()) / 60) * HOUR_HEIGHT}px` }}>
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                )}
                {dayEvents.filter(e => !e.allDay).map(event => {
                  const member = getMember(event.memberId); if (!member) return null;
                  const {top, height} = getEventPositionAndHeight(event);
                  return (
                    <div key={event.id} onClick={() => handleEventClick(event)}
                         className="absolute left-1 right-1 rounded p-1.5 text-xs shadow-sm cursor-pointer calendar-event"
                         style={{ top: `${top}px`, height: `${height}px`, backgroundColor: `${event.color || member.color}30`, borderLeft: `3px solid ${event.color || member.color}`}}>
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-[10px] opacity-80">{formatEventTime(event)} - {format(parseISO(event.end), 'h:mm a')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (view === 'week') {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden h-[calc(100vh-260px)] flex flex-col">
                <div className="grid grid-cols-[auto_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-20 pr-4">
                    <div className="w-14 md:w-16"></div>
                    {daysInView.map((day) => ( 
                        <div key={day.toISOString()} className={`p-2 text-center border-l border-slate-100 dark:border-slate-800 ${isSameDay(day, new Date()) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{format(day, 'EEE')}</div>
                            <div className={`text-lg font-medium ${isSameDay(day, new Date()) ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{format(day, 'd')}</div>
                        </div>
                    ))}
                </div>
                <div ref={scrollableContainerRef} className="flex-1 overflow-y-auto grid grid-cols-[auto_repeat(7,1fr)]">
                    <div className="w-14 md:w-16 pt-[28px] sticky left-0 bg-white dark:bg-slate-900 z-10"> 
                        {renderTimeLabels()}
                    </div>
                    {daysInView.map((day, dayIndex) => { 
                        const dayEvents = getEventsForDay(day);
                        return (
                            <div key={dayIndex} className="relative border-l border-slate-100 dark:border-slate-800">
                                <div className="sticky top-0 z-[5] bg-white dark:bg-slate-900 py-1 min-h-[30px] border-b border-slate-200 dark:border-slate-700">
                                  {dayEvents.filter(e => e.allDay).map(event => {
                                      const member = getMember(event.memberId); if (!member) return null;
                                      return <div key={event.id} onClick={() => handleEventClick(event)} style={{ backgroundColor: `${event.color || member.color}30`, borderLeft: `2px solid ${event.color || member.color}`}} className="p-0.5 text-[10px] rounded mx-0.5 mb-0.5 truncate cursor-pointer calendar-event">{event.title}</div>;
                                  })}
                                </div>
                                <div className="absolute inset-0 top-[30px]"> 
                                    {renderHourLines()}
                                </div>
                                <div className="relative pt-[30px]"> 
                                    {isSameDay(nowIndicator, day) && (
                                      <div className="absolute left-0 right-0 border-t-2 border-red-500 z-[2] pointer-events-none" style={{ top: `${(((nowIndicator.getHours() - EARLIEST_HOUR_DISPLAY) * 60 + nowIndicator.getMinutes()) / 60) * HOUR_HEIGHT + 30}px` }}>
                                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                                      </div>
                                    )}
                                    {dayEvents.filter(e => !e.allDay).map(event => {
                                        const member = getMember(event.memberId); if (!member) return null;
                                        const {top, height} = getEventPositionAndHeight(event);
                                        return (
                                            <div key={event.id} onClick={() => handleEventClick(event)}
                                                className="absolute left-0.5 right-0.5 rounded p-1 text-[10px] shadow-sm cursor-pointer calendar-event z-[1]"
                                                style={{ top: `${top}px`, height: `${height}px`, backgroundColor: `${event.color || member.color}30`, borderLeft: `2px solid ${event.color || member.color}`}}>
                                            <div className="font-semibold truncate">{event.title}</div>
                                            <div className="opacity-80">{formatEventTime(event)} - {format(parseISO(event.end), 'h:mm a')}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="absolute inset-0 cursor-pointer" onClick={() => handleAddEvent(day)}></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    const firstDayOfMonth = startOfMonth(currentDate);
    const monthStartDate = startOfWeek(firstDayOfMonth, { weekStartsOn: calendarSettings.firstDayOfWeek as 0 | 1 }); 
    const lastDayOfMonth = endOfMonth(currentDate);
    const monthEndDate = endOfWeek(lastDayOfMonth, { weekStartsOn: calendarSettings.firstDayOfWeek as 0 | 1 }); 
    const allDaysInGrid = eachDayOfInterval({ start: monthStartDate, end: monthEndDate }); 
    const weeks = [];
    for (let i = 0; i < allDaysInGrid.length; i += 7) { weeks.push(allDaysInGrid.slice(i, i + 7)); }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden h-[calc(100vh-260px)] flex flex-col">
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, i) => ( 
            <div key={i} className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">{dayName}</div>
          ))}
        </div>
        <div ref={scrollableContainerRef} className="flex-1 overflow-y-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const dayEvents = getEventsForDay(day);
                return (
                  <div key={dayIndex} onClick={() => handleAddEvent(day)}
                       className={`p-1.5 border-r border-slate-100 dark:border-slate-800 last:border-r-0 min-h-[100px] lg:min-h-[120px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-800/30 opacity-60' : ''} ${isToday ? 'bg-indigo-50/70 dark:bg-indigo-900/30' : ''}`}>
                    <div className={`text-right text-xs sm:text-sm mb-1 ${isToday ? 'font-bold text-indigo-600 dark:text-indigo-300' : isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(event => {
                        const member = getMember(event.memberId); if(!member) return null;
                        return (
                          <div key={event.id} onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleEventClick(event);}} // Typed 'e'
                               style={{backgroundColor: `${event.color || member.color}25`}}
                               className="px-1 py-0.5 rounded text-[10px] truncate flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full mr-1 shrink-0" style={{backgroundColor: event.color || member.color}}></div>
                            <span className="truncate" style={{color: event.color || member.color }}>{event.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && <div className="text-[9px] text-slate-500 dark:text-slate-400 text-center">+{dayEvents.length - 3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Family Calendar
          </h1>
          <div className="flex items-center mt-1 text-slate-600 dark:text-slate-300 text-sm">
            <CalendarIcon size={16} className="mr-1.5" />
            <span>{getDateRangeText()}</span>
          </div>
        </div>
        {settings.showWeather && calendarSettings.showWeatherInCalendar && (
          isLoadingWeather ? <div className="text-xs mt-2 sm:mt-0">Loading weather...</div> :
          weatherError ? <div className="text-xs text-red-500 mt-2 sm:mt-0">{weatherError}</div> :
          currentWeather && (
            <div className="mt-2 sm:mt-0 flex items-center bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 text-xs">
              <img src={`https://openweathermap.org/img/wn/${currentWeather.icon}.png`} alt={currentWeather.description} width={32} height={32} className="mr-1 -my-1"/>
              <div>
                <div className="font-medium text-sm">{currentWeather.temp}°F</div>
                <div className="text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{currentWeather.location}</div>
              </div>
            </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex space-x-1">
          <button onClick={goToPrevious} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={goToToday} className="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">Today</button>
          <button onClick={goToNext} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronRight size={20} /></button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 sm:p-1">
            <button onClick={() => setView('day')} className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center ${view === 'day' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              <ListFilter size={14} className="mr-1 hidden sm:inline" />Agenda
            </button>
            <button onClick={() => setView('dayGrid')} className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center ${view === 'dayGrid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              <Clock size={14} className="mr-1 hidden sm:inline" />Day
            </button>
            <button onClick={() => setView('week')} className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${view === 'week' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Week</button>
            <button onClick={() => setView('month')} className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${view === 'month' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Month</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsFiltering(!isFiltering)} className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors ${isFiltering || memberFilter.length > 0 || eventTypeFilter.length > 0 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              <Filter size={16} /> <span className="hidden sm:inline">Filter</span>
              {(memberFilter.length > 0 || eventTypeFilter.length > 0) && <span className="ml-1 bg-indigo-500 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs">{memberFilter.length + eventTypeFilter.length}</span>}
            </button>
            <button onClick={() => handleAddEvent()} className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm transition-colors" disabled={familyMembers.length === 0}>
              <Plus size={16} /> <span className="hidden sm:inline">Add Event</span>
            </button>
          </div>
        </div>
      </div>

      <MemberLegend members={familyMembers} className="mb-3" selectedMembers={memberFilter} onMemberClick={toggleMemberFilter} interactive={true} onSelectAll={selectAllMembers} />

      <AnimatePresence>
        {isFiltering && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="flex items-start md:items-center justify-between mb-3 flex-col md:flex-row">
              <div className="flex items-center mb-2 md:mb-0"><Filter size={16} className="mr-2 text-indigo-500" /><h3 className="font-medium text-sm">Calendar Filters</h3></div>
              {(memberFilter.length > 0 || eventTypeFilter.length > 0) && <button onClick={resetFilters} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Clear all filters</button>}
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5"><div className="flex items-center"><Users size={14} className="mr-1.5 text-indigo-500" /><h4 className="text-xs font-medium">Family Members</h4></div><button onClick={selectAllMembers} className={`text-xs px-1.5 py-0.5 rounded ${memberFilter.length === familyMembers.length ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'}`}>{memberFilter.length === familyMembers.length ? 'Deselect All' : 'Select All'}</button></div>
              <div className="flex flex-wrap gap-1.5">{familyMembers.map(member => <button key={member.id} onClick={() => toggleMemberFilter(member.id)} className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs transition-colors ${memberFilter.includes(member.id) ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-300 dark:ring-indigo-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: member.color }}></div><span>{member.name}</span></button>)}</div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-1.5"><div className="flex items-center"><Tag size={14} className="mr-1.5 text-indigo-500" /><h4 className="text-xs font-medium">Event Types</h4></div><button onClick={toggleAllEventTypes} className={`text-xs px-1.5 py-0.5 rounded ${eventTypeFilter.length === EVENT_TYPES.length ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'}`}>{eventTypeFilter.length === EVENT_TYPES.length ? 'Deselect All' : 'Select All'}</button></div>
              <div className="flex flex-wrap gap-1.5">{EVENT_TYPES.map(type => <button key={type.value} onClick={() => toggleEventTypeFilter(type.value)} className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs transition-colors ${eventTypeFilter.includes(type.value) ? 'font-medium ring-1' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`} style={eventTypeFilter.includes(type.value) ? {backgroundColor: `${type.color}25`, borderColor: type.color, color: type.color} : {backgroundColor: `${type.color}15`, color: `${type.color}99`}}><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }}></div><span>{type.label}</span></button>)}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-h-0"> 
        {renderCalendar()}
      </div>

      <AnimatePresence>
        {(isAddingEvent || editingEvent) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <EventForm event={editingEvent || undefined} date={selectedDateForModal || undefined} familyMembers={familyMembers}
              onSubmit={(eventData) => {
                if (editingEvent) updateCalendarEvent(editingEvent.id, eventData);
                else addCalendarEvent(eventData);
                setIsAddingEvent(false); setEditingEvent(null);
              }}
              onCancel={() => { setIsAddingEvent(false); setEditingEvent(null); }} />
          </div>
        )}
      </AnimatePresence>

      {selectedEventData && ( 
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={closeEventPopover}>
            <div onClick={(e: React.MouseEvent) => e.stopPropagation()}> 
                 <EventPopover event={selectedEventData} member={getMember(selectedEventData.memberId)!} onClose={closeEventPopover} onEdit={handleEditEvent} onDelete={handleDeleteEvent} />
            </div>
          </div>
      )}
    </div>
  );
}