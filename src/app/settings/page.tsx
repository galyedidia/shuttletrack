
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
import { getGroups, getCoaches, getAbsenceReasons, getAthletesInGroup, addGroup, updateGroup, deleteGroup, addAthlete, updateAthlete, deleteAthlete, addCoach, updateCoach, deleteCoach } from "@/lib/data";
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

  // State for athlete management dialogs
  const [isAthleteDialogOpen, setIsAthleteDialogOpen] = useState(false);
  const [athleteToEdit, setAthleteToEdit] = useState<Athlete | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [newAthleteFirstName, setNewAthleteFirstName] = useState("");
  const [newAthleteLastName, setNewAthleteLastName] = useState("");
  const [newAthletePhone, setNewAthletePhone] = useState("");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null); // For creating athlete in the correct group
  const [targetGroupId, setTargetGroupId] = useState(""); // For moving athlete

  // State for coach management
  const [isCoachDialogOpen, setIsCoachDialogOpen] = useState(false);
  const [coachToEdit, setCoachToEdit] = useState<Coach | null>(null);
  const [coachToDelete, setCoachToDelete] = useState<Coach | null>(null);
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachPhone, setNewCoachPhone] = useState("");


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
            await updateGroup(groupToEdit.id, newGroupName);
            toast({ title: "קבוצה עודכנה", description: `הקבוצה ${newGroupName} עודכנה בהצלחה.` });
        } else {
            await addGroup(newGroupName);
            toast({ title: "קבוצה נוצרה", description: `הקבוצה ${newGroupName} נוצרה בהצלחה.` });
        }
        await fetchAllData();
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

  // Athlete Management Handlers
  const handleOpenAthleteDialog = (athlete: Athlete | null = null, groupId: string) => {
      setAthleteToEdit(athlete);
      setActiveGroupId(groupId);
      setNewAthleteFirstName(athlete?.firstName || "");
      setNewAthleteLastName(athlete?.lastName || "");
      setNewAthletePhone(athlete?.phone || "");
      setTargetGroupId(athlete?.groupId || groupId);
      setIsAthleteDialogOpen(true);
  }

  const handleCloseAthleteDialog = () => {
      setIsAthleteDialogOpen(false);
      setAthleteToEdit(null);
      setActiveGroupId(null);
      setNewAthleteFirstName("");
      setNewAthleteLastName("");
      setNewAthletePhone("");
      setTargetGroupId("");
  }

  const handleSaveAthlete = async () => {
      if (!newAthleteFirstName.trim() || !newAthleteLastName.trim()) {
          toast({ title: "שם הספורטאי אינו מלא", description: "יש להזין שם פרטי ושם משפחה.", variant: "destructive"});
          return;
      }
      if (!activeGroupId && !athleteToEdit) {
          toast({ title: "שגיאה", description: "לא זוהתה קבוצה לשיוך.", variant: "destructive" });
          return;
      }
      
      try {
          if (athleteToEdit) {
              await updateAthlete(athleteToEdit.id, {
                  firstName: newAthleteFirstName,
                  lastName: newAthleteLastName,
                  phone: newAthletePhone,
                  groupId: targetGroupId
              });
              toast({ title: "ספורטאי עודכן", description: `פרטי ${newAthleteFirstName} ${newAthleteLastName} עודכנו.`});
          } else if (activeGroupId) {
              await addAthlete(newAthleteFirstName, newAthleteLastName, newAthletePhone, activeGroupId);
              toast({ title: "ספורטאי נוסף", description: `${newAthleteFirstName} ${newAthleteLastName} נוסף לקבוצה.` });
          }
          await fetchAllData();
      } catch (error) {
          toast({ title: "שגיאה", description: "אירעה שגיאה בעת שמירת הספורטאי.", variant: "destructive"});
      } finally {
          handleCloseAthleteDialog();
      }
  }

  const handleDeleteAthlete = async () => {
      if (!athleteToDelete) return;
      try {
          await deleteAthlete(athleteToDelete.id);
          toast({ title: "ספורטאי נמחק", description: `${athleteToDelete.firstName} ${athleteToDelete.lastName} נמחק בהצלחה.`});
          await fetchAllData();
      } catch (error) {
          toast({ title: "שגיאה", description: "אירעה שגיאה במחיקת הספורטאי.", variant: "destructive"});
      } finally {
          setAthleteToDelete(null);
      }
  }

  // Coach Management Handlers
  const handleOpenCoachDialog = (coach: Coach | null = null) => {
    setCoachToEdit(coach);
    setNewCoachName(coach?.name || "");
    setNewCoachPhone(coach?.phone || "");
    setIsCoachDialogOpen(true);
  }

  const handleCloseCoachDialog = () => {
    setIsCoachDialogOpen(false);
    setCoachToEdit(null);
    setNewCoachName("");
    setNewCoachPhone("");
  }

  const handleSaveCoach = async () => {
    if (!newCoachName.trim() || !newCoachPhone.trim()) {
        toast({ title: "שם או טלפון חסרים", description: "יש להזין שם וטלפון למאמן.", variant: "destructive" });
        return;
    }
    
    try {
        if (coachToEdit) {
            await updateCoach(coachToEdit.id, { name: newCoachName, phone: newCoachPhone });
            toast({ title: "מאמן עודכן", description: `פרטי ${newCoachName} עודכנו.`});
        } else {
            await addCoach(newCoachName, newCoachPhone);
            toast({ title: "מאמן נוסף", description: `${newCoachName} נוסף למערכת.`});
        }
        await fetchAllData();
    } catch (error) {
        toast({ title: "שגיאה", description: "אירעה שגיאה בעת שמירת המאמן.", variant: "destructive"});
    } finally {
        handleCloseCoachDialog();
    }
  }

  const handleDeleteCoach = async () => {
    if (!coachToDelete) return;
    try {
        await deleteCoach(coachToDelete.id);
        toast({ title: "מאמן נמחק", description: `${coachToDelete.name} נמחק מהמערכת.`});
        await fetchAllData();
    } catch (error) {
        toast({ title: "שגיאה", description: "אירעה שגיאה במחיקת המאמן.", variant: "destructive"});
    } finally {
        setCoachToDelete(null);
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
                            <Button variant="outline" size="sm" className="mb-4" onClick={() => handleOpenAthleteDialog(null, group.id)}>
                                <UserPlus className="me-2 h-4 w-4" /> הוסף ספורטאי לקבוצה
                            </Button>
                            {(athletesByGroup[group.id] || []).length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>שם פרטי</TableHead>
                                        <TableHead>שם משפחה</TableHead>
                                        <TableHead>טלפון</TableHead>
                                        <TableHead className="text-left">פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {(athletesByGroup[group.id] || []).map(athlete => (
                                    <TableRow key={athlete.id}>
                                        <TableCell>{athlete.firstName}</TableCell>
                                        <TableCell>{athlete.lastName}</TableCell>
                                        <TableCell>{athlete.phone}</TableCell>
                                        <TableCell className="text-left">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenAthleteDialog(athlete, group.id)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                             <AlertDialog onOpenChange={(isOpen) => !isOpen && setAthleteToDelete(null)}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => setAthleteToDelete(athlete)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        פעולה זו תמחק את הספורטאי "{athleteToDelete?.firstName} {athleteToDelete?.lastName}" לצמיתות.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteAthlete}>מחק</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
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
                 <Button onClick={() => handleOpenCoachDialog()}><UserPlus className="me-2 h-4 w-4" />הוסף מאמן</Button>
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
                                <Button variant="ghost" size="icon" onClick={() => handleOpenCoachDialog(coach)}><Edit className="h-4 w-4" /></Button>
                                 <AlertDialog onOpenChange={(isOpen) => !isOpen && setCoachToDelete(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => setCoachToDelete(coach)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            פעולה זו תמחק את המאמן "{coachToDelete?.name}" לצמיתות.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteCoach}>מחק</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
                <Button onClick={handleSaveGroup}>{groupToEdit ? 'שמור שינויים' : 'צור קבוצה'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Athlete Edit/Create Dialog */}
    <Dialog open={isAthleteDialogOpen} onOpenChange={handleCloseAthleteDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{athleteToEdit ? 'עריכת פרטי ספורטאי' : 'הוספת ספורטאי חדש'}</DialogTitle>
            </DialogHeader>
            <div className="py-4 grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">שם פרטי</Label>
                    <Input id="firstName" value={newAthleteFirstName} onChange={(e) => setNewAthleteFirstName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="lastName">שם משפחה</Label>
                    <Input id="lastName" value={newAthleteLastName} onChange={(e) => setNewAthleteLastName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">טלפון</Label>
                    <Input id="phone" value={newAthletePhone} onChange={(e) => setNewAthletePhone(e.target.value)} />
                </div>
                {athleteToEdit && (
                <div className="space-y-2">
                    <Label htmlFor="group">העבר לקבוצה</Label>
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
                )}
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button variant="outline" onClick={handleCloseAthleteDialog}>ביטול</Button>
                </DialogClose>
                <Button onClick={handleSaveAthlete}>{athleteToEdit ? 'שמור שינויים' : 'צור ספורטאי'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Coach Edit/Create Dialog */}
     <Dialog open={isCoachDialogOpen} onOpenChange={handleCloseCoachDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{coachToEdit ? 'עריכת פרטי מאמן' : 'הוספת מאמן חדש'}</DialogTitle>
            </DialogHeader>
            <div className="py-4 grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="coachName">שם מלא</Label>
                    <Input id="coachName" value={newCoachName} onChange={(e) => setNewCoachName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="coachPhone">טלפון</Label>
                    <Input id="coachPhone" value={newCoachPhone} onChange={(e) => setNewCoachPhone(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button variant="outline" onClick={handleCloseCoachDialog}>ביטול</Button>
                </DialogClose>
                <Button onClick={handleSaveCoach}>{coachToEdit ? 'שמור שינויים' : 'הוסף מאמן'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
