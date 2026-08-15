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
import { PlusCircle, Trash2, Edit, FileText } from 'lucide-react';
import type { AbsenceReason } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { addAbsenceReason, updateAbsenceReason, deleteAbsenceReason } from "@/lib/data";

interface AbsenceReasonsTabProps {
  absenceReasons: AbsenceReason[];
  onRefreshData: () => Promise<void>;
}

export function AbsenceReasonsTab({
  absenceReasons,
  onRefreshData
}: AbsenceReasonsTabProps) {
  const { toast } = useToast();
  
  // Reason dialog states
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [reasonToEdit, setReasonToEdit] = useState<AbsenceReason | null>(null);
  const [reasonToDelete, setReasonToDelete] = useState<AbsenceReason | null>(null);
  const [newReasonName, setNewReasonName] = useState("");

  const handleOpenReasonDialog = (reason: AbsenceReason | null = null) => {
    setReasonToEdit(reason);
    setNewReasonName(reason?.label || "");
    setIsReasonDialogOpen(true);
  }
  
  const handleCloseReasonDialog = () => {
    setIsReasonDialogOpen(false);
    setReasonToEdit(null);
    setNewReasonName("");
  }
  
  const handleSaveReason = async () => {
    if (!newReasonName.trim()) {
      toast({ title: "שם הסיבה ריק", description: "יש להזין שם לסיבת היעדרות.", variant: "destructive" });
      return;
    }

    try {
      if (reasonToEdit) {
        await updateAbsenceReason(reasonToEdit.id, newReasonName);
        toast({ title: "סיבת היעדרות עודכנה", description: `הסיבה "${newReasonName}" עודכנה בהצלחה.` });
      } else {
        await addAbsenceReason(newReasonName);
        toast({ title: "סיבת היעדרות נוצרה", description: `הסיבה "${newReasonName}" נוצרה בהצלחה.` });
      }
      handleCloseReasonDialog();
      await onRefreshData();
    } catch (error) {
      toast({ title: "שגיאה", description: "אירעה שגיאה בעת שמירת סיבת ההיעדרות.", variant: "destructive" });
    }
  }
  
  const handleDeleteReason = async () => {
    if (!reasonToDelete) return;
    try {
      await deleteAbsenceReason(reasonToDelete.id);
      toast({ title: "סיבת היעדרות נמחקה", description: `הסיבה "${reasonToDelete.label}" נמחקה בהצלחה.` });
      setReasonToDelete(null);
      await onRefreshData();
    } catch (error) {
      toast({ title: "שגיאה", description: "אירעה שגיאה במחיקת סיבת ההיעדרות.", variant: "destructive" });
    }
  }

  return (
    <>
      <Card className="bg-white border-2 border-gray-200 rounded-xl shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <FileText className="h-6 w-6" />
                ניהול סיבות היעדרות
              </CardTitle>
              <CardDescription className="mt-2">הוסף ונהל סיבות להיעדרות מאימונים.</CardDescription>
            </div>
            <Button 
              onClick={() => handleOpenReasonDialog()}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <PlusCircle className="me-2 h-4 w-4" />
              הוסף סיבה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {absenceReasons.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-right font-semibold text-gray-700">סיבת היעדרות</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absenceReasons.map(reason => (
                    <TableRow key={reason.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <TableCell className="py-3">{reason.label}</TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenReasonDialog(reason)} className="h-8 w-8 hover:bg-gray-200">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog onOpenChange={(isOpen) => !isOpen && setReasonToDelete(null)}>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setReasonToDelete(reason)} className="h-8 w-8 hover:bg-red-100">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  פעולה זו תמחק את סיבת ההיעדרות "{reasonToDelete?.label}" לצמיתות.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteReason}>מחק</AlertDialogAction>
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
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg text-muted-foreground">לא נמצאו סיבות היעדרות.</p>
              <p className="mt-2 text-muted-foreground">לחץ על "הוסף סיבה" כדי להתחיל.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reason Dialog */}
      <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent className="bg-white border-2 border-gray-200 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle>{reasonToEdit ? 'עריכת סיבת היעדרות' : 'יצירת סיבת היעדרות חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason-name">שם הסיבה</Label>
            <Input 
              id="reason-name" 
              value={newReasonName} 
              onChange={(e) => setNewReasonName(e.target.value)} 
              className="mt-2 border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-primary transition-colors" 
              placeholder="לדוגמא: חולה"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseReasonDialog}>ביטול</Button>
            <Button 
              onClick={handleSaveReason}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {reasonToEdit ? 'שמור שינויים' : 'צור סיבה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}