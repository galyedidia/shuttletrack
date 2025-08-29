
"use client";

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { getGroups, getTrainingSessions, addTrainingSession, getAthletesInGroup, deleteTrainingSession } from "@/lib/data";
import type { TrainingSession, Group, Athlete } from '@/types';
import { PlusCircle, Calendar as CalendarIcon, Users, Edit, Eye, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function SessionsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const getInitialDate = () => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      // Ensure parsing is robust
      const parsedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
      if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
      }
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());
  const [newSessionGroupId, setNewSessionGroupId] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Effect to update the current time every minute to check if the day has changed
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60 * 1000); // every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const sessionsData = await getTrainingSessions();
    setSessions(sessionsData);
    setLoading(false);
  }

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        const [sessionsData, groupsData] = await Promise.all([
            getTrainingSessions(),
            getGroups()
        ]);
        setSessions(sessionsData);
        setGroups(groupsData);
        setLoading(false);
    }
    fetchData();
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
        setSelectedDate(date);
        const dateString = format(date, "yyyy-MM-dd");
        router.push(`/?date=${dateString}`);
        setIsDatePickerOpen(false);
    }
  }


  const sessionDates = useMemo(() => {
    return sessions.map(s => {
        const [year, month, day] = s.date.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    });
  }, [sessions]);

  const selectedDateString = useMemo(() => {
    return format(selectedDate, "yyyy-MM-dd");
  }, [selectedDate]);

  const isToday = useMemo(() => {
      const today = new Date(now); // Use the 'now' state which updates every minute
      today.setHours(0,0,0,0);
      const selDate = new Date(selectedDate);
      selDate.setHours(0,0,0,0);
      return today.getTime() === selDate.getTime();
  }, [selectedDate, now]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
        const [year, month, day] = s.date.split('-').map(Number);
        const sessionDate = new Date(Date.UTC(year, month - 1, day));
        const selDate = new Date(selectedDate);
        const selectedDateUTC = new Date(Date.UTC(selDate.getFullYear(), selDate.getMonth(), selDate.getDate()));
        return sessionDate.getTime() === selectedDateUTC.getTime();
    }).sort((a,b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }, [sessions, selectedDate]);

  const handleCreateSession = async () => {
    if (!newSessionGroupId) return;
    try {
      const athletesInGroup = await getAthletesInGroup(newSessionGroupId);
      const attendance = athletesInGroup.reduce((acc, athlete) => {
          acc[athlete.id] = {
              athleteId: athlete.id,
              present: true, // Default to present
              rating: 0,
              comment: ''
          };
          return acc;
      }, {} as Record<string, any>);

      const newSessionData = {
        date: selectedDateString,
        groupId: newSessionGroupId,
        attendance,
        createdAt: new Date().toISOString(),
      };
      const newSession = await addTrainingSession(newSessionData);
      
      setSessions(prev => [...prev, newSession]);
      setNewSessionGroupId('');
      
       toast({
        title: "אימון נוצר בהצלחה",
        description: `האימון לקבוצה נוצר לתאריך ${new Date(newSession.date + 'T00:00:00').toLocaleDateString('he-IL')}.`,
      });
      router.push(`/session/${newSession.id}?returnDate=${selectedDateString}`);
    } catch (error) {
       toast({
        title: "שגיאה ביצירת אימון",
        description: "אירעה שגיאה בעת יצירת האימון. נסה שוב.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
        await deleteTrainingSession(sessionId);
        await fetchSessions(); // Refetch sessions to update the UI
        toast({
            title: "אימון נמחק",
            description: "האימון נמחק בהצלחה."
        })
    } catch(error) {
        toast({
            title: "שגיאה במחיקת אימון",
            description: "אירעה שגיאה בעת מחיקת האימון.",
            variant: "destructive"
        })
    }
  }
  
  const getGroupById = (groupId: string) => groups.find(g => g.id === groupId);
  
  const athleteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(session => {
        counts[session.id] = Object.keys(session.attendance).length;
    });
    return counts;
  }, [sessions]);


  if (loading) {
    return <div>טוען נתונים...</div>
  }
  
  const handleSessionNavigation = (sessionId: string) => {
    router.push(`/session/${sessionId}?returnDate=${selectedDateString}`);
  }

  const formatCreationTime = (isoString?: string) => {
      if (!isoString) return '';
      return new Date(isoString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="items-center">
            <div className="flex flex-col items-center gap-4">
                <CardTitle>ניהול אימונים</CardTitle>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-[280px] justify-center text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>בחר תאריך</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      modifiers={{ withSession: sessionDates }}
                      modifiersClassNames={{ withSession: 'day-with-session' }}
                    />
                  </PopoverContent>
                </Popover>
            </div>
        </CardHeader>
      </Card>

      {filteredSessions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map(session => {
            const group = getGroupById(session.groupId);
            const athleteCount = athleteCounts[session.id] || 0;
            const isPast = new Date(session.date + 'T00:00:00').setHours(0,0,0,0) < new Date(new Date().setHours(0,0,0,0)).getTime();
            const creationTime = formatCreationTime(session.createdAt);
            const canDelete = isToday;

            return (
              <Card key={session.id} className="border-l-4 border-primary bg-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{group?.name}</CardTitle>
                        <CardDescription>
                            {new Date(session.date + 'T00:00:00').toLocaleDateString('he-IL')}
                            {creationTime && <span className="ms-2 font-mono text-xs">({creationTime})</span>}
                        </CardDescription>
                    </div>
                    {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                              <AlertDialogTitle className="text-right">האם אתה בטוח?</AlertDialogTitle>
                              <AlertDialogDescription className="text-right">
                                  פעולה זו תמחק את האימון של קבוצת {group?.name} מתאריך זה לצמיתות. לא ניתן לבטל פעולה זו.
                              </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSession(session.id)}>מחק</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="me-2 h-4 w-4" />
                    <span>{athleteCount} ספורטאים</span>
                  </div>
                  <Button size="sm" onClick={() => handleSessionNavigation(session.id)}>
                    {isPast ? <Eye className="me-2 h-4 w-4" /> : <Edit className="me-2 h-4 w-4" />}
                    {isPast ? 'הצג' : 'ערוך'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
           <CardContent>
             <p className="text-muted-foreground">לא נמצאו אימונים לתאריך שנבחר.</p>
           </CardContent>
        </Card>
      )}

      {isToday && (
         <Dialog>
            <DialogTrigger asChild>
                 <Button className="fixed bottom-6 end-6 rounded-full h-16 w-16 shadow-lg">
                    <PlusCircle className="h-8 w-8" />
                    <span className="sr-only">צור אימון חדש</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-center">יצירת אימון חדש</DialogTitle>
                    <DialogDescription className="text-center">
                        בחר קבוצה כדי ליצור אימון חדש להיום.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select onValueChange={setNewSessionGroupId} value={newSessionGroupId} dir="rtl">
                        <SelectTrigger>
                            <SelectValue placeholder="בחר קבוצה..." />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button onClick={handleCreateSession} disabled={!newSessionGroupId}>צור אימון</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


export default function SessionsDashboardPage() {
    return (
        <Suspense fallback={<div>טוען...</div>}>
            <SessionsDashboard />
        </Suspense>
    )
}

    

    

    

    
