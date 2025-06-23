import { v4 as uuidv4 } from 'uuid';
import { 
  FamilyMember, 
  Chore, 
  List, 
  AppSettings, 
  CalendarEvent, 
  CalendarSettings 
} from '../types';

// Define storage keys
const STORAGE_KEYS = {
  FAMILY_MEMBERS: 'familyHub_familyMembers',
  CHORES: 'familyHub_chores',
  LISTS: 'familyHub_lists',
  MEAL_PLANS: 'familyHub_mealPlans',
  CALENDAR_EVENTS: 'familyHub_calendarEvents',
  APP_SETTINGS: 'familyHub_appSettings',
  CALENDAR_SETTINGS: 'familyHub_calendarSettings',
};

// Initialize default data if not exists
const initializeDefaultData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.FAMILY_MEMBERS)) {
    localStorage.setItem(STORAGE_KEYS.FAMILY_MEMBERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHORES)) {
    localStorage.setItem(STORAGE_KEYS.CHORES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LISTS)) {
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MEAL_PLANS)) {
    localStorage.setItem(STORAGE_KEYS.MEAL_PLANS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CALENDAR_EVENTS)) {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_EVENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.APP_SETTINGS)) {
    const defaultSettings: AppSettings = {
      theme: 'light',
      sleepMode: false,
      sleepStart: '22:00',
      sleepEnd: '07:00',
      showWeather: true,
      weatherLocation: '',
      showRewards: true,
      autoRotateChores: false,
      rotationFrequency: 'weekly',
      autoRotationMembers: [],
    };
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(defaultSettings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CALENDAR_SETTINGS)) {
    const defaultCalendarSettings: CalendarSettings = {
      defaultView: 'week',
      showWeatherInCalendar: true,
      firstDayOfWeek: 0,
      syncWithGoogle: false,
      googleCalendarIds: [],
      showHolidays: true,
      showBirthdays: true,
      showChores: true,
      useRelativeTimeLabels: true,
    };
    localStorage.setItem(STORAGE_KEYS.CALENDAR_SETTINGS, JSON.stringify(defaultCalendarSettings));
  }
};

// Initialize data on import
initializeDefaultData();

