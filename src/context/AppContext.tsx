/* ----------------------------------------------------------------
   src/context/AppContext.tsx
   ---------------------------------------------------------------- */
import { shouldRotate } from '../utils/rotation';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { supabase } from '../supabaseClient';
import {
  FamilyMember,
  Chore,
  List,
  ListItem, // Ensure ListItem is imported
  MealPlan,
  CalendarEvent,
  AppSettings,
  CalendarSettings,
} from '../types';

/* -------------------------------------------------------------------------- */
/* Defaults                                                                  */
/* -------------------------------------------------------------------------- */
const defaultSettings: AppSettings = {
  theme: 'light',
  sleepMode: false,
  sleepStart: '22:00',
  sleepEnd: '06:00',
  showWeather: false,
  weatherLocation: '85552', // User's provided default
  weatherApiKey: '',
  weatherLastUpdated: new Date().toISOString(),
  showRewards: false,
  autoRotateChores: false,
  rotationFrequency: 'weekly',
  rotationDay: 0,
  lastAutoRotation: new Date().toISOString(),
  autoRotationMembers: [],
};

const defaultCalendarSettings: CalendarSettings = {
  defaultView: 'week',
  showWeatherInCalendar: true,
  firstDayOfWeek: 0,
  syncWithGoogle: false,
  googleCalendarIds: [],
};

/* -------------------------------------------------------------------------- */
/* Context types                                                             */
/* -------------------------------------------------------------------------- */
interface AppContextType {
  familyMembers: FamilyMember[];
  chores: Chore[];
  lists: List[];
  mealPlans: MealPlan[];
  calendarEvents: CalendarEvent[];
  settings: AppSettings;
  calendarSettings: CalendarSettings;

  addFamilyMember(m: Omit<FamilyMember, 'id' | 'profilePicture'> & { profilePicture?: string }): Promise<void>;
  updateFamilyMember(id: string, m: Partial<Omit<FamilyMember, 'id' | 'profilePicture'> & { profilePicture?: string }>): Promise<void>;
  removeFamilyMember(id: string): Promise<void>;

  addChore(c: Omit<Chore, 'id'>): Promise<void>;
  updateChore(id: string, c: Partial<Chore>): Promise<void>;
  removeChore(id: string): Promise<void>;
  toggleChoreCompletion(choreId: string, memberId: string): Promise<void>;
  rotateChores(): Promise<void>;

  addCalendarEvent(e: Omit<CalendarEvent, 'id'>): Promise<void>;
  updateCalendarEvent(id: string, e: Partial<CalendarEvent>): Promise<void>;
  removeCalendarEvent(id: string): Promise<void>;

  // List functions
  addList(listData: { title: string; created_by?: string }): Promise<void>;
  updateList(id: string, listUpdates: Partial<{ title: string }>): Promise<void>;
  removeList(id: string): Promise<void>;

  // ListItem functions
  addListItem(listId: string, itemData: { text: string; position?: number; assignedTo?: string[] }): Promise<void>;
  updateListItem(itemId: string, updates: Partial<{ text: string; completed: boolean; position: number; assignedTo: string[] }>): Promise<void>;
  removeListItem(itemId: string): Promise<void>;
  toggleListItemCompletion(itemId: string, currentStatus: boolean): Promise<void>;

  addMealPlan(p: Omit<MealPlan, 'id'>): Promise<void>;
  updateMealPlan(id: string, p: Partial<MealPlan>): Promise<void>;
  removeMealPlan(id: string): Promise<void>;

  updateSettings(s: Partial<AppSettings>): void;
  updateCalendarSettings(s: Partial<CalendarSettings>): void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/* Constants                                                                 */
/* -------------------------------------------------------------------------- */
const SETTINGS_ROW_ID = '2c10355d-a1ad-4cf5-8520-963724450a11'; // Ensure this is your actual UUID for settings row

/* -------------------------------------------------------------------------- */
/* Provider                                                                  */
/* -------------------------------------------------------------------------- */
export function AppProvider({ children }: { children: ReactNode }) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [lists, setLists] = useState<List[]>([]); // Will store lists with their items
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [calendarSettings, setCalendarSettings] =
    useState<CalendarSettings>(defaultCalendarSettings);

