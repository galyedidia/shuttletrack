import type { Athlete, Group, Coach, AbsenceReason, TrainingSession } from '@/types';

export const athletes: Athlete[] = [
  { id: '1', name: 'ישראל ישראלי', phone: '050-1234567' },
  { id: '2', name: 'משה כהן', phone: '052-7654321' },
  { id: '3', name: 'יוסי לוי', phone: '054-1122334' },
  { id: '4', name: 'דנה שמש', phone: '053-5566778' },
  { id: '5', name: 'אביגיל אביגיל', phone: '058-8899001' },
  { id: '6', name: 'נעה כוכבי', phone: '055-2233445' },
];

export const groups: Group[] = [
  {
    id: 'g1',
    name: 'קבוצת מתחילים',
    athletes: [athletes[0], athletes[2], athletes[4]],
  },
  {
    id: 'g2',
    name: 'קבוצת מתקדמים',
    athletes: [athletes[1], athletes[3], athletes[5]],
  },
  {
    id: 'g3',
    name: 'נבחרת הנוער',
    athletes: [athletes[0], athletes[1], athletes[3], athletes[5]],
  },
];

export const coaches: Coach[] = [
  { id: 'c1', name: 'מאמן ראשי' },
  { id: 'c2', name: 'עוזר מאמן' },
];

export const absenceReasons: AbsenceReason[] = [
  { id: 'r1', label: 'חופשה' },
  { id: 'r2', label: 'פציעה' },
  { id: 'r3', label: 'מחלה' },
  { id: 'r4', label: 'אחר' },
];

// Mock Training Sessions
export const trainingSessions: TrainingSession[] = [
    {
        id: 'ts1',
        date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], // Yesterday
        groupId: 'g1',
        attendance: {
            '1': { athleteId: '1', present: true, rating: 4, comment: 'עבודה טובה על חבטות גב יד' },
            '3': { athleteId: '3', present: false, absenceReason: 'r3' },
            '5': { athleteId: '5', present: true, rating: 5, comment: 'ריכוז גבוה, כל הכבוד' },
        }
    },
    {
        id: 'ts2',
        date: new Date().toISOString().split('T')[0], // Today
        groupId: 'g2',
        attendance: {}
    }
];
