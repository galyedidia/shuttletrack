
import type { Athlete, Group, Coach, AbsenceReason, TrainingSession, AttendanceRecord } from '@/types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, writeBatch, deleteDoc, startAt, endAt, orderBy } from 'firebase/firestore';


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

// --- Coach Management ---
export async function addCoach(firstName: string, lastName: string, phone: string): Promise<Coach> {
    // Check for uniqueness
    const q = query(collection(db, "coaches"), where("phone", "==", phone));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        throw new Error("A coach with this phone number already exists.");
    }
    
    const docRef = await addDoc(collection(db, 'coaches'), { firstName, lastName, phone });
    return { id: docRef.id, firstName, lastName, phone };
}

export async function updateCoach(id: string, data: Partial<Pick<Coach, 'firstName' | 'lastName' | 'phone'>>): Promise<void> {
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


// --- Database Seeding Utilities ---

export async function seedAthletes() {
    const groups = await getGroups();
    if (groups.length === 0) {
        throw new Error("Please create at least one group before seeding athletes.");
    }

    const athletesToAdd = [
        { firstName: "יובל", lastName: "כהן", phone: "050-1234501" },
        { firstName: "נועה", lastName: "לוי", phone: "050-1234502" },
        { firstName: "איתי", lastName: "מזרחי", phone: "050-1234503" },
        { firstName: "מאיה", lastName: "פרץ", phone: "050-1234504" },
        { firstName: "דניאל", lastName: "ביטון", phone: "050-1234505" },
        { firstName: "תמר", lastName: "דהן", phone: "050-1234506" },
        { firstName: "עומר", lastName: "אברהם", phone: "050-1234507" },
        { firstName: "יעל", lastName: "פרידמן", phone: "050-1234508" },
        { firstName: "אריאל", lastName: "כץ", phone: "050-1234509" },
        { firstName: "שירה", lastName: "חדד", phone: "050-1234510" },
        { firstName: "דוד", lastName: "לוי", phone: "050-1234511" },
        { firstName: "רוני", lastName: "כהן", phone: "050-1234512" },
        { firstName: "אורי", lastName: "מזרחי", phone: "050-1234513" },
        { firstName: "אביגיל", lastName: "פרץ", phone: "050-1234514" },
        { firstName: "איתן", lastName: "ביטון", phone: "050-1234515" },
        { firstName: "ליה", lastName: "דהן", phone: "050-1234516" },
        { firstName: "יונתן", lastName: "אברהם", phone: "050-1234517" },
        { firstName: "מיכאל", lastName: "פרידמן", phone: "050-1234518" },
        { firstName: "אלה", lastName: "כץ", phone: "050-1234519" },
        { firstName: "גיא", lastName: "חדד", phone: "050-1234520" },
    ];

    const batch = writeBatch(db);
    athletesToAdd.forEach((athlete, index) => {
        const groupId = groups[index % groups.length].id;
        const athleteRef = doc(collection(db, 'athletes'));
        batch.set(athleteRef, { ...athlete, groupId });
    });

    await batch.commit();
}


export async function seedDatabaseWithMockData() {
    const batch = writeBatch(db);

    const groups = await getGroups();
    const absenceReasons = await getAbsenceReasons();
    const athletesByGroup: Record<string, Athlete[]> = {};

    for (const group of groups) {
        athletesByGroup[group.id] = await getAthletesInGroup(group.id);
    }
    
    if (groups.length === 0 || absenceReasons.length === 0 || Object.values(athletesByGroup).every(a => a.length === 0)) {
        throw new Error("Not enough base data (groups, athletes, reasons) to seed sessions. Please create some first.");
    }

    const today = new Date();
    const mockComments = ["Great focus today!", "Needs to work on footwork.", "Excellent attitude.", "A bit tired, but pushed through.", "Good progress on serves."];
    
    // Generate data for the last 3 months
    for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
        const date = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        // ~3 sessions per week
        for(let i = 0; i < 12; i++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const sessionDate = new Date(year, month, day);
            const dateString = sessionDate.toISOString().split('T')[0];

            for (const group of groups) {
                if (athletesByGroup[group.id] && athletesByGroup[group.id].length > 0) {
                    
                    const attendance: Record<string, AttendanceRecord> = {};
                    const athletesInGroup = athletesByGroup[group.id];

                    for (const athlete of athletesInGroup) {
                        const isPresent = Math.random() > 0.15; // 85% chance of being present
                        let record: AttendanceRecord = {
                            athleteId: athlete.id,
                            present: isPresent,
                        };

                        if (isPresent) {
                            if (Math.random() > 0.2) { // 80% chance of getting a rating
                                record.rating = Math.floor(Math.random() * 3) + 3; // Rating between 3 and 5
                            }
                            if (Math.random() > 0.6) { // 40% chance of getting a comment
                                record.comment = mockComments[Math.floor(Math.random() * mockComments.length)];
                            }
                        } else {
                            if (absenceReasons.length > 0) {
                                record.absenceReason = absenceReasons[Math.floor(Math.random() * absenceReasons.length)].id;
                            }
                        }
                        attendance[athlete.id] = record;
                    }
                    
                    const newSession: Omit<TrainingSession, 'id'> = {
                        date: dateString,
                        groupId: group.id,
                        attendance,
                    };
                    
                    const sessionRef = doc(collection(db, 'trainingSessions'));
                    batch.set(sessionRef, newSession);
                }
            }
        }
    }

    await batch.commit();
}
