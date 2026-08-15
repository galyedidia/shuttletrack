import { useToast } from "@/hooks/use-toast";
import { 
  addGroup, updateGroup, deleteGroup,
  addAthlete, updateAthlete, deleteAthlete,
  addCoach, updateCoach, deleteCoach
} from "@/lib/data";

interface CrudOperations {
  // Group operations
  saveGroup: (id: string | null, name: string) => Promise<boolean>;
  removeGroup: (id: string, name: string) => Promise<boolean>;
  
  // Athlete operations
  saveAthlete: (
    id: string | null, 
    firstName: string, 
    lastName: string, 
    phone: string, 
    groupId: string
  ) => Promise<boolean>;
  removeAthlete: (id: string, firstName: string, lastName: string) => Promise<boolean>;
  
  // Coach operations
  saveCoach: (
    id: string | null,
    firstName: string,
    lastName: string,
    phone: string,
    role: 'manager' | 'coach'
  ) => Promise<boolean>;
  removeCoach: (id: string, firstName: string, lastName: string) => Promise<boolean>;
}

export function useCrudOperations(): CrudOperations {
  const { toast } = useToast();

  const saveGroup = async (id: string | null, name: string): Promise<boolean> => {
    if (!name.trim()) {
      toast({ title: "שם הקבוצה ריק", description: "יש להזין שם לקבוצה.", variant: "destructive" });
      return false;
    }

    try {
      if (id) {
        await updateGroup(id, name);
        toast({ title: "קבוצה עודכנה", description: `הקבוצה ${name} עודכנה בהצלחה.` });
      } else {
        await addGroup(name);
        toast({ title: "קבוצה נוצרה", description: `הקבוצה ${name} נוצרה בהצלחה.` });
      }
      return true;
    } catch (error) {
      toast({ title: "שגיאה", description: "אירעה שגיאה בעת שמירת הקבוצה.", variant: "destructive" });
      return false;
    }
  };

  const removeGroup = async (id: string, name: string): Promise<boolean> => {
    try {
      await deleteGroup(id);
      toast({ title: "קבוצה נמחקה", description: `הקבוצה ${name} נמחקה בהצלחה.` });
      return true;
    } catch (error) {
      toast({ title: "שגיאה", description: "אירעה שגיאה בעת מחיקת הקבוצה.", variant: "destructive" });
      return false;
    }
  };

  const saveAthlete = async (
    id: string | null, 
    firstName: string, 
    lastName: string, 
    phone: string, 
    groupId: string
  ): Promise<boolean> => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "שם הספורטאי אינו מלא", description: "יש להזין שם פרטי ושם משפחה.", variant: "destructive" });
      return false;
    }

    try {
      if (id) {
        await updateAthlete(id, { firstName, lastName, phone, groupId });
        toast({ title: "ספורטאי עודכן", description: `פרטי ${firstName} ${lastName} עודכנו.` });
      } else {
        await addAthlete(firstName, lastName, phone, groupId);
        toast({ title: "ספורטאי נוסף", description: `${firstName} ${lastName} נוסף לקבוצה.` });
      }
      return true;
    } catch (error) {
      toast({ title: "שגיאה", description: "אירעה שגיאה בעת שמירת הספורטאי.", variant: "destructive" });
      return false;
    }
  };

  const removeAthlete = async (id: string, firstName: string, lastName: string): Promise<boolean> => {
    try {
      await deleteAthlete(id);
      toast({ title: "ספורטאי נמחק", description: `${firstName} ${lastName} נמחק בהצלחה.` });
      return true;
    } catch (error) {
      toast({ title: "שגיאה", description: "אירעה שגיאה במחיקת הספורטאי.", variant: "destructive" });
      return false;
    }
  };

  const saveCoach = async (
    id: string | null,
    firstName: string,
    lastName: string,
    phone: string,
    role: 'manager' | 'coach'
  ): Promise<boolean> => {
    const israeliPhoneRegex = /^(05\d-?\d{7}|\+9725\d-?\d{7})$/;
    
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toast({ title: "שדות חסרים", description: "יש למלא שם פרטי, שם משפחה ומספר טלפון.", variant: "destructive" });
      return false;
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+972${phone.substring(1)}`;

    if (!israeliPhoneRegex.test(phone.replace("-", ""))) {
      toast({ title: "מספר טלפון לא תקין", description: "יש להזין מספר טלפון ישראלי תקין.", variant: "destructive" });
      return false;
    }

    try {
      if (id) {
        await updateCoach(id, { firstName, lastName, phone: formattedPhone, role });
        toast({ title: "משתמש עודכן", description: `פרטי ${firstName} ${lastName} עודכנו.` });
      } else {
        await addCoach(firstName, lastName, formattedPhone, role);
        toast({ title: "משתמש נוסף", description: `${firstName} ${lastName} נוסף למערכת.` });
      }
      return true;
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        toast({ title: "מספר טלפון קיים", description: "קיים כבר משתמש עם מספר טלפון זה.", variant: "destructive" });
      } else {
        toast({ title: "שגיאה", description: "אירעה שגיאה בעת שמירת המשתמש.", variant: "destructive" });
      }
      return false;
    }
  };

  const removeCoach = async (id: string, firstName: string, lastName: string): Promise<boolean> => {
    try {
      await deleteCoach(id);
      toast({ title: "משתמש נמחק", description: `${firstName} ${lastName} נמחק מהמערכת.` });
      return true;
    } catch (error) {
      toast({ title: "שגיאה", description: "אירעה שגיאה במחיקת המשתמש.", variant: "destructive" });
      return false;
    }
  };

  return {
    saveGroup,
    removeGroup,
    saveAthlete,
    removeAthlete,
    saveCoach,
    removeCoach
  };
}