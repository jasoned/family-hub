import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ChoreForm from '../components/ChoreForm';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';

export default function Chores() {
  const { familyMembers, chores, addChore, updateChore, removeChore, rotateChores, settings } = useAppContext();
  const [isAddingChore, setIsAddingChore] = useState(false);
  const [editingChore, setEditingChore] = useState<string | null>(null);
  
  const handleRemoveChore = (id: string) => {
    if (confirm('Are you sure you want to remove this chore?')) {
      removeChore(id);
    }
  };
  
  // Get assigned members for a chore
  const getAssignedMembers = (choreId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return [];
    
    return familyMembers.filter(member => chore.assignedTo.includes(member.id));
  };
  
  // Format frequency for display
  const formatFrequency = (chore: any) => {
    switch (chore.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        if (!chore.daysOfWeek || chore.daysOfWeek.length === 0) return 'Weekly';
        if (chore.daysOfWeek.length === 7) return 'Every day';
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = chore.daysOfWeek.map((day: number) => days[day]);
        
        if (selectedDays.length <= 2) return selectedDays.join(' & ');
        return selectedDays.join(', ');
        
      case 'monthly':
        return `Monthly (Day ${chore.dayOfMonth})`;
      case 'once':
        return 'One-time';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Chores
        </h1>
        
        <div className="flex space-x-2 mt-2 md:mt-0">
          <button
            onClick={rotateChores}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <RotateCcw size={18} />
            <span>Rotate</span>
          </button>
          
          <button
            onClick={() => setIsAddingChore(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={familyMembers.length === 0}
          >
            <Plus size={18} />
            <span>Add Chore</span>
          </button>
        </div>
      </div>
      
      {isAddingChore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <ChoreForm
            familyMembers={familyMembers}
            onSubmit={(chore) => {
              addChore(chore);
              setIsAddingChore(false);
            }}
            onCancel={() => setIsAddingChore(false)}
          />
        </div>
      )}
      
      {editingChore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <ChoreForm
            chore={chores.find(c => c.id === editingChore)}
            familyMembers={familyMembers}
            onSubmit={(chore) => {
              updateChore(editingChore, chore);
              setEditingChore(null);
            }}
            onCancel={() => setEditingChore(null)}
          />
        </div>
      )}
      
      {familyMembers.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
          <p className="text-yellow-700 dark:text-yellow-300 mb-2">You need to add family members first</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Go to the Family Members page to add people to your family.
          </p>
        </div>
      ) : chores.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">No chores added yet</p>
          <button
            onClick={() => setIsAddingChore(true)}
            className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            <span>Add Your First Chore</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-50 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Chore
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rotation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {chores.map(chore => (
                  <tr key={chore.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {chore.title}
                      </div>
                      {chore.timeOfDay && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {chore.timeOfDay.charAt(0).toUpperCase() + chore.timeOfDay.slice(1)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {getAssignedMembers(chore.id).map((member, index) => {
                          const isCurrentlyAssigned = chore.isRotating && index === 0;
                          return (
                            <div 
                              key={member.id}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                                isCurrentlyAssigned ? 'ring-2 ring-green-500 ring-offset-1 dark:ring-offset-gray-800' : ''
                              }`}
                              style={{ backgroundColor: member.color }}
                              title={`${member.name}${isCurrentlyAssigned ? ' (Currently Assigned)' : ''}`}
                            >
                              {member.initial}
                            </div>
                          );
                        })}
                        {chore.isRotating && getAssignedMembers(chore.id).length > 1 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 ml-1 flex items-center">
                            <span className="ml-1">→ Rotates</span>
                          </div>
                        )}
                      </div>
                      {chore.isRotating && getAssignedMembers(chore.id).length > 0 && (
                        <div className="mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Currently: {getAssignedMembers(chore.id)[0]?.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFrequency(chore)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {chore.isRotating ? (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Rotating
                          </span>
                          <div className="mt-1 flex items-center">
                            <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                              {chore.rotationFrequency ? 
                                chore.rotationFrequency === 'daily' ? 'Daily' : 
                                chore.rotationFrequency === 'weekly' ? `Weekly (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][chore.rotationDay || 0]})` : 
                                `Monthly (Day ${chore.rotationDay})` : 
                                settings.autoRotateChores ? 'Auto' : 'Manual'
                              }
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingChore(chore.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleRemoveChore(chore.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