  const choresRef = useRef<Chore[]>([]);
  useEffect(() => {
    choresRef.current = chores;
  }, [chores]);

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', SETTINGS_ROW_ID)
        .single();

      if (error && error.code === 'PGRST116') { // Not found, insert default
        console.log('No user settings found, creating default entry.');
        const { error: insertError } = await supabase.from('user_settings').insert([
          {
            id: SETTINGS_ROW_ID, // Make sure this ID is unique or handle potential primary key violation
            // user_id: authUser?.id, // If you have user authentication
            weather_location: defaultSettings.weatherLocation,
            weather_api_key: defaultSettings.weatherApiKey,
            show_weather: defaultSettings.showWeather,
            weather_last_updated: defaultSettings.weatherLastUpdated,
          },
        ]);
        if (insertError) {
            console.error('Failed to insert default user settings:', insertError);
        }
        // setSettings(defaultSettings) will be handled by the state initializer if no data is loaded
        return;
      }
      if (error) {
        console.error('Settings fetch failed:', error.message);
        return;
      }
      if (data) {
        setSettings((prev) => ({
          ...prev, // Keep client-side only settings from defaultSettings
          weatherLocation: data.weather_location || prev.weatherLocation,
          weatherApiKey: data.weather_api_key || prev.weatherApiKey,
          showWeather: data.show_weather ?? prev.showWeather,
          weatherLastUpdated: data.weather_last_updated || prev.weatherLastUpdated,
          // Other AppSettings are client-side and persisted in localStorage or similar if needed
        }));
      }
    }
    fetchSettings();
  }, []);

  const upsert = <T extends { id: string }>(rows: T[], incoming: T): T[] => {
    const i = rows.findIndex((r) => r.id === incoming.id);
    return i === -1 ? [...rows, incoming] : rows.map((r) => (r.id === incoming.id ? incoming : r));
  };
  const remove = <T extends { id: string }>(rows: T[], id: string): T[] =>
    rows.filter((r) => r.id !== id);

  /* ------------------------------------------------------------------------
     FAMILY MEMBERS
  ------------------------------------------------------------------------ */
  const famMap = (m: any): FamilyMember => ({
    id: m.id,
    name: m.name,
    color: m.color,
    initial: m.initials,
    profilePicture: m.avatar_url,
    email: m.email, // Assuming email is in your FamilyMember type and DB
  });

  async function fetchFamilyMembers() {
    const { data, error } = await supabase.from('family_members').select('*');
    if (error) {
      console.error('fetchFamilyMembers error:', error);
      setFamilyMembers([]);
      return;
    }
    setFamilyMembers((data || []).map(famMap));
  }
  async function addFamilyMember(member: Omit<FamilyMember, 'id' | 'profilePicture'> & { profilePicture?: string }) {
    const { error } = await supabase.from('family_members').insert([
      {
        name: member.name,
        color: member.color,
        initials: member.initial,
        avatar_url: member.profilePicture,
        email: member.email,
        // is_child: member.is_child, // If you add this to your type/form
      },
    ]);
    if (error) console.error('addFamilyMember error:', error);
  }
  async function updateFamilyMember(id: string, member: Partial<Omit<FamilyMember, 'id' | 'profilePicture'> & { profilePicture?: string }>) {
    const update: any = {};
    if (member.name !== undefined) update.name = member.name;
    if (member.color !== undefined) update.color = member.color;
    if (member.initial !== undefined) update.initials = member.initial;
    if (member.profilePicture !== undefined) update.avatar_url = member.profilePicture;
    if (member.email !== undefined) update.email = member.email;
    const { error } = await supabase.from('family_members').update(update).eq('id', id);
    if (error) console.error('updateFamilyMember error:', error);
  }
  async function removeFamilyMember(id: string) {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) console.error('removeFamilyMember error:', error);
  }

  /* ------------------------------------------------------------------------
     CHORES
  ------------------------------------------------------------------------ */
  const choreMap = (c: any): Chore => ({
    id: c.id,
    title: c.title,
    description: c.notes,
    assignedTo: c.assigned_to || [],
    frequency: c.frequency,
    starValue: c.star_value,
    isRotating: c.is_rotating ?? false,
    rotationFrequency: c.rotation_frequency,
    rotationDay: c.rotation_day,
    lastRotated: c.last_rotated,
    timeOfDay: c.time_of_day,
    completed: c.completed ?? {},
    // from DB schema, add to type if needed:
    // dueDate: c.due_date,
    // createdBy: c.created_by,
  });

  async function fetchChores() {
    const { data, error } = await supabase.from('chores').select('*');
    if (error) {
      console.error('fetchChores error:', error);
      setChores([]);
      return;
    }
    setChores((data || []).map(choreMap));
  }
  async function addChore(chore: Omit<Chore, 'id'>) {
    const completedMap: Record<string, boolean> = {};
    chore.assignedTo.forEach((assigneeId) => (completedMap[assigneeId] = false));
    const { error } = await supabase.from('chores').insert([
      {
        title: chore.title,
        notes: chore.description,
        assigned_to: chore.assignedTo,
        frequency: chore.frequency,
        star_value: chore.starValue,
        is_rotating: chore.isRotating,
        rotation_frequency: chore.rotationFrequency,
        rotation_day: chore.rotationDay,
        time_of_day: chore.timeOfDay,
        completed: completedMap,
        // lastRotated: chore.lastRotated, // Set on rotation
        // daysOfWeek, dayOfMonth if needed for DB based on frequency
      },
    ]);
    if (error) console.error('addChore error:', error);
  }
  async function updateChore(id: string, chore: Partial<Chore>) {
    const update: any = {};
    if (chore.title !== undefined) update.title = chore.title;
    if (chore.description !== undefined) update.notes = chore.description;
    if (chore.assignedTo !== undefined) update.assigned_to = chore.assignedTo;
    if (chore.frequency !== undefined) update.frequency = chore.frequency;
    if (chore.starValue !== undefined) update.star_value = chore.starValue;
    if (chore.isRotating !== undefined) update.is_rotating = chore.isRotating;
    if (chore.rotationFrequency !== undefined) update.rotation_frequency = chore.rotationFrequency;
    if (chore.rotationDay !== undefined) update.rotation_day = chore.rotationDay;
    if (chore.lastRotated !== undefined) update.last_rotated = chore.lastRotated;
    if (chore.timeOfDay !== undefined) update.time_of_day = chore.timeOfDay;
    if (chore.completed !== undefined) update.completed = chore.completed;

    const { error } = await supabase.from('chores').update(update).eq('id', id);
    if (error) console.error('updateChore error:', error);
  }
  async function removeChore(id: string) {
    const { error } = await supabase.from('chores').delete().eq('id', id);
    if (error) console.error('removeChore error:', error);
  }
  async function toggleChoreCompletion(choreId: string, memberId: string) {
    const chore = chores.find((c) => c.id === choreId);
    if (!chore) return;
    const updatedCompletions = { ...chore.completed, [memberId]: !chore.completed[memberId] };
    await updateChore(choreId, { completed: updatedCompletions });
  }

  function rotateOne(chore: Chore) {
    const newOrder = [...chore.assignedTo.slice(1), chore.assignedTo[0]];
    const newCompleted: Record<string, boolean> = {};
    newOrder.forEach((id) => (newCompleted[id] = false));
    updateChore(chore.id, {
      assignedTo: newOrder,
      completed: newCompleted,
      lastRotated: new Date().toISOString(),
    });
  }

  async function rotateChores() {
    choresRef.current.forEach((c) => { // Use choresRef for latest state in case of rapid calls
      if (c.isRotating && c.assignedTo.length > 1) rotateOne(c);
    });
  }

  /* ------------------------------------------------------------------------
     CALENDAR EVENTS
  ------------------------------------------------------------------------ */
  const calMap = (e: any): CalendarEvent => ({
    id: e.id,
    title: e.title,
    description: e.description,
    memberId: e.member_id,
    eventType: e.event_type,
    start: e.start,
    end: e.end,
    allDay: e.all_day ?? false,
    location: e.location,
    isRecurring: e.is_recurring ?? false,
    recurrencePattern: e.recurrence_pattern,
    recurrenceInterval: e.recurrence_interval,
    recurrenceDaysOfWeek: e.recurrence_days_of_week,
    recurrenceDayOfMonth: e.recurrence_day_of_month,
    recurrenceEndDate: e.recurrence_end_date,
    recurrenceParentId: e.recurrence_parent_id,
    recurrenceExceptions: e.recurrence_exceptions,
    // created_at: e.created_at, // Add to type if needed
  });

  async function fetchCalendarEvents() {
    const { data, error } = await supabase.from('calendar_events').select('*');
    if (error) {
      console.error('fetchCalendarEvents error:', error);
      setCalendarEvents([]);
      return;
    }
    setCalendarEvents((data || []).map(calMap));
  }
  async function addCalendarEvent(event: Omit<CalendarEvent, 'id'>) {
    // Map CalendarEvent fields to DB columns
    const dbEvent: any = {
        title: event.title,
        start: event.start,
        end: event.end,
        all_day: event.allDay,
        member_id: event.memberId, // Ensure this matches your DB foreign key if it's to family_members
        description: event.description,
        location: event.location,
        event_type: event.eventType,
        is_recurring: event.isRecurring,
        recurrence_pattern: event.recurrencePattern,
        recurrence_interval: event.recurrenceInterval,
        recurrence_days_of_week: event.recurrenceDaysOfWeek,
        recurrence_day_of_month: event.recurrenceDayOfMonth,
        recurrence_end_date: event.recurrenceEndDate,
        recurrence_parent_id: event.recurrenceParentId,
        recurrence_exceptions: event.recurrenceExceptions,
    };
    const { error } = await supabase.from('calendar_events').insert([dbEvent]);
    if (error) console.error('addCalendarEvent error:', error);
  }
  async function updateCalendarEvent(id: string, event: Partial<CalendarEvent>) {
    const dbEventUpdate: any = { ...event }; // Map to DB column names if different
    if (event.memberId) dbEventUpdate.member_id = event.memberId;
    if (event.allDay !== undefined) dbEventUpdate.all_day = event.allDay;
    if (event.isRecurring !== undefined) dbEventUpdate.is_recurring = event.isRecurring;
    // ... map other fields as needed
    const { error } = await supabase.from('calendar_events').update(dbEventUpdate).eq('id', id);
    if (error) console.error('updateCalendarEvent error:', error);
  }
  async function removeCalendarEvent(id: string) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) console.error('removeCalendarEvent error:', error);
  }

  /* ------------------------------------------------------------------------
     LISTS & LIST ITEMS - NEW/UPDATED SECTION
  ------------------------------------------------------------------------ */
  const listMap = (dbList: any): Omit<List, 'items'> => ({
    id: dbList.id,
    title: dbList.title ?? dbList.name,
    created_by: dbList.created_by,
    created_at: dbList.created_at,
  });

  const listItemMap = (dbListItem: any): ListItem => ({
    id: dbListItem.id,
    list_id: dbListItem.list_id,
    text: dbListItem.text, // Using 'text' from DB
    completed: dbListItem.completed ?? false, // Using 'completed' from DB
    position: dbListItem.position, // Using 'position' from DB
    assignedTo: dbListItem.assigned_to || [], // Using 'assigned_to' from DB
    created_at: dbListItem.created_at,
  });

  async function fetchListsAndItems() {
    const { data: listData, error: listError } = await supabase
      .from('lists')
      .select('*');
    if (listError) {
      console.error('Error fetching lists:', listError);
      setLists([]);
      return;
    }
    if (!listData) {
      setLists([]);
      return;
    }

    const { data: itemData, error: itemError } = await supabase
      .from('list_items')
      .select('*');
    if (itemError) {
      console.error('Error fetching list items:', itemError);
      // Continue with lists, items will be empty for affected lists
    }

    const itemsByListId = new Map<string, ListItem[]>();
    if (itemData) {
      itemData.forEach(dbItem => {
        const item = listItemMap(dbItem);
        if (!itemsByListId.has(item.list_id)) {
          itemsByListId.set(item.list_id, []);
        }
        itemsByListId.get(item.list_id)!.push(item);
      });
    }

    itemsByListId.forEach(items => {
      items.sort((a, b) => {
        const posA = a.position ?? Number.MAX_SAFE_INTEGER;
        const posB = b.position ?? Number.MAX_SAFE_INTEGER;
        if (posA !== posB) return posA - posB;
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      });
    });

    const populatedLists = listData.map(dbList => ({
      ...listMap(dbList),
      items: itemsByListId.get(dbList.id) || [],
    }));
    setLists(populatedLists);
  }

  async function addList(listData: { title: string; created_by?: string }) {
    // Your DB `lists` table has `name NOT NULL` and `title TEXT`.
    // We'll use the input `title` for both `name` and `title` columns for simplicity,
    // or you can adjust if `name` should be different.
    const { error } = await supabase.from('lists').insert([
      { name: listData.title, title: listData.title, created_by: listData.created_by },
    ]);
    if (error) {
        console.error('addList error:', error);
    } else {
        // fetchListsAndItems(); // Let realtime handle or call explicitly if preferred
    }
  }

  async function updateList(id: string, listUpdates: Partial<{ title: string }>) {
    const payload: { name?: string; title?: string } = {};
    if (listUpdates.title !== undefined) {
      payload.name = listUpdates.title; // Assuming name is primary unique identifier or display name
      payload.title = listUpdates.title;
    }
    const { error } = await supabase.from('lists').update(payload).eq('id', id);
    if (error) console.error('updateList error:', error);
  }

  async function removeList(id: string) {
    // Assuming ON DELETE CASCADE is set for list_items.list_id foreign key
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) console.error('removeList error:', error);
  }

  async function addListItem(listId: string, itemData: { text: string; position?: number; assignedTo?: string[] }) {
    const { error } = await supabase.from('list_items').insert([
      {
        list_id: listId,
        text: itemData.text,
        completed: false, // Default new items to not completed
        position: itemData.position,
        assigned_to: itemData.assignedTo,
      },
    ]);
    if (error) console.error('addListItem error:', error);
  }

  async function updateListItem(itemId: string, updates: Partial<{ text: string; completed: boolean; position: number; assignedTo: string[] }>) {
    const dbUpdates: any = {};
    if (updates.text !== undefined) dbUpdates.text = updates.text;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.position !== undefined) dbUpdates.position = updates.position;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;

    const { error } = await supabase.from('list_items').update(dbUpdates).eq('id', itemId);
    if (error) console.error('updateListItem error:', error);
  }

  async function removeListItem(itemId: string) {
    const { error } = await supabase.from('list_items').delete().eq('id', itemId);
    if (error) console.error('removeListItem error:', error);
  }

  async function toggleListItemCompletion(itemId: string, currentStatus: boolean) {
    await updateListItem(itemId, { completed: !currentStatus });
  }

  /* ------------------------------------------------------------------------
     MEAL PLANS
  ------------------------------------------------------------------------ */
  const mealMap = (p: any): MealPlan => ({
    id: p.id,
    title: p.title,
    date: p.date, // DB: date
    meal: p.meal_type, // DB: meal_type
    description: p.description,
    members: p.members || [],
    created_by: p.created_by, // Added from DB schema
  });

  async function fetchMealPlans() {
    const { data, error } = await supabase.from('meal_plans').select('*');
    if (error) {
      console.error('fetchMealPlans error:', error);
      setMealPlans([]);
      return;
    }
    setMealPlans((data || []).map(mealMap));
  }
  async function addMealPlan(plan: Omit<MealPlan, 'id'>) {
    const { error } = await supabase.from('meal_plans').insert([
      {
        title: plan.title,
        date: plan.date,
        meal_type: plan.meal,
        description: plan.description,
        members: plan.members,
        created_by: plan.created_by,
      },
    ]);
    if (error) console.error('addMealPlan error:', error);
  }
  async function updateMealPlan(id: string, plan: Partial<MealPlan>) {
    const update: any = {};
    if (plan.title !== undefined) update.title = plan.title;
    if (plan.date !== undefined) update.date = plan.date;
    if (plan.meal !== undefined) update.meal_type = plan.meal; // Ensure 'meal' from type maps to 'meal_type' in DB
    if (plan.description !== undefined) update.description = plan.description;
    if (plan.members !== undefined) update.members = plan.members;
    // created_by typically not updated
    const { error } = await supabase.from('meal_plans').update(update).eq('id', id);
    if (error) console.error('updateMealPlan error:', error);
  }
  async function removeMealPlan(id: string) {
    const { error } = await supabase.from('meal_plans').delete().eq('id', id);
    if (error) console.error('removeMealPlan error:', error);
  }

  /* ------------------------------------------------------------------------
     UI SETTINGS
  ------------------------------------------------------------------------ */
  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...s };
      supabase
        .from('user_settings')
        .update({
          weather_location: updated.weatherLocation,
          weather_api_key: updated.weatherApiKey,
          show_weather: updated.showWeather,
          weather_last_updated: updated.weatherLastUpdated,
        })
        .eq('id', SETTINGS_ROW_ID)
        .then(({ error }) => {
            if (error) console.error('Error updating user_settings:', error);
        });
      return updated;
    });
  };

  /* ------------------------------------------------------------------------
     INITIAL FETCH + REALTIME + TICKER
  ------------------------------------------------------------------------ */
  useEffect(() => {
    fetchFamilyMembers();
    fetchChores();
    fetchListsAndItems(); // Use the new function for lists and items
    fetchMealPlans();
    fetchCalendarEvents();

    const channels: any[] = []; // To store all channel subscriptions

    channels.push(supabase
      .channel('family_members-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members' },
        (payload) => payload.eventType === 'DELETE' ? setFamilyMembers(prev => remove(prev, payload.old.id)) : setFamilyMembers(prev => upsert(prev, famMap(payload.new)))
      ).subscribe());

    channels.push(supabase
      .channel('chores-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chores' },
        (payload) => payload.eventType === 'DELETE' ? setChores(prev => remove(prev, payload.old.id)) : setChores(prev => upsert(prev, choreMap(payload.new)))
      ).subscribe());

    channels.push(supabase
      .channel('calendar_events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' },
        (payload) => payload.eventType === 'DELETE' ? setCalendarEvents(prev => remove(prev, payload.old.id)) : setCalendarEvents(prev => upsert(prev, calMap(payload.new)))
      ).subscribe());

    channels.push(supabase
      .channel('lists-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' },
        (payload) => {
          // If a list is deleted, remove it locally.
          // If a list is inserted/updated, refetch all lists and items
          // to correctly handle nested items.
          if (payload.eventType === 'DELETE') {
            setLists(prev => remove(prev, payload.old.id));
          } else {
            fetchListsAndItems();
          }
        }
      ).subscribe());

    // Realtime for list_items - NEW
    channels.push(supabase
      .channel('list_items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items' },
        (payload) => {
           // Simplest approach: refetch all lists and items on any item change
           fetchListsAndItems();
        }
      ).subscribe());

    channels.push(supabase
      .channel('meal_plans-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plans' },
        (payload) => payload.eventType === 'DELETE' ? setMealPlans(prev => remove(prev, payload.old.id)) : setMealPlans(prev => upsert(prev, mealMap(payload.new)))
      ).subscribe());

    const tick = setInterval(() => {
      choresRef.current.forEach((c) => {
        if (shouldRotate(c)) rotateOne(c);
      });
    }, 60 * 60 * 1000);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
      clearInterval(tick);
    };
  }, []); // <- run once

  const value: AppContextType = {
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
    rotateChores,
    addCalendarEvent,
    updateCalendarEvent,
    removeCalendarEvent,
    // List and ListItem functions
    addList,
    updateList,
    removeList,
    addListItem,
    updateListItem,
    removeListItem,
    toggleListItemCompletion,
    addMealPlan,
    updateMealPlan,
    removeMealPlan,
    updateSettings,
    updateCalendarSettings: (s) =>
      setCalendarSettings((prev) => ({ ...prev, ...s })),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
}