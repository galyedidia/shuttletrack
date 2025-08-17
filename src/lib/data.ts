
import type { Athlete, Group, Coach, AbsenceReason, TrainingSession, AttendanceRecord } from '@/types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, writeBatch } from 'firebase/firestore';


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

export async function getAthletesInGroup(groupId: string): Promise<Athlete[]> {
    const q = query(collection(db, "athletes"), where("groupId", "==", groupId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Athlete));
}


export async function getGroups(): Promise<Group[]> {
    const groupsCol = collection(db, 'groups');
    const snapshot = await getDocs(groupsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
}

export async function getGroupById(id: string): Promise<Group | null> {
    const groupRef = doc(db, 'groups', id);
    const docSnap = await getDoc(groupRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Group;
    } else {
        return null;
    }
}


export async function getAbsenceReasons(): Promise<AbsenceReason[]> {
    const reasonsCol = collection(db, 'absenceReasons');
    const snapshot = await getDocs(reasonsCol);
    if (snapshot.empty) {
        // Create default reasons if none exist
        const defaultReasons = [
            { label: 'חופשה' },
            { label: 'פציעה' },
            { label: 'מחלה' },
            { label: 'אחר' },
        ];
        const batch = writeBatch(db);
        defaultReasons.forEach(reason => {
            const docRef = doc(collection(db, "absenceReasons"));
            batch.set(docRef, reason);
        });
        await batch.commit();
        // Refetch after creation
        const newSnapshot = await getDocs(reasonsCol);
        return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AbsenceReason));
    }
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

// --- WRITE OPERATIONS ---

export async function addTrainingSession(session: Omit<TrainingSession, 'id'>): Promise<TrainingSession> {
    const docRef = await addDoc(collection(db, 'trainingSessions'), session);
    return { id: docRef.id, ...session };
}

export async function updateAttendance(sessionId: string, attendance: Record<string, AttendanceRecord>): Promise<void> {
    const sessionRef = doc(db, 'trainingSessions', sessionId);
    await updateDoc(sessionRef, { attendance });
}
