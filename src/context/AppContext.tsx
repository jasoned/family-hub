import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import {
  FamilyMember,
  Chore,
  List,
  MealPlan,
  CalendarEvent,
  AppSettings,
  CalendarSettings,
} from '../types';

/* --------------------------------------------------------------------------
   Local-only UI-settings defaults (move to Supabase later if you wish)
--------------------------------------------------------------------------- */
const defaultSettings: AppSettings = {
  theme: 'light',
  sleepMode: false,
  sleepStart: '22:00',
  sleepEnd: '06:00',
  showWeather: false,
  weatherLocation: 'Thatcher, AZ',
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

/* --------------------------------------------------------------------------
   Context interface
--------------------------------------------------------------------------- */
interface AppContextType {
  familyMembers: FamilyMember[];
  chores: Chore[];
  lists: List[];
  mealPlans: MealPlan[];
  calendarEvents: CalendarEvent[];
  settings: AppSettings;
  calendarSettings: CalendarSettings;

  addFamilyMember(m: Omit<FamilyMember, 'id'>): Promise<void>;
  updateFamilyMember(id: string, m: Partial<FamilyMember>): Promise<void>;
  removeFamilyMember(id: string): Promise<void>;

  addChore(c: Omit<Chore, 'id'>): Promise<void>;
  updateChore(id: string, c: Partial<Chore>): Promise<void>;
  removeChore(id: string): Promise<void>;
  toggleChoreCompletion(choreId: string, memberId: string): Promise<void>;
  rotateChores(): Promise<void>;

  addCalendarEvent(e: Omit<CalendarEvent, 'id'>): Promise<void>;
  updateCalendarEvent(id: string, e: Partial<CalendarEvent>): Promise<void>;
  removeCalendarEvent(id: string): Promise<void>;

  addList(l: Omit<List, 'id'>): Promise<void>;
  updateList(id: string, l: Partial<List>): Promise<void>;
  removeList(id: string): Promise<void>;

  addMealPlan(p: Omit<MealPlan, 'id'>): Promise<void>;
  updateMealPlan(id: string, p: Partial<MealPlan>): Promise<void>;
  removeMealPlan(id: string): Promise<void>;

  updateSettings(s: Partial<AppSettings>): void;
  updateCalendarSettings(s: Partial<CalendarSettings>): void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* --------------------------------------------------------------------------
   Provider
--------------------------------------------------------------------------- */
export function AppProvider({ children }: { children: ReactNode }) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [calendarSettings, setCalendarSettings] =
    useState<CalendarSettings>(defaultCalendarSettings);

  /* -------- helpers for realtime arrays -------- */
  const upsert = <T extends { id: string }>(rows: T[], incoming: T): T[] => {
    const i = rows.findIndex((r) => r.id === incoming.id);
    return i === -1 ? [...rows, incoming] : rows.map((r) => (r.id === incoming.id ? incoming : r));
  };
  const remove = <T extends { id: string }>(rows: T[], id: string) =>
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
  });

  async function fetchFamilyMembers() {
    const { data, error } = await supabase.from('family_members').select('*');
    if (error) return console.error(error);
    setFamilyMembers((data || []).map(famMap));
  }
  async function addFamilyMember(member: Omit<FamilyMember, 'id'>) {
    const { error } = await supabase.from('family_members').insert([
      {
        name: member.name,
        color: member.color,
        initials: member.initial,
        avatar_url: member.profilePicture,
      },
    ]);
    if (error) console.error(error);
  }
  async function updateFamilyMember(id: string, member: Partial<FamilyMember>) {
    const update: any = {};
    if (member.name !== undefined) update.name = member.name;
    if (member.color !== undefined) update.color = member.color;
    if (member.initial !== undefined) update.initials = member.initial;
    if (member.profilePicture !== undefined) update.avatar_url = member.profilePicture;
    const { error } = await supabase.from('family_members').update(update).eq('id', id);
    if (error) console.error(error);
  }
  async function removeFamilyMember(id: string) {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) console.error(error);
  }

  /* ------------------------------------------------------------------------
     CHORES
  ------------------------------------------------------------------------ */
  const choreMap = (c: any): Chore => ({
    id: c.id,
    title: c.title,
    description: c.notes, // fixed mapping
    assignedTo: c.assigned_to,
    frequency: c.frequency,
    dueDate: c.due_date,
    notes: c.notes,
    starValue: c.star_value,
    time: c.time,
    isRecurring: c.is_recurring,
    isRotating: c.is_rotating,
    rotationFrequency: c.rotation_frequency,
    rotationDay: c.rotation_day,
    lastRotated: c.last_rotated,
    timeOfDay: c.time_of_day,
    completed: c.completed ?? {},
    createdBy: c.created_by,
  });

  async function fetchChores() {
    const { data, error } = await supabase.from('chores').select('*');
    if (error) return console.error(error);
    setChores((data || []).map(choreMap));
  }
  async function addChore(chore: Omit<Chore, 'id'>) {
    const completed: Record<string, boolean> = {};
    chore.assignedTo.forEach((id) => (completed[id] = false));

    const { error } = await supabase.from('chores').insert([
      {
        title: chore.title,
        notes: chore.description,
        assigned_to: chore.assignedTo,
        frequency: chore.frequency,
        due_date: chore.dueDate,
        star_value: chore.starValue,
        time: chore.time,
        is_recurring: chore.isRecurring,
        is_rotating: chore.isRotating,
        rotation_frequency: chore.rotationFrequency,
        rotation_day: chore.rotationDay,
        last_rotated: chore.lastRotated,
        time_of_day: chore.timeOfDay,
        completed,
        created_by: chore.createdBy,
      },
    ]);
    if (error) console.error(error);
  }
  async function updateChore(id: string, chore: Partial<Chore>) {
    const update: any = {};
    if (chore.title !== undefined) update.title = chore.title;
    if (chore.description !== undefined) update.notes = chore.description;
    if (chore.assignedTo !== undefined) update.assigned_to = chore.assignedTo;
    if (chore.frequency !== undefined) update.frequency = chore.frequency;
    if (chore.dueDate !== undefined) update.due_date = chore.dueDate;
    if (chore.starValue !== undefined) update.star_value = chore.starValue;
    if (chore.time !== undefined) update.time = chore.time;
    if (chore.isRecurring !== undefined) update.is_recurring = chore.isRecurring;
    if (chore.isRotating !== undefined) update.is_rotating = chore.isRotating;
    if (chore.rotationFrequency !== undefined) update.rotation_frequency = chore.rotationFrequency;
    if (chore.rotationDay !== undefined) update.rotation_day = chore.rotationDay;
    if (chore.lastRotated !== undefined) update.last_rotated = chore.lastRotated;
    if (chore.timeOfDay !== undefined) update.time_of_day = chore.timeOfDay;
    if (chore.completed !== undefined) update.completed = chore.completed;

    const { error } = await supabase.from('chores').update(update).eq('id', id);
    if (error) console.error(error);
  }
  async function removeChore(id: string) {
    const { error } = await supabase.from('chores').delete().eq('id', id);
    if (error) console.error(error);
  }
  async function toggleChoreCompletion(choreId: string, memberId: string) {
    const chore = chores.find((c) => c.id === choreId);
    if (!chore) return;
    const updated = {
      ...chore.completed,
      [memberId]: !chore.completed[memberId],
    };
    await updateChore(choreId, { completed: updated });
  }

  async function rotateChores() {
    const rotations = chores.filter((c) => c.isRotating && c.assignedTo.length > 1);
    for (const chore of rotations) {
      const newOrder = [...chore.assignedTo.slice(1), chore.assignedTo[0]];
      const newCompleted: Record<string, boolean> = {};
      newOrder.forEach((id) => (newCompleted[id] = false));
      await updateChore(chore.id, {
        assignedTo: newOrder,
        completed: newCompleted,
        lastRotated: new Date().toISOString(),
      });
    }
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
    allDay: e.all_day,
    location: e.location,
    isRecurring: e.is_recurring,
    recurrencePattern: e.recurrence_pattern,
    recurrenceInterval: e.recurrence_interval,
    recurrenceDaysOfWeek: e.recurrence_days_of_week,
    recurrenceDayOfMonth: e.recurrence_day_of_month,
    recurrenceEndDate: e.recurrence_end_date,
    recurrenceParentId: e.recurrence_parent_id,
    recurrenceExceptions: e.recurrence_exceptions,
  });

  async function fetchCalendarEvents() {
    const { data, error } = await supabase.from('calendar_events').select('*');
    if (error) return console.error(error);
    setCalendarEvents((data || []).map(calMap));
  }
  async function addCalendarEvent(event: Omit<CalendarEvent, 'id'>) {
    const { error } = await supabase.from('calendar_events').insert([
      {
        ...event,
        all_day: event.allDay,
        member_id: event.memberId,
        event_type: event.eventType,
        is_recurring: event.isRecurring,
        recurrence_pattern: event.recurrencePattern,
        recurrence_interval: event.recurrenceInterval,
        recurrence_days_of_week: event.recurrenceDaysOfWeek,
        recurrence_day_of_month: event.recurrenceDayOfMonth,
        recurrence_end_date: event.recurrenceEndDate,
        recurrence_parent_id: event.recurrenceParentId,
        recurrence_exceptions: event.recurrenceExceptions,
      },
    ]);
    if (error) console.error(error);
  }
  async function updateCalendarEvent(id: string, event: Partial<CalendarEvent>) {
    const update: any = {
      ...event,
      all_day: event.allDay,
      member_id: event.memberId,
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
    const { error } = await supabase.from('calendar_events').update(update).eq('id', id);
    if (error) console.error(error);
  }
  async function removeCalendarEvent(id: string) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) console.error(error);
  }

  /* ------------------------------------------------------------------------
     LISTS
  ------------------------------------------------------------------------ */
  const listMap = (l: any): List => ({
    id: l.id,
    title: l.title ?? l.name,
    name: l.name,
  });

  async function fetchLists() {
    const { data, error } = await supabase.from('lists').select('*');
    if (error) return console.error(error);
    setLists((data || []).map(listMap));
  }
  async function addList(list: Omit<List, 'id'>) {
    const { error } = await supabase.from('lists').insert([{ name: list.title || list.name }]);
    if (error) console.error(error);
  }
  async function updateList(id: string, list: Partial<List>) {
    const update: any = {};
    if (list.title !== undefined) update.title = list.title;
    if (list.name !== undefined) update.name = list.name;
    const { error } = await supabase.from('lists').update(update).eq('id', id);
    if (error) console.error(error);
  }
  async function removeList(id: string) {
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) console.error(error);
  }

  /* ------------------------------------------------------------------------
     MEAL PLANS
  ------------------------------------------------------------------------ */
  const mealMap = (p: any): MealPlan => ({
    id: p.id,
    title: p.title,
    date: p.date,
    mealType: p.meal_type,
    description: p.description,
    members: p.members,
  });

  async function fetchMealPlans() {
    const { data, error } = await supabase.from('meal_plans').select('*');
    if (error) return console.error(error);
    setMealPlans((data || []).map(mealMap));
  }
  async function addMealPlan(plan: Omit<MealPlan, 'id'>) {
    const { error } = await supabase.from('meal_plans').insert([
      {
        title: plan.title,
        date: plan.date,
        meal_type: plan.mealType,
        description: plan.description,
        members: plan.members,
      },
    ]);
    if (error) console.error(error);
  }
  async function updateMealPlan(id: string, plan: Partial<MealPlan>) {
    const update: any = {};
    if (plan.title !== undefined) update.title = plan.title;
    if (plan.date !== undefined) update.date = plan.date;
    if (plan.mealType !== undefined) update.meal_type = plan.mealType;
    if (plan.description !== undefined) update.description = plan.description;
    if (plan.members !== undefined) update.members = plan.members;
    const { error } = await supabase.from('meal_plans').update(update).eq('id', id);
    if (error) console.error(error);
  }
  async function removeMealPlan(id: string) {
    const { error } = await supabase.from('meal_plans').delete().eq('id', id);
    if (error) console.error(error);
  }

  /* ------------------------------------------------------------------------
     Local-only UI settings
  ------------------------------------------------------------------------ */
  const updateSettings = (s: Partial<AppSettings>) => setSettings((prev) => ({ ...prev, ...s }));
  const updateCalendarSettings = (s: Partial<CalendarSettings>) =>
    setCalendarSettings((prev) => ({ ...prev, ...s }));

  /* ------------------------------------------------------------------------
     Initial fetch + realtime subscriptions
  ------------------------------------------------------------------------ */
  useEffect(() => {
    fetchFamilyMembers();
    fetchChores();
    fetchLists();
    fetchMealPlans();
    fetchCalendarEvents();

    const tables = [
      { key: 'family_members', map: famMap, setter: setFamilyMembers },
      { key: 'chores', map: choreMap, setter: setChores },
      { key: 'calendar_events', map: calMap, setter: setCalendarEvents },
      { key: 'lists', map: listMap, setter: setLists },
      { key: 'meal_plans', map: mealMap, setter: setMealPlans },
    ];

    const subs = tables.map(({ key, map, setter }) =>
      supabase
        .channel(`${key}-realtime`)
        .on('postgres_changes', { event: '*', schema: 'public', table: key }, (payload) => {
          const row = map(payload.new || payload.old);
          if (payload.eventType === 'DELETE') {
            setter((prev) => remove(prev, row.id));
          } else {
            setter((prev) => upsert(prev, row));
          }
        })
        .subscribe(),
    );

    return () => {
      subs.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []);

  /* ------------------------------------------------------------------------
     Context value
  ------------------------------------------------------------------------ */
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
    addList,
    updateList,
    removeList,
    addMealPlan,
    updateMealPlan,
    removeMealPlan,
    updateSettings,
    updateCalendarSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* --------------------------------------------------------------------------
   Hook
--------------------------------------------------------------------------- */
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
}
