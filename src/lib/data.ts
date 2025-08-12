import type { Athlete, Group, Coach, AbsenceReason } from '@/types';

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
