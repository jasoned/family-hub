import { useState } from 'react';
import { SubChore, FamilyMember } from '../types';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface SubChoreManagerProps {
  subChores: SubChore[];
  familyMembers: FamilyMember[];
  onSubChoresChange: (subChores: SubChore[]) => void;
}

export default function SubChoreManager({ 
  subChores = [], 
  familyMembers, 
  onSubChoresChange 
}: SubChoreManagerProps) {
  const [newSubChoreTitle, setNewSubChoreTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleAddSubChore = () => {
    if (!newSubChoreTitle.trim()) return;
    
    const newSubChore: SubChore = {
      id: uuidv4(),
      title: newSubChoreTitle.trim(),
      completed: false,
      assignedTo: [],
      createdAt: new Date().toISOString(),
    };

    onSubChoresChange([...subChores, newSubChore]);
    setNewSubChoreTitle('');
  };

  const handleDeleteSubChore = (id: string) => {
    onSubChoresChange(subChores.filter(sc => sc.id !== id));
  };

  const toggleSubChoreComplete = (id: string) => {
    onSubChoresChange(subChores.map(sc => 
      sc.id === id 
        ? { ...sc, completed: !sc.completed, updatedAt: new Date().toISOString() } 
        : sc
    ));
  };

  const startEditing = (subChore: SubChore) => {
    setEditingId(subChore.id);
    setEditTitle(subChore.title);
  };

  const saveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    
    onSubChoresChange(subChores.map(sc => 
      sc.id === id 
        ? { ...sc, title: editTitle.trim(), updatedAt: new Date().toISOString() } 
        : sc
    ));
    
    setEditingId(null);
    setEditTitle('');
  };

  const toggleAssignee = (subChoreId: string, memberId: string) => {
    onSubChoresChange(subChores.map(sc => {
      if (sc.id !== subChoreId) return sc;
      
      const isAssigned = sc.assignedTo.includes(memberId);
      return {
        ...sc,
        assignedTo: isAssigned 
          ? sc.assignedTo.filter(id => id !== memberId)
          : [...sc.assignedTo, memberId],
        updatedAt: new Date().toISOString()
      };
    }));
  };

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
        Sub-tasks
      </h4>
      
      <div className="space-y-2 mb-4">
        {subChores.map((subChore) => (
          <div 
            key={subChore.id}
            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
          >
            <div className="flex items-center flex-1">
              <button
                onClick={() => toggleSubChoreComplete(subChore.id)}
                className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                  subChore.completed 
                    ? 'bg-green-500 text-white' 
                    : 'border-2 border-gray-300 dark:border-slate-600'
                }`}
              >
                {subChore.completed && <Check size={12} />}
              </button>
              
              {editingId === subChore.id ? (
                <div className="flex-1 flex items-center">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 bg-transparent border-b border-blue-400 px-1 py-0.5 text-sm focus:outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => saveEdit(subChore.id)}
                    className="ml-2 text-green-500 hover:text-green-600"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => setEditingId(null)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div 
                  className={`flex-1 text-sm ${
                    subChore.completed 
                      ? 'line-through text-gray-400 dark:text-gray-500' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  onDoubleClick={() => startEditing(subChore)}
                >
                  {subChore.title}
                </div>
              )}
              
              <div className="ml-2 flex space-x-1">
                {familyMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => toggleAssignee(subChore.id, member.id)}
                    className={`w-5 h-5 rounded-full text-[9px] font-semibold flex items-center justify-center ${
                      subChore.assignedTo.includes(member.id)
                        ? 'opacity-100 ring-1 ring-white'
                        : 'opacity-30'
                    }`}
                    style={{ backgroundColor: member.color }}
                    title={member.name}
                  >
                    {member.initial}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => handleDeleteSubChore(subChore.id)}
              className="ml-2 text-gray-400 hover:text-red-500"
              title="Delete sub-task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex mt-2">
        <input
          type="text"
          value={newSubChoreTitle}
          onChange={(e) => setNewSubChoreTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSubChore()}
          placeholder="Add a sub-task..."
          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800"
        />
        <button
          onClick={handleAddSubChore}
          className="px-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
