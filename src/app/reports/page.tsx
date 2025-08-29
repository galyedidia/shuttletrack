
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown, Loader2 } from 'lucide-react';
import { getGroups, getAthletes, getTrainingSessionsForGroupInMonth, getAbsenceReasons } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import type { Group, Athlete, TrainingSession, AbsenceReason } from '@/types';

const months = [
  { value: 1, label: 'ינואר' }, { value: 2, label: 'פברואר' }, { value: 3, label: 'מרץ' },
  { value: 4, label: 'אפריל' }, { value: 5, label: 'מאי' }, { value: 6, label: 'יוני' },
  { value: 7, label: 'יולי' }, { value: 8, label: 'אוגוסט' }, { value: 9, label: 'ספטמבר' },
  { value: 10, label: 'אוקטובר' }, { value: 11, label: 'נובמבר' }, { value: 12, label: 'דצמבר' },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

interface ReportData {
    athleteId: string;
    firstName: string;
    lastName: string;
    attendancePercentage: number;
    attendedSessions: number;
    totalSessions: number;
    averageRating: number;
}

interface AthleteSessionDetail {
    date: string;
    status: 'נוכח' | 'נעדר';
    rating?: number;
    absenceReason?: string;
    comment?: string;
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [absenceReasons, setAbsenceReasons] = useState<Record<string, string>>({});

  // For Athlete Detail Dialog
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAthleteReport, setSelectedAthleteReport] = useState<ReportData | null>(null);
  const [athleteSessionDetails, setAthleteSessionDetails] = useState<AthleteSessionDetail[]>([]);
  const [sessionsForMonth, setSessionsForMonth] = useState<TrainingSession[]>([]);

   useEffect(() => {
    async function fetchInitialData() {
        setLoading(true);
        const [groupsData, reasonsData] = await Promise.all([
            getGroups(),
            getAbsenceReasons(),
        ]);
        setGroups(groupsData);
        if (groupsData.length > 0) {
            setSelectedGroup(groupsData[0].id);
        }

        const reasonsMap = reasonsData.reduce((acc, reason) => {
            acc[reason.id] = reason.label;
            return acc;
        }, {} as Record<string, string>);
        setAbsenceReasons(reasonsMap);

        setLoading(false);
    }
    fetchInitialData();
  }, []);

  const generateReport = useCallback(async () => {
    if (!selectedGroup) return;

    setLoadingReport(true);
    setReportData([]);

    try {
        const sessions = await getTrainingSessionsForGroupInMonth(selectedGroup, selectedYear, selectedMonth);
        setSessionsForMonth(sessions);
        const totalSessions = sessions.length;

        if (totalSessions === 0) {
            setReportData([]);
            setLoadingReport(false);
            return;
        }

        // Aggregate all unique athlete IDs from all sessions in the month
        const athleteStats: Record<string, { attended: number; totalRating: number; ratedCount: number; absences: number; }> = {};
        const athleteIdsInReport = new Set<string>();

        sessions.forEach(session => {
            Object.values(session.attendance).forEach(record => {
                const athleteId = record.athleteId;
                athleteIdsInReport.add(athleteId);
                if (!athleteStats[athleteId]) {
                    athleteStats[athleteId] = { attended: 0, totalRating: 0, ratedCount: 0, absences: 0 };
                }
                if (record?.present) {
                    athleteStats[athleteId].attended++;
                    if (record.rating && record.rating > 0) {
                        athleteStats[athleteId].totalRating += record.rating;
                        athleteStats[athleteId].ratedCount++;
                    }
                } else {
                    athleteStats[athleteId].absences++;
                }
            });
        });
        
        if(athleteIdsInReport.size === 0) {
            setReportData([]);
            setLoadingReport(false);
            return;
        }

        // Fetch details for all athletes who participated
        const athletes = await getAthletes(Array.from(athleteIdsInReport));
        const athletesMap = new Map(athletes.map(a => [a.id, a]));

        const calculatedData = Array.from(athleteIdsInReport).map(athleteId => {
            const stats = athleteStats[athleteId];
            const athlete = athletesMap.get(athleteId);
            
            const attendancePercentage = totalSessions > 0 ? Math.round((stats.attended / totalSessions) * 100) : 0;
            const averageRating = stats.ratedCount > 0 ? parseFloat((stats.totalRating / stats.ratedCount).toFixed(1)) : 0;

            return {
                athleteId,
                firstName: athlete?.firstName || 'לא ידוע',
                lastName: athlete?.lastName || '',
                attendancePercentage,
                attendedSessions: stats.attended,
                totalSessions,
                averageRating,
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


  const handleAthleteClick = (athleteReport: ReportData) => {
    const details: AthleteSessionDetail[] = sessionsForMonth.map(session => {
        const record = session.attendance[athleteReport.athleteId];
        const detail: AthleteSessionDetail = {
            date: new Date(session.date + 'T00:00:00').toLocaleDateString('he-IL'),
            status: record?.present ? 'נוכח' : 'נעדר',
            rating: record?.rating,
            comment: record?.comment,
            absenceReason: record?.absenceReason ? absenceReasons[record.absenceReason] : undefined,
        };
        return detail;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAthleteSessionDetails(details);
    setSelectedAthleteReport(athleteReport);
    setIsDetailOpen(true);
  };
  
  const handleExport = () => {
    if (!selectedAthleteReport || !athleteSessionDetails.length) return;

    const headers = ["תאריך", "סטטוס", "דירוג", "סיבת היעדרות", "הערה"];
    const csvContent = [
        headers.join(','),
        ...athleteSessionDetails.map(d => [
            `"${d.date}"`,
            `"${d.status}"`,
            d.rating || '',
            `"${d.absenceReason || ''}"`,
            `"${(d.comment || '').replace(/"/g, '""')}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const safeName = `${selectedAthleteReport.firstName}_${selectedAthleteReport.lastName}`.replace(/ /g, '_');
    link.setAttribute('download', `report_${safeName}_${selectedMonth}-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getAttendanceBadgeVariant = (percentage: number) => {
    if (percentage > 85) return 'default';
    if (percentage < 70) return 'destructive';
    return 'secondary';
  }

  if (loading) {
      return <div>טוען נתונים...</div>
  }

  return (
    <>
    <Card>
      <CardHeader className="text-center">
            <CardTitle className="mb-4">דוחות חודשיים</CardTitle>
            <div className="flex items-center justify-center gap-2">
                <Select dir="rtl" value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(month => (
                        <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select dir="rtl" value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select dir="rtl" value={selectedGroup} onValueChange={setSelectedGroup}>
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
      </CardHeader>
      <CardContent>
         {loadingReport ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : reportData.length > 0 ? (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="text-center">שם הספורטאי</TableHead>
                <TableHead className="text-center">אחוז נוכחות</TableHead>
                <TableHead className="text-center">דירוג ממוצע</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reportData.map((row) => (
                <TableRow key={row.athleteId} onClick={() => handleAthleteClick(row)} className="cursor-pointer">
                    <TableCell className="font-medium text-right">{`${row.firstName} ${row.lastName}`}</TableCell>
                    <TableCell className="text-center">
                         <Badge variant={getAttendanceBadgeVariant(row.attendancePercentage)}>
                            {`${row.attendancePercentage}% (${row.attendedSessions}/${row.totalSessions})`}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">{row.averageRating > 0 ? row.averageRating : 'אין'}</TableCell>
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
    </Card>

    <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>דוח מפורט: {selectedAthleteReport ? `${selectedAthleteReport.firstName} ${selectedAthleteReport.lastName}`: ''}</DialogTitle>
                <DialogDescription>
                    פירוט אימונים עבור {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                 <ScrollArea className="h-96">
                    <Table dir="rtl">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">תאריך</TableHead>
                                <TableHead className="text-right">סטטוס</TableHead>
                                <TableHead className="text-right">דירוג/סיבה</TableHead>
                                <TableHead className="text-right">הערה</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {athleteSessionDetails.map((detail, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-right">{detail.date}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={detail.status === 'נוכח' ? 'default' : 'destructive'}>
                                            {detail.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{detail.rating || detail.absenceReason || '-'}</TableCell>
                                    <TableCell className="text-right">{detail.comment || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </ScrollArea>
            </div>
            <DialogFooter className="flex-row justify-end gap-2">
                 <Button variant="outline" onClick={() => setIsDetailOpen(false)}>סגור</Button>
                 <Button onClick={handleExport}>
                    <FileDown className="me-2 h-4 w-4" />
                    ייצא לאקסל
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
