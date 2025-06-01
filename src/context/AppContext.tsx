/* ----------------------------------------------------------------
   src/context/AppContext.tsx
   ---------------------------------------------------------------- */
import { shouldRotate } from '../utils/rotation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '../supabaseClient';
import {
  AuthChangeEvent,
  Session,
  User,
  PostgrestError,
} from '@supabase/supabase-js';
import {
  FamilyMember,
  Chore,
  List,
  ListItem,
  MealPlan,
  CalendarEvent,
  AppSettings,
  CalendarSettings,
  CalendarRecurrencePattern,
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
  weatherLocation: '85552',
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
  showHolidays: true,
  showBirthdays: true,
  showChores: false,
  useRelativeTimeLabels: true,
};

/* -------------------------------------------------------------------------- */
/* Context types                                                             */
/* -------------------------------------------------------------------------- */
interface AppContextType {
  session: Session | null;
  user: User | null;
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

  addFamilyMember(m: Omit<FamilyMember, 'id' | 'profilePicture'> & { profilePicture?: string }): Promise<void>;
  updateFamilyMember(id: string, m: Partial<Omit<FamilyMember, 'id' | 'profilePicture'> & { profilePicture?: string }>): Promise<void>;
  removeFamilyMember(id: string): Promise<void>;

  addChore(c: Omit<Chore, 'id' | 'createdBy' | 'completed' | 'lastRotated'>): Promise<void>;
  updateChore(id: string, c: Partial<Chore>): Promise<void>;
  removeChore(id: string): Promise<void>;
  toggleChoreCompletion(choreId: string, memberId: string): Promise<void>;
  rotateChores(): Promise<void>;

  addCalendarEvent(e: Omit<CalendarEvent, 'id'>): Promise<void>;
  updateCalendarEvent(id: string, e: Partial<CalendarEvent>): Promise<void>;
  removeCalendarEvent(id: string): Promise<void>;

  addList(listData: { title: string }): Promise<void>;
  updateList(id: string, listUpdates: Partial<{ title: string }>): Promise<void>;
  removeList(id: string): Promise<void>;

  addListItem(listId: string, itemData: { text: string; position?: number; assignedTo?: string[] }): Promise<void>;
  updateListItem(itemId: string, updates: Partial<{ text: string; completed: boolean; position: number; assignedTo: string[] }>): Promise<void>;
  removeListItem(itemId: string): Promise<void>;
  toggleListItemCompletion(itemId: string, currentStatus: boolean): Promise<void>;

  addMealPlan(p: Omit<MealPlan, 'id' | 'created_by'>): Promise<void>;
  updateMealPlan(id: string, p: Partial<MealPlan>): Promise<void>;
  removeMealPlan(id: string): Promise<void>;

  updateSettings(s: Partial<AppSettings>): void;
  updateCalendarSettings(s: Partial<CalendarSettings>): void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/* Provider                                                                  */
/* -------------------------------------------------------------------------- */
export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [calendarSettings, setCalendarSettings] =
    useState<CalendarSettings>(defaultCalendarSettings);

  const choresRef = useRef<Chore[]>([]);
  useEffect(() => {
    choresRef.current = chores;
  }, [chores]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
    // setSession, setUser to null will be handled by onAuthStateChange
  };

  const fetchFamilyMembers = async () => {
    if (!user && !authLoading) { // Check authLoading to prevent race condition on initial load if user is briefly null
        setFamilyMembers([]);
        return;
    }
    if (!user && authLoading) { // Still loading auth state, don't fetch yet
        return;
    }
    // If user is null AND auth is no longer loading, it means they are logged out.
    if (!user) {
        setFamilyMembers([]);
        return;
    }

    const { data, error } = await supabase.from('family_members').select('*');
    if (error) {
      console.error('fetchFamilyMembers error:', error);
      setFamilyMembers([]);
      return;
    }
    setFamilyMembers((data || []).map(famMap));
  };


