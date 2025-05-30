 export interface FamilyMember {
   id: string;
   name: string;
+  initials?: string;   // <-- NEW
   color?: string;
   email?: string;
   avatar_url?: string;
 }


export interface Chore {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  isRotating: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  rotationFrequency?: 'daily' | 'weekly' | 'monthly';
  rotationDay?: number; // Day of week (0-6) for weekly or day of month (1-31) for monthly
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  completed: Record<string, boolean>; // memberId -> completed status
  lastRotated?: string;
}

export interface List {
  id: string;
  title: string;
  items: ListItem[];
}

export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string[];
}

export interface MealPlan {
  id: string;
  date: string;
  meal: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  sleepMode: boolean;
  sleepStart: string; // HH:MM
  sleepEnd: string; // HH:MM
  showWeather: boolean;
  weatherLocation: string;
  weatherApiKey?: string; // OpenWeatherMap API key
  weatherLastUpdated?: string; // ISO date string of last weather update
  showRewards: boolean;
  autoRotateChores: boolean;
  rotationFrequency: 'daily' | 'weekly' | 'monthly';
  rotationDay?: number; // Day of week (0-6) for weekly or day of month (1-31) for monthly
  lastAutoRotation?: string; // ISO date string of last auto rotation
  autoRotationMembers: string[]; // IDs of family members included in auto-rotation
}

// Calendar-related types
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string; // ISO date string
  allDay: boolean;
  location?: string;
  description?: string;
  memberId: string; // ID of the family member
  color?: string; // Optional override for member color
  syncId?: string; // For Google Calendar sync
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

  // Recurrence properties
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceInterval?: number; // Every X days/weeks/months
  recurrenceEndDate?: string; // ISO date string, null if "forever"
  recurrenceDaysOfWeek?: number[]; // For weekly: [0,1,2,3,4,5,6] (Sunday to Saturday)
  recurrenceDayOfMonth?: number; // For monthly: 1-31
  recurrenceParentId?: string; // ID of the parent recurring event
  recurrenceExceptions?: string[]; // ISO date strings that are exceptions to the pattern
}

export interface CalendarSettings {
  defaultView: 'day' | 'week' | 'month';
  showWeatherInCalendar: boolean;
  firstDayOfWeek: 0 | 1; // 0 for Sunday, 1 for Monday
  syncWithGoogle: boolean;
  googleCalendarIds: string[]; // IDs of Google Calendars to sync with
  lastSync?: string; // ISO date string of last sync
  showHolidays: boolean;
  showBirthdays: boolean;
  showChores: boolean;
  useRelativeTimeLabels: boolean; // e.g., "Today", "Tomorrow" instead of dates
}
