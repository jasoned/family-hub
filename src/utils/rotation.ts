// src/utils/rotation.ts
import { Chore } from '../types';

/**
 * Quick utility to test if two dates fall on the same *calendar* day
 */
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Decide whether the given chore should rotate *today*.
 * – It only returns true once per day per chore.
 * – If the chore isn't configured for rotation it returns false.
 */
export function shouldRotate(chore: Chore): boolean {
  if (!chore.isRotating || !chore.assignedTo?.length) return false;

  const today = new Date();
  const last = chore.lastRotated ? new Date(chore.lastRotated) : new Date(0);

  switch (chore.rotationFrequency) {
    case 'daily':
      return !isSameDay(today, last);

    case 'weekly': {
      const targetDow = chore.rotationDay ?? 0; // default Sunday
      return (
        today.getDay() === targetDow &&           // today is the right weekday
        !isSameDay(today, last)                   // …and we haven’t rotated yet today
      );
    }

    case 'monthly': {
      const targetDom = chore.rotationDay ?? 1;   // default 1st
      return (
        today.getDate() === targetDom &&          // today is the right day-of-month
        !isSameDay(today, last)
      );
    }

    default:
      // Undefined rotationFrequency → use global setting elsewhere.
      // We'll treat that like "daily".
      return !isSameDay(today, last);
  }
}
