
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { FileDown, Loader2 } from 'lucide-react';
import { getGroups, getAthletesInGroup, getTrainingSessionsForGroupInMonth } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import type { Group, Athlete, TrainingSession } from '@/types';

const months = [
  { value: 1, label: 'ינואר' }, { value: 2, label: 'פברואר' }, { value: 3, label: 'מרץ' },
  { value: 4, label: 'אפריל' }, { value: 5, label: 'מאי' }, { value: 6, label: 'יוני' },
  { value: 7, label: 'יולי' }, { value: 8, label: 'אוגוסט' }, { value: 9, label: 'ספטמבר' },
  { value: 10, label: 'אוקטובר' }, { value: 11, label: 'נובמבר' }, { value: 12, label: 'דצמבר' },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

interface ReportData {
    name: string;
    attendancePercentage: number;
    averageRating: number;
    absences: number;
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);

   useEffect(() => {
    async function fetchGroups() {
        setLoading(true);
        const groupsData = await getGroups();
        setGroups(groupsData);
        if (groupsData.length > 0) {
            setSelectedGroup(groupsData[0].id);
        }
        setLoading(false);
    }
    fetchGroups();
  }, []);

  const generateReport = useCallback(async () => {
    if (!selectedGroup) return;

    setLoadingReport(true);
    setReportData([]);

    try {
        const [athletes, sessions] = await Promise.all([
            getAthletesInGroup(selectedGroup),
            getTrainingSessionsForGroupInMonth(selectedGroup, selectedYear, selectedMonth)
        ]);

        const totalSessions = sessions.length;

        if (totalSessions === 0 || athletes.length === 0) {
            setReportData([]);
            setLoadingReport(false);
            return;
        }

        const calculatedData = athletes.map(athlete => {
            let attendedSessions = 0;
            let totalRating = 0;
            let ratedSessions = 0;

            sessions.forEach(session => {
                const record = session.attendance[athlete.id];
                if (record?.present) {
                    attendedSessions++;
                    if (record.rating && record.rating > 0) {
                        totalRating += record.rating;
                        ratedSessions++;
                    }
                }
            });

            const attendancePercentage = Math.round((attendedSessions / totalSessions) * 100) || 0;
            const averageRating = ratedSessions > 0 ? parseFloat((totalRating / ratedSessions).toFixed(1)) : 0;
            const absences = totalSessions - attendedSessions;

            return {
                name: `${athlete.firstName} ${athlete.lastName}`,
                attendancePercentage,
                averageRating,
                absences
            };
        });

        setReportData(calculatedData.sort((a,b) => b.attendancePercentage - a.attendancePercentage));

    } catch (error) {
        console.error("Failed to generate report:", error);
        setReportData([]);
    } finally {
        setLoadingReport(false);
    }
  }, [selectedGroup, selectedYear, selectedMonth]);

   useEffect(() => {
        if(selectedGroup) {
            generateReport();
        }
   }, [selectedGroup, selectedYear, selectedMonth, generateReport]);


  const handleExport = () => {
    // Logic for exporting to Excel would go here
    alert(`מייצא דוח עבור ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}...`);
  };
  
  const selectedGroupName = useMemo(() => {
    return groups.find(g => g.id === selectedGroup)?.name || '...';
  }, [groups, selectedGroup]);
  
  if (loading) {
      return <div>טוען נתונים...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle>דוחות חודשיים</CardTitle>
                <CardDescription>הפק וייצא דוחות נוכחות חודשיים עבור כל קבוצה.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {months.map(month => (
                    <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                 <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-[180px]">
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
        <h3 className="font-semibold mb-4">תצוגה מקדימה: {selectedGroupName}</h3>
         {loadingReport ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : reportData.length > 0 ? (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>שם הספורטאי</TableHead>
                <TableHead className="text-center">אחוז נוכחות</TableHead>
                <TableHead className="text-center">דירוג ממוצע</TableHead>
                <TableHead className="text-center">מספר היעדרויות</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reportData.map((row) => (
                <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant={row.attendancePercentage > 85 ? "default" : "secondary"} className={row.attendancePercentage > 95 ? 'bg-green-500' : row.attendancePercentage < 75 ? 'bg-red-500': ''}>
                            {row.attendancePercentage}%
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">{row.averageRating > 0 ? row.averageRating : 'אין'}</TableCell>
                    <TableCell className="text-center">{row.absences}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        ) : (
             <div className="text-center text-muted-foreground py-12">
              <p>לא נמצאו נתונים עבור הקבוצה והחודש שנבחרו.</p>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleExport} className="ms-auto" disabled={reportData.length === 0}>
          <FileDown className="me-2 h-4 w-4" />
          ייצא לאקסל
        </Button>
      </CardFooter>
    </Card>
  );
}