  async function verifyAndSetupFamilyMember(currentUser: User): Promise<boolean> {
    if (!currentUser) return false;

    const { id: authUserId, email: authUserEmail } = currentUser;

    if (!authUserEmail) {
      console.error("Authenticated user has no email. Cannot verify against allowed list. Signing out.");
      await signOut();
      return false;
    }

    try {
      const { data: allowedEntry, error: allowedCheckError } = await supabase
        .from('allowed_family_emails')
        .select('name')
        .eq('email', authUserEmail)
        .maybeSingle();

      if (allowedCheckError) {
        console.error('Error checking allowed_family_emails:', allowedCheckError.message);
        await signOut();
        return false;
      }

      if (!allowedEntry) {
        console.warn(`Email ${authUserEmail} (User ID: ${authUserId}) is not in allowed_family_emails. Access denied. Signing out.`);
        await signOut();
        return false;
      }

      const { data: existingFamilyMember, error: familyMemberCheckError } = await supabase
        .from('family_members')
        .select('id')
        .eq('id', authUserId)
        .maybeSingle();

      if (familyMemberCheckError) {
        console.error('Error checking for existing family_members profile:', familyMemberCheckError.message);
        await signOut();
        return false;
      }

      if (!existingFamilyMember) {
        console.log(`User ${authUserId} (email: ${authUserEmail}) is allowed. Creating family_member profile.`);
        let memberName = (allowedEntry && allowedEntry.name) ? allowedEntry.name : authUserEmail.split('@')[0];
        let memberColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        let memberInitials = memberName.length > 0 ? memberName.substring(0, 1).toUpperCase() : '?';
        if (memberName.includes(' ') && memberName.split(' ').length > 1 && memberName.split(' ')[1].length > 0) {
            const parts = memberName.split(' ');
            memberInitials = `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase();
        }


        const { error: insertError } = await supabase
          .from('family_members')
          .insert({
            id: authUserId,
            email: authUserEmail,
            name: memberName,
            color: memberColor,
            initials: memberInitials,
            is_child: false, // Default, adjust if needed
          });

        if (insertError) {
          console.error('Error creating family_members profile:', insertError.message, insertError.details);
          await signOut();
          return false;
        }
        console.log(`Family member profile created for ${authUserId}.`);
        await fetchFamilyMembers(); // Fetch immediately to update context
      }
      return true; // User is allowed and profile is set up or already existed
    } catch (error: any) {
        console.error("Unexpected error in verifyAndSetupFamilyMember:", error.message);
        await signOut();
        return false;
    }
  }

  useEffect(() => {
    setAuthLoading(true);
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      const currentUser = currentSession?.user ?? null;
      if (currentUser) {
        const isVerifiedAndSetUp = await verifyAndSetupFamilyMember(currentUser);
        if (isVerifiedAndSetUp) {
          setSession(currentSession);
          setUser(currentUser);
        } else {
          // verifyAndSetupFamilyMember would have called signOut.
          // onAuthStateChange will handle setting user/session to null if signOut was effective.
          // If user was already null or became null, this branch ensures state consistency.
          setSession(null);
          setUser(null);
        }
      } else {
        setSession(null);
        setUser(null);
      }
      setAuthLoading(false);
    }).catch((error: PostgrestError | Error ) => {
      console.error('[AppContext] Error fetching initial session:', error);
      setSession(null); // Ensure session/user are null on error
      setUser(null);
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        setAuthLoading(true);
        const currentUser = newSession?.user ?? null;
        if (currentUser) {
          const isVerifiedAndSetUp = await verifyAndSetupFamilyMember(currentUser);
          if (isVerifiedAndSetUp) {
            setSession(newSession);
            setUser(currentUser);
          } else {
            // If !isVerifiedAndSetUp, signOut has been called.
            // The auth state will change again, leading to currentUser being null.
            // Explicitly setting here ensures UI consistency if needed before re-render.
            setSession(null);
            setUser(null);
          }
        } else { // User is null (logged out)
          setSession(null);
          setUser(null);
        }
        setAuthLoading(false);
      }
    );
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []); // signOut is stable as it's defined in this component's scope


  useEffect(() => {
    const SETTINGS_ROW_ID_FALLBACK = '2c10355d-a1ad-4cf5-8520-963724450a11';
    async function fetchSettings() {
      const columnToMatch = user ? 'user_id' : 'id';
      const identifier = user ? user.id : SETTINGS_ROW_ID_FALLBACK;

      const { data, error } = await supabase // CORRECTED QUERY
        .from('user_settings')
        .select('*')
        .eq(columnToMatch, identifier)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Settings fetch failed:', error.message);
        if (user) setSettings(defaultSettings);
        return;
      }
      if (data) {
        setSettings((prev) => ({
          ...prev,
          theme: data.theme || defaultSettings.theme,
          sleepMode: data.sleep_mode ?? defaultSettings.sleepMode,
          sleepStart: data.sleep_start || defaultSettings.sleepStart,
          sleepEnd: data.sleep_end || defaultSettings.sleepEnd,
          weatherLocation: data.weather_location || defaultSettings.weatherLocation,
          weatherApiKey: data.weather_api_key || defaultSettings.weatherApiKey,
          showWeather: data.show_weather ?? defaultSettings.showWeather,
          weatherLastUpdated: data.weather_last_updated || defaultSettings.weatherLastUpdated,
          showRewards: data.show_rewards ?? defaultSettings.showRewards,
          autoRotateChores: data.auto_rotate_chores ?? defaultSettings.autoRotateChores,
          rotationFrequency: data.rotation_frequency || defaultSettings.rotationFrequency,
          rotationDay: data.rotation_day ?? defaultSettings.rotationDay,
          lastAutoRotation: data.last_auto_rotation || defaultSettings.lastAutoRotation,
          autoRotationMembers: data.auto_rotation_members || defaultSettings.autoRotationMembers,
        }));
      } else if (user && !data) {
        console.log(`No settings for user ${user.id}, using defaults.`);
        setSettings(defaultSettings);
      } else if (!user) {
        setSettings(defaultSettings);
      }
    }
    if (user && !authLoading) {
        fetchSettings();
    } else if (!user && !authLoading) {
        setSettings(defaultSettings);
    }
  }, [user, authLoading]);

  async function signInWithGoogle() {
    const redirectURL = `${window.location.origin}${import.meta.env.BASE_URL || '/'}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectURL },
    });
    if (error) console.error('Error signing in with Google:', error.message);
  }

