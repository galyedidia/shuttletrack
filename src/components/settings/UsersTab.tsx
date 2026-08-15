import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Trash2, Edit, Settings } from 'lucide-react';
import type { Coach } from '@/types';

interface UsersTabProps {
  coaches: Coach[];
  onSaveCoach: (
    id: string | null,
    firstName: string,
    lastName: string,
    phone: string,
    role: 'manager' | 'coach'
  ) => Promise<boolean>;
  onDeleteCoach: (id: string, firstName: string, lastName: string) => Promise<boolean>;
  onRefreshData: () => Promise<void>;
}

export function UsersTab({
  coaches,
  onSaveCoach,
  onDeleteCoach,
  onRefreshData
}: UsersTabProps) {
  // User dialog states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Coach | null>(null);
  const [userToDelete, setUserToDelete] = useState<Coach | null>(null);
  const [newCoachFirstName, setNewCoachFirstName] = useState("");
  const [newCoachLastName, setNewCoachLastName] = useState("");
  const [newCoachPhone, setNewCoachPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<'manager' | 'coach'>('coach');

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
    const success = await onSaveCoach(
      userToEdit?.id || null,
      newCoachFirstName,
      newCoachLastName,
      newCoachPhone,
      newUserRole
    );
    
    if (success) {
      handleCloseUserDialog();
      await onRefreshData();
    }
  }
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const success = await onDeleteCoach(userToDelete.id, userToDelete.firstName, userToDelete.lastName);
    if (success) {
      setUserToDelete(null);
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
                <Settings className="h-6 w-6" />
                ניהול משתמשים
              </CardTitle>
              <CardDescription className="mt-2">הוסף ונהל מאמנים ומנהלים.</CardDescription>
            </div>
            <Button 
              onClick={() => handleOpenUserDialog()}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <UserPlus className="me-2 h-4 w-4" />
              הוסף משתמש
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-right font-semibold text-gray-700">שם</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">תפקיד</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coaches.map(user => (
                  <TableRow key={user.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <TableCell className="py-3">{user.firstName} {user.lastName}</TableCell>
                    <TableCell className="py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'manager' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'manager' ? 'מנהל' : 'מאמן'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenUserDialog(user)} className="h-8 w-8 hover:bg-gray-200">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} className="h-8 w-8 hover:bg-red-100">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={handleCloseUserDialog}>
        <DialogContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle>{userToEdit ? 'עריכת פרטי משתמש' : 'הוספת משתמש חדש'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="coachFirstName">שם פרטי</Label>
              <Input 
                id="coachFirstName" 
                value={newCoachFirstName} 
                onChange={(e) => setNewCoachFirstName(e.target.value)} 
                className="border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coachLastName">שם משפחה</Label>
              <Input 
                id="coachLastName" 
                value={newCoachLastName} 
                onChange={(e) => setNewCoachLastName(e.target.value)} 
                className="border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coachPhone">טלפון</Label>
              <Input 
                id="coachPhone" 
                value={newCoachPhone} 
                onChange={(e) => setNewCoachPhone(e.target.value)} 
                placeholder="05... או +972..."
                className="border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userRole">תפקיד</Label>
              <Select dir="rtl" value={newUserRole} onValueChange={(value) => setNewUserRole(value as 'manager' | 'coach')}>
                <SelectTrigger id="userRole" className="border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors">
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
            <Button 
              onClick={handleSaveUser}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {userToEdit ? 'שמור שינויים' : 'הוסף משתמש'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}