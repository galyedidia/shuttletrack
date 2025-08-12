"use client";

import React, { useState, useMemo } from 'react';
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
import { Input } from "@/components/ui/input";
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
import { groups, trainingSessions as mockSessions, athletes } from "@/lib/data";
import type { TrainingSession } from '@/types';
import { PlusCircle, Calendar as CalendarIcon, Users, Edit } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function SessionsDashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TrainingSession[]>(mockSessions);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSessionGroupId, setNewSessionGroupId] = useState<string>('');
  
  const isToday = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const selDate = new Date(selectedDate);
      selDate.setHours(0,0,0,0);
      return today.getTime() === selDate.getTime();
  }, [selectedDate]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.date === selectedDate);
  }, [sessions, selectedDate]);

  const handleCreateSession = () => {
    if (!newSessionGroupId) return;
    const newSession: TrainingSession = {
      id: `ts${Date.now()}`,
      date: selectedDate,
      groupId: newSessionGroupId,
      attendance: {},
    };
    setSessions(prev => [...prev, newSession]);
    setNewSessionGroupId('');
  };
  
  const getGroupById = (groupId: string) => groups.find(g => g.id === groupId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>ניהול אימונים</CardTitle>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {filteredSessions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map(session => {
            const group = getGroupById(session.groupId);
            return (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>{group?.name}</CardTitle>
                  <CardDescription>
                    אימון בתאריך {new Date(session.date).toLocaleDateString('he-IL')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="me-2 h-4 w-4" />
                    <span>{group?.athletes.length} ספורטאים</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => router.push(`/session/${session.id}`)}>
                    <Edit className="me-2 h-4 w-4" />
                    {isToday ? 'ערוך אימון' : 'הצג אימון'}
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
