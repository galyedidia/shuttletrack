export interface Athlete {
  id: string;
  name: string;
  phone: string;
}

export interface Group {
  id: string;
  name: string;
  // This will often be an array of athlete IDs in Firestore,
  // but for simplicity in the UI, we might populate it with full Athlete objects.
  athletes: Athlete[] | string[];
}

export interface Coach {
  id: string;
  name: string;
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
}


export interface AbsenceReason {
  id: string;
  label: string;
}
