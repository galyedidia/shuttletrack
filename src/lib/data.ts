

import type { Athlete, Group, Coach, AbsenceReason, TrainingSession, AttendanceRecord } from '@/types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, writeBatch, deleteDoc, startAt, endAt, orderBy, limit } from 'firebase/firestore';


export async function getCoaches(): Promise<Coach[]> {
    const coachesCol = collection(db, 'coaches');
    const snapshot = await getDocs(coachesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
}

export async function hasManagerAccount(): Promise<boolean> {
    const q = query(collection(db, "coaches"), where("role", "==", "manager"), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
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

export async function getAthletes(athleteIds?: string[]): Promise<Athlete[]> {
    const athletesCol = collection(db, 'athletes');
    let q;
    if (athleteIds && athleteIds.length > 0) {
        // Firestore 'in' query is limited to 30 elements. Chunk if necessary.
        const athleteChunks: string[][] = [];
        for (let i = 0; i < athleteIds.length; i += 30) {
            athleteChunks.push(athleteIds.slice(i, i + 30));
        }

        const athletes: Athlete[] = [];
        for (const chunk of athleteChunks) {
            q = query(athletesCol, where( '__name__', 'in', chunk));
            const snapshot = await getDocs(q);
            athletes.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Athlete)));
        }
        return athletes;

    } else {
        q = query(athletesCol);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Athlete));
    }
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
    const reasons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AbsenceReason));
    return reasons.sort((a, b) => a.label.localeCompare(b.label));
}


export async function getTrainingSessions(): Promise<TrainingSession[]> {
    const sessionsCol = collection(db, 'trainingSessions');
    const snapshot = await getDocs(sessionsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingSession));
}


export async function getTrainingSessionsForGroupInMonth(groupId: string, year: number, month: number): Promise<TrainingSession[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    // Get the last day of the given month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const q = query(
        collection(db, 'trainingSessions'),
        where('groupId', '==', groupId),
        orderBy('date'),
        startAt(startDate),
        endAt(endDate)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingSession));
}

export async function getAllCommentsForAthlete(athleteId: string): Promise<{ date: string; comment: string }[]> {
    const q = query(
      collection(db, 'trainingSessions'),
      orderBy(`attendance.${athleteId}.comment`) // This query requires an index.
    );
    // Note: Firestore doesn't allow querying for the existence of a nested field
    // in this way directly. We have to fetch all sessions and filter locally.
    // This is inefficient but is the simplest approach without changing data structure.
    // For a production app, a separate 'comments' collection would be better.
    const snapshot = await getDocs(collection(db, 'trainingSessions'));
    
    const comments: { date: string; comment: string }[] = [];
    
    snapshot.forEach(doc => {
      const session = doc.data() as Omit<TrainingSession, 'id'>;
      const attendanceRecord = session.attendance?.[athleteId];
      if (attendanceRecord && attendanceRecord.comment) {
        comments.push({
          date: session.date,
          comment: attendanceRecord.comment
        });
      }
    });

    // Sort by date descending
    return comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


export async function getTrainingSessionById(id: string): Promise<{
    sessionData: (TrainingSession & { group: Group | null }) | null,
    athletesData: Athlete[],
    reasonsData: AbsenceReason[],
}> {
    const sessionRef = doc(db, 'trainingSessions', id);
    const docSnap = await getDoc(sessionRef);

    if (!docSnap.exists()) {
        return { sessionData: null, athletesData: [], reasonsData: [] };
    }
    
    const sessionData = { id: docSnap.id, ...docSnap.data() } as TrainingSession;
    const athleteIds = Object.keys(sessionData.attendance || {});

    const [groupData, athletesData, reasonsData] = await Promise.all([
        getGroupById(sessionData.groupId),
        athleteIds.length > 0 ? getAthletes(athleteIds) : Promise.resolve([]),
        getAbsenceReasons(),
    ]);

    return {
        sessionData: { ...sessionData, group: groupData },
        athletesData,
        reasonsData
    };
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

export async function deleteTrainingSession(sessionId: string): Promise<void> {
    const sessionRef = doc(db, 'trainingSessions', sessionId);
    await deleteDoc(sessionRef);
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
export async function addAthlete(firstName: string, lastName: string, phone: string, groupId: string): Promise<Athlete> {
    const docRef = await addDoc(collection(db, 'athletes'), { firstName, lastName, phone, groupId });
    return { id: docRef.id, firstName, lastName, phone, groupId };
}

export async function updateAthlete(id: string, data: Partial<Pick<Athlete, 'firstName' | 'lastName' | 'phone' | 'groupId'>>): Promise<void> {
    const athleteRef = doc(db, 'athletes', id);
    await updateDoc(athleteRef, data);
}

export async function deleteAthlete(id: string): Promise<void> {
    const athleteRef = doc(db, 'athletes', id);
    await deleteDoc(athleteRef);
}

// --- Coach / User Management ---
export async function addCoach(firstName: string, lastName: string, phone: string, role: 'manager' | 'coach'): Promise<Coach> {
    // Check for uniqueness
    const q = query(collection(db, "coaches"), where("phone", "==", phone));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        throw new Error("A coach with this phone number already exists.");
    }
    
    const docRef = await addDoc(collection(db, 'coaches'), { firstName, lastName, phone, role });
    return { id: docRef.id, firstName, lastName, phone, role };
}

export async function updateCoach(id: string, data: Partial<Pick<Coach, 'firstName' | 'lastName' | 'phone' | 'role'>>): Promise<void> {
    const coachRef = doc(db, 'coaches', id);
    await updateDoc(coachRef, data);
}

export async function deleteCoach(id: string): Promise<void> {
    const coachRef = doc(db, 'coaches', id);
    await deleteDoc(coachRef);
}

// --- Absence Reason Management ---
export async function addAbsenceReason(label: string): Promise<AbsenceReason> {
    const docRef = await addDoc(collection(db, 'absenceReasons'), { label });
    return { id: docRef.id, label };
}

export async function updateAbsenceReason(id: string, label: string): Promise<void> {
    const reasonRef = doc(db, 'absenceReasons', id);
    await updateDoc(reasonRef, { label });
}

export async function deleteAbsenceReason(id: string): Promise<void> {
    const reasonRef = doc(db, 'absenceReasons', id);
    await deleteDoc(reasonRef);
}

    