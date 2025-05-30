import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import { Check, Clock, CloudRain, CloudSnow, CloudSun, Droplets, Settings, Star, Sun, Wind } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchWeather, WeatherData, getWeatherIconUrl } from '../services/weatherService';

export default function Dashboard() {
  const { familyMembers, chores, toggleChoreCompletion, settings, updateSettings } = useAppContext();
  const [today, setToday] = useState(new Date());
  const [choresByMember, setChoresByMember] = useState<Record<string, any[]>>({});
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setToday(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Fetch weather data when component mounts or when location changes
  useEffect(() => {
    if (!settings.showWeather) return;
    
    const getWeather = async () => {
      setIsLoadingWeather(true);
      setWeatherError(null);
      
      try {
        // Check if API key exists before trying to fetch
        if (!settings.weatherApiKey) {
          throw new Error('API key is required. Please add your OpenWeatherMap API key in Settings.');
        }
        
        const data = await fetchWeather(settings.weatherLocation, settings.weatherApiKey);
        setCurrentWeather(data);
        // Update last weather fetch time
        updateSettings({ weatherLastUpdated: new Date().toISOString() });
      } catch (error: any) {
        console.error('Weather fetch failed:', error);
        // Display the specific error message from the service
        setWeatherError(error.message || 'Could not fetch weather data. Please check your settings.');
      } finally {
        setIsLoadingWeather(false);
      }
    };
    
    getWeather();
    
    // Set up a refresh every 30 minutes
    const weatherRefreshInterval = setInterval(() => {
      getWeather();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(weatherRefreshInterval);
  }, [settings.weatherLocation, settings.showWeather]);
  
  // Group chores by family member
  useEffect(() => {
    const grouped: Record<string, any[]> = {};
    
    familyMembers.forEach(member => {
      const memberChores = chores
        .filter(chore => {
          // Filter based on frequency and rotation status
          if (chore.isRotating) {
            // For rotating chores, only show to the first person in the assignedTo array
            if (chore.assignedTo.length > 0 && chore.assignedTo[0] === member.id) {
              // Then check frequency
              if (chore.frequency === 'daily') return true;
              if (chore.frequency === 'once') return true;
              
              if (chore.frequency === 'weekly' && chore.daysOfWeek) {
                const dayOfWeek = today.getDay();
                return chore.daysOfWeek.includes(dayOfWeek);
              }
              
              if (chore.frequency === 'monthly' && chore.dayOfMonth) {
                const dayOfMonth = today.getDate();
                return chore.dayOfMonth === dayOfMonth;
              }
            }
            return false;
          } else {
            // For non-rotating chores, show to all assigned members
            if (chore.assignedTo.includes(member.id)) {
              if (chore.frequency === 'daily') return true;
              if (chore.frequency === 'once') return true;
              
              if (chore.frequency === 'weekly' && chore.daysOfWeek) {
                const dayOfWeek = today.getDay();
                return chore.daysOfWeek.includes(dayOfWeek);
              }
              
              if (chore.frequency === 'monthly' && chore.dayOfMonth) {
                const dayOfMonth = today.getDate();
                return chore.dayOfMonth === dayOfMonth;
              }
            }
            return false;
          }
        })
        .map(chore => ({
          ...chore,
          completed: chore.completed[member.id] || false
        }));
      
      grouped[member.id] = memberChores;
    });
    
    setChoresByMember(grouped);
  }, [chores, familyMembers, today]);

  // Calculate completion stats
  const getCompletionStats = (memberId: string) => {
    const memberChores = choresByMember[memberId] || [];
    const total = memberChores.length;
    const completed = memberChores.filter(chore => chore.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percentage };
  };
  
  const getTimeOfDayIcon = (timeOfDay?: string) => {
    switch(timeOfDay) {
      case 'morning': return <Clock size={16} className="text-yellow-500" />;
      case 'afternoon': return <Clock size={16} className="text-orange-500" />;
      case 'evening': return <Clock size={16} className="text-blue-500" />;
      default: return null;
    }
  };
  
  // Format time as 12-hour with AM/PM
  const getFormattedTime = () => {
    return today.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  // Format date as "Weekday, Month Day"
  const getFormattedDate = () => {
    return format(today, 'EEEE, MMMM d');
  };
  
  return (
    <div>
      <div className="bg-indigo-600 dark:bg-indigo-700 text-white w-full px-6 py-3 mb-8 shadow-md">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              FamilyHub
              <span className="ml-2 text-xs bg-indigo-500 px-1.5 py-0.5 rounded">v1.0</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {settings.showWeather && (
              <div className="flex items-center bg-indigo-500/30 px-3 py-1.5 rounded-lg">
                {isLoadingWeather ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    <span>Loading...</span>
                  </div>
                ) : weatherError ? (
                  <div className="flex items-center text-orange-300">
                    <span className="text-sm truncate max-w-[200px] md:max-w-xs">{weatherError}</span>
                    {weatherError.includes('API key') && (
                      <a href="#/settings" className="ml-2 underline text-xs">
                        Fix
                      </a>
                    )}
                  </div>
                ) : currentWeather ? (
                  <>
                    {currentWeather.condition === 'Clear' && <Sun size={18} className="mr-2 text-yellow-300" />}
                    {currentWeather.condition === 'Clouds' && <CloudSun size={18} className="mr-2 text-gray-300" />}
                    {currentWeather.condition === 'Rain' && <CloudRain size={18} className="mr-2 text-blue-300" />}
                    {currentWeather.condition === 'Snow' && <CloudSnow size={18} className="mr-2 text-blue-200" />}
                    {!['Clear', 'Clouds', 'Rain', 'Snow'].includes(currentWeather.condition) && 
                      <Sun size={18} className="mr-2" />
                    }
                    <span className="font-medium">{currentWeather.temp}°F</span>
                    <span className="ml-1 text-indigo-200">{currentWeather.location}</span>
                    
                    <div className="ml-3 pl-3 border-l border-indigo-400/30 flex items-center">
                      <Droplets size={14} className="mr-1 text-blue-300" />
                      <span className="text-xs">{currentWeather.humidity}%</span>
                      
                      <Wind size={14} className="ml-2 mr-1 text-gray-300" />
                      <span className="text-xs">{currentWeather.windSpeed} mph</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center">
                    <Sun size={18} className="mr-2" />
                    <span>No data</span>
                  </div>
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
            Auto-rotation {settings.rotationFrequency === 'daily' ? 'daily' : 
              settings.rotationFrequency === 'weekly' ? `every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][settings.rotationDay || 0]}` : 
              `on day ${settings.rotationDay} monthly`}
          </div>
        )}
      </div>
      
      {familyMembers.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-xl p-6 text-center shadow-sm mx-6 md:mx-8"
        >
          <p className="text-amber-700 dark:text-amber-300 font-medium mb-2">No family members yet</p>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Go to the Family Members page to add people to your family.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 md:px-8">
          {familyMembers.map((member, index) => {
            const stats = getCompletionStats(member.id);
            
            return (
              <motion.div 
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden"
              >
                <div className="h-2.5" style={{ backgroundColor: member.color }}></div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-medium shadow-sm"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.initial}
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{member.name}</h2>
                    </div>
                    
                    {stats.total > 0 && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-300">
                          {stats.percentage}%
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {choresByMember[member.id]?.length > 0 ? (
                    <div className="space-y-2.5">
                      {choresByMember[member.id].map(chore => (
                        <motion.div 
                          key={chore.id}
                          whileHover={{ x: 4 }}
                          className={`flex items-start px-3 py-2.5 rounded-lg ${chore.completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800'} transition-colors`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              checked={chore.completed}
                              onChange={() => toggleChoreCompletion(chore.id, member.id)}
                              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className={`font-medium flex items-center ${chore.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                              {chore.title}
                              {chore.completed && (
                                <Check size={14} className="ml-2 text-green-500" />
                              )}
                            </div>
                            {chore.timeOfDay && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                                {getTimeOfDayIcon(chore.timeOfDay)}
                                <span className="ml-1 capitalize">{chore.timeOfDay}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400 text-center py-4 bg-gray-50 dark:bg-slate-800/30 rounded-lg">
                      <Star size={16} className="inline-block mb-1 text-yellow-400" />
                      <p>All done for today!</p>
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