// Generic CRUD operations
const getItems = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting items from ${key}:`, error);
    return [];
  }
};

const saveItems = <T>(key: string, items: T[]): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error(`Error saving items to ${key}:`, error);
    return false;
  }
};

// Family Members
export const getFamilyMembers = (): FamilyMember[] => 
  getItems<FamilyMember>(STORAGE_KEYS.FAMILY_MEMBERS);

export const saveFamilyMember = (member: Omit<FamilyMember, 'id'> & { id?: string }): FamilyMember => {
  const members = getFamilyMembers();
  const newMember: FamilyMember = {
    ...member,
    id: member.id || uuidv4(),
  };
  
  const existingIndex = members.findIndex(m => m.id === newMember.id);
  if (existingIndex >= 0) {
    members[existingIndex] = newMember;
  } else {
    members.push(newMember);
  }
  
  saveItems(STORAGE_KEYS.FAMILY_MEMBERS, members);
  return newMember;
};

export const deleteFamilyMember = (id: string): boolean => {
  const members = getFamilyMembers();
  const updatedMembers = members.filter(m => m.id !== id);
  return saveItems(STORAGE_KEYS.FAMILY_MEMBERS, updatedMembers);
};

// Chores
export const getChores = (): Chore[] => getItems<Chore>(STORAGE_KEYS.CHORES);

export const saveChore = (chore: Omit<Chore, 'id'> & { id?: string }): Chore => {
  const chores = getChores();
  const newChore: Chore = {
    ...chore,
    id: chore.id || uuidv4(),
    completed: chore.completed || {},
  };
  
  const existingIndex = chores.findIndex(c => c.id === newChore.id);
  if (existingIndex >= 0) {
    chores[existingIndex] = newChore;
  } else {
    chores.push(newChore);
  }
  
  saveItems(STORAGE_KEYS.CHORES, chores);
  return newChore;
};

export const deleteChore = (id: string): boolean => {
  const chores = getChores();
  const updatedChores = chores.filter(c => c.id !== id);
  return saveItems(STORAGE_KEYS.CHORES, updatedChores);
};

// Lists
export const getLists = (): List[] => getItems<List>(STORAGE_KEYS.LISTS);

export const saveList = (list: Omit<List, 'id'> & { id?: string }): List => {
  const lists = getLists();
  const newList: List = {
    ...list,
    id: list.id || uuidv4(),
    items: list.items || [],
  };
  
  const existingIndex = lists.findIndex(l => l.id === newList.id);
  if (existingIndex >= 0) {
    lists[existingIndex] = newList;
  } else {
    lists.push(newList);
  }
  
  saveItems(STORAGE_KEYS.LISTS, lists);
  return newList;
};

export const deleteList = (id: string): boolean => {
  const lists = getLists();
  const updatedLists = lists.filter(l => l.id !== id);
  return saveItems(STORAGE_KEYS.LISTS, updatedLists);
};

// List Items
export const saveListItem = (listId: string, item: Omit<ListItem, 'id'> & { id?: string }): ListItem | null => {
  const lists = getLists();
  const listIndex = lists.findIndex(l => l.id === listId);
  
  if (listIndex === -1) return null;
  
  const list = { ...lists[listIndex] };
  const newItem: ListItem = {
    ...item,
    id: item.id || uuidv4(),
    list_id: listId,
  };
  
  const existingIndex = list.items.findIndex(i => i.id === newItem.id);
  if (existingIndex >= 0) {
    list.items[existingIndex] = newItem;
  } else {
    list.items.push(newItem);
  }
  
  lists[listIndex] = list;
  saveItems(STORAGE_KEYS.LISTS, lists);
  return newItem;
};

export const deleteListItem = (listId: string, itemId: string): boolean => {
  const lists = getLists();
  const listIndex = lists.findIndex(l => l.id === listId);
  
  if (listIndex === -1) return false;
  
  const list = { ...lists[listIndex] };
  list.items = list.items.filter(i => i.id !== itemId);
  
  lists[listIndex] = list;
  return saveItems(STORAGE_KEYS.LISTS, lists);
};

// Calendar Events
export const getCalendarEvents = (): CalendarEvent[] => 
  getItems<CalendarEvent>(STORAGE_KEYS.CALENDAR_EVENTS);

export const saveCalendarEvent = (event: Omit<CalendarEvent, 'id'> & { id?: string }): CalendarEvent => {
  const events = getCalendarEvents();
  const newEvent: CalendarEvent = {
    ...event,
    id: event.id || uuidv4(),
  };
  
  const existingIndex = events.findIndex(e => e.id === newEvent.id);
  if (existingIndex >= 0) {
    events[existingIndex] = newEvent;
  } else {
    events.push(newEvent);
  }
  
  saveItems(STORAGE_KEYS.CALENDAR_EVENTS, events);
  return newEvent;
};

export const deleteCalendarEvent = (id: string): boolean => {
  const events = getCalendarEvents();
  const updatedEvents = events.filter(e => e.id !== id);
  return saveItems(STORAGE_KEYS.CALENDAR_EVENTS, updatedEvents);
};

// Settings
export const getAppSettings = (): AppSettings => {
  const defaultSettings: AppSettings = {
    theme: 'light',
    sleepMode: false,
    sleepStart: '22:00',
    sleepEnd: '07:00',
    showWeather: true,
    weatherLocation: '',
    showRewards: true,
    autoRotateChores: false,
    rotationFrequency: 'weekly',
    autoRotationMembers: [],
  };
  
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings;
  } catch (error) {
    console.error('Error getting app settings:', error);
    return defaultSettings;
  }
};

export const saveAppSettings = (settings: Partial<AppSettings>): AppSettings => {
  const currentSettings = getAppSettings();
  const updatedSettings = { ...currentSettings, ...settings };
  
  try {
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('Error saving app settings:', error);
    return currentSettings;
  }
};

export const getCalendarSettings = (): CalendarSettings => {
  const defaultSettings: CalendarSettings = {
    defaultView: 'week',
    showWeatherInCalendar: true,
    firstDayOfWeek: 0,
    syncWithGoogle: false,
    googleCalendarIds: [],
    showHolidays: true,
    showBirthdays: true,
    showChores: true,
    useRelativeTimeLabels: true,
  };
  
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.CALENDAR_SETTINGS);
    return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings;
  } catch (error) {
    console.error('Error getting calendar settings:', error);
    return defaultSettings;
  }
};

export const saveCalendarSettings = (settings: Partial<CalendarSettings>): CalendarSettings => {
  const currentSettings = getCalendarSettings();
  const updatedSettings = { ...currentSettings, ...settings };
  
  try {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_SETTINGS, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('Error saving calendar settings:', error);
    return currentSettings;
  }
};

// Export all functions
export default {
  // Family Members
  getFamilyMembers,
  saveFamilyMember,
  deleteFamilyMember,
  
  // Chores
  getChores,
  saveChore,
  deleteChore,
  
  // Lists
  getLists,
  saveList,
  deleteList,
  saveListItem,
  deleteListItem,
  
  // Calendar Events
  getCalendarEvents,
  saveCalendarEvent,
  deleteCalendarEvent,
  
  // Settings
  getAppSettings,
  saveAppSettings,
  getCalendarSettings,
  saveCalendarSettings,
};
