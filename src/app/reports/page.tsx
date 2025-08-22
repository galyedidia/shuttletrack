
"use client";

import React, { useState, useEffect } from 'react';
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
import { FileDown } from 'lucide-react';
import { getGroups } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import type { Group } from '@/types';

const months = [
  { value: 1, label: 'ינואר' }, { value: 2, label: 'פברואר' }, { value: 3, label: 'מרץ' },
  { value: 4, label: 'אפריל' }, { value: 5, label: 'מאי' }, { value: 6, label: 'יוני' },
  { value: 7, label: 'יולי' }, { value: 8, label: 'אוגוסט' }, { value: 9, label: 'ספטמבר' },
  { value: 10, label: 'אוקטובר' }, { value: 11, label: 'נובמבר' }, { value: 12, label: 'דצמבר' },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

// Mock data for report preview - will be replaced with real data later
const mockReportData = [
    { name: 'ישראל ישראלי', attendancePercentage: 95, averageRating: 4.5, absences: 1},
    { name: 'דנה לוי', attendancePercentage: 88, averageRating: 4.1, absences: 2},
]

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);

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


  const handleExport = () => {
    // Logic for exporting to Excel would go here
    alert(`מייצא דוח עבור ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}...`);
  };
  
  const selectedGroupName = groups.find(g => g.id === selectedGroup)?.name || '...';
  
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
            {mockReportData.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-center">
                    <Badge variant={row.attendancePercentage > 85 ? "default" : "secondary"} className={row.attendancePercentage > 85 ? 'bg-green-500' : ''}>
                        {row.attendancePercentage}%
                    </Badge>
                </TableCell>
                <TableCell className="text-center">{row.averageRating}</TableCell>
                <TableCell className="text-center">{row.absences}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button onClick={handleExport} className="ms-auto">
          <FileDown className="me-2 h-4 w-4" />
          ייצא לאקסל
        </Button>
      </CardFooter>
    </Card>
  );
}