  const famMap = (m: any): FamilyMember => ({ id: m.id, name: m.name, color: m.color, initial: m.initials, profilePicture: m.avatar_url, email: m.email });
  // fetchFamilyMembers is defined above verifyAndSetupFamilyMember

  async function addFamilyMember(member: Omit<FamilyMember, 'id' | 'profilePicture'> & { profilePicture?: string }) {
    const { error } = await supabase.from('family_members').insert([{ name: member.name, color: member.color, initials: member.initial, avatar_url: member.profilePicture, email: member.email, }]).select();
    if (error) console.error('addFamilyMember error:', error);
  }
  async function updateFamilyMember(id: string, member: Partial<Omit<FamilyMember, 'id' | 'profilePicture'> & { profilePicture?: string }>) {
    const update: any = {};
    if (member.name !== undefined) update.name = member.name;
    if (member.color !== undefined) update.color = member.color;
    if (member.initial !== undefined) update.initials = member.initial;
    if (member.profilePicture !== undefined) update.avatar_url = member.profilePicture;
    if (member.email !== undefined) update.email = member.email;
    const { error } = await supabase.from('family_members').update(update).eq('id', id).select();
    if (error) console.error('updateFamilyMember error:', error);
  }
  async function removeFamilyMember(id: string) {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) console.error('removeFamilyMember error:', error);
  }

  const choreMap = (c: any): Chore => ({ id: c.id, title: c.title, description: c.notes, assignedTo: c.assigned_to || [], frequency: c.frequency, starValue: c.star_value, isRotating: c.is_rotating ?? false, rotationFrequency: c.rotation_frequency, rotationDay: c.rotation_day, lastRotated: c.last_rotated, timeOfDay: c.time_of_day, completed: c.completed ?? {}, daysOfWeek: c.daysOfWeek, dayOfMonth: c.dayOfMonth });
  async function fetchChores() {
    if (!user) { setChores([]); return; }
    const { data, error } = await supabase.from('chores').select('*');
    if (error) { console.error('fetchChores error:', error); setChores([]); return; }
    setChores((data || []).map(choreMap));
   }
  async function addChore(choreData: Omit<Chore, 'id' | 'createdBy' | 'completed' | 'lastRotated'>) {
    if (!user) { console.error("User must be logged in to add a chore"); return; }
    const completedMap: Record<string, boolean> = {};
    (choreData.assignedTo || []).forEach((assigneeId) => (completedMap[assigneeId] = false));
    const choreToInsert = { title: choreData.title, notes: choreData.description, assigned_to: choreData.assignedTo, frequency: choreData.frequency, star_value: choreData.starValue, is_rotating: choreData.isRotating, rotation_frequency: choreData.rotationFrequency, rotation_day: choreData.rotationDay, time_of_day: choreData.timeOfDay, daysOfWeek: choreData.daysOfWeek, dayOfMonth: choreData.dayOfMonth, completed: completedMap, created_by: user.id, };
    const { error } = await supabase.from('chores').insert([choreToInsert]).select();
    if (error) console.error('addChore error:', error.message, error.details);
  }
  async function updateChore(id: string, choreUpdates: Partial<Chore>) {
    if (!user) { console.error("User must be logged in to update a chore"); return; }
    const updatePayload: any = {};
    if(choreUpdates.title !== undefined) updatePayload.title = choreUpdates.title;
    if(choreUpdates.description !== undefined) updatePayload.notes = choreUpdates.description;
    if(choreUpdates.assignedTo !== undefined) updatePayload.assigned_to = choreUpdates.assignedTo;
    if(choreUpdates.frequency !== undefined) updatePayload.frequency = choreUpdates.frequency;
    if(choreUpdates.starValue !== undefined) updatePayload.star_value = choreUpdates.starValue;
    if(choreUpdates.isRotating !== undefined) updatePayload.is_rotating = choreUpdates.isRotating;
    if(choreUpdates.rotationFrequency !== undefined) updatePayload.rotation_frequency = choreUpdates.rotationFrequency;
    if(choreUpdates.rotationDay !== undefined) updatePayload.rotation_day = choreUpdates.rotationDay;
    if(choreUpdates.timeOfDay !== undefined) updatePayload.time_of_day = choreUpdates.timeOfDay;
    if(choreUpdates.completed !== undefined) updatePayload.completed = choreUpdates.completed;
    if(choreUpdates.daysOfWeek !== undefined) updatePayload.daysOfWeek = choreUpdates.daysOfWeek;
    if(choreUpdates.dayOfMonth !== undefined) updatePayload.dayOfMonth = choreUpdates.dayOfMonth;
    if(choreUpdates.lastRotated !== undefined) updatePayload.last_rotated = choreUpdates.lastRotated;

    const { error } = await supabase.from('chores').update(updatePayload).eq('id', id).select();
    if (error) console.error('updateChore error:', error.message, error.details);
  }
  async function removeChore(id: string) {
    const { error } = await supabase.from('chores').delete().eq('id', id);
    if (error) console.error('removeChore error:', error.message, error.details);
  }
  async function toggleChoreCompletion(choreId: string, memberId: string) {
    const chore = choresRef.current.find((c) => c.id === choreId);
    if (!chore) return;
    const updatedCompletions = { ...chore.completed, [memberId]: !chore.completed[memberId] };
    await updateChore(choreId, { completed: updatedCompletions });
   }
  function rotateOne(chore: Chore) {
    const newOrder = [...chore.assignedTo.slice(1), chore.assignedTo[0]];
    const newCompleted: Record<string, boolean> = {};
    newOrder.forEach(id => (newCompleted[id] = false));
    updateChore(chore.id, { assignedTo: newOrder, completed: newCompleted, lastRotated: new Date().toISOString() });
  }
  async function rotateChores() {
    choresRef.current.forEach((c) => { if (c.isRotating && c.assignedTo.length > 1) rotateOne(c); });
  }

  const calMap = (e: any): CalendarEvent => ({ id: e.id, title: e.title, description: e.description, memberId: e.member_id, eventType: e.event_type, start: e.start, end: e.end, allDay: e.all_day ?? false, location: e.location, isRecurring: e.is_recurring ?? false, recurrencePattern: e.recurrence_pattern as CalendarRecurrencePattern | undefined, recurrenceInterval: e.recurrence_interval, recurrenceDaysOfWeek: e.recurrence_days_of_week, recurrenceDayOfMonth: e.recurrence_day_of_month, recurrenceEndDate: e.recurrence_end_date, recurrenceParentId: e.recurrence_parent_id, recurrenceExceptions: e.recurrence_exceptions, color: e.color, editMode: e.editMode as CalendarEvent['editMode'] });
  async function fetchCalendarEvents() {
    if (!user) { setCalendarEvents([]); return; }
    const { data, error } = await supabase.from('calendar_events').select('*');
    if (error) { console.error('fetchCalendarEvents error:', error); setCalendarEvents([]); return; }
    setCalendarEvents((data || []).map(calMap));
   }
  async function addCalendarEvent(event: Omit<CalendarEvent, 'id'>) {
    if (!user) { console.error("User must be logged in to add a calendar event"); return; }
    const dbEventPayload = {
      title: event.title, description: event.description, member_id: event.memberId,
      event_type: event.eventType, start: event.start, end: event.end,
      all_day: event.allDay, location: event.location, is_recurring: event.isRecurring,
      recurrence_pattern: event.recurrencePattern, recurrence_interval: event.recurrenceInterval,
      recurrence_days_of_week: event.recurrenceDaysOfWeek, recurrence_day_of_month: event.recurrenceDayOfMonth,
      recurrence_end_date: event.recurrenceEndDate, recurrence_parent_id: event.recurrenceParentId,
      recurrence_exceptions: event.recurrenceExceptions, color: event.color,
    };
    const { error } = await supabase.from('calendar_events').insert([dbEventPayload]).select();
    if (error) console.error('addCalendarEvent error:', error.message, error.details);
  }
  async function updateCalendarEvent(id: string, eventUpdates: Partial<CalendarEvent>) {
    if (!user) { console.error("User must be logged in to update a calendar event"); return; }
    const dbUpdatePayload: any = {};
    for (const key in eventUpdates) {
      if (Object.prototype.hasOwnProperty.call(eventUpdates, key)) {
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        dbUpdatePayload[dbKey] = (eventUpdates as any)[key];
      }
    }
    if (eventUpdates.memberId !== undefined) { dbUpdatePayload.member_id = eventUpdates.memberId; delete dbUpdatePayload.memberId; }
    if (eventUpdates.allDay !== undefined) dbUpdatePayload.all_day = eventUpdates.allDay;
    if (eventUpdates.isRecurring !== undefined) dbUpdatePayload.is_recurring = eventUpdates.isRecurring;
    if (eventUpdates.recurrenceDaysOfWeek !== undefined) dbUpdatePayload.recurrence_days_of_week = eventUpdates.recurrenceDaysOfWeek;
    if (eventUpdates.recurrenceDayOfMonth !== undefined) dbUpdatePayload.recurrence_day_of_month = eventUpdates.recurrenceDayOfMonth;
    if (eventUpdates.recurrenceEndDate !== undefined) dbUpdatePayload.recurrence_end_date = eventUpdates.recurrenceEndDate;
    if (eventUpdates.recurrenceParentId !== undefined) dbUpdatePayload.recurrence_parent_id = eventUpdates.recurrenceParentId;
    if (eventUpdates.recurrenceExceptions !== undefined) dbUpdatePayload.recurrence_exceptions = eventUpdates.recurrenceExceptions;

    delete dbUpdatePayload.id;
    delete dbUpdatePayload.editMode;

    const { error } = await supabase.from('calendar_events').update(dbUpdatePayload).eq('id', id).select();
    if (error) console.error('updateCalendarEvent error:', error.message, error.details);
   }
  async function removeCalendarEvent(id: string) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) console.error('removeCalendarEvent error:', error.message, error.details);
  }

  const listMap = (dbList: any): Omit<List, 'items'> => ({ id: dbList.id, title: dbList.title ?? dbList.name, created_by: dbList.created_by, created_at: dbList.created_at });
  const listItemMap = (dbListItem: any): ListItem => ({ id: dbListItem.id, list_id: dbListItem.list_id, text: dbListItem.text, completed: dbListItem.completed ?? false, position: dbListItem.position, assignedTo: dbListItem.assigned_to || [], created_at: dbListItem.created_at });

  async function fetchListsAndItems() {
    if (!user) { setLists([]); return; }
    const { data: listData, error: listError } = await supabase.from('lists').select('*');
    if (listError) { console.error('Error fetching lists:', listError); setLists([]); return; }
    if (!listData) { setLists([]); return; }
    const { data: itemData, error: itemError } = await supabase.from('list_items').select('*');
    if (itemError) { console.error('Error fetching list items:', itemError); }
    const itemsByListId = new Map<string, ListItem[]>();
    if (itemData) {
      itemData.forEach((dbItem: any) => {
        const item = listItemMap(dbItem);
        if (!itemsByListId.has(item.list_id)) itemsByListId.set(item.list_id, []);
        itemsByListId.get(item.list_id)!.push(item);
      });
    }
    itemsByListId.forEach(items => items.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity) || new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()));
    const populatedLists = listData.map((dbList: any) => ({ ...listMap(dbList), items: itemsByListId.get(dbList.id) || [] }));
    setLists(populatedLists);
  }

  async function addList(listData: { title: string }) {
    if (!user) { console.error("User must be logged in to add a list"); return; }
    const { error } = await supabase.from('lists').insert([{ name: listData.title, title: listData.title, created_by: user.id }]).select();
    if (error) console.error('addList error:', error.message, error.details);
  }
  async function updateList(id: string, listUpdates: Partial<{ title: string }>) {
    const { error } = await supabase.from('lists').update({ name: listUpdates.title, title: listUpdates.title }).eq('id', id).select();
    if (error) console.error('updateList error:', error.message, error.details);
  }
  async function removeList(id: string) {
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) console.error('removeList error:', error.message, error.details);
  }
  async function addListItem(listId: string, itemData: { text: string; position?: number; assignedTo?: string[] }) {
    const { error } = await supabase.from('list_items').insert([{ list_id: listId, text: itemData.text, completed: false, position: itemData.position, assigned_to: itemData.assignedTo }]).select();
    if (error) console.error('addListItem error:', error.message, error.details);
  }
  async function updateListItem(itemId: string, updates: Partial<{ text: string; completed: boolean; position: number; assignedTo: string[] }>) {
    const payload: any = {};
    if(updates.text !== undefined) payload.text = updates.text;
    if(updates.completed !== undefined) payload.completed = updates.completed;
    if(updates.position !== undefined) payload.position = updates.position;
    if(updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
    if (Object.keys(payload).length === 0) return;
    const { error } = await supabase.from('list_items').update(payload).eq('id', itemId).select();
    if (error) console.error('updateListItem error:', error.message, error.details);
  }
  async function removeListItem(itemId: string) {
    const { error } = await supabase.from('list_items').delete().eq('id', itemId);
    if (error) console.error('removeListItem error:', error.message, error.details);
  }
  async function toggleListItemCompletion(itemId: string, currentStatus: boolean) {
    await updateListItem(itemId, { completed: !currentStatus });
  }

  const mealMap = (p: any): MealPlan => ({ id: p.id, title: p.title, date: p.date, meal: p.meal_type, description: p.description, members: p.members || [], created_by: p.created_by });
  async function fetchMealPlans() {
    if (!user) { setMealPlans([]); return; }
    const { data, error } = await supabase.from('meal_plans').select('*');
    if (error) { console.error('fetchMealPlans error:', error); setMealPlans([]); return; }
    setMealPlans((data || []).map(mealMap));
   }
  async function addMealPlan(plan: Omit<MealPlan, 'id' | 'created_by'>) {
    if (!user) { console.error("User must be logged in to add a meal plan"); return; }
    const { error } = await supabase.from('meal_plans').insert([{ title: plan.title, date: plan.date, meal_type: plan.meal, description: plan.description, members: plan.members, created_by: user.id }]).select();
    if (error) console.error('addMealPlan error:', error.message, error.details);
  }
  async function updateMealPlan(id: string, plan: Partial<MealPlan>) {
    const updatePayload:any = {};
    if(plan.title !== undefined) updatePayload.title = plan.title;
    if(plan.date !== undefined) updatePayload.date = plan.date;
    if(plan.meal !== undefined) updatePayload.meal_type = plan.meal;
    if(plan.description !== undefined) updatePayload.description = plan.description;
    if(plan.members !== undefined) updatePayload.members = plan.members;

    const { error } = await supabase.from('meal_plans').update(updatePayload).eq('id', id).select();
    if (error) console.error('updateMealPlan error:', error.message, error.details);
  }
  async function removeMealPlan(id: string) {
    const { error } = await supabase.from('meal_plans').delete().eq('id', id);
    if (error) console.error('removeMealPlan error:', error.message, error.details);
  }

  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...s };
      const settingsIdentifier = user?.id || '2c10355d-a1ad-4cf5-8520-963724450a11';
      const columnToMatch = user?.id ? 'user_id' : 'id';

      const dbSettingsPayload: any = {};
      if (updated.theme !== undefined) dbSettingsPayload.theme = updated.theme;
      if (updated.sleepMode !== undefined) dbSettingsPayload.sleep_mode = updated.sleepMode;
      if (updated.sleepStart !== undefined) dbSettingsPayload.sleep_start = updated.sleepStart;
      if (updated.sleepEnd !== undefined) dbSettingsPayload.sleep_end = updated.sleepEnd;
      if (updated.showWeather !== undefined) dbSettingsPayload.show_weather = updated.showWeather;
      if (updated.weatherLocation !== undefined) dbSettingsPayload.weather_location = updated.weatherLocation;
      if (updated.weatherApiKey !== undefined) dbSettingsPayload.weather_api_key = updated.weatherApiKey;
      if (updated.weatherLastUpdated !== undefined) dbSettingsPayload.weather_last_updated = updated.weatherLastUpdated;
      if (updated.showRewards !== undefined) dbSettingsPayload.show_rewards = updated.showRewards;
      if (updated.autoRotateChores !== undefined) dbSettingsPayload.auto_rotate_chores = updated.autoRotateChores;
      if (updated.rotationFrequency !== undefined) dbSettingsPayload.rotation_frequency = updated.rotationFrequency;
      if (updated.rotationDay !== undefined) dbSettingsPayload.rotation_day = updated.rotationDay;
      if (updated.lastAutoRotation !== undefined) dbSettingsPayload.last_auto_rotation = updated.lastAutoRotation;
      if (updated.autoRotationMembers !== undefined) dbSettingsPayload.auto_rotation_members = updated.autoRotationMembers;

      if (user && columnToMatch === 'user_id') {
        dbSettingsPayload.user_id = user.id;
      }

      if (Object.keys(dbSettingsPayload).length > 0) {
        supabase
          .from('user_settings')
          .update(dbSettingsPayload)
          .eq(columnToMatch, settingsIdentifier)
          .then(({ error }: { error: PostgrestError | null }) => {
              if (error) console.error('Error updating user_settings:', error.message, error.details);
          });
      }
      return updated;
    });
  };

  useEffect(() => {
    if (user && !authLoading) {
      // Data fetching for a verified and set up user
      // verifyAndSetupFamilyMember calls fetchFamilyMembers if new profile created.
      // Calling again here is safe and ensures it's fetched if profile was pre-existing.
      fetchFamilyMembers();
      fetchChores();
      fetchListsAndItems();
      fetchMealPlans();
      fetchCalendarEvents();
    } else if (!user && !authLoading) {
      // User is signed out or access was denied and they were signed out
      setFamilyMembers([]);
      setChores([]);
      setLists([]);
      setMealPlans([]);
      setCalendarEvents([]);
      setSettings(defaultSettings);
      setCalendarSettings(defaultCalendarSettings);
    }
  }, [user, authLoading]);


  useEffect(() => {
    if (!user) {
        supabase.removeAllChannels();
        return;
    }
    const channels: any[] = [];
    channels.push(supabase.channel('family_members-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'family_members' }, fetchFamilyMembers).subscribe());
    channels.push(supabase.channel('chores-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'chores' }, fetchChores).subscribe());
    channels.push(supabase.channel('calendar_events-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchCalendarEvents).subscribe());
    channels.push(supabase.channel('lists-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, fetchListsAndItems).subscribe());
    channels.push(supabase.channel('list_items-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'list_items' }, fetchListsAndItems).subscribe());
    channels.push(supabase.channel('meal_plans-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plans' }, fetchMealPlans).subscribe());

    const choresTicker = setInterval(() => {
        choresRef.current.forEach((c) => { if (shouldRotate(c)) rotateOne(c); });
    }, 60 * 60 * 1000);

    return () => {
      channels.forEach(channel => {
        if (channel) supabase.removeChannel(channel);
      });
      clearInterval(choresTicker);
    };
  }, [user]);

  const value: AppContextType = {
    session, user, authLoading, signInWithGoogle, signOut,
    familyMembers, chores, lists, mealPlans, calendarEvents, settings, calendarSettings,
    addFamilyMember, updateFamilyMember, removeFamilyMember,
    addChore, updateChore, removeChore, toggleChoreCompletion, rotateChores,
    addCalendarEvent, updateCalendarEvent, removeCalendarEvent,
    addList, updateList, removeList,
    addListItem, updateListItem, removeListItem, toggleListItemCompletion,
    addMealPlan, updateMealPlan, removeMealPlan,
    updateSettings, updateCalendarSettings: (s) => setCalendarSettings((prev) => ({ ...prev, ...s })),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
}