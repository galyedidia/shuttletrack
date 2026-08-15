import { useState, useEffect, useCallback } from 'react';
import { getGroups, getCoaches, getAbsenceReasons, getAthletesInGroup } from "@/lib/data";
import type { Athlete, Group, Coach, AbsenceReason } from '@/types';
import { useToast } from "@/hooks/use-toast";

interface SettingsData {
  groups: Group[];
  coaches: Coach[];
  absenceReasons: AbsenceReason[];
  athletesByGroup: Record<string, Athlete[]>;
  loading: boolean;
  refreshData: () => Promise<void>;
}

export function useSettingsData(isManager: boolean): SettingsData {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [absenceReasons, setAbsenceReasons] = useState<AbsenceReason[]>([]);
  const [athletesByGroup, setAthletesByGroup] = useState<Record<string, Athlete[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch core data in parallel
      const [groupsData, coachesData, reasonsData] = await Promise.all([
        getGroups(),
        isManager ? getCoaches() : Promise.resolve([]),
        isManager ? getAbsenceReasons() : Promise.resolve([])
      ]);
      
      setGroups(groupsData);
      setCoaches(coachesData);
      setAbsenceReasons(reasonsData);

      // Fetch athletes for each group
      const athletesData: Record<string, Athlete[]> = {};
      for (const group of groupsData) {
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
        description: "לא ניתן היה לטעון את הגדרות המערכת.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast, isManager]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    groups,
    coaches,
    absenceReasons,
    athletesByGroup,
    loading,
    refreshData: fetchAllData
  };
}