
export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  groupId: string; // Add groupId to athlete
}

export interface Group {
  id: string;
  name: string;
}

export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AttendanceRecord {
  athleteId: string;
  present: boolean;
  absenceReason?: string;
  rating?: number;
  comment?: string;
}

export interface TrainingSession {
  id: string;
  date: string; // YYYY-MM-DD
  groupId: string;
  attendance: Record<string, AttendanceRecord>;
  createdAt?: string; // ISO string
}


export interface AbsenceReason {
  id: string;
  label: string;
}
