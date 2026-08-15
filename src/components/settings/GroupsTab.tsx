import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogFooter,
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
import { UserPlus, PlusCircle, Trash2, Edit, Users } from 'lucide-react';
import type { Athlete, Group } from '@/types';

interface GroupsTabProps {
  groups: Group[];
  athletesByGroup: Record<string, Athlete[]>;
  isManager: boolean;
  onSaveGroup: (id: string | null, name: string) => Promise<boolean>;
  onDeleteGroup: (id: string, name: string) => Promise<boolean>;
  onSaveAthlete: (id: string | null, firstName: string, lastName: string, phone: string, groupId: string) => Promise<boolean>;
  onDeleteAthlete: (id: string, firstName: string, lastName: string) => Promise<boolean>;
  onRefreshData: () => Promise<void>;
}

export function GroupsTab({
  groups,
  athletesByGroup,
  isManager,
  onSaveGroup,
  onDeleteGroup,
  onSaveAthlete,
  onDeleteAthlete,
  onRefreshData
}: GroupsTabProps) {
  const [openAccordion, setOpenAccordion] = useState<string | undefined>();

  // Group dialog states
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  // Athlete dialog states
  const [isAthleteDialogOpen, setIsAthleteDialogOpen] = useState(false);
  const [athleteToEdit, setAthleteToEdit] = useState<Athlete | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [newAthleteFirstName, setNewAthleteFirstName] = useState("");
  const [newAthleteLastName, setNewAthleteLastName] = useState("");
  const [newAthletePhone, setNewAthletePhone] = useState("");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Group handlers
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
    const success = await onSaveGroup(groupToEdit?.id || null, newGroupName);
    if (success) {
      handleCloseGroupDialog();
      await onRefreshData();
    }
  }

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    const success = await onDeleteGroup(groupToDelete.id, groupToDelete.name);
    if (success) {
      setOpenAccordion(undefined);
      setGroupToDelete(null);
      await onRefreshData();
    }
  }

  // Athlete handlers
  const handleOpenAthleteDialog = (athlete: Athlete | null = null, groupId: string) => {
    setAthleteToEdit(athlete);
    setActiveGroupId(groupId);
    setNewAthleteFirstName(athlete?.firstName || "");
    setNewAthleteLastName(athlete?.lastName || "");
    setNewAthletePhone(athlete?.phone || "");
    setIsAthleteDialogOpen(true);
  }

  const handleCloseAthleteDialog = () => {
    setIsAthleteDialogOpen(false);
    setAthleteToEdit(null);
    setActiveGroupId(null);
    setNewAthleteFirstName("");
    setNewAthleteLastName("");
    setNewAthletePhone("");
  }

  const handleSaveAthlete = async () => {
    if (!activeGroupId && !athleteToEdit) return;
    
    const groupId = activeGroupId || athleteToEdit?.groupId || "";
    const success = await onSaveAthlete(
      athleteToEdit?.id || null, 
      newAthleteFirstName, 
      newAthleteLastName, 
      newAthletePhone, 
      groupId
    );
    
    if (success) {
      handleCloseAthleteDialog();
      await onRefreshData();
    }
  }

  const handleDeleteAthlete = async () => {
    if (!athleteToDelete) return;
    const success = await onDeleteAthlete(athleteToDelete.id, athleteToDelete.firstName, athleteToDelete.lastName);
    if (success) {
      setAthleteToDelete(null);
      await onRefreshData();
    }
  }

  return (
    <>
      <Card className="bg-white border-2 border-gray-200 rounded-xl shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <Users className="h-6 w-6" />
                ניהול קבוצות וספורטאים
              </CardTitle>
            </div>
            {isManager && (
              <Button 
                onClick={() => handleOpenGroupDialog()}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <PlusCircle className="me-2 h-4 w-4" />
                הוסף קבוצה
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {groups.length > 0 ? (
            <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
              {groups.map(group => (
                <AccordionItem value={group.id} key={group.id} className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
                  <div className="flex items-center w-full bg-gray-50 justify-between">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline flex-1 px-4 py-3 hover:bg-gray-100 transition-colors">
                      <span className="flex-1 text-right me-4">{group.name}</span>
                    </AccordionTrigger>
                    {isManager && (
                      <div className="flex items-center gap-1 px-4">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenGroupDialog(group)} className="h-8 w-8 hover:bg-gray-200">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog onOpenChange={(isOpen) => !isOpen && setGroupToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setGroupToDelete(group)} className="h-8 w-8 hover:bg-red-100">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
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
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      {isManager && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mb-4 border-2 border-primary/30 text-primary hover:bg-primary/5" 
                          onClick={() => handleOpenAthleteDialog(null, group.id)}
                        >
                          <UserPlus className="me-2 h-4 w-4" /> הוסף ספורטאי לקבוצה
                        </Button>
                      )}
                      {(athletesByGroup[group.id] || []).length > 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="text-right font-semibold text-gray-700">שם פרטי</TableHead>
                                <TableHead className="text-right font-semibold text-gray-700">שם משפחה</TableHead>
                                                                        {isManager && <TableHead className="text-left font-semibold text-gray-700">פעולות</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(athletesByGroup[group.id] || []).map(athlete => (
                                <TableRow key={athlete.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                  <TableCell className="py-3">{athlete.firstName}</TableCell>
                                  <TableCell className="py-3">{athlete.lastName}</TableCell>
                                  {isManager && (
                                    <TableCell className="text-right py-3">
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenAthleteDialog(athlete, group.id)} className="h-8 w-8 hover:bg-gray-200">
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog onOpenChange={(isOpen) => !isOpen && setAthleteToDelete(null)}>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setAthleteToDelete(athlete)} className="h-8 w-8 hover:bg-red-100">
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
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
                                      </div>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                          <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-muted-foreground">עדיין אין ספורטאים בקבוצה זו.</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg text-muted-foreground">לא נמצאו קבוצות.</p>
              {isManager && <p className="mt-2 text-muted-foreground">לחץ על "הוסף קבוצה" כדי להתחיל.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle>{groupToEdit ? 'עריכת שם קבוצה' : 'יצירת קבוצה חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="group-name">שם הקבוצה</Label>
            <Input 
              id="group-name" 
              value={newGroupName} 
              onChange={(e) => setNewGroupName(e.target.value)} 
              className="mt-2 border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors" 
              placeholder="לדוגמא: בוגרים"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseGroupDialog}>ביטול</Button>
            <Button 
              onClick={handleSaveGroup}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {groupToEdit ? 'שמור שינויים' : 'צור קבוצה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Athlete Dialog */}
      <Dialog open={isAthleteDialogOpen} onOpenChange={handleCloseAthleteDialog}>
        <DialogContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle>{athleteToEdit ? 'עריכת פרטי ספורטאי' : 'הוספת ספורטאי חדש'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">שם פרטי</Label>
              <Input 
                id="firstName" 
                value={newAthleteFirstName} 
                onChange={(e) => setNewAthleteFirstName(e.target.value)} 
                className="border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input 
                id="lastName" 
                value={newAthleteLastName} 
                onChange={(e) => setNewAthleteLastName(e.target.value)} 
                className="border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input 
                id="phone" 
                value={newAthletePhone} 
                onChange={(e) => setNewAthletePhone(e.target.value)} 
                className="border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors"
              />
            </div>
            {athleteToEdit && (
              <div className="space-y-2">
                <Label htmlFor="athleteGroup">העבר לקבוצה</Label>
                <Select dir="rtl" value={activeGroupId || ""} onValueChange={(value) => setActiveGroupId(value)}>
                  <SelectTrigger id="athleteGroup" className="border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors">
                    <SelectValue />
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
            <Button 
              onClick={handleSaveAthlete}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {athleteToEdit ? 'שמור שינויים' : 'צור ספורטאי'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}