
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
import { getGroups, getCoaches, getAbsenceReasons, getAthletesInGroup, addGroup, updateGroup, deleteGroup, addAthlete, updateAthlete, deleteAthlete, addCoach, updateCoach, deleteCoach, addAbsenceReason, updateAbsenceReason, deleteAbsenceReason } from "@/lib/data";
import { UserPlus, PlusCircle, Trash2, Edit } from 'lucide-react';
import type { Athlete, Group, Coach, AbsenceReason } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/lib/auth';


export default function SettingsPage() {
  const { toast } = useToast();
  const { role } = useAuth();
  const isManager = role === 'manager';
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [absenceReasons, setAbsenceReasons] = useState<AbsenceReason[]>([]);
  const [athletesByGroup, setAthletesByGroup] = useState<Record<string, Athlete[]>>({});

  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("groups");
  const [openAccordion, setOpenAccordion] = useState<string | undefined>();


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

  // State for user management
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Coach | null>(null);
  const [userToDelete, setUserToDelete] = useState<Coach | null>(null);
  const [newCoachFirstName, setNewCoachFirstName] = useState("");
  const [newCoachLastName, setNewCoachLastName] = useState("");
  const [newCoachPhone, setNewCoachPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<'manager' | 'coach'>('coach');


  // State for absence reason management
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [reasonToEdit, setReasonToEdit] = useState<AbsenceReason | null>(null);
  const [reasonToDelete, setReasonToDelete] = useState<AbsenceReason | null>(null);
  const [newReasonLabel, setNewReasonLabel] = useState("");
  const [newReasonInput, setNewReasonInput] = useState("");

  const fetchAllData = useCallback(async () => {
    try {
        setLoading(true);
        const [groupsData, coachesData, reasonsData] = await Promise.all([
            getGroups(),
            isManager ? getCoaches() : Promise.resolve([]),
            isManager ? getAbsenceReasons() : Promise.resolve([]),
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
  }, [toast, isManager]);
  
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
        setOpenAccordion(undefined); // Close accordion
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

  // User Management Handlers (Coach/Manager)
  const handleOpenUserDialog = (user: Coach | null = null) => {
    setUserToEdit(user);
    setNewCoachFirstName(user?.firstName || "");
    setNewCoachLastName(user?.lastName || "");
    setNewCoachPhone(user?.phone || "");
    setNewUserRole(user?.role || 'coach');
    setIsUserDialogOpen(true);
  }

  const handleCloseUserDialog = () => {
    setIsUserDialogOpen(false);
    setUserToEdit(null);
    setNewCoachFirstName("");
    setNewCoachLastName("");
    setNewCoachPhone("");
    setNewUserRole("coach");
  }

  const handleSaveUser = async () => {
    const israeliPhoneRegex = /^(05\d-?\d{7}|\+9725\d-?\d{7})$/;
    
    if (!newCoachFirstName.trim() || !newCoachLastName.trim() || !newCoachPhone.trim()) {
        toast({ title: "שדות חסרים", description: "יש למלא שם פרטי, שם משפחה ומספר טלפון.", variant: "destructive" });
        return;
    }

    const formattedPhone = newCoachPhone.startsWith('+') ? newCoachPhone : `+972${newCoachPhone.substring(1)}`;

    if (!israeliPhoneRegex.test(newCoachPhone.replace("-", ""))) {
        toast({ title: "מספר טלפון לא תקין", description: "יש להזין מספר טלפון ישראלי תקין.", variant: "destructive"});
        return;
    }
    
    try {
        if (userToEdit) {
            await updateCoach(userToEdit.id, { firstName: newCoachFirstName, lastName: newCoachLastName, phone: formattedPhone, role: newUserRole });
            toast({ title: "משתמש עודכן", description: `פרטי ${newCoachFirstName} ${newCoachLastName} עודכנו.`});
        } else {
            await addCoach(newCoachFirstName, newCoachLastName, formattedPhone, newUserRole);
            toast({ title: "משתמש נוסף", description: `${newCoachFirstName} ${newCoachLastName} נוסף למערכת.`});
        }
        await fetchAllData();
        handleCloseUserDialog();
    } catch (error: any) {
        if (error.message.includes("already exists")) {
            toast({ title: "מספר טלפון קיים", description: "קיים כבר משתמש עם מספר טלפון זה.", variant: "destructive"});
        } else {
            toast({ title: "שגיאה", description: "אירעה שגיאה בעת שמירת המשתמש.", variant: "destructive"});
        }
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
        await deleteCoach(userToDelete.id);
        toast({ title: "משתמש נמחק", description: `${userToDelete.firstName} ${userToDelete.lastName} נמחק מהמערכת.`});
        await fetchAllData();
    } catch (error) {
        toast({ title: "שגיאה", description: "אירעה שגיאה במחיקת המשתמש.", variant: "destructive"});
    } finally {
        setUserToDelete(null);
    }
  }

  // Absence Reason Handlers
  const handleOpenReasonDialog = (reason: AbsenceReason | null = null) => {
    setReasonToEdit(reason);
    setNewReasonLabel(reason?.label || "");
    setIsReasonDialogOpen(true);
  }

  const handleCloseReasonDialog = () => {
    setIsReasonDialogOpen(false);
    setReasonToEdit(null);
    setNewReasonLabel("");
  }
  
  const handleAddReason = async () => {
    if(!newReasonInput.trim()) {
        toast({ title: "שם הסיבה ריק", description: "יש להזין שם לסיבת ההיעדרות.", variant: "destructive" });
        return;
    }
    try {
        await addAbsenceReason(newReasonInput);
        toast({ title: "סיבה נוספה", description: `הסיבה "${newReasonInput}" נוספה בהצלחה.`});
        setNewReasonInput("");
        await fetchAllData();
    } catch(error) {
        toast({ title: "שגיאה", description: "אירעה שגיאה בעת הוספת הסיבה.", variant: "destructive" });
    }
  }

  const handleSaveReason = async () => {
    if (!newReasonLabel.trim()) {
        toast({ title: "שם הסיבה ריק", description: "יש להזין שם לסיבת ההיעדרות.", variant: "destructive" });
        return;
    }

    if (!reasonToEdit) return;

    try {
        await updateAbsenceReason(reasonToEdit.id, newReasonLabel);
        toast({ title: "סיבה עודכנה", description: `הסיבה עודכנה ל-"${newReasonLabel}".` });
        await fetchAllData();
    } catch(error) {
        toast({ title: "שגיאה", description: "אירעה שגיאה בעת שמירת הסיבה.", variant: "destructive" });
    } finally {
        handleCloseReasonDialog();
    }
  }

  const handleDeleteReason = async () => {
    if (!reasonToDelete) return;
    try {
        await deleteAbsenceReason(reasonToDelete.id);
        toast({ title: "סיבה נמחקה", description: `הסיבה "${reasonToDelete.label}" נמחקה בהצלחה.` });
        await fetchAllData();
    } catch(error) {
        toast({ title: "שגיאה", description: "אירעה שגיאה בעת מחיקת הסיבה.", variant: "destructive" });
    } finally {
        setReasonToDelete(null);
    }
  }


  if (loading) {
      return <div className="flex h-screen w-full items-center justify-center">טוען הגדרות...</div>
  }

  return (
    <>
    <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="groups" dir="rtl">
      <TabsList className={`grid w-full ${isManager ? 'grid-cols-3' : 'grid-cols-1'}`}>
        <TabsTrigger value="groups">קבוצות וספורטאים</TabsTrigger>
        {isManager && (
            <>
                <TabsTrigger value="users">משתמשים</TabsTrigger>
                <TabsTrigger value="reasons">סיבות היעדרות</TabsTrigger>
            </>
        )}
      </TabsList>
      
      <TabsContent value="groups">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>ניהול קבוצות וספורטאים</CardTitle>
                </div>
                {isManager && (
                    <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenGroupDialog()}><PlusCircle className="me-2 h-4 w-4" />הוסף קבוצה</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{groupToEdit ? 'עריכת שם קבוצה' : 'יצירת קבוצה חדשה'}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Label htmlFor="group-name">שם הקבוצה</Label>
                                <Input id="group-name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="mt-2" placeholder="לדוגמה: בוגרים"/>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={handleCloseGroupDialog}>ביטול</Button>
                                <Button onClick={handleSaveGroup}>{groupToEdit ? 'שמור שינויים' : 'צור קבוצה'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
          </CardHeader>
          <CardContent>
            {groups.length > 0 ? (
                <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                {groups.map(group => (
                    <AccordionItem value={group.id} key={group.id}>
                      <div className="flex items-center w-full">
                        <AccordionTrigger className="text-lg font-medium hover:no-underline flex-1">
                            <span className="flex-1 text-right me-4">{group.name}</span>
                        </AccordionTrigger>
                        {isManager && (
                            <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity me-4">
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
                        )}
                      </div>
                    <AccordionContent>
                        <div className="space-y-4 pt-2">
                            {isManager && (
                                <Button variant="outline" size="sm" className="mb-4" onClick={() => handleOpenAthleteDialog(null, group.id)}>
                                    <UserPlus className="me-2 h-4 w-4" /> הוסף ספורטאי לקבוצה
                                </Button>
                            )}
                            {(athletesByGroup[group.id] || []).length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">שם פרטי</TableHead>
                                        <TableHead className="text-right">שם משפחה</TableHead>
                                        {isManager && <TableHead className="text-right">פעולות</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {(athletesByGroup[group.id] || []).map(athlete => (
                                    <TableRow key={athlete.id}>
                                        <TableCell>{athlete.firstName}</TableCell>
                                        <TableCell>{athlete.lastName}</TableCell>
                                        {isManager && (
                                            <TableCell className="text-right">
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
                                        )}
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
                    {isManager && <p className="mt-2">לחץ על "הוסף קבוצה" כדי להתחיל.</p>}
                </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {isManager && (
        <>
            <TabsContent value="users">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>ניהול משתמשים</CardTitle>
                                <CardDescription>הוסף ונהל מאמנים ומנהלים.</CardDescription>
                            </div>
                            <Button onClick={() => handleOpenUserDialog()}><UserPlus className="me-2 h-4 w-4" />הוסף משתמש</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">שם</TableHead>
                                    <TableHead className="text-right">תפקיד</TableHead>
                                    <TableHead className="text-right">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coaches.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                                        <TableCell>{user.role === 'manager' ? 'מנהל' : 'מאמן'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenUserDialog(user)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        פעולה זו תמחק את המשתמש "{userToDelete?.firstName} {userToDelete?.lastName}" לצמיתות.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteUser}>מחק</AlertDialogAction>
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
                            <Input 
                                placeholder="הוסף סיבה חדשה..."
                                value={newReasonInput}
                                onChange={(e) => setNewReasonInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddReason()}
                            />
                            <Button onClick={handleAddReason}><PlusCircle className="me-2 h-4 w-4" />הוסף</Button>
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
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenReasonDialog(reason)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog onOpenChange={(isOpen) => !isOpen && setReasonToDelete(null)}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => setReasonToDelete(reason)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        פעולה זו תמחק את הסיבה "{reasonToDelete?.label}" לצמיתות.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteReason}>מחק</AlertDialogAction>
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
        </>
      )}

    </Tabs>
    
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
                 <Button variant="outline" onClick={handleCloseAthleteDialog}>ביטול</Button>
                 <Button onClick={handleSaveAthlete}>{athleteToEdit ? 'שמור שינויים' : 'צור ספורטאי'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* User Edit/Create Dialog */}
     <Dialog open={isUserDialogOpen} onOpenChange={handleCloseUserDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{userToEdit ? 'עריכת פרטי משתמש' : 'הוספת משתמש חדש'}</DialogTitle>
            </DialogHeader>
            <div className="py-4 grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="coachFirstName">שם פרטי</Label>
                    <Input id="coachFirstName" value={newCoachFirstName} onChange={(e) => setNewCoachFirstName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="coachLastName">שם משפחה</Label>
                    <Input id="coachLastName" value={newCoachLastName} onChange={(e) => setNewCoachLastName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="coachPhone">טלפון</Label>
                    <Input id="coachPhone" value={newCoachPhone} onChange={(e) => setNewCoachPhone(e.target.value)} placeholder="05... או +972..."/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="userRole">תפקיד</Label>
                     <Select dir="rtl" value={newUserRole} onValueChange={(value) => setNewUserRole(value as 'manager' | 'coach')}>
                        <SelectTrigger id="userRole">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="coach">מאמן</SelectItem>
                            <SelectItem value="manager">מנהל</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <Button variant="outline" onClick={handleCloseUserDialog}>ביטול</Button>
                 <Button onClick={handleSaveUser}>{userToEdit ? 'שמור שינויים' : 'הוסף משתמש'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Absence Reason Edit/Create Dialog */}
    <Dialog open={isReasonDialogOpen} onOpenChange={handleCloseReasonDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>עריכת סיבת היעדרות</DialogTitle>
            </DialogHeader>
            <div className="py-4 grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="reasonLabel">שם הסיבה</Label>
                    <Input id="reasonLabel" value={newReasonLabel} onChange={(e) => setNewReasonLabel(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                 <Button variant="outline" onClick={handleCloseReasonDialog}>ביטול</Button>
                 <Button onClick={handleSaveReason}>שמור שינויים</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
