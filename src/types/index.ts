export interface FamilyMember {
  id: string;
  name: string;
  initial?: string;   // Changed from initials
  color?: string;
  email?: string;
  profilePicture?: string; // Changed from avatar_url
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
  starValue?: number; // Added to match AppContext.choreMap usage
}

export interface ListItem {
  id: string;
  list_id: string; // Added: ID of the parent list
  text: string;
  completed: boolean;
  position?: number; // Added: For ordering items
  assignedTo?: string[]; // Kept, as discussed for DB an_to' column
  created_at?: string;  // Added: Corresponds to DB column
}

export interface List {
  id: string;
  title: string; // This is good, AppContext maps db 'name' or 'title' to this
  items: ListItem[];
  created_by?: string; // Added: Corresponds to DB column
  created_at?: string;  // Added: Corresponds to DB column
}

export interface MealPlan {
  id: string;
  date: string; // Consider if this should be Date object or string (ISO)
  meal: string; // Consider more specific type like 'Breakfast' | 'Lunch' | 'Dinner'
  // The provided schema for meal_plans also has title, description, members, created_by
  // These are not reflected here yet.
  title?: string;
  description?: string;
  members?: string[]; // Assuming array of member IDs
  created_by?: string;
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
  // color?: string; // This was in your original type, but AppContext.calMap doesn't map it.
                     // Member color is typically used. If event-specific color override is needed,
                     // AppContext.calMap would need to handle it.
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
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom'; // DB has text
  recurrenceInterval?: number; // DB has integer
  recurrenceEndDate?: string; // ISO date string, null if "forever". DB has timestamp
  recurrenceDaysOfWeek?: number[]; // For weekly: [0,1,2,3,4,5,6] (Sunday to Saturday). DB has ARRAY
  recurrenceDayOfMonth?: number; // For monthly: 1-31. DB has integer
  recurrenceParentId?: string; // ID of the parent recurring event. DB has uuid
  recurrenceExceptions?: string[]; // ISO date strings that are exceptions. DB has ARRAY
  // created_at is in your DB table, could be added here if needed
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