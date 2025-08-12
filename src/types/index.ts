export interface Athlete {
  id: string;
  name: string;
  phone: string;
}

export interface Group {
  id: string;
  name: string;
  athletes: Athlete[];
}

export interface Coach {
  id: string;
  name: string;
}

export interface AttendanceRecord {
  athleteId: string;
  date: string; // YYYY-MM-DD
  present: boolean;
  absenceReason?: 'vacation' | 'injury' | 'illness' | 'other' | string;
  rating?: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface AbsenceReason {
  id: string;
  label: string;
}
