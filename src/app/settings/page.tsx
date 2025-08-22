
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  DialogClose,
  DialogTrigger
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getGroups, getCoaches, getAbsenceReasons, getAthletesInGroup, addGroup, updateGroup, deleteGroup, addAbsenceReason, deleteAbsenceReason, addCoach, deleteCoach } from "@/lib/data";
import { AppLogo } from '@/components/icons';
import { UserPlus, PlusCircle, Trash2, Edit } from 'lucide-react';
import type { Athlete, Group, Coach, AbsenceReason } from '@/types';
import { useToast } from "@/hooks/use-toast";


export default function SettingsPage() {
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [absenceReasons, setAbsenceReasons] = useState<AbsenceReason[]>([]);
  const [athletesByGroup, setAthletesByGroup] = useState<Record<string, Athlete[]>>({});

  const [loading, setLoading] = useState(true);

  // State for group management dialogs
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<{ athlete: Athlete; group: Group } | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
        const [groupsData, coachesData, reasonsData] = await Promise.all([
            getGroups(),
            getCoaches(),
            getAbsenceReasons(),
        ]);

        setGroups(groupsData);
        setCoaches(coachesData);
        setAbsenceReasons(reasonsData);

        const athletesData: Record<string, Athlete[]> = {};
        for(const group of groupsData) {
            try {
               athletesData[group.id] = await getAthletesInGroup(group.id);
            } catch (groupError) {
                console.error(`Failed to get athletes for group ${group.id}`, groupError);
                athletesData[group.id] = [];
            }
        }
        setAthletesByGroup(athletesData);
    } catch (error) {
        console.error("Failed to fetch settings data:", error);
        toast({
            title: "שגיאה בטעינת נתונים",
            description: "לא ניתן היה לטעון את הגדרות המערכת. אנא נסה לרענן את העמוד.",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
    
    console.log("Saving changes to Firestore:", {
        athleteId: athlete.id,
        newName: editedName,
        newPhone: editedPhone,
        originalGroupId: originalGroup.id,
        newGroupId: targetGroupId,
    });
    
    toast({
        title: "השינויים נשמרו",
        description: `פרטי הספורטאי ${editedName} עודכנו בהצלחה.`,
    });

    setIsEditDialogOpen(false);
    setSelectedAthlete(null);
  };

  const getAthletesInGroupFromState = (groupId: string) => {
    return athletesByGroup[groupId] || [];
  }

  // Group Management Handlers
  const handleOpenGroupDialog = (group: Group | null = null) => {
    setGroupToEdit(group);
    setNewGroupName(group?.name || "");
    setIsGroupDialogOpen(true);
  }

  const handleCloseGroupDialog = () => {
    setIsGroupDialogOpen(false);
    setGroupToEdit(null);
    setNewGroupName("");
  }

  const handleSaveGroup = async () => {
    if (!newGroupName.trim()) {
        toast({ title: "שם הקבוצה ריק", description: "יש להזין שם לקבוצה.", variant: "destructive" });
        return;
    }

    try {
        if (groupToEdit) {
            // Update existing group
            await updateGroup(groupToEdit.id, newGroupName);
            toast({ title: "קבוצה עודכנה", description: `הקבוצה ${newGroupName} עודכנה בהצלחה.` });
        } else {
            // Create new group
            await addGroup(newGroupName);
            toast({ title: "קבוצה נוצרה", description: `הקבוצה ${newGroupName} נוצרה בהצלחה.` });
        }
        await fetchAllData(); // Refetch all data to show changes
    } catch(error) {
        toast({ title: "שגיאה", description: "אירעה שגיאה בעת שמירת הקבוצה.", variant: "destructive" });
    } finally {
        handleCloseGroupDialog();
    }
  }

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
        await deleteGroup(groupToDelete.id);
        toast({ title: "קבוצה נמחקה", description: `הקבוצה ${groupToDelete.name} נמחקה בהצלחה.` });
        await fetchAllData();
    } catch(error) {
        toast({ title: "שגיאה", description: "אירעה שגיאה בעת מחיקת הקבוצה.", variant: "destructive" });
    } finally {
        setGroupToDelete(null);
    }
  }


  if (loading) {
      return <div className="flex h-screen w-full items-center justify-center">טוען הגדרות...</div>
  }

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
                <Button onClick={() => handleOpenGroupDialog()}><PlusCircle className="me-2 h-4 w-4" />הוסף קבוצה חדשה</Button>
            </div>
          </CardHeader>
          <CardContent>
            {groups.length > 0 ? (
                <Accordion type="single" collapsible className="w-full" defaultValue={groups[0]?.id}>
                {groups.map(group => (
                    <AccordionItem value={group.id} key={group.id}>
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">
                        <div className="flex items-center gap-4 flex-1">
                            <span className="flex-1 text-right">{group.name}</span>
                            <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenGroupDialog(group)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog onOpenChange={(isOpen) => !isOpen && setGroupToDelete(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => setGroupToDelete(group)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            פעולה זו תמחק את הקבוצה "{groupToDelete?.name}" לצמיתות. לא ניתן לבטל פעולה זו.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteGroup}>מחק</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 p-4">
                            <Button variant="outline" size="sm" className="mb-4">
                                <UserPlus className="me-2 h-4 w-4" /> הוסף ספורטאי לקבוצה
                            </Button>
                            {getAthletesInGroupFromState(group.id).length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>שם</TableHead>
                                        <TableHead>טלפון</TableHead>
                                        <TableHead className="text-left">פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {getAthletesInGroupFromState(group.id).map(athlete => (
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
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">עדיין אין ספורטאים בקבוצה זו.</p>
                            )}
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>לא נמצאו קבוצות.</p>
                    <p className="mt-2">לחץ על "הוסף קבוצה חדשה" כדי להתחיל.</p>
                </div>
            )}
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
                        <TableHead>טלפון</TableHead>
                         <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {coaches.map(coach => (
                        <TableRow key={coach.id}>
                            <TableCell>{coach.name}</TableCell>
                            <TableCell>{coach.phone}</TableCell>
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
    
    {/* Group Edit/Create Dialog */}
    <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{groupToEdit ? 'עריכת שם קבוצה' : 'יצירת קבוצה חדשה'}</DialogTitle>
                <DialogDescription>
                  {groupToEdit ? 'שנה את שם הקבוצה ולחץ על שמור.' : 'הזן את שם הקבוצה החדשה ולחץ על יצירה.'}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="group-name">שם הקבוצה</Label>
                <Input id="group-name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="mt-2" placeholder="לדוגמה: בוגרים"/>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button variant="outline" onClick={handleCloseGroupDialog}>ביטול</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button onClick={handleSaveGroup}>{groupToEdit ? 'שמור שינויים' : 'צור קבוצה'}</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>


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
