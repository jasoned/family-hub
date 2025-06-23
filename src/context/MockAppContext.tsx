import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import localDataService from '../services/localDataService';
import { WEATHER_API_KEY } from '../config/env';
import {
  FamilyMember,
  Chore,
  List,
  MealPlan,
  CalendarEvent,
  AppSettings,
  CalendarSettings,
} from '../types';

const defaultSettings: AppSettings = {
  theme: 'light',
  sleepMode: false,
  sleepStart: '22:00',
  sleepEnd: '06:00',
  showWeather: !!WEATHER_API_KEY, // Only show weather if API key is provided
  weatherLocation: 'New York, NY',
  showRewards: true,
  autoRotateChores: false,
  rotationFrequency: 'weekly',
  autoRotationMembers: [],
};

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

interface MockAppContextType {
  session: any;
  user: any;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  familyMembers: FamilyMember[];
  chores: Chore[];
  lists: List[];
  mealPlans: MealPlan[];
  calendarEvents: CalendarEvent[];
  settings: AppSettings;
  calendarSettings: CalendarSettings;
  addFamilyMember: (m: Omit<FamilyMember, 'id'>) => Promise<void>;
  updateFamilyMember: (id: string, m: Partial<FamilyMember>) => Promise<void>;
  removeFamilyMember: (id: string) => Promise<void>;
  addChore: (c: Omit<Chore, 'id' | 'completed'>) => Promise<void>;
  updateChore: (id: string, c: Partial<Chore>) => Promise<void>;
  removeChore: (id: string) => Promise<void>;
  toggleChoreCompletion: (choreId: string, memberId: string) => Promise<void>;
  addCalendarEvent: (e: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateCalendarEvent: (id: string, e: Partial<CalendarEvent>) => Promise<void>;
  removeCalendarEvent: (id: string) => Promise<void>;
  addList: (listData: { title: string }) => Promise<void>;
  updateList: (id: string, listUpdates: { title: string }) => Promise<void>;
  removeList: (id: string) => Promise<void>;
  addListItem: (listId: string, itemData: { text: string }) => Promise<void>;
  updateListItem: (itemId: string, updates: { text?: string; completed?: boolean }) => Promise<void>;
  removeListItem: (itemId: string) => Promise<void>;
  toggleListItemCompletion: (itemId: string, currentStatus: boolean) => Promise<void>;
  updateSettings: (s: Partial<AppSettings>) => void;
  updateCalendarSettings: (s: Partial<CalendarSettings>) => void;
}

const MockAppContext = createContext<MockAppContextType | undefined>(undefined);

export const MockAppProvider = ({ children }: { children: ReactNode }) => {
  const [authLoading, setAuthLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>(defaultCalendarSettings);

  // Mock user session
  const mockUser = {
    id: 'mock-user-id',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    setFamilyMembers(localDataService.getFamilyMembers());
    setChores(localDataService.getChores());
    setLists(localDataService.getLists());
    setMealPlans([]); // Add meal plans if needed
    setCalendarEvents(localDataService.getCalendarEvents());
    setSettings(localDataService.getAppSettings());
    setCalendarSettings(localDataService.getCalendarSettings());
  };

  // Mock authentication functions
  const signInWithGoogle = async () => {
    setAuthLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAuthLoading(false);
  };

  const signOut = async () => {
    setAuthLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setAuthLoading(false);
  };

  // Family Members
  const addFamilyMember = async (member: Omit<FamilyMember, 'id'>) => {
    const newMember = { ...member, id: uuidv4() };
    localDataService.saveFamilyMember(newMember);
    setFamilyMembers([...familyMembers, newMember]);
  };

  const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>) => {
    const updatedMember = { ...familyMembers.find(m => m.id === id), ...updates } as FamilyMember;
    localDataService.saveFamilyMember(updatedMember);
    setFamilyMembers(familyMembers.map(m => (m.id === id ? updatedMember : m)));
  };

  const removeFamilyMember = async (id: string) => {
    localDataService.deleteFamilyMember(id);
    setFamilyMembers(familyMembers.filter(m => m.id !== id));
  };

  // Chores
  const addChore = async (chore: Omit<Chore, 'id' | 'completed'>) => {
    const newChore = { 
      ...chore, 
      id: uuidv4(), 
      completed: {} as Record<string, boolean> 
    } as Chore;
    localDataService.saveChore(newChore);
    setChores([...chores, newChore]);
  };

  const updateChore = async (id: string, updates: Partial<Chore>) => {
    const updatedChore = { ...chores.find(c => c.id === id), ...updates } as Chore;
    localDataService.saveChore(updatedChore);
    setChores(chores.map(c => (c.id === id ? updatedChore : c)));
  };

  const removeChore = async (id: string) => {
    localDataService.deleteChore(id);
    setChores(chores.filter(c => c.id !== id));
  };

  const toggleChoreCompletion = async (choreId: string, memberId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;
    
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    const completionKey = `${memberId}_${today}`;
    const isCompleted = !!chore.completed?.[completionKey];
    
    const updatedCompleted = {
      ...chore.completed,
      [completionKey]: !isCompleted
    };
    
    await updateChore(choreId, { completed: updatedCompleted });
  };

  // Calendar Events
  const addCalendarEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent = { ...event, id: uuidv4() } as CalendarEvent;
    localDataService.saveCalendarEvent(newEvent);
    setCalendarEvents([...calendarEvents, newEvent]);
  };

