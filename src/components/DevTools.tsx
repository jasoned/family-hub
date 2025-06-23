import React, { useState } from 'react';
import { initializeTestData, clearAllData } from '../testData';
import localDataService from '../services/localDataService';

const DevTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('data');
  const [jsonData, setJsonData] = useState('');
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty');
  const [dataType, setDataType] = useState('familyMembers');

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleLoadTestData = () => {
    if (window.confirm('This will replace all current data with test data. Continue?')) {
      initializeTestData();
    }
  };

  const handleClearData = () => {
    if (window.confirm('This will delete ALL data. Are you sure?')) {
      clearAllData();
    }
  };

  const handleViewData = () => {
    let data;
    switch (dataType) {
      case 'familyMembers':
        data = localDataService.getFamilyMembers();
        break;
      case 'chores':
        data = localDataService.getChores();
        break;
      case 'lists':
        data = localDataService.getLists();
        break;
      case 'calendarEvents':
        data = localDataService.getCalendarEvents();
        break;
      case 'appSettings':
        data = localDataService.getAppSettings();
        break;
      case 'calendarSettings':
        data = localDataService.getCalendarSettings();
        break;
      default:
        data = {};
    }
    
    setJsonData(JSON.stringify(data, null, 2));
  };

  const handleSaveData = () => {
    try {
      const data = JSON.parse(jsonData);
      switch (dataType) {
        case 'familyMembers':
          if (Array.isArray(data)) {
            data.forEach((item: any) => localDataService.saveFamilyMember(item));
          } else {
            localDataService.saveFamilyMember(data);
          }
          break;
        case 'chores':
          if (Array.isArray(data)) {
            data.forEach((item: any) => localDataService.saveChore(item));
          } else {
            localDataService.saveChore(data);
          }
          break;
        // Add other cases as needed
      }
      alert('Data saved successfully!');
    } catch (error) {
      alert('Error saving data: ' + error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-lg w-96 max-h-[80vh] flex flex-col">
          <div className="bg-gray-800 text-white p-2 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">Developer Tools</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          <div className="border-b border-gray-200">
            <button 
              className={`px-4 py-2 ${activeTab === 'data' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              Data Management
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'inspect' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('inspect')}
            >
              Inspect Data
            </button>
          </div>
          
          <div className="p-4 overflow-auto flex-1">
            {activeTab === 'data' ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold mb-2">Test Data</h4>
                  <button
                    onClick={handleLoadTestData}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Load Test Data
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Populate with sample data</p>
                </div>
                
                <div>
                  <h4 className="font-bold mb-2">Danger Zone</h4>
                  <button
                    onClick={handleClearData}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Clear All Data
                  </button>
                  <p className="text-xs text-gray-500 mt-1">This cannot be undone</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <select
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value)}
                    className="border rounded px-2 py-1 text-sm flex-1"
                  >
                    <option value="familyMembers">Family Members</option>
                    <option value="chores">Chores</option>
                    <option value="lists">Lists</option>
                    <option value="calendarEvents">Calendar Events</option>
                    <option value="appSettings">App Settings</option>
                    <option value="calendarSettings">Calendar Settings</option>
                  </select>
                  <button
                    onClick={handleViewData}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    View
                  </button>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'pretty' ? 'raw' : 'pretty')}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    {viewMode === 'pretty' ? 'Raw' : 'Pretty'}
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(jsonData)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                    title="Copy to clipboard"
                  >
                    Copy
                  </button>
                </div>
                
                <div className="border rounded p-2 bg-gray-50 h-64 overflow-auto">
                  {jsonData ? (
                    <pre className="text-xs">
                      {viewMode === 'pretty' ? (
                        <code dangerouslySetInnerHTML={{
                          __html: jsonData
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"(\w+)":/g, '"<span class="text-blue-600">$1</span>":')
                            .replace(/("[^"]*"):/g, '<span class="text-blue-600">$1</span>:')
                            .replace(/"/g, '<span class="text-gray-500">"</span>')
                            .replace(/(true|false|null)/g, '<span class="text-purple-600">$1</span>')
                            .replace(/(\d+)/g, '<span class="text-green-600">$1</span>')
                        }} />
                      ) : (
                        jsonData
                      )}
                    </pre>
                  ) : (
                    <p className="text-gray-400 text-sm">No data to display. Click "View" to load data.</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-bold mb-2">Edit Data</h4>
                  <textarea
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    className="w-full h-32 border rounded p-2 text-xs font-mono"
                    placeholder="Paste JSON data here"
                  />
                  <button
                    onClick={handleSaveData}
                    className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    disabled={!jsonData.trim()}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          title="Developer Tools"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default DevTools;
