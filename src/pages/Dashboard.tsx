import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { useAppContext } from "../context";
import {
  Check,
  Clock,
  // CloudRain, // <-- REMOVED
  // CloudSnow, // <-- REMOVED
  // CloudSun,  // <-- REMOVED
  Droplets,
  Star,
  Sun,
  Wind,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchWeather, WeatherData } from '../services/weatherService'; 

export default function Dashboard() {
  const { familyMembers, chores, toggleChoreCompletion, settings, updateSettings } = useAppContext();
  const [today, setToday] = useState(new Date());
  // Removed ChoreCompletion interface as we're using inline type now

  interface ChoreItem {
    id: string;
    title: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'once';
    assignedTo: string | string[];
    daysOfWeek?: number[];
    dayOfMonth?: number;
    completed: Record<string, boolean>;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    isRotating?: boolean;
    rotationFrequency?: 'daily' | 'weekly' | 'monthly';
    rotationDay?: number;
  }

  const [choresByMember, setChoresByMember] = useState<Record<string, ChoreItem[]>>({});
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Track the current request to avoid race conditions and unnecessary re-renders
  const weatherRequestRef = useRef<Promise<void> | null>(null);
  const retryCountRef = useRef(0);
  const lastFetchedLocation = useRef<string>('');
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 3000; // 3 seconds
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes for testing, change to 30 * 60 * 1000 for production

  const fetchWeatherWithRetry = useCallback(async (location: string): Promise<void> => {
    const now = Date.now();
    const locationKey = location.toLowerCase();
    
    // Skip if already fetching this location
    if (weatherRequestRef.current || !location || !isMounted.current) {
      return;
    }

    // Skip if we've fetched this location very recently (within 1 second)
    if (lastFetchedLocation.current === locationKey && 
        now - lastFetchTime.current < 1000) {
      return;
    }

    // Skip if we have fresh data (within refresh interval)
    const lastUpdated = settings.weatherLastUpdated ? new Date(settings.weatherLastUpdated).getTime() : 0;
    if (currentWeather?.location.toLowerCase() === locationKey && 
        now - lastUpdated < REFRESH_INTERVAL / 2) { // Half the refresh interval for safety
      return;
    }

    console.log('Fetching weather for location:', location);
    setIsLoadingWeather(true);
    setWeatherError(null);
    weatherRequestRef.current = (async (): Promise<void> => {
      try {
        const data = await fetchWeather(location);
        
        if (!isMounted.current) return;
        
        lastFetchedLocation.current = locationKey;
        lastFetchTime.current = now;
        
        setCurrentWeather(data);
        
        // Only update settings if the location has actually changed
        if (settings.weatherLocation !== location) {
          updateSettings({
            weatherLastUpdated: new Date().toISOString(),
            weatherLocation: location
          });
        } else {
          // Still update the timestamp
          updateSettings({
            weatherLastUpdated: new Date().toISOString()
          });
        }
        
        retryCountRef.current = 0;
      } catch (error: any) {
        if (!isMounted.current) return;
        
        console.error('Weather fetch failed:', error);
        
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          console.log(`Retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCountRef.current));
          if (isMounted.current) {
            return fetchWeatherWithRetry(location);
          }
          return;
        }
        
        setWeatherError(error.message || 'Could not fetch weather data');
        setCurrentWeather(null);
        retryCountRef.current = 0;
      } finally {
        if (isMounted.current) {
          weatherRequestRef.current = null;
          setIsLoadingWeather(false);
        }
      }
    })();
    
    return weatherRequestRef.current;
  }, [updateSettings, settings.weatherLastUpdated, settings.weatherLocation, currentWeather?.location]);

  // Effect to handle weather data fetching
  useEffect(() => {
    isMounted.current = true;
    
    if (!settings.showWeather) {
      setCurrentWeather(null);
      return;
    }

    // Use default location if not set
    const location = settings.weatherLocation || 'New York, NY';
    
    // Initial fetch
    const fetchInitialWeather = async () => {
      await fetchWeatherWithRetry(location);
    };
    
    fetchInitialWeather();
    
    // Set up refresh interval
    const weatherRefreshInterval = setInterval(() => {
      if (isMounted.current) {
        fetchWeatherWithRetry(location);
      }
    }, REFRESH_INTERVAL);
    
    // Cleanup
    return () => {
      isMounted.current = false;
      clearInterval(weatherRefreshInterval);
      weatherRequestRef.current = null;
    };
  }, [settings.weatherLocation, settings.showWeather]); // Removed fetchWeatherWithRetry from deps

  useEffect(() => {
    const currentDayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const currentDayOfMonth = today.getDate();
    
    const grouped = familyMembers.reduce<Record<string, ChoreItem[]>>((acc, member) => {
      acc[member.id] = chores
        .filter((chore) => {
          // Handle both string[] and string types for assignedTo
          const assignedTo = Array.isArray(chore.assignedTo) 
            ? chore.assignedTo 
            : typeof chore.assignedTo === 'string' 
              ? [chore.assignedTo]
              : [];
              
          const isAssigned = assignedTo.includes(member.id);
          if (!isAssigned) return false;

          // Handle once frequency - only show if not completed today
          if (chore.frequency === 'once') {
            const todayKey = today.toISOString().split('T')[0];
            const completionKey = `${member.id}_${todayKey}`;
            return !chore.completed?.[completionKey];
          }

          // Handle other frequencies
          switch (chore.frequency) {
            case 'daily': 
              return true;
            case 'weekly': 
              return chore.daysOfWeek?.includes(currentDayOfWeek) ?? false;
            case 'monthly':
              return chore.dayOfMonth === currentDayOfMonth;
            default: 
              return false;
          }
        });
      return acc;
    }, {});
    setChoresByMember(grouped);
  }, [chores, familyMembers, today]);

  const getCompletionStats = useCallback((memberId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const memberChores = choresByMember[memberId] || [];
    
    const completed = memberChores.filter(chore => {
      const completionKey = `${memberId}_${today}`;
      return chore.completed?.[completionKey] === true;
    }).length;
    
    const total = memberChores.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  }, [choresByMember]);

  const getTimeOfDayIcon = (timeOfDay?: string) => {
    switch (timeOfDay) {
      case 'morning': return <Clock size={16} className="text-yellow-500" />;
      case 'afternoon': return <Clock size={16} className="text-orange-500" />;
      case 'evening': return <Clock size={16} className="text-blue-500" />;
      default: return null;
    }
  };

  const getFormattedTime = () => today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const getFormattedDate = () => format(today, 'EEEE, MMMM d');

  // In your Dashboard component's return JSX, where the weather icons were previously used:
  // You were checking currentWeather.condition for 'Clear', 'Clouds', 'Rain', 'Snow'.
  // Now, openweathermap provides an `icon` code (e.g., '01d', '02d') which is more reliable.
  // The `weatherService.ts` already returns this `icon` in `WeatherData`.
  // We can use this `currentWeather.icon` directly in an <img> tag if you want to show the OpenWeatherMap icons.

  return (
    <div>
      <div className="bg-indigo-600 dark:bg-indigo-700 text-white w-full px-6 py-3 mb-8 shadow-md">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
            FamilyHub<span className="ml-2 text-xs bg-indigo-500 px-1.5 py-0.5 rounded">v1.0</span>
          </h1>
          <div className="flex items-center space-x-4">
            {settings.showWeather && (
              <div className="flex items-center bg-indigo-500/30 px-3 py-1.5 rounded-lg text-xs sm:text-sm">
                {isLoadingWeather ? (
                  <div className="flex items-center"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>Loading...</div>
                ) : weatherError ? (
                  <div className="flex items-center text-orange-300">
                    <span className="truncate max-w-[150px] md:max-w-xs">{weatherError}</span>
                    {weatherError.includes('API key') && <a href="#/settings" className="ml-1.5 underline text-[10px] sm:text-xs">Fix</a>}
                  </div>
                ) : currentWeather ? (
                  <>
                    {/* Using OpenWeatherMap icon directly */}
                    {currentWeather.icon && 
                      <img 
                        src={`https://openweathermap.org/img/wn/${currentWeather.icon}.png`} 
                        alt={currentWeather.condition} 
                        width={28} height={28} 
                        className="-my-1" // Adjust styling as needed
                      />
                    }
                    {!currentWeather.icon && <Sun size={18} className="mr-1" />} {/* Fallback if no icon code */}
                    <span className="font-medium ml-1">{currentWeather.temp}°F</span>
                    <span className="ml-1.5 text-indigo-200 hidden sm:inline truncate max-w-[100px]">{currentWeather.location}</span>
                    <div className="ml-2 pl-2 border-l border-indigo-400/30 flex items-center text-xs">
                      <Droplets size={14} className="mr-0.5 text-blue-300" />{currentWeather.humidity}%
                      <Wind size={14} className="ml-1.5 mr-0.5 text-gray-300" />{currentWeather.windSpeed} mph
                    </div>
                  </>
                ) : (
                  <div className="flex items-center"><Sun size={18} className="mr-2" />No data</div>
                )}
              </div>
            )}
            <div className="text-right">
              <div className="text-lg font-medium">{getFormattedTime()}</div>
              <div className="text-xs text-indigo-200">{getFormattedDate()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8">
        {settings.autoRotateChores && (
          <div className="mb-4 text-sm text-slate-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 p-2 rounded-lg inline-flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
            Auto-rotation{' '}
            {settings.rotationFrequency === 'daily'
              ? 'daily'
              : settings.rotationFrequency === 'weekly'
                ? `every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][settings.rotationDay || 0]}`
                : `on day ${settings.rotationDay || 1} monthly`} 
          </div>
        )}
      </div>

      {familyMembers.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-xl p-6 text-center shadow-sm mx-6 md:mx-8">
          <p className="text-amber-700 dark:text-amber-300 font-medium mb-2">No family members yet</p>
          <p className="text-sm text-amber-600 dark:text-amber-400">Go to the Family Members page to add people.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 md:px-8 pb-8">
          {familyMembers.map((member, index) => {
            const stats = getCompletionStats(member.id);
            const memberChoresToday = choresByMember[member.id] || [];
            return (
              <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className="card overflow-hidden flex flex-col">
                <div className="h-2" style={{ backgroundColor: member.color }}></div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-medium shadow-sm" 
                        style={{ backgroundColor: member.color }}
                      >
                        {member.initial}
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {member.name}
                      </h2>
                    </div>
                    {stats.total > 0 && (
                      <div 
                        className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-300" 
                        title={`${stats.completed}/${stats.total} chores done`}
                      >
                        {stats.percentage}%
                      </div>
                    )}
                  </div>

                  {stats.total > 0 ? (
                    <div className="space-y-2.5 flex-grow">
                      {memberChoresToday.map((chore) => {
                        const todayKey = new Date().toISOString().split('T')[0];
                        const completionKey = `${member.id}_${todayKey}`;
                        const isCompleted = chore.completed?.[completionKey] === true;
                        
                        return (
                          <motion.div 
                            key={chore.id} 
                            whileHover={{ x: 3 }}
                            className={`flex items-start px-3 py-2.5 rounded-lg ${
                              isCompleted 
                                ? 'bg-green-50 dark:bg-green-900/20 opacity-75' 
                                : 'bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800'
                            } transition-colors`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => toggleChoreCompletion(chore.id, member.id)}
                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 rounded"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <div className={`font-medium flex items-center ${
                                isCompleted 
                                  ? 'line-through text-slate-500 dark:text-slate-400' 
                                  : 'text-slate-900 dark:text-white'
                              }`}>
                                {chore.title}
                                {isCompleted && <Check size={14} className="ml-1.5 text-green-500" />}
                              </div>
                              {chore.timeOfDay && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                                  {getTimeOfDayIcon(chore.timeOfDay)}
                                  <span className="ml-1 capitalize">{chore.timeOfDay}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400 text-center py-4 bg-gray-50 dark:bg-slate-800/30 rounded-lg flex-grow flex flex-col items-center justify-center">
                      <Star size={20} className="mb-1 text-yellow-400" />
                      <p className="text-sm">All done for today!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}