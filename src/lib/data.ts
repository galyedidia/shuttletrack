
import type { Athlete, Group, Coach, AbsenceReason, TrainingSession, AttendanceRecord } from '@/types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';


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
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Coach;
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
    // Sort groups by name alphabetically
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    return groups.sort((a, b) => a.name.localeCompare(b.name));
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

// --- Group Management ---
export async function addGroup(name: string): Promise<Group> {
    const docRef = await addDoc(collection(db, 'groups'), { name });
    return { id: docRef.id, name };
}

export async function updateGroup(id: string, name: string): Promise<void> {
    const groupRef = doc(db, 'groups', id);
    await updateDoc(groupRef, { name });
}

export async function deleteGroup(id: string): Promise<void> {
    // TODO: Decide on what to do with athletes in the group. For now, just delete the group.
    const groupRef = doc(db, 'groups', id);
    await deleteDoc(groupRef);
}


// --- Athlete Management ---
export async function addAthlete(name: string, phone: string, groupId: string): Promise<Athlete> {
    const docRef = await addDoc(collection(db, 'athletes'), { name, phone, groupId });
    return { id: docRef.id, name, phone, groupId };
}

export async function updateAthlete(id: string, data: Partial<Pick<Athlete, 'name' | 'phone' | 'groupId'>>): Promise<void> {
    const athleteRef = doc(db, 'athletes', id);
    await updateDoc(athleteRef, data);
}

export async function deleteAthlete(id: string): Promise<void> {
    const athleteRef = doc(db, 'athletes', id);
    await deleteDoc(athleteRef);
}
