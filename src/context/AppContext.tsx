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

  // ───────────────────────────────────────────────────────────────
  // DEV AUTH BYPASS: ONLY in dev, only if VITE_BYPASS_AUTH=true
  // ───────────────────────────────────────────────────────────────
  const BYPASS_AUTH =
    import.meta.env.DEV &&
    import.meta.env.VITE_BYPASS_AUTH === 'true';

  useEffect(() => {
    if (!BYPASS_AUTH) return;
    const fakeUser = {
      id: 'local-dev',
      email: 'dev@local.test',
    } as unknown as User;
    setUser(fakeUser);
    setSession({ user: fakeUser } as unknown as Session);
    setAuthLoading(false);
  }, []);
  // ───────────────────────────────────────────────────────────────

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
    // setSession, setUser to null will be handled by onAuthStateChange
  };

  // ... fetchFamilyMembers and all your logic stays the same ...

  const fetchFamilyMembers = async () => {
    if (!user && !authLoading) {
      setFamilyMembers([]);
      return;
    }
    if (!user && authLoading) {
      return;
    }
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

  // ... verifyAndSetupFamilyMember stays the same ...

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
            is_child: false,
          });
        if (insertError) {
          console.error('Error creating family_members profile:', insertError.message, insertError.details);
          await signOut();
          return false;
        }
        console.log(`Family member profile created for ${authUserId}.`);
        await fetchFamilyMembers();
      }
      return true;
    } catch (error: any) {
      console.error("Unexpected error in verifyAndSetupFamilyMember:", error.message);
      await signOut();
      return false;
    }
  }

  useEffect(() => {
    if (BYPASS_AUTH) return;
    setAuthLoading(true);
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      const currentUser = currentSession?.user ?? null;
      if (currentUser) {
        const isVerifiedAndSetUp = await verifyAndSetupFamilyMember(currentUser);
        if (isVerifiedAndSetUp) {
          setSession(currentSession);
          setUser(currentUser);
        } else {
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
      setSession(null);
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
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(null);
          setUser(null);
        }
        setAuthLoading(false);
      }
    );
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const SETTINGS_ROW_ID_FALLBACK = '2c10355d-a1ad-4cf5-8520-963724450a11';
    async function fetchSettings() {
      const columnToMatch = user ? 'user_id' : 'id';
      const identifier = user ? user.id : SETTINGS_ROW_ID_FALLBACK;
      const { data, error } = await supabase
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

  // (Everything else: addChore, updateChore, list/meal/calendar CRUD, etc. is unchanged.)

  // ... rest of your CRUD, rotation, etc. functions ...

  useEffect(() => {
    if (BYPASS_AUTH) return;
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
