
"use client";

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { getTrainingSessionById, getAbsenceReasons, getAthletes, updateAttendance } from "@/lib/data";
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
          className={`cursor-pointer h-5 w-5 ${rating >= value ? "text-primary fill-primary" : "text-muted-foreground"} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
          onClick={() => !isReadOnly && setRating(value)}
        />
      ))}
    </div>
  );
};

function AttendancePageContent() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  
  const returnDate = searchParams.get('returnDate');

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const [athletesInSession, setAthletesInSession] = useState<Athlete[]>([]);
  const [absenceReasons, setAbsenceReasons] = useState<AbsenceReason[]>([]);
  const [loading, setLoading] = useState(true);

  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [originalAttendance, setOriginalAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
        if (!sessionId) return;
        setLoading(true);
        
        const { sessionData, athletesData, reasonsData } = await getTrainingSessionById(sessionId);
        if (!sessionData) {
            setLoading(false);
            notFound();
            return;
        }

        setSession(sessionData);
        setGroupName(sessionData.group?.name || '');
        
        const initialAttendance = JSON.parse(JSON.stringify(sessionData.attendance || {}));
        setAttendance(initialAttendance);
        setOriginalAttendance(initialAttendance);

        // sort athletes by first name
        athletesData.sort((a, b) => a.firstName.localeCompare(b.firstName));
        setAthletesInSession(athletesData);
        setAbsenceReasons(reasonsData);
        setLoading(false);
    }
    fetchData();
  }, [sessionId]);

  useEffect(() => {
    const hasChanges = JSON.stringify(attendance) !== JSON.stringify(originalAttendance);
    setIsUnsaved(hasChanges);
  }, [attendance, originalAttendance]);

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
        newRecord.rating = 0;
        newRecord.comment = '';
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
  
  const navigateBack = () => {
    if (returnDate) {
        router.push(`/?date=${returnDate}`);
    } else {
        router.push('/');
    }
  }

  const handleClose = () => {
      if(isUnsaved) {
          setIsCloseAlertOpen(true);
      } else {
          navigateBack();
      }
  }

  const handleSave = async () => {
    try {
      await updateAttendance(sessionId, attendance);
      setOriginalAttendance(JSON.parse(JSON.stringify(attendance))); // Update original state to reflect saved changes
      toast({
        title: "הנוכחות נשמרה בהצלחה",
        description: `נתוני הנוכחות עבור ${groupName} נשמרו.`,
      });
      navigateBack();
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
  
  if (!session) {
      notFound();
  }

  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>רישום נוכחות: {groupName}</CardTitle>
            <CardDescription>
                {new Date(session.date).toLocaleDateString('he-IL', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {isPastSession && <span className="text-destructive font-semibold ms-4">(אימון עבר - צפייה בלבד)</span>}
            </CardDescription>
        </CardHeader>
      </Card>
      
      {athletesInSession.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-24">
          {athletesInSession.map((athlete: Athlete) => {
            const record = getAthleteAttendance(athlete.id);
            const isPresent = record.present !== false;

            return (
              <Card key={athlete.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{`${athlete.firstName} ${athlete.lastName}`}</CardTitle>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Label htmlFor={`attendance-${athlete.id}`} className="text-sm">נוכח</Label>
                        <Switch
                          id={`attendance-${athlete.id}`}
                          checked={isPresent}
                          onCheckedChange={(checked) => handleAttendanceChange(athlete.id, 'present', checked)}
                          dir="ltr"
                          disabled={isPastSession}
                        />
                        <Label htmlFor={`attendance-${athlete.id}`} className="text-sm">נעדר</Label>
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
                          <Textarea
                              id={`comment-${athlete.id}`}
                              placeholder={isPastSession ? 'אין הערה' : 'הוסף הערה...'}
                              value={record.comment || ""}
                              onChange={(e) => handleAttendanceChange(athlete.id, 'comment', e.target.value)}
                              className="mt-1 min-h-[60px]"
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
                            dir="rtl"
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
      ) : (
        <Card>
            <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">לא נמצאו ספורטאים המשויכים לאימון זה.</p>
            </CardContent>
        </Card>
      )}


      <CardFooter className="flex justify-end sticky bottom-0 bg-background py-4 px-6 border-t gap-2">
        {!isPastSession && (
          <Button onClick={handleSave} disabled={!isUnsaved}>
            <Save className="me-2 h-4 w-4" />
            שמור נוכחות
          </Button>
        )}
        <Button variant="outline" onClick={handleClose}>
           <XCircle className="me-2 h-4 w-4" />
           סגור
        </Button>
      </CardFooter>
    </div>
    <AlertDialog open={isCloseAlertOpen} onOpenChange={setIsCloseAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>שינויים שלא נשמרו</AlertDialogTitle>
            <AlertDialogDescription>
                יצאת לפני ששמרת את השינויים. האם אתה בטוח שברצונך לצאת ולבטל את השינויים?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={navigateBack}>כן, בטל שינויים וצא</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export default function AttendancePage() {
    return (
        <Suspense fallback={<div>טוען...</div>}>
            <AttendancePageContent />
        </Suspense>
    )
}
