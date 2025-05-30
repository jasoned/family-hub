import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CloudRain, ExternalLink, Info, Key, Moon, RotateCcw, Search, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchWeather } from '../services/weatherService';

export default function Settings() {
  const { settings, updateSettings, familyMembers } = useAppContext();
  const [locationInput, setLocationInput] = useState(settings.weatherLocation || '');
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState(settings.weatherApiKey || '');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false);
  
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Settings
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 max-w-2xl border border-gray-50 dark:border-gray-700">
        <div className="space-y-6">
          {/* Theme */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Display Theme</h2>
            <div className="flex flex-wrap gap-3">
              <ThemeButton 
                label="Light"
                icon={<Sun size={18} />}
                isSelected={settings.theme === 'light'}
                onClick={() => updateSettings({ theme: 'light' })}
              />
              <ThemeButton 
                label="Dark"
                icon={<Moon size={18} />}
                isSelected={settings.theme === 'dark'}
                onClick={() => updateSettings({ theme: 'dark' })}
              />
              <ThemeButton 
                label="Auto"
                icon={
                  <div className="relative">
                    <Sun size={18} className="absolute" />
                    <Moon size={18} className="relative left-1 top-1" />
                  </div>
                }
                isSelected={settings.theme === 'auto'}
                onClick={() => updateSettings({ theme: 'auto' })}
              />
            </div>
          </div>
          
          {/* Auto Rotate Chores */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <RotateCcw size={20} className="text-indigo-500" />
                <h2 className="text-lg font-semibold">Auto Rotate Chores</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.autoRotateChores}
                  onChange={() => updateSettings({ autoRotateChores: !settings.autoRotateChores })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            {settings.autoRotateChores && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg"
              >
                <div>
                  <label htmlFor="rotationFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Rotation Frequency
                  </label>
                  <select
                    id="rotationFrequency"
                    value={settings.rotationFrequency}
                    onChange={(e) => updateSettings({ 
                      rotationFrequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                      // Reset rotation day when changing frequency
                      rotationDay: e.target.value === 'weekly' ? 0 : e.target.value === 'monthly' ? 1 : undefined
                    })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                {settings.rotationFrequency === 'weekly' && (
                  <div>
                    <label htmlFor="rotationDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Day of Week
                    </label>
                    <select
                      id="rotationDay"
                      value={settings.rotationDay || 0}
                      onChange={(e) => updateSettings({ rotationDay: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                  </div>
                )}
                
                {settings.rotationFrequency === 'monthly' && (
                  <div>
                    <label htmlFor="rotationDayMonth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Day of Month
                    </label>
                    <select
                      id="rotationDayMonth"
                      value={settings.rotationDay || 1}
                      onChange={(e) => updateSettings({ rotationDay: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:bg-slate-800 transition-colors"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                  <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">How it works:</p>
                  <p>
                    {settings.rotationFrequency === 'daily' ? 
                      'Chores will automatically rotate every day at midnight.' : 
                      settings.rotationFrequency === 'weekly' ? 
                        `Chores will automatically rotate every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][settings.rotationDay || 0]} at midnight.` : 
                        `Chores will automatically rotate on day ${settings.rotationDay} of each month at midnight.`
                    }
                  </p>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Sleep Mode */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Sleep Mode</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.sleepMode}
                  onChange={() => updateSettings({ sleepMode: !settings.sleepMode })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {settings.sleepMode && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label htmlFor="sleepStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sleep Start
                  </label>
                  <input
                    type="time"
                    id="sleepStart"
                    value={settings.sleepStart}
                    onChange={(e) => updateSettings({ sleepStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label htmlFor="sleepEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sleep End
                  </label>
                  <input
                    type="time"
                    id="sleepEnd"
                    value={settings.sleepEnd}
                    onChange={(e) => updateSettings({ sleepEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Weather Widget */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <CloudRain size={20} />
                <h2 className="text-lg font-semibold">Weather Widget</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.showWeather}
                  onChange={() => updateSettings({ showWeather: !settings.showWeather })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {settings.showWeather && (
              <div className="mt-3 space-y-4">
                {/* Weather API Key */}
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <Key className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <label htmlFor="weatherApiKey" className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                          OpenWeatherMap API Key
                        </label>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 flex items-center">
                          <button 
                            onClick={() => setShowApiKeyInfo(!showApiKeyInfo)}
                            className="inline-flex items-center hover:underline"
                            aria-expanded={showApiKeyInfo}
                          >
                            <Info size={14} className="mr-1" />
                            How to get an API key
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                      className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {isApiKeyVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                  
                  {showApiKeyInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-blue-600 dark:text-blue-400 bg-white/50 dark:bg-blue-900/30 p-3 rounded-lg mb-3 mt-2"
                    >
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Visit <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                          OpenWeatherMap.org <ExternalLink size={12} className="inline ml-1" />
                        </a></li>
                        <li>Sign up for a free account</li>
                        <li>Once registered, go to the "API Keys" tab in your account</li>
                        <li>Copy your default API key or create a new one</li>
                        <li>Paste it in the field below</li>
                        <li className="font-bold text-blue-700 dark:text-blue-300">Important: New API keys may take up to 2 hours to activate</li>
                      </ol>
                      <p className="mt-2 text-xs text-blue-500">The free tier allows up to 1,000 API calls per day, which is more than enough for personal use.</p>
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/30 rounded text-xs text-yellow-800 dark:text-yellow-200">
                        ⚠️ Note: This app requires a valid API key for the weather feature to work. The key is stored only on your device.
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="relative">
                    <input
                      type={isApiKeyVisible ? "text" : "password"}
                      id="weatherApiKey"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Enter your OpenWeatherMap API key"
                      className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 font-mono text-sm"
                    />
                    <button
                      onClick={() => {
                        if (!apiKeyInput.trim()) {
                          alert("Please enter an API key. Weather functionality requires a valid OpenWeatherMap API key.");
                          return;
                        }
                        updateSettings({ weatherApiKey: apiKeyInput });
                        alert("API key saved successfully! The weather data will update on the dashboard.");
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 rounded text-xs"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
                
                {/* Weather Location */}
                <div>
                  <label htmlFor="weatherLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location (City, State or 5-digit ZIP code)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id="weatherLocation"
                        value={locationInput}
                        onChange={(e) => {
                          setLocationInput(e.target.value);
                          setLocationError(null);
                        }}
                        placeholder="e.g. Thatcher, AZ or 85552 or New York"
                        className={`w-full px-3 py-2 border ${locationError ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-2 ${locationError ? 'focus:ring-red-500' : 'focus:ring-blue-500'} bg-white dark:bg-gray-700`}
                      />
                      {isValidatingLocation && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (!locationInput.trim()) {
                          setLocationError("Please enter a location");
                          return;
                        }
                        
                        setIsValidatingLocation(true);
                        setLocationError(null);
                        
                        try {
                          // Try to fetch weather for this location to validate it
                          await fetchWeather(locationInput, settings.weatherApiKey);
                          
                          // If successful, update the settings
                          updateSettings({ 
                            weatherLocation: locationInput,
                            weatherLastUpdated: new Date().toISOString() 
                          });
                          
                          // Show success notification
                          alert("Weather location updated successfully!");
                        } catch (error) {
                          // If error, show validation error
                          setLocationError("Could not find this location. Please check spelling or try another nearby city.");
                        } finally {
                          setIsValidatingLocation(false);
                        }
                      }}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                      disabled={isValidatingLocation}
                    >
                      {isValidatingLocation ? (
                        <span className="flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Checking
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Search size={16} className="mr-1" />
                          Update
                        </span>
                      )}
                    </button>
                  </div>
                  {locationError ? (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                      {locationError}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Enter a city name or US ZIP code for accurate weather information. Currently set to: <span className="font-medium text-blue-500 dark:text-blue-400">{settings.weatherLocation}</span>
                      {settings.weatherLastUpdated && (
                        <span className="block text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Last updated: {new Date(settings.weatherLastUpdated).toLocaleString()}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Rewards System */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Rewards System</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.showRewards}
                  onChange={() => updateSettings({ showRewards: !settings.showRewards })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enable to track chore completion and display rewards
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThemeButtonProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

function ThemeButton({ label, icon, isSelected, onClick }: ThemeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
        isSelected
          ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/50 dark:border-blue-500 dark:text-blue-300'
          : 'bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
