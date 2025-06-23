import { v4 as uuidv4 } from 'uuid';
import localDataService from './services/localDataService';

// Clear all existing data
export const clearAllData = (): void => {
  localStorage.clear();
  window.location.reload(); // Refresh to re-initialize
};

// Initialize with test data
export const initializeTestData = (): void => {
  // Clear existing data
  localStorage.clear();
  
  // Re-initialize default data structures
  require('./services/localDataService');
  
  // Create test family members
  const familyMembers = [
    { id: uuidv4(), name: 'Alex Johnson', color: '#3b82f6', email: 'alex@example.com' },
    { id: uuidv4(), name: 'Jamie Smith', color: '#10b981', email: 'jamie@example.com' },
    { id: uuidv4(), name: 'Taylor Wilson', color: '#f59e0b', email: 'taylor@example.com' },
    { id: uuidv4(), name: 'Jordan Lee', color: '#8b5cf6', email: 'jordan@example.com' },
  ];
  
  // Save family members and get their IDs
  const memberIds = familyMembers.map(member => {
    const savedMember = localDataService.saveFamilyMember(member);
    return savedMember.id;
  });
  
  // Create test chores
  const chores = [
    {
      title: 'Vacuum Living Room',
      description: 'Vacuum all carpets and mop hard floors',
      assignedTo: [memberIds[0], memberIds[1]],
      isRotating: true,
      frequency: 'weekly',
      rotationFrequency: 'weekly',
      rotationDay: 1, // Monday
      timeOfDay: 'evening',
      completed: {},
      starValue: 3
    },
    {
      title: 'Take Out Trash',
      description: 'Take all trash to the bins outside',
      assignedTo: [memberIds[2]],
      isRotating: true,
      frequency: 'weekly',
      rotationDay: 3, // Wednesday
      timeOfDay: 'evening',
      completed: {},
      starValue: 2
    },
    {
      title: 'Clean Bathroom',
      description: 'Clean sink, toilet, and shower',
      assignedTo: [memberIds[3]],
      isRotating: true,
      frequency: 'weekly',
      rotationDay: 5, // Friday
      timeOfDay: 'morning',
      completed: {},
      starValue: 4
    }
  ];
  
  // Save chores
  chores.forEach(chore => localDataService.saveChore(chore));
  
  // Create test lists
  const shoppingList = localDataService.saveList({
    title: 'Grocery List',
    items: [
      { id: uuidv4(), text: 'Milk', completed: false },
      { id: uuidv4(), text: 'Eggs', completed: true },
      { id: uuidv4(), text: 'Bread', completed: false },
      { id: uuidv4(), text: 'Fruits', completed: false },
    ]
  });
  
  const packingList = localDataService.saveList({
    title: 'Weekend Trip',
    items: [
      { id: uuidv4(), text: 'Toothbrush', completed: false },
      { id: uuidv4(), text: 'Phone charger', completed: true },
      { id: uuidv4(), text: 'Swimsuit', completed: false },
    ]
  });
  
  // Create test calendar events
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const events = [
    {
      title: 'Family Dinner',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0).toISOString(),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 30).toISOString(),
      allDay: false,
      memberId: memberIds[0],
      color: '#3b82f6',
      eventType: 'FamilyTime'
    },
    {
      title: 'Dentist Appointment',
      start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0).toISOString(),
      end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0).toISOString(),
      allDay: false,
      memberId: memberIds[1],
      color: '#10b981',
      eventType: 'Appointment',
      location: 'Main Street Dental'
    },
    {
      title: 'Soccer Game',
      start: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 15, 0).toISOString(),
      end: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 16, 30).toISOString(),
      allDay: false,
      memberId: memberIds[2],
      color: '#f59e0b',
      eventType: 'Sports',
      location: 'City Park',
      isRecurring: true,
      recurrencePattern: 'weekly',
      recurrenceInterval: 1
    }
  ];
  
  // Save events
  events.forEach(event => localDataService.saveCalendarEvent(event));
  
  // Set some app settings
  localDataService.saveAppSettings({
    theme: 'light',
    showWeather: true,
    weatherLocation: 'New York, NY'
  });
  
  console.log('Test data initialized successfully!');
  window.location.reload(); // Refresh to see the changes
};

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).testUtils = {
    initializeTestData,
    clearAllData,
    dataService: localDataService
  };
}
