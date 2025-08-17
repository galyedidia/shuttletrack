import type { Athlete, Group, Coach, AbsenceReason, TrainingSession } from '@/types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

// Note: The functions below are simplified for the prototype.
// In a real-world scenario, you'd have more robust error handling,
// data validation (e.g., using Zod), and potentially data transformation.

export async function getCoaches(): Promise<Coach[]> {
    const coachesCol = collection(db, 'coaches');
    const snapshot = await getDocs(coachesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
}

export async function getCoachByPhone(phone: string): Promise<Coach | null> {
    const q = query(collection(db, "coaches"), where("phone", "==", phone));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Coach;
}


export async function getAthletes(): Promise<Athlete[]> {
    const athletesCol = collection(db, 'athletes');
    const snapshot = await getDocs(athletesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Athlete));
}

export async function getGroups(): Promise<Group[]> {
    const groupsCol = collection(db, 'groups');
    const snapshot = await getDocs(groupsCol);
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    
    // In a real app, athlete data would be linked by reference.
    // For this prototype, we will assume athlete details are embedded or we fetch them separately if needed.
    // This simplified version just returns the group structure.
    // A more complex implementation would fetch athlete objects based on an array of IDs.
    return groups;
}

export async function getAbsenceReasons(): Promise<AbsenceReason[]> {
    const reasonsCol = collection(db, 'absenceReasons');
    const snapshot = await getDocs(reasonsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AbsenceReason));
}

export async function getTrainingSessions(): Promise<TrainingSession[]> {
    const sessionsCol = collection(db, 'trainingSessions');
    const snapshot = await getDocs(sessionsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingSession));
}

export async function getTrainingSessionById(id: string): Promise<TrainingSession | null> {
    const sessionRef = doc(db, 'trainingSessions', id);
    const docSnap = await getDoc(sessionRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as TrainingSession;
    } else {
        return null;
    }
}

// --- Hardcoded data for features not yet migrated ---

// This will be replaced by a fetch from Firestore as well.
export const absenceReasons: AbsenceReason[] = [
  { id: 'r1', label: 'חופשה' },
  { id: 'r2', label: 'פציעה' },
  { id: 'r3', label: 'מחלה' },
  { id: 'r4', label: 'אחר' },
];
