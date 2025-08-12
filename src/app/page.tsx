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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { groups, absenceReasons } from "@/lib/data";
import type { AttendanceRecord, Athlete } from '@/types';
import { Star, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>רישום נוכחות</CardTitle>
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Select onValueChange={setSelectedGroupId} defaultValue={selectedGroupId ?? ""}>
              <SelectTrigger className="w-[200px]">
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
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">שם מלא</TableHead>
                <TableHead className="text-center">נוכחות</TableHead>
                <TableHead className="text-center w-[150px]">דירוג אימון</TableHead>
                <TableHead className="w-[200px]">סיבת היעדרות</TableHead>
                <TableHead>הערות פרטניות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedGroup?.athletes.map((athlete: Athlete) => {
                const record = getAthleteAttendance(athlete.id);
                const isPresent = record.present;

                return (
                  <TableRow key={athlete.id}>
                    <TableCell className="font-medium">{athlete.name}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                         <Label htmlFor={`attendance-${athlete.id}`}>נוכח</Label>
                         <Switch
                          id={`attendance-${athlete.id}`}
                          checked={isPresent}
                          onCheckedChange={(checked) => handleAttendanceChange(athlete.id, 'present', checked)}
                          dir="ltr"
                         />
                         <Label htmlFor={`attendance-${athlete.id}`}>נעדר</Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isPresent && (
                        <div className="flex justify-center">
                          <StarRating
                            rating={record.rating || 0}
                            setRating={(rating) => handleAttendanceChange(athlete.id, 'rating', rating)}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isPresent && (
                        <Select
                          onValueChange={(value) => handleAttendanceChange(athlete.id, 'absenceReason', value)}
                          value={record.absenceReason || ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="בחר סיבה" />
                          </SelectTrigger>
                          <SelectContent>
                            {absenceReasons.map(reason => (
                              <SelectItem key={reason.id} value={reason.id}>{reason.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="הוסף הערה..."
                        value={record.comment || ""}
                        onChange={(e) => handleAttendanceChange(athlete.id, 'comment', e.target.value)}
                        className="min-h-[40px]"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="ms-auto">
          <Save className="me-2 h-4 w-4" />
          שמור נוכחות
        </Button>
      </CardFooter>
    </Card>
  );
}
