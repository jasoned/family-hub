import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
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
  getHours,
  getMinutes,
  isWithinInterval,
  addWeeks,
  subWeeks,
  differenceInCalendarDays,
  isBefore,
  isAfter,
  addMinutes,
} from 'date-fns';
import { CalendarEvent } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  ListFilter,
  Plus,
  Repeat,
  Tag,
  Users,
  X,
} from 'lucide-react';
import EventForm from '../components/calendar/EventForm';
import EventPopover from '../components/calendar/EventPopover';
import MemberLegend from '../components/calendar/MemberLegend';

// Weather components
import { fetchWeather, WeatherData } from '../services/weatherService';

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

  // State for date navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>(calendarSettings.defaultView);

  // Event management state
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Filter state
  const [memberFilter, setMemberFilter] = useState<string[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Weather state
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  // Current time indicator
  const [nowIndicator, setNowIndicator] = useState(new Date());

  // Get weather data
  useEffect(() => {
    if (!settings.showWeather || !calendarSettings.showWeatherInCalendar) return;

    const getWeather = async () => {
      setIsLoadingWeather(true);
      setWeatherError(null);

      try {
        // Check if API key exists before trying to fetch
        if (!settings.weatherApiKey) {
          throw new Error(
            'API key is required. Please add your OpenWeatherMap API key in Settings.',
          );
        }

        const data = await fetchWeather(settings.weatherLocation, settings.weatherApiKey);
        setCurrentWeather(data);
      } catch (error: any) {
        console.error('Weather fetch failed:', error);
        setWeatherError(
          error.message || 'Could not fetch weather data. Please check your settings.',
        );
      } finally {
        setIsLoadingWeather(false);
      }
    };

    getWeather();
  }, [
    settings.weatherLocation,
    settings.showWeather,
    settings.weatherApiKey,
    calendarSettings.showWeatherInCalendar,
  ]);

  // Update current time indicator every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNowIndicator(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Helper to get member by ID
  const getMember = (memberId: string) => {
    return familyMembers.find((member) => member.id === memberId);
  };

  // Date navigation handlers
  const goToToday = () => setCurrentDate(new Date());

  const goToPrevious = () => {
    if (view === 'day') {
      setCurrentDate((prev) => subDays(prev, 1));
    } else if (view === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else if (view === 'month') {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const goToNext = () => {
    if (view === 'day') {
      setCurrentDate((prev) => addDays(prev, 1));
    } else if (view === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else if (view === 'month') {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  // Event handlers
  const handleAddEvent = (date?: Date) => {
    setSelectedDate(date || new Date());
    setIsAddingEvent(true);
    setEditingEvent(null);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsAddingEvent(true);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      removeCalendarEvent(id);
      setSelectedEvent(null);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const closeEventPopover = () => {
    setSelectedEvent(null);
  };

  // Filter events by member
  const toggleMemberFilter = (memberId: string) => {
    setMemberFilter((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      } else {
        return [...current, memberId];
      }
    });
  };

  // Select all members for filtering
  const selectAllMembers = () => {
    if (memberFilter.length === familyMembers.length) {
      // If all are selected, clear the filter
      setMemberFilter([]);
    } else {
      // Otherwise, select all members
      setMemberFilter(familyMembers.map((m) => m.id));
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setMemberFilter([]);
    setEventTypeFilter([]);
  };

  // Toggle event type filter
  const toggleEventTypeFilter = (eventType: string) => {
    setEventTypeFilter((current) => {
      if (current.includes(eventType)) {
        return current.filter((type) => type !== eventType);
      } else {
        return [...current, eventType];
      }
    });
  };

  // Select all event types
  const toggleAllEventTypes = () => {
    if (eventTypeFilter.length === EVENT_TYPES.length) {
      setEventTypeFilter([]);
    } else {
      setEventTypeFilter(EVENT_TYPES.map((t) => t.value));
    }
  };

  // Filter events based on selected members and event types
  const filteredEvents = useMemo(() => {
    let filtered = calendarEvents;

    // Filter by member if filters are active
    if (memberFilter.length > 0) {
      filtered = filtered.filter((event) => memberFilter.includes(event.memberId));
    }

    // Filter by event type if filters are active
    if (eventTypeFilter.length > 0) {
      filtered = filtered.filter((event) =>
        event.eventType ? eventTypeFilter.includes(event.eventType) : false,
      );
    }

    return filtered;
  }, [calendarEvents, memberFilter, eventTypeFilter]);

  // Get date range for current view
  const getDaysForView = () => {
    if (view === 'day') {
      return [currentDate];
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek });
      const end = endOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => {
      const startDate = parseISO(event.start);
      const endDate = parseISO(event.end);

      // Get the event's color based on type or member
      const getEventColor = (event: CalendarEvent) => {
        // If an event type is specified, use its color
        if (event.eventType) {
          const eventTypeInfo = EVENT_TYPES.find((t) => t.value === event.eventType);
          if (eventTypeInfo) return eventTypeInfo.color;
        }

        // Otherwise use the member's color
        const member = familyMembers.find((m) => m.id === event.memberId);
        return member ? member.color : '#6B7280';
      };

      // Handle recurring events (simplified - future enhancement to calculate actual recurrence)
      if (event.isRecurring) {
        // Check if this day matches the recurrence pattern
        const dayOfWeek = day.getDay();
        const dayOfMonth = day.getDate();

        // Basic recurrence check (this is simplified)
        if (event.recurrencePattern === 'daily') {
          // Daily recurrence
          if (isBefore(day, startDate)) return false;

          if (event.recurrenceEndDate) {
            const endRecur = parseISO(event.recurrenceEndDate);
            if (isAfter(day, endRecur)) return false;
          }

          // Check interval
          const daysSinceStart = differenceInCalendarDays(day, startDate);
          return daysSinceStart % (event.recurrenceInterval || 1) === 0;
        } else if (event.recurrencePattern === 'weekly') {
          // Weekly recurrence
          if (isBefore(day, startDate)) return false;

          if (event.recurrenceEndDate) {
            const endRecur = parseISO(event.recurrenceEndDate);
            if (isAfter(day, endRecur)) return false;
          }

          // Check if this day of week is included
          if (event.recurrenceDaysOfWeek && !event.recurrenceDaysOfWeek.includes(dayOfWeek)) {
            return false;
          }

          // Check interval
          const weeksSinceStart = Math.floor(differenceInCalendarDays(day, startDate) / 7);
          return weeksSinceStart % (event.recurrenceInterval || 1) === 0;
        } else if (event.recurrencePattern === 'monthly') {
          // Monthly recurrence
          if (isBefore(day, startDate)) return false;

          if (event.recurrenceEndDate) {
            const endRecur = parseISO(event.recurrenceEndDate);
            if (isAfter(day, endRecur)) return false;
          }

          // Check if this is the right day of month
          if (event.recurrenceDayOfMonth && dayOfMonth !== event.recurrenceDayOfMonth) {
            return false;
          }

          // Check interval
          const monthsSinceStart =
            (day.getFullYear() - startDate.getFullYear()) * 12 +
            (day.getMonth() - startDate.getMonth());

          return monthsSinceStart % (event.recurrenceInterval || 1) === 0;
        }
      }

      // Regular non-recurring event
      if (event.allDay) {
        return isSameDay(day, startDate);
      }

      return (
        isWithinInterval(day, { start: startDate, end: endDate }) ||
        isSameDay(day, startDate) ||
        isSameDay(day, endDate)
      );
    });
  };

  // Format date range for header
  const getDateRangeText = () => {
    if (view === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek });
      const end = endOfWeek(currentDate, { weekStartsOn: calendarSettings.firstDayOfWeek });
      const sameMonth = start.getMonth() === end.getMonth();

      return sameMonth
        ? `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`
        : `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  // Format event time
  const formatEventTime = (event: CalendarEvent) => {
    const startDate = parseISO(event.start);

    if (event.allDay) {
      return 'All day';
    }

    const hours = getHours(startDate);
    const minutes = getMinutes(startDate);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour = hours % 12 || 12;

    return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Render time grid for day/week view
  const renderTimeGrid = (day: Date) => {
    const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

    return (
      <div className="relative">
        {hours.map((hour) => {
          const time = new Date(day);
          time.setHours(hour, 0, 0, 0);

          return (
            <div key={hour} className="border-t border-gray-200 dark:border-gray-700 h-16 relative">
              <div className="absolute -top-3 left-0 text-xs text-gray-500 dark:text-gray-400 w-12 text-right pr-2">
                {hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Position event on time grid
  const getEventPosition = (event: CalendarEvent) => {
    const startDate = parseISO(event.start);
    const endDate = parseISO(event.end);

    if (event.allDay) {
      return { top: 0, height: 32 };
    }

    const dayStart = new Date(startDate);
    dayStart.setHours(6, 0, 0, 0); // 6am start

    const minutesSinceStart = (startDate.getHours() - 6) * 60 + startDate.getMinutes();
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

    // 16px per minute (height of hour row is 64px)
    const top = (minutesSinceStart / 60) * 64;
    const height = Math.max(32, (durationMinutes / 60) * 64); // Min height 32px

    return { top, height };
  };

  // Render daily agenda view
  const renderDailyAgenda = () => {
    const dayEvents = getEventsForDay(currentDate);
    dayEvents.sort((a, b) => {
      const aStart = parseISO(a.start);
      const bStart = parseISO(b.start);
      return aStart.getTime() - bStart.getTime();
    });

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-50 dark:border-slate-800 overflow-hidden h-[calc(100vh-220px)]">
        <div className="p-4 text-center font-semibold border-b border-gray-100 dark:border-slate-800">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </div>

        <div className="h-full overflow-y-auto">
          {dayEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No events for this day
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {dayEvents.map((event) => {
                const member = getMember(event.memberId);
                if (!member) return null;

                const startTime = parseISO(event.start);
                const endTime = parseISO(event.end);

                const eventTypeInfo = event.eventType
                  ? EVENT_TYPES.find((t) => t.value === event.eventType)
                  : null;

                return (
                  <div
                    key={event.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start">
                      <div className="w-16 text-sm text-gray-500 dark:text-gray-400 pt-1">
                        {event.allDay ? (
                          <span>All day</span>
                        ) : (
                          <span>{format(startTime, 'h:mm a')}</span>
                        )}
                      </div>

                      <div className="flex-1 ml-4">
                        <div className="flex items-center">
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: member.color }}
                          ></span>
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {event.title}
                          </h3>

                          {event.isRecurring && (
                            <Repeat
                              size={14}
                              className="ml-2 text-indigo-500 dark:text-indigo-400"
                            />
                          )}
                        </div>

                        <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {!event.allDay && (
                            <span className="mr-2">
                              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                            </span>
                          )}

                          {event.location && (
                            <span className="mr-2 flex items-center">
                              <MapPin size={12} className="mr-1" />
                              {event.location}
                            </span>
                          )}
                        </div>

                        {event.eventType && (
                          <div
                            className="mt-1 text-xs px-2 py-0.5 rounded-full inline-block"
                            style={{
                              backgroundColor: `${eventTypeInfo?.color}20`,
                              color: eventTypeInfo?.color,
                            }}
                          >
                            {event.eventType}
                          </div>
                        )}

                        {event.description && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800/50 p-2 rounded">
                            {event.description}
                          </div>
                        )}
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

  // Render calendar based on current view
  const renderCalendar = () => {
    const days = getDaysForView();

    if (view === 'day') {
      // Render the daily agenda view instead of traditional day view
      return renderDailyAgenda();
    } else if (view === 'time') {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-50 dark:border-slate-800 overflow-hidden h-[calc(100vh-220px)]">
          <div className="p-4 text-center font-semibold border-b border-gray-100 dark:border-slate-800">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </div>

          <div className="h-full overflow-y-auto p-4">
            <div className="relative min-h-[1000px]">
              {/* Time grid */}
              {renderTimeGrid(currentDate)}

              {/* Current time indicator */}
              {isSameDay(nowIndicator, currentDate) && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                  style={{
                    top: `${(((nowIndicator.getHours() - 6) * 60 + nowIndicator.getMinutes()) / 60) * 64}px`,
                  }}
                >
                  <div className="absolute -top-2 -left-3 w-4 h-4 rounded-full bg-red-500"></div>
                  <div className="absolute -top-4 left-2 text-xs text-red-500 font-medium">
                    {format(nowIndicator, 'h:mm a')}
                  </div>
                </div>
              )}

              {/* Events */}
              {filteredEvents
                .filter((event) => isSameDay(parseISO(event.start), currentDate))
                .map((event) => {
                  const member = getMember(event.memberId);
                  if (!member) return null;

                  const { top, height } = getEventPosition(event);

                  return (
                    <div
                      key={event.id}
                      className="absolute left-16 right-4 rounded-md p-2 text-sm shadow-sm cursor-pointer"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: `${member.color}20`,
                        borderLeft: `3px solid ${member.color}`,
                      }}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                        <Clock size={10} className="mr-1" />
                        {formatEventTime(event)}
                        {event.isRecurring && (
                          <span className="ml-2 text-indigo-500 dark:text-indigo-400">↻</span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Event click target overlay */}
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={(e) => {
                  // Only trigger if clicking directly on the background
                  if ((e.target as HTMLElement).classList.contains('cursor-pointer')) {
                    handleAddEvent(currentDate);
                  }
                }}
              ></div>
            </div>
          </div>
        </div>
      );
    } else if (view === 'week') {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-50 dark:border-slate-800 overflow-hidden h-[calc(100vh-220px)]">
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800">
            {days.map((day, i) => (
              <div
                key={i}
                className={`p-3 text-center ${
                  isSameDay(day, new Date())
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 font-medium'
                    : ''
                }`}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-lg ${
                    isSameDay(day, new Date()) ? 'text-indigo-600 dark:text-indigo-300' : ''
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-7 min-h-[1000px] relative">
              {/* Time grid overlay */}
              <div className="absolute inset-0 grid grid-cols-7">
                {days.map((day, i) => (
                  <div
                    key={i}
                    className="relative border-r border-gray-100 dark:border-slate-800 last:border-r-0"
                  >
                    {renderTimeGrid(day)}

                    {/* Current time indicator */}
                    {isSameDay(nowIndicator, day) && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                        style={{
                          top: `${(((nowIndicator.getHours() - 6) * 60 + nowIndicator.getMinutes()) / 60) * 64}px`,
                        }}
                      >
                        <div className="absolute -top-2 -left-1 w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Days columns with events */}
              {days.map((day, dayIndex) => {
                const dayEvents = getEventsForDay(day);

                return (
                  <div
                    key={dayIndex}
                    className={`relative border-r border-gray-100 dark:border-slate-800 last:border-r-0 ${
                      isSameDay(day, new Date()) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                    }`}
                  >
                    {/* All-day events */}
                    <div className="sticky top-0 z-20 bg-inherit">
                      {dayEvents
                        .filter((event) => event.allDay)
                        .map((event, eventIndex) => {
                          const member = getMember(event.memberId);
                          if (!member) return null;

                          return (
                            <div
                              key={`${event.id}-${eventIndex}`}
                              className="mx-1 my-0.5 p-1 text-xs rounded shadow-sm cursor-pointer calendar-event"
                              style={{
                                backgroundColor: `${member.color}20`,
                                borderLeft: `2px solid ${member.color}`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                All day
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Timed events */}
                    {dayEvents
                      .filter((event) => !event.allDay)
                      .map((event, eventIndex) => {
                        const member = getMember(event.memberId);
                        if (!member) return null;

                        const { top, height } = getEventPosition(event);

                        return (
                          <div
                            key={`${event.id}-${eventIndex}`}
                            className="absolute left-0.5 right-0.5 rounded shadow-sm p-1 text-xs cursor-pointer z-10 calendar-event"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: `${member.color}20`,
                              borderLeft: `2px solid ${member.color}`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400 flex items-center">
                              {formatEventTime(event)}
                              {event.isRecurring && (
                                <span className="ml-1 text-indigo-500 dark:text-indigo-400">↻</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {/* Click handler for adding events */}
                    <div
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => handleAddEvent(day)}
                    ></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    } else {
      // Month view
      const firstDay = startOfMonth(currentDate);
      const startDate = startOfWeek(firstDay, { weekStartsOn: calendarSettings.firstDayOfWeek });
      const lastDay = endOfMonth(currentDate);
      const endDate = endOfWeek(lastDay, { weekStartsOn: calendarSettings.firstDayOfWeek });

      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      const weeks = [];

      for (let i = 0; i < allDays.length; i += 7) {
        weeks.push(allDays.slice(i, i + 7));
      }

      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-50 dark:border-slate-800 overflow-hidden h-[calc(100vh-220px)]">
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div
                key={i}
                className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="h-full overflow-y-auto">
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800 last:border-b-0"
              >
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  const dayEvents = getEventsForDay(day);

                  return (
                    <div
                      key={dayIndex}
                      className={`p-1 border-r border-gray-100 dark:border-slate-800 last:border-r-0 min-h-[120px] ${
                        !isCurrentMonth ? 'bg-gray-50 dark:bg-slate-800/50 opacity-50' : ''
                      } ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                      onClick={() => handleAddEvent(day)}
                    >
                      <div
                        className={`text-right p-1 ${
                          isToday
                            ? 'font-bold text-indigo-600 dark:text-indigo-400'
                            : isCurrentMonth
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 4).map((event, i) => {
                          const member = getMember(event.memberId);
                          if (!member) return null;

                          return (
                            <div
                              key={`${event.id}-${i}`}
                              className="px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer flex items-center"
                              style={{ backgroundColor: `${member.color}20` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                            >
                              <div
                                className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                                style={{ backgroundColor: member.color }}
                              ></div>
                              <div className="truncate">
                                <span className="font-medium">{event.title}</span>
                                {event.isRecurring && (
                                  <span className="ml-1 text-indigo-500 dark:text-indigo-400">
                                    ↻
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {dayEvents.length > 4 && (
                          <div className="px-1.5 py-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                            +{dayEvents.length - 4} more
                          </div>
                        )}

                        {selectedEvent && dayEvents.find((e) => e.id === selectedEvent.id) && (
                          <div className="relative">
                            <EventPopover
                              event={selectedEvent}
                              member={getMember(selectedEvent.memberId)!}
                              onClose={closeEventPopover}
                              onEdit={handleEditEvent}
                              onDelete={handleDeleteEvent}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-6 md:p-8 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Family Calendar
          </h1>

          <div className="flex items-center mt-1 text-slate-600 dark:text-slate-300">
            <Calendar size={16} className="mr-1.5" />
            <span>{getDateRangeText()}</span>
          </div>
        </div>

        {settings.showWeather && calendarSettings.showWeatherInCalendar && currentWeather && (
          <div className="mt-2 sm:mt-0 flex items-center bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center">
              <img
                src={`https://openweathermap.org/img/wn/${currentWeather.icon}@2x.png`}
                alt={currentWeather.description}
                width={40}
                height={40}
                className="mr-1"
              />
              <div>
                <div className="text-xl font-medium">{currentWeather.temp}°F</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentWeather.location} • {currentWeather.description}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex space-x-1">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            Today
          </button>

          <button
            onClick={goToNext}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center ${
                view === 'day'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <ListFilter size={14} className="mr-1" />
              Agenda
            </button>

            <button
              onClick={() => setView('time')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center ${
                view === 'time'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock size={14} className="mr-1" />
              Time
            </button>

            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'week'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              Week
            </button>

            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === 'month'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              Month
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFiltering(!isFiltering)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isFiltering || memberFilter.length > 0
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <Filter size={18} />
              <span>Filter</span>
              {memberFilter.length > 0 && (
                <span className="ml-1 bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                  {memberFilter.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleAddEvent(currentDate)}
              className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              disabled={familyMembers.length === 0}
            >
              <Plus size={18} />
              <span>Add Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Family Member Color Legend */}
      <MemberLegend
        members={familyMembers}
        className="mb-4"
        selectedMembers={memberFilter}
        onMemberClick={toggleMemberFilter}
        interactive={true}
        onSelectAll={selectAllMembers}
      />

      {/* Filters dropdown */}
      <AnimatePresence>
        {isFiltering && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700"
          >
            <div className="flex items-start md:items-center justify-between mb-4 flex-col md:flex-row">
              <div className="flex items-center mb-2 md:mb-0">
                <Filter size={16} className="mr-2 text-indigo-500" />
                <h3 className="font-medium">Calendar Filters</h3>
              </div>
              <div className="flex items-center space-x-2">
                {(memberFilter.length > 0 || eventTypeFilter.length > 0) && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>

            {/* Family Members Filter */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Users size={16} className="mr-2 text-indigo-500" />
                  <h3 className="text-sm font-medium">Family Members</h3>
                </div>
                <button
                  onClick={selectAllMembers}
                  className={`text-xs px-2 py-1 rounded ${
                    memberFilter.length === familyMembers.length
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
                  }`}
                >
                  {memberFilter.length === familyMembers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleMemberFilter(member.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      memberFilter.includes(member.id)
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-300 dark:ring-indigo-600'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: member.color }}
                    ></div>
                    <span>{member.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Event Types Filter */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Tag size={16} className="mr-2 text-indigo-500" />
                  <h3 className="text-sm font-medium">Event Types</h3>
                </div>
                <button
                  onClick={toggleAllEventTypes}
                  className={`text-xs px-2 py-1 rounded ${
                    eventTypeFilter.length === EVENT_TYPES.length
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
                  }`}
                >
                  {eventTypeFilter.length === EVENT_TYPES.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => toggleEventTypeFilter(type.value)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      eventTypeFilter.includes(type.value)
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-300 dark:ring-indigo-600'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                    style={{
                      backgroundColor: eventTypeFilter.includes(type.value)
                        ? `${type.color}20`
                        : '',
                      borderColor: eventTypeFilter.includes(type.value) ? type.color : '',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    ></div>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Status */}
            {(memberFilter.length > 0 || eventTypeFilter.length > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex flex-wrap gap-2">
                  {memberFilter.length > 0 && (
                    <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">
                      {memberFilter.length} of {familyMembers.length} members
                    </span>
                  )}
                  {eventTypeFilter.length > 0 && (
                    <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">
                      {eventTypeFilter.length} of {EVENT_TYPES.length} event types
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {renderCalendar()}

      <AnimatePresence>
        {(isAddingEvent || editingEvent) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <EventForm
              event={editingEvent || undefined}
              date={selectedDate || undefined}
              familyMembers={familyMembers}
              onSubmit={(event) => {
                if (editingEvent) {
                  updateCalendarEvent(editingEvent.id, event);
                } else {
                  addCalendarEvent(event);
                }
                setIsAddingEvent(false);
                setEditingEvent(null);
              }}
              onCancel={() => {
                setIsAddingEvent(false);
                setEditingEvent(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
