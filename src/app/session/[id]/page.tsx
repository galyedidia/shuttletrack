
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getTrainingSessionById, getAbsenceReasons, getAthletesInGroup, getGroupById, updateAttendance } from "@/lib/data";
import type { AttendanceRecord, Athlete, TrainingSession, Group, AbsenceReason } from '@/types';
import { Star, Save, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

const StarRating = ({ rating, setRating, isReadOnly }: { rating: number, setRating: (rating: number) => void, isReadOnly: boolean }) => {
  return (
    <div className="flex flex-row-reverse gap-1">
      {[5, 4, 3, 2, 1].map((value) => (
        <Star
          key={value}
          className={`cursor-pointer h-5 w-5 ${rating >= value ? "text-accent fill-accent" : "text-muted-foreground"} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
          onClick={() => !isReadOnly && setRating(value)}
        />
      ))}
    </div>
  );
};

export default function AttendancePage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [athletesInGroup, setAthletesInGroup] = useState<Athlete[]>([]);
  const [absenceReasons, setAbsenceReasons] = useState<AbsenceReason[]>([]);
  const [loading, setLoading] = useState(true);

  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});

  useEffect(() => {
    async function fetchData() {
        if (!sessionId) return;
        setLoading(true);
        
        const sessionData = await getTrainingSessionById(sessionId);
        if (!sessionData) {
            setLoading(false);
            notFound();
            return;
        }

        setSession(sessionData);
        setAttendance(JSON.parse(JSON.stringify(sessionData.attendance || {})));

        const [groupData, athletesData, reasonsData] = await Promise.all([
            getGroupById(sessionData.groupId),
            getAthletesInGroup(sessionData.groupId),
            getAbsenceReasons(),
        ]);

        setSelectedGroup(groupData);
        setAthletesInGroup(athletesData);
        setAbsenceReasons(reasonsData);
        setLoading(false);
    }
    fetchData();
  }, [sessionId]);

  const isPastSession = useMemo(() => {
    if (!session) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDate = new Date(session.date);
    sessionDate.setUTCHours(0,0,0,0);
    return sessionDate.getTime() < today.getTime();
  }, [session]);

  const handleAttendanceChange = (athleteId: string, field: keyof AttendanceRecord, value: any) => {
    if(isPastSession) return;
    setAttendance(prev => {
      const currentRecord = prev[athleteId] || {
        athleteId,
        present: true,
      };
      const newRecord = { ...currentRecord, [field]: value };
      if (field === 'present' && value === true) {
        delete newRecord.absenceReason;
      }
      if (field === 'present' && value === false) {
        delete newRecord.rating;
        delete newRecord.comment;
      }
      return { ...prev, [athleteId]: newRecord };
    });
  };

  const getAthleteAttendance = (athleteId: string): AttendanceRecord => {
    return attendance[athleteId] || {
      athleteId,
      present: true,
      rating: 0
    };
  };

  const handleSave = async () => {
    try {
      await updateAttendance(sessionId, attendance);
      toast({
        title: "הנוכחות נשמרה בהצלחה",
        description: `נתוני הנוכחות עבור ${selectedGroup?.name} נשמרו.`,
      });
    } catch (error) {
       toast({
        title: "שגיאה בשמירת נוכחות",
        description: "אירעה שגיאה בעת שמירת הנתונים. נסה שוב.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
      return <div className="flex h-screen items-center justify-center">טוען נתוני אימון...</div>;
  }
  
  if (!session || !selectedGroup) {
      notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>רישום נוכחות: {selectedGroup.name}</CardTitle>
            <CardDescription>
                {new Date(session.date).toLocaleDateString('he-IL', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {isPastSession && <span className="text-destructive font-semibold ms-4">(אימון עבר - צפייה בלבד)</span>}
            </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-24">
        {athletesInGroup.map((athlete: Athlete) => {
          const record = getAthleteAttendance(athlete.id);
          const isPresent = record.present !== false;

          return (
            <Card key={athlete.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                   <CardTitle className="text-lg">{`${athlete.firstName} ${athlete.lastName}`}</CardTitle>
                   <div className="flex items-center space-x-2 space-x-reverse">
                       <Label htmlFor={`attendance-${athlete.id}`} className="text-sm">נעדר</Label>
                       <Switch
                        id={`attendance-${athlete.id}`}
                        checked={!isPresent}
                        onCheckedChange={(checked) => handleAttendanceChange(athlete.id, 'present', !checked)}
                        dir="ltr"
                        disabled={isPastSession}
                       />
                       <Label htmlFor={`attendance-${athlete.id}`} className="text-sm">נוכח</Label>
                    </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                {isPresent ? (
                    <>
                     <div className="flex justify-between items-center">
                       <Label>דירוג אימון</Label>
                       <StarRating
                          rating={record.rating || 0}
                          setRating={(rating) => handleAttendanceChange(athlete.id, 'rating', rating)}
                          isReadOnly={isPastSession}
                        />
                     </div>
                     <div>
                        <Label htmlFor={`comment-${athlete.id}`}>הערות פרטניות</Label>
                        <Textarea
                            id={`comment-${athlete.id}`}
                            placeholder={isPastSession ? 'אין הערה' : 'הוסף הערה...'}
                            value={record.comment || ""}
                            onChange={(e) => handleAttendanceChange(athlete.id, 'comment', e.target.value)}
                            className="mt-1"
                            readOnly={isPastSession}
                        />
                     </div>
                    </>
                ) : (
                    <div>
                        <Label htmlFor={`absence-${athlete.id}`}>סיבת היעדרות</Label>
                         <Select
                          onValueChange={(value) => handleAttendanceChange(athlete.id, 'absenceReason', value)}
                          value={record.absenceReason || ""}
                          disabled={isPastSession}
                        >
                          <SelectTrigger id={`absence-${athlete.id}`} className="mt-1">
                            <SelectValue placeholder={isPastSession ? 'לא נבחרה סיבה' : 'בחר סיבה'} />
                          </SelectTrigger>
                          <SelectContent>
                            {absenceReasons.map(reason => (
                              <SelectItem key={reason.id} value={reason.id}>{reason.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CardFooter className="flex justify-end sticky bottom-0 bg-background py-4 px-6 border-t gap-2">
        {!isPastSession && (
          <Button onClick={handleSave}>
            <Save className="me-2 h-4 w-4" />
            שמור נוכחות
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push('/')}>
           <XCircle className="me-2 h-4 w-4" />
           סגור
        </Button>
      </CardFooter>
    </div>
  );
}

    