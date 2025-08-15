"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogClose
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { groups, coaches, absenceReasons, athletes } from "@/lib/data";
import { AppLogo } from '@/components/icons';
import { UserPlus, PlusCircle, Trash2, Edit } from 'lucide-react';
import type { Athlete, Group } from '@/types';
import { useToast } from "@/hooks/use-toast";


export default function SettingsPage() {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<{ athlete: Athlete; group: Group } | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [_, setForceRender] = useState(0); // Helper to re-render on data change

  const handleEditClick = (athlete: Athlete, group: Group) => {
    setSelectedAthlete({ athlete, group });
    setEditedName(athlete.name);
    setEditedPhone(athlete.phone);
    setTargetGroupId(group.id);
    setIsEditDialogOpen(true);
  };
  
  const handleSaveChanges = () => {
    if (!selectedAthlete) return;

    const { athlete, group: originalGroup } = selectedAthlete;

    // Find the original athlete in the mock data to update their details
    const athleteToUpdate = athletes.find(a => a.id === athlete.id);
    if (athleteToUpdate) {
        athleteToUpdate.name = editedName;
        athleteToUpdate.phone = editedPhone;
    }
    
    // If the group has changed, move the athlete
    if (originalGroup.id !== targetGroupId) {
        const targetGroup = groups.find(g => g.id === targetGroupId);
        if (targetGroup) {
            // Remove from original group
            const athleteIndex = originalGroup.athletes.findIndex(a => a.id === athlete.id);
            if (athleteIndex > -1) {
                originalGroup.athletes.splice(athleteIndex, 1);
            }
            // Add to new group
            targetGroup.athletes.push(athleteToUpdate!);
        }
    }

    toast({
        title: "השינויים נשמרו",
        description: `פרטי הספורטאי ${editedName} עודכנו בהצלחה.`,
    });

    setIsEditDialogOpen(false);
    setSelectedAthlete(null);
    setForceRender(c => c + 1); // Trigger a re-render to show updated groups
  };

  return (
    <>
    <Tabs defaultValue="groups" dir="rtl">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="groups">קבוצות וספורטאים</TabsTrigger>
        <TabsTrigger value="coaches">מאמנים</TabsTrigger>
        <TabsTrigger value="reasons">סיבות היעדרות</TabsTrigger>
        <TabsTrigger value="logo">לוגו המועדון</TabsTrigger>
      </TabsList>
      
      <TabsContent value="groups">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>ניהול קבוצות וספורטאים</CardTitle>
                    <CardDescription>הוסף, ערוך ומחק קבוצות וספורטאים.</CardDescription>
                </div>
                <Button><PlusCircle className="me-2 h-4 w-4" />הוסף קבוצה חדשה</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {groups.map(group => (
                <AccordionItem value={group.id} key={group.id}>
                  <AccordionTrigger className="text-lg font-medium">{group.name}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4">
                        <Button variant="outline" size="sm" className="mb-4">
                            <UserPlus className="me-2 h-4 w-4" /> הוסף ספורטאי לקבוצה
                        </Button>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>שם</TableHead>
                                    <TableHead>טלפון</TableHead>
                                    <TableHead className="text-left">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {group.athletes.map(athlete => (
                                <TableRow key={athlete.id}>
                                    <TableCell>{athlete.name}</TableCell>
                                    <TableCell>{athlete.phone}</TableCell>
                                    <TableCell className="text-left">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(athlete, group)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="coaches">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>ניהול מאמנים</CardTitle>
                    <CardDescription>הוסף ונהל חשבונות מאמנים.</CardDescription>
                </div>
                 <Button><UserPlus className="me-2 h-4 w-4" />הוסף מאמן</Button>
            </div>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>שם</TableHead>
                        <TableHead>תפקיד</TableHead>
                         <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {coaches.map(coach => (
                        <TableRow key={coach.id}>
                            <TableCell>{coach.name}</TableCell>
                            <TableCell>מאמן</TableCell>
                            <TableCell className="text-left">
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reasons">
        <Card>
          <CardHeader>
            <CardTitle>ניהול סיבות היעדרות</CardTitle>
            <CardDescription>הוסף או ערוך סיבות היעדרות מותאמות אישית.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
                <Input placeholder="הוסף סיבה חדשה..."/>
                <Button><PlusCircle className="me-2 h-4 w-4" />הוסף</Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>סיבה</TableHead>
                        <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {absenceReasons.map(reason => (
                         <TableRow key={reason.id}>
                            <TableCell>{reason.label}</TableCell>
                            <TableCell className="text-left">
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logo">
        <Card>
          <CardHeader>
            <CardTitle>לוגו המועדון</CardTitle>
            <CardDescription>העלה את לוגו המועדון שיוצג באפליקציה ובדוחות.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 text-center">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-dashed">
                <AppLogo className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="w-full max-w-sm">
                <Input type="file" />
                <p className="text-xs text-muted-foreground mt-2">סוגי קבצים מומלצים: PNG, JPG, SVG</p>
            </div>
            <Button>שמור לוגו</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>עריכת פרטי ספורטאי</DialogTitle>
                <DialogDescription>
                    ערוך את הפרטים או העבר את הספורטאי לקבוצה אחרת.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">שם</Label>
                    <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">טלפון</Label>
                    <Input id="phone" value={editedPhone} onChange={(e) => setEditedPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="group">קבוצה</Label>
                    <Select value={targetGroupId} onValueChange={setTargetGroupId}>
                        <SelectTrigger id="group">
                            <SelectValue placeholder="בחר קבוצה..." />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button variant="outline">ביטול</Button>
                </DialogClose>
                <Button onClick={handleSaveChanges}>שמור שינויים</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
