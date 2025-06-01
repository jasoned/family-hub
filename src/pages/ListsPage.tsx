import React, { useState } from 'react'; // Keep React for useState
import { useAppContext } from '../context/AppContext';
// Removed Save, Check
import { List as ListIcon, Plus, Trash2, Edit3, CheckSquare, Square, X } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { List as ListType, ListItem } from '../types';

export default function ListsPage() {
  const {
    lists,
    addList,
    removeList,
    updateList,
    addListItem,
    updateListItem,
    removeListItem,
    toggleListItemCompletion,
  } = useAppContext();

  const [newListName, setNewListName] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState('');

  const [editingListItemId, setEditingListItemId] = useState<string | null>(null);
  const [editingListItemText, setEditingListItemText] = useState('');

  const handleAddNewList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await addList({ title: newListName.trim() });
    setNewListName('');
  };

  const handleRemoveList = async (listId: string) => {
    if (window.confirm('Are you sure you want to delete this list and all its items?')) {
      await removeList(listId);
    }
  };

  const handleStartEditList = (list: ListType) => {
    setEditingListId(list.id);
    setEditingListTitle(list.title);
  };

  const handleCancelEditList = () => {
    setEditingListId(null);
    setEditingListTitle('');
  };

  const handleSaveListTitle = async (listId: string) => {
    if (!editingListTitle.trim()) { // If empty, cancel edit
        handleCancelEditList();
        return;
    }
    await updateList(listId, { title: editingListTitle.trim() });
    setEditingListId(null);
    setEditingListTitle('');
  };

  const handleNewItemTextChange = (listId: string, text: string) => {
    setNewItemTexts(prev => ({ ...prev, [listId]: text }));
  };

  const handleAddNewListItem = async (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    const text = newItemTexts[listId]?.trim();
    if (!text) return;
    const currentList = lists.find(l => l.id === listId);
    const newPosition = currentList ? currentList.items.length : 0;
    await addListItem(listId, { text, position: newPosition });
    setNewItemTexts(prev => ({ ...prev, [listId]: '' }));
  };

  const handleToggleListItem = async (itemId: string, currentStatus: boolean) => {
    await toggleListItemCompletion(itemId, currentStatus);
  };

  const handleRemoveListItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await removeListItem(itemId);
    }
  };
  
  const handleStartEditListItem = (item: ListItem) => {
    setEditingListItemId(item.id);
    setEditingListItemText(item.text);
  };

  const handleCancelEditListItem = () => {
    setEditingListItemId(null);
    setEditingListItemText('');
  };

  const handleSaveListItemText = async (itemId: string) => {
    if (!editingListItemText.trim()) { // if empty, maybe delete or just cancel
        const originalItem = lists.flatMap(l => l.items).find(i => i.id === itemId);
        if (originalItem) setEditingListItemText(originalItem.text); // revert if needed, or handle delete
        handleCancelEditListItem();
        return;
    }
    await updateListItem(itemId, { text: editingListItemText.trim() });
    setEditingListItemId(null);
    setEditingListItemText('');
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1
          className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <ListIcon size={30} className="mr-3 text-indigo-500" />
          Lists
        </h1>
        <form onSubmit={handleAddNewList} className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto md:min-w-[300px]">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New list name..."
            className="input flex-grow"
          />
          <button
            type="submit"
            className="btn-primary flex items-center"
            disabled={!newListName.trim()}
          >
            <Plus size={18} className="mr-1" /> Add List
          </button>
        </form>
      </div>

      <AnimatePresence>
        {lists.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-slate-500 dark:text-slate-400 py-10"
          >
            No lists yet. Create one to get started!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        {lists.map((list) => (
          <motion.div
            key={list.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="card p-5 flex flex-col" // bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-100 dark:border-slate-800
          >
            {editingListId === list.id ? (
              <div className="mb-3">
                <input
                  type="text"
                  value={editingListTitle}
                  onChange={(e) => setEditingListTitle(e.target.value)}
                  onBlur={() => handleSaveListTitle(list.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveListTitle(list.id); if (e.key === 'Escape') handleCancelEditList(); }}
                  className="input text-lg font-semibold mb-2 py-1.5" // Adjusted padding
                  autoFocus
                />
                <div className="flex gap-2">
                    <button onClick={() => handleSaveListTitle(list.id)} className="btn-secondary py-1 px-2 text-xs">Save</button>
                    <button onClick={handleCancelEditList} className="btn-secondary py-1 px-2 text-xs bg-slate-200 dark:bg-slate-700">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-3 group">
                <h2 
                    className="text-xl font-semibold text-slate-800 dark:text-white flex-grow truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400" 
                    title={list.title}
                    onClick={() => handleStartEditList(list)}
                >
                  {list.title}
                </h2>
                <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleStartEditList(list)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Edit list name"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button
                        onClick={() => handleRemoveList(list.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Delete list"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            )}
            
            <div className="space-y-2 mb-4 flex-grow min-h-[60px]">
              {list.items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors group ${item.completed ? 'bg-green-50 dark:bg-green-800/30 opacity-70' : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}
                >
                  <button onClick={() => handleToggleListItem(item.id, item.completed)} title={item.completed ? "Mark as incomplete" : "Mark as complete"}>
                    {item.completed ? <CheckSquare size={20} className="text-green-600 dark:text-green-400" /> : <Square size={20} className="text-slate-400 dark:text-slate-500" />}
                  </button>
                  
                  {editingListItemId === item.id ? (
                    <input
                        type="text"
                        value={editingListItemText}
                        onChange={(e) => setEditingListItemText(e.target.value)}
                        onBlur={() => handleSaveListItemText(item.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveListItemText(item.id); if (e.key === 'Escape') handleCancelEditListItem(); }}
                        className={`input flex-grow text-sm py-1 ${item.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}
                        autoFocus
                    />
                  ) : (
                    <span
                        onClick={() => handleStartEditListItem(item)}
                        className={`flex-grow cursor-pointer text-sm ${item.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}
                    >
                      {item.text}
                    </span>
                  )}

                  <button
                    onClick={() => handleRemoveListItem(item.id)}
                    className="ml-auto p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-100/50 dark:hover:bg-red-900/30"
                    title="Delete item"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
              {list.items.length === 0 && (
                <p className="text-xs text-center text-slate-400 dark:text-slate-500 py-2">No items in this list yet.</p>
              )}
            </div>

            <form onSubmit={(e) => handleAddNewListItem(e, list.id)} className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-200 dark:border-slate-700/50">
              <input
                type="text"
                value={newItemTexts[list.id] || ''}
                onChange={(e) => handleNewItemTextChange(list.id, e.target.value)}
                placeholder="Add new item..."
                className="input flex-grow py-1.5 text-sm"
              />
              <button
                type="submit"
                className="btn-secondary p-2" // Or btn-primary
                disabled={!(newItemTexts[list.id]?.trim())}
                title="Add item"
              >
                <Plus size={16} />
              </button>
            </form>
          </motion.div>
        ))}
      </div>
    </div>
  );
}