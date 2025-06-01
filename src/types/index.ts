// Define the comprehensive recurrence pattern type
export type CalendarRecurrencePattern =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom'
  | 'weekday'
  | 'weekend'
  | 'nth-day';

export interface FamilyMember {
  id: string;
  name: string;
  initial?: string;
  color?: string;
  email?: string;
  profilePicture?: string;
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  isRotating: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  rotationFrequency?: 'daily' | 'weekly' | 'monthly';
  rotationDay?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  completed: Record<string, boolean>;
  lastRotated?: string;
  starValue?: number;
}

export interface ListItem {
  id: string;
  list_id: string;
  text: string;
  completed: boolean;
  position?: number;
  assignedTo?: string[];
  created_at?: string;
}

export interface List {
  id: string;
  title: string;
  items: ListItem[];
  created_by?: string;
  created_at?: string;
}

export interface MealPlan {
  id: string;
  date: string;
  meal: string;
  title?: string;
  description?: string;
  members?: string[];
  created_by?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  sleepMode: boolean;
  sleepStart: string;
  sleepEnd: string;
  showWeather: boolean;
  weatherLocation: string;
  weatherApiKey?: string;
  weatherLastUpdated?: string;
  showRewards: boolean;
  autoRotateChores: boolean;
  rotationFrequency: 'daily' | 'weekly' | 'monthly';
  rotationDay?: number;
  lastAutoRotation?: string;
  autoRotationMembers: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
  memberId: string;
  color?: string;
  syncId?: string;
  eventType?:
    | 'School'
    | 'Work'
    | 'Fun'
    | 'Appointment'
    | 'Meal'
    | 'Chores'
    | 'Sports'
    | 'Birthday'
    | 'Holiday'
    | 'FamilyTime'
    | 'Other';
  isRecurring?: boolean;
  recurrencePattern?: CalendarRecurrencePattern; // <-- UPDATED TO USE THE NEW TYPE
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  recurrenceDaysOfWeek?: number[];
  recurrenceDayOfMonth?: number;
  recurrenceParentId?: string;
  recurrenceExceptions?: string[];
  editMode?: 'single' | 'all' | 'future';
}

export interface CalendarSettings {
  defaultView: 'day' | 'week' | 'month' | 'dayGrid';
  showWeatherInCalendar: boolean;
  firstDayOfWeek: 0 | 1;
  syncWithGoogle: boolean;
  googleCalendarIds: string[];
  lastSync?: string;
  showHolidays: boolean;
  showBirthdays: boolean;
  showChores: boolean;
  useRelativeTimeLabels: boolean;
}