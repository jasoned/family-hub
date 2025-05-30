/* ----------------------------------------------------------------
   src/pages/Chores.tsx
----------------------------------------------------------------- */
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

import ChoreForm from '../components/ChoreForm';
import ChoreRow  from '../components/ChoreRow';

import { Plus } from 'lucide-react';   // ⬅️ RotateCcw import removed

export default function Chores() {
  const {
    familyMembers,
    chores,
    addChore,
    updateChore,
    removeChore,
    /* rotateChores –- no longer needed */
    settings,
  } = useAppContext();

  const [isAddingChore, setIsAddingChore] = useState(false);
  const [editingChore, setEditingChore]   = useState<string | null>(null);

  const handleRemoveChore = (id: string) => {
    if (confirm('Are you sure you want to remove this chore?')) {
      removeChore(id);
    }
  };

  /* ------------------------------------------------------------
     render
  ------------------------------------------------------------- */
  return (
    <div className="p-6 md:p-8">
      {/* header / buttons --------------------------------------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1
          className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Chores
        </h1>

        <div className="flex space-x-2 mt-2 md:mt-0">
          {/* Rotate button removed – auto-rotation is handled in context */}

          <button
            onClick={() => setIsAddingChore(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={familyMembers.length === 0}
          >
            <Plus size={18} />
            <span>Add Chore</span>
          </button>
        </div>
      </div>

      {/* modal: add chore --------------------------------------------- */}
      {isAddingChore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
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

      {/* modal: edit chore -------------------------------------------- */}
      {editingChore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <ChoreForm
            chore={chores.find((c) => c.id === editingChore)}
            familyMembers={familyMembers}
            onSubmit={(chore) => {
              updateChore(editingChore, chore);
              setEditingChore(null);
            }}
            onCancel={() => setEditingChore(null)}
          />
        </div>
      )}

      {/* empty-state handlers ----------------------------------------- */}
      {familyMembers.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
          <p className="text-yellow-700 dark:text-yellow-300 mb-2">
            You need to add family members first
          </p>
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
        /* main table -------------------------------------------------- */
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
                {chores.map((c) => (
                  <ChoreRow
                    key={c.id}
                    chore={c}
                    familyMembers={familyMembers}
                    settings={settings}
                    onEdit={() => setEditingChore(c.id)}
                    onDelete={() => handleRemoveChore(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