  const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const updatedEvent = { ...calendarEvents.find(e => e.id === id), ...updates } as CalendarEvent;
    localDataService.saveCalendarEvent(updatedEvent);
    setCalendarEvents(calendarEvents.map(e => (e.id === id ? updatedEvent : e)));
  };

  const removeCalendarEvent = async (id: string) => {
    localDataService.deleteCalendarEvent(id);
    setCalendarEvents(calendarEvents.filter(e => e.id !== id));
  };

  // Lists
  const addList = async (listData: { title: string }) => {
    const newList = { id: uuidv4(), title: listData.title, items: [] };
    localDataService.saveList(newList);
    setLists([...lists, newList]);
  };

  const updateList = async (id: string, listUpdates: { title: string }) => {
    const list = lists.find(l => l.id === id);
    if (!list) return;
    
    const updatedList = { ...list, ...listUpdates };
    localDataService.saveList(updatedList);
    setLists(lists.map(l => (l.id === id ? updatedList : l)));
  };

  const removeList = async (id: string) => {
    localDataService.deleteList(id);
    setLists(lists.filter(l => l.id !== id));
  };

  // List Items
  const addListItem = async (listId: string, itemData: { text: string }) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    
    const newItem = {
      id: uuidv4(),
      list_id: listId,
      text: itemData.text,
      completed: false,
    };
    
    const updatedList = {
      ...list,
      items: [...(list.items || []), newItem],
    };
    
    localDataService.saveList(updatedList);
    setLists(lists.map(l => (l.id === listId ? updatedList : l)));
  };

  const updateListItem = async (itemId: string, updates: { text?: string; completed?: boolean }) => {
    const list = lists.find(l => l.items?.some(i => i.id === itemId));
    if (!list) return;
    
    const updatedItems = list.items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    
    const updatedList = { ...list, items: updatedItems };
    localDataService.saveList(updatedList);
    setLists(lists.map(l => (l.id === list.id ? updatedList : l)));
  };

  const removeListItem = async (itemId: string) => {
    const list = lists.find(l => l.items?.some(i => i.id === itemId));
    if (!list) return;
    
    const updatedItems = list.items.filter(item => item.id !== itemId);
    const updatedList = { ...list, items: updatedItems };
    
    localDataService.saveList(updatedList);
    setLists(lists.map(l => (l.id === list.id ? updatedList : l)));
  };

  const toggleListItemCompletion = async (itemId: string, currentStatus: boolean) => {
    await updateListItem(itemId, { completed: !currentStatus });
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    localDataService.saveAppSettings(updatedSettings);
    setSettings(updatedSettings);
  };

  const updateCalendarSettings = (newSettings: Partial<CalendarSettings>) => {
    const updatedSettings = { ...calendarSettings, ...newSettings };
    localDataService.saveCalendarSettings(updatedSettings);
    setCalendarSettings(updatedSettings);
  };

  return (
    <MockAppContext.Provider
      value={{
        session: { user: mockUser },
        user: mockUser,
        authLoading,
        signInWithGoogle,
        signOut,
        familyMembers,
        chores,
        lists,
        mealPlans,
        calendarEvents,
        settings,
        calendarSettings,
        addFamilyMember,
        updateFamilyMember,
        removeFamilyMember,
        addChore,
        updateChore,
        removeChore,
        toggleChoreCompletion,
        addCalendarEvent,
        updateCalendarEvent,
        removeCalendarEvent,
        addList,
        updateList,
        removeList,
        addListItem,
        updateListItem,
        removeListItem,
        toggleListItemCompletion,
        updateSettings,
        updateCalendarSettings,
      }}
    >
      {children}
    </MockAppContext.Provider>
  );
};

export const useMockAppContext = () => {
  const context = useContext(MockAppContext);
  if (context === undefined) {
    throw new Error('useMockAppContext must be used within a MockAppProvider');
  }
  return context;
};

export default MockAppContext;
