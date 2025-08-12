"use client";

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { groups, absenceReasons } from "@/lib/data";
import type { AttendanceRecord, Athlete } from '@/types';
import { Star, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

const StarRating = ({ rating, setRating }: { rating: number, setRating: (rating: number) => void }) => {
  return (
    <div className="flex flex-row-reverse gap-1">
      {[5, 4, 3, 2, 1].map((value) => (
        <Star
          key={value}
          className={`cursor-pointer h-5 w-5 ${rating >= value ? "text-accent fill-accent" : "text-muted-foreground"}`}
          onClick={() => setRating(value)}
        />
      ))}
    </div>
  );
};

export default function AttendancePage() {
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groups[0]?.id ?? null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});

  const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [selectedGroupId]);

  const handleAttendanceChange = (athleteId: string, field: keyof AttendanceRecord, value: any) => {
    setAttendance(prev => {
      const currentRecord = prev[athleteId] || {
        athleteId,
        date: selectedDate,
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
      date: selectedDate,
      present: true,
      rating: 0
    };
  };

  const handleSave = () => {
    console.log("Saving attendance:", attendance);
    toast({
      title: "הנוכחות נשמרה בהצלחה",
      description: `נתוני הנוכחות עבור ${selectedGroup?.name} בתאריך ${selectedDate} נשמרו.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>רישום נוכחות</CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto"
              />
              <Select onValueChange={setSelectedGroupId} defaultValue={selectedGroupId ?? ""}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="בחר קבוצה" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {selectedGroup?.athletes.map((athlete: Athlete) => {
          const record = getAthleteAttendance(athlete.id);
          const isPresent = record.present;

          return (
            <Card key={athlete.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                   <CardTitle className="text-lg">{athlete.name}</CardTitle>
                   <div className="flex items-center space-x-2 space-x-reverse">
                       <Label htmlFor={`attendance-${athlete.id}`} className="text-sm">נעדר</Label>
                       <Switch
                        id={`attendance-${athlete.id}`}
                        checked={isPresent}
                        onCheckedChange={(checked) => handleAttendanceChange(athlete.id, 'present', checked)}
                        dir="ltr"
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
                        />
                     </div>
                     <div>
                        <Label htmlFor={`comment-${athlete.id}`}>הערות פרטניות</Label>
                        <Textarea
                            id={`comment-${athlete.id}`}
                            placeholder="הוסף הערה..."
                            value={record.comment || ""}
                            onChange={(e) => handleAttendanceChange(athlete.id, 'comment', e.target.value)}
                            className="mt-1"
                        />
                     </div>
                    </>
                ) : (
                    <div>
                        <Label htmlFor={`absence-${athlete.id}`}>סיבת היעדרות</Label>
                         <Select
                          onValueChange={(value) => handleAttendanceChange(athlete.id, 'absenceReason', value)}
                          value={record.absenceReason || ""}
                        >
                          <SelectTrigger id={`absence-${athlete.id}`} className="mt-1">
                            <SelectValue placeholder="בחר סיבה" />
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

      {selectedGroup && (
        <CardFooter className="flex justify-end sticky bottom-0 bg-background py-4 px-6 border-t">
          <Button onClick={handleSave}>
            <Save className="me-2 h-4 w-4" />
            שמור נוכחות
          </Button>
        </CardFooter>
      )}
    </div>
  );
}
