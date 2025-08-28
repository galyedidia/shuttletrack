
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
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
import { getGroups, getTrainingSessions, addTrainingSession, getAthletesInGroup } from "@/lib/data";
import type { TrainingSession, Group, Athlete } from '@/types';
import { PlusCircle, Calendar as CalendarIcon, Users, Edit } from "lucide-react";
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function SessionsDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
    });
  }, [sessions, selectedDate]);

  const handleCreateSession = async () => {
    if (!newSessionGroupId) return;
    try {
      const newSessionData = {
        date: selectedDateString,
        groupId: newSessionGroupId,
        attendance: {},
      };
      const newSession = await addTrainingSession(newSessionData);
      
      setSessions(prev => [...prev, newSession]);
      setNewSessionGroupId('');
      
       toast({
        title: "אימון נוצר בהצלחה",
        description: `האימון לקבוצה נוצר לתאריך ${new Date(newSession.date + 'T00:00:00').toLocaleDateString('he-IL')}.`,
      });
    } catch (error) {
       toast({
        title: "שגיאה ביצירת אימון",
        description: "אירעה שגיאה בעת יצירת האימון. נסה שוב.",
        variant: "destructive"
      });
    }
  };
  
  const getGroupById = (groupId: string) => groups.find(g => g.id === groupId);
  
  const [athleteCounts, setAthleteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
        const counts: Record<string, number> = {};
        for (const group of groups) {
            try {
              const athletes = await getAthletesInGroup(group.id);
              counts[group.id] = athletes.length;
            } catch (error) {
               counts[group.id] = 0;
            }
        }
        setAthleteCounts(counts);
    };

    if (groups.length > 0) {
        fetchCounts();
    }
  }, [groups]);


  if (loading) {
    return <div>טוען נתונים...</div>
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
                      onSelect={(date) => {
                          if (date) {
                              setSelectedDate(date);
                              setIsDatePickerOpen(false);
                          }
                      }}
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
            const athleteCount = athleteCounts[session.groupId] || 0;

            return (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>{group?.name}</CardTitle>
                  <CardDescription>
                    אימון בתאריך {new Date(session.date + 'T00:00:00').toLocaleDateString('he-IL')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="me-2 h-4 w-4" />
                    <span>{athleteCount} ספורטאים</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => router.push(`/session/${session.id}`)}>
                    <Edit className="me-2 h-4 w-4" />
                    {new Date(session.date + 'T00:00:00').setHours(0,0,0,0) >= new Date(new Date().setHours(0,0,0,0)).getTime() ? 'ערוך אימון' : 'הצג אימון'}
                  </Button>
                </CardFooter>
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
                <DialogTitle>יצירת אימון חדש</DialogTitle>
                <DialogDescription>
                    בחר קבוצה כדי ליצור אימון חדש להיום.
                </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select onValueChange={setNewSessionGroupId} value={newSessionGroupId}>
                        <SelectTrigger>
                            <SelectValue placeholder="בחר קבוצה..." />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map(group => (
                                <SelectItem key={group.id} value={group.id} disabled={filteredSessions.some(s => s.groupId === group.id)}>{group.name}</SelectItem>
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
