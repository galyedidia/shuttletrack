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
import { FileDown, Loader2, TrendingUp, Users, Calendar } from 'lucide-react';
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

function AttendancePill({ attended, total }: { attended: number; total: number }) {
  const pct = Math.round((attended / total) * 100);
  const getColors = () => {
    if (pct >= 90) return { bg: 'bg-emerald-500', ring: 'ring-emerald-300', text: 'text-emerald-900', bgLight: 'bg-emerald-50' };
    if (pct >= 75) return { bg: 'bg-blue-500', ring: 'ring-blue-300', text: 'text-blue-900', bgLight: 'bg-blue-50' };
    if (pct >= 60) return { bg: 'bg-yellow-500', ring: 'ring-yellow-300', text: 'text-yellow-900', bgLight: 'bg-yellow-50' };
    return { bg: 'bg-red-500', ring: 'ring-red-300', text: 'text-red-900', bgLight: 'bg-red-50' };
  };
  
  const colors = getColors();
  
  return (
    <div className={`relative inline-flex items-center rounded-full ring-1 ${colors.ring} ${colors.bgLight} ${colors.text} px-3 py-1.5 min-w-[85px] overflow-hidden`}>
      <div 
        className={`absolute inset-y-0 right-0 rounded-full transition-all duration-500 ${colors.bg} opacity-20`}
        style={{ width: `${pct}%` }}
      />
      <span className="relative z-10 text-sm font-bold tabular-nums">
        {pct}%
      </span>
      <span className="relative z-10 text-xs font-medium mr-2 opacity-80">
        {attended}/{total}
      </span>
    </div>
  );
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
    const clear = () => {
      document.body.style.paddingLeft = "";
      document.body.style.paddingRight = "";
      document.body.style.paddingInlineStart = "";
      document.body.style.paddingInlineEnd = "";
    };
    if (!isDetailOpen) clear();
    return clear; // also clear on unmount
  }, [isDetailOpen]);
  
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

    const blob = new Blob([`\uFEFF\u202E${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const safeName = `${selectedAthleteReport.firstName}_${selectedAthleteReport.lastName}`.replace(/ /g, '_');
    link.setAttribute('download', `report_${safeName}_${selectedMonth}-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedDetails = React.useMemo(() => {
    const toTs = (d: { date: string; isoDate?: string }) => {
      if (d.isoDate) return new Date(d.isoDate).getTime();
      // parse "12.8.2025"
      const m = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(d.date);
      if (m) {
        const [, dd, mm, yyyy] = m;
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
      }
      return new Date(d.date).getTime(); // fallback
    };
    // newest first; swap to a-b for oldest first
    return [...athleteSessionDetails].sort((a, b) => toTs(a) - toTs(b));
  }, [athleteSessionDetails]);

  if (loading) {
      return (
        <div className="space-y-6">
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-md p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
              <div className="flex justify-center gap-4">
                <div className="h-10 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-40"></div>
              </div>
            </div>
          </div>
        </div>
      );
  }

  return (
    <>
    {/* Fixed container for mobile responsiveness */}
    <div className="w-full">
      {/* Main content container */}
      <div className="mx-auto w-full max-w-[680px] sm:max-w-[760px] md:max-w-[880px] px-3 sm:px-4">
        <Card className="bg-gradient-to-br from-white to-gray-50/50 border-2 border-gray-200 rounded-xl shadow-md text-[18px] sm:text-[19px] md:text-xl leading-[1.65]">
          <CardHeader className="text-center pb-6">
              <CardTitle className="mb-4 text-2xl sm:text-3xl font-bold text-primary flex items-center justify-center gap-3">
                <TrendingUp className="h-8 w-8" />
                דוחות חודשיים
              </CardTitle>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  
                    
                    <Select dir="rtl" value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                        <SelectTrigger className="h-11 sm:h-12 text-base sm:text-lg w-[116px] sm:w-[128px] border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                            <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  
                  
                    <Select dir="rtl" value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                        <SelectTrigger className="h-11 sm:h-12 text-base sm:text-lg w-[96px] sm:w-[110px] border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  
                  
                    <Select dir="rtl" value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger className="h-11 sm:h-12 text-base sm:text-lg w-[170px] sm:w-[190px] border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors">
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
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <Table className="text-base sm:text-lg">
                          <TableHeader>
                          <TableRow className="bg-gray-50">
                              <TableHead className="text-center font-semibold text-gray-700 py-4">שם הספורטאי</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700 py-4">אחוז נוכחות</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700 py-4">דירוג ממוצע</TableHead>
                          </TableRow>
                          </TableHeader>
                          <TableBody>
                          {reportData.map((row) => (
                              <TableRow 
                                key={row.athleteId} 
                                onClick={() => handleAthleteClick(row)} 
                                className="cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-gray-100"
                              >
                              <TableCell className="font-medium text-right py-4 sm:py-5">{`${row.firstName} ${row.lastName}`}</TableCell>
                              <TableCell className="text-center py-4 sm:py-5">
                              <AttendancePill attended={row.attendedSessions} total={row.totalSessions} />
                              </TableCell>
                              <TableCell className="text-center py-4 sm:py-5">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                                    {row.averageRating > 0 ? row.averageRating : 'אין'}
                                  </span>
                              </TableCell>
                              </TableRow>
                          ))}
                          </TableBody>
                      </Table>
                  </div>
              ) : (
                  <div className="text-center text-muted-foreground py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">לא נמצאו נתונים עבור הקבוצה והחודש שנבחרו.</p>
                  </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Fixed Dialog with proper RTL support */}
    <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
      <DialogContent
        dir="rtl"
        className="
          fixed top-[50%] left-[50%] 
          -translate-x-1/2 -translate-y-1/2 
          w-[calc(100vw-1rem)] max-w-[95vw]
          sm:w-[90vw] sm:max-w-[85vw] 
          md:w-[80vw] md:max-w-[75vw] 
          lg:w-[70vw] lg:max-w-[65vw]
          max-h-[90vh]
          px-4 sm:px-6
          z-50
          bg-white border-2 border-gray-200 rounded-xl shadow-xl
        "
      >
        <DialogHeader className="text-center space-y-1 pb-4">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-center text-primary">
              דוח מפורט: {selectedAthleteReport ? `${selectedAthleteReport.firstName} ${selectedAthleteReport.lastName}` : ""}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground text-center">
              פירוט אימונים עבור {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="mt-3 max-h-[60vh] overflow-auto">
          {/* Mobile: condensed cards */}
          <div className="sm:hidden space-y-2.5" dir="rtl">
            {sortedDetails.map((detail, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 px-3 py-2 bg-gray-50/30">
                <div className="flex items-center justify-between gap-3">
                  {/* Date (right) */}
                  <span className="text-base font-medium whitespace-nowrap">{detail.date}</span>

                  {/* Rating (middle) */}
                  <span className="text-base font-semibold tabular-nums shrink-0">
                    {detail?.rating ?? "—"}
                  </span>

                  {/* Status (left) */}
                  <span
                      style={{
                        backgroundColor: detail.status === "נוכח" ? "#dbeafe" : "#fee2e2",
                        color: detail.status === "נוכח" ? "#1e40af" : "#dc2626",
                        borderColor: detail.status === "נוכח" ? "#93c5fd" : "#fca5a5"
                      }}
                      className="inline-flex items-center rounded-full px-3 py-1 text-sm shrink-0 border font-medium"
                    >
                      {detail.status}
                    </span>
                </div>

                {(detail?.absenceReason || detail?.comment) && (
                  <div className="mt-1 text-right text-sm leading-6 whitespace-pre-wrap break-words">
                    {detail.absenceReason ?? detail.comment}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tablet/Desktop: table */}
          <div className="hidden sm:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table className="table-auto text-base" dir="rtl">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-right w-[6.5rem] whitespace-nowrap px-2 font-semibold text-gray-700">תאריך</TableHead>
                  <TableHead className="text-center w-[6rem] px-2 font-semibold text-gray-700">סטטוס</TableHead>
                  <TableHead className="text-center w-[5rem] px-2 font-semibold text-gray-700">דירוג/סיבה</TableHead>
                  <TableHead className="text-right px-2 font-semibold text-gray-700">הערה</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedDetails.map((detail, index) => (
                  <TableRow key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    {/* Date */}
                    <TableCell className="text-right w-[6.5rem] whitespace-nowrap tabular-nums py-2.5 px-2">
                      {detail.date}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center w-[6rem] py-2.5 px-2">
                    <span
                      style={{
                        backgroundColor: detail.status === "נוכח" ? "#dbeafe" : "#fee2e2",
                        color: detail.status === "נוכח" ? "#1e40af" : "#dc2626",
                        borderColor: detail.status === "נוכח" ? "#93c5fd" : "#fca5a5"
                      }}
                      className="inline-flex items-center rounded-full px-3 py-1 text-sm shrink-0 border font-medium"
                    >
                      {detail.status}
                    </span>
                    </TableCell>

                    {/* Rating/Reason */}
                    <TableCell className="text-center w-[5rem] py-2.5 px-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-sm font-medium">
                        {detail.rating ?? detail.absenceReason ?? "—"}
                      </span>
                    </TableCell>

                    {/* Notes */}
                    <TableCell className="text-right py-2.5 px-2 whitespace-normal break-words leading-[1.45]">
                      {detail.comment ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="pt-4">
          <div className="w-full flex items-center justify-center gap-3">
            <Button 
              onClick={handleExport} 
              className="h-10 sm:h-11 px-4 sm:px-5 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <FileDown className="me-2 h-4 w-4" />
              ייצא לאקסל
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              className="h-10 sm:h-11 px-4 sm:px-5 text-base border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              סגור
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}