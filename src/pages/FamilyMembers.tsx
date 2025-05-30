import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import FamilyMemberForm from '../components/FamilyMemberForm';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export default function FamilyMembers() {
  const { familyMembers, addFamilyMember, updateFamilyMember, removeFamilyMember } =
    useAppContext();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);

  const handleRemoveMember = (id: string) => {
    if (
      confirm(
        'Are you sure you want to remove this family member? This will also remove their assigned chores.',
      )
    ) {
      removeFamilyMember(id);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1
          className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Family Members
        </h1>

        <button
          onClick={() => setIsAddingMember(true)}
          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          <span>Add Member</span>
        </button>
      </div>

      {isAddingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <FamilyMemberForm
            onSubmit={(member) => {
              addFamilyMember(member);
              setIsAddingMember(false);
            }}
            onCancel={() => setIsAddingMember(false)}
          />
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <FamilyMemberForm
            member={familyMembers.find((m) => m.id === editingMember)}
            onSubmit={(member) => {
              updateFamilyMember(editingMember, member);
              setEditingMember(null);
            }}
            onCancel={() => setEditingMember(null)}
          />
        </div>
      )}

      {familyMembers.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">No family members added yet</p>
          <button
            onClick={() => setIsAddingMember(true)}
            className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            <span>Add Your First Family Member</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center justify-between border border-gray-50 dark:border-gray-700"
            >
              <div className="flex items-center">
                <div
                  className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white text-lg"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initial}
                </div>
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                </div>
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={() => setEditingMember(member.id)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
