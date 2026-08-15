"use client";

import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSettingsData } from '@/hooks/useSettingsData';
import { useCrudOperations } from '@/hooks/useCrudOperations';
import { GroupsTab } from '@/components/settings/GroupsTab';
import { UsersTab } from '@/components/settings/UsersTab';
import { AbsenceReasonsTab } from '@/components/settings/AbsenceReasonsTab';

export default function SettingsPage() {
  const { role } = useAuth();
  const isManager = role === 'manager';
  const [activeTab, setActiveTab] = useState("groups");
  
  const { groups, coaches, absenceReasons, athletesByGroup, loading, refreshData } = useSettingsData(isManager);
  const { saveGroup, removeGroup, saveAthlete, removeAthlete, saveCoach, removeCoach } = useCrudOperations();

  if (loading) {
    return <div>טוען נתונים...</div>
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="groups" dir="rtl">
      <TabsList className={`grid w-full mb-6 ${isManager ? 'grid-cols-3' : 'grid-cols-1'} bg-gray-100 p-1 rounded-lg`}>
        <TabsTrigger value="groups" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary">
            <Users className="h-4 w-4" />
            קבוצות וספורטאים
        </TabsTrigger>
        {isManager && (
            <>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary">
                משתמשים
            </TabsTrigger>
            <TabsTrigger value="reasons" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary">
                סיבות היעדרות
            </TabsTrigger>
            </>
        )}
        </TabsList>
      
      <TabsContent value="groups">
        <GroupsTab
          groups={groups}
          athletesByGroup={athletesByGroup}
          isManager={isManager}
          onSaveGroup={saveGroup}
          onDeleteGroup={removeGroup}
          onSaveAthlete={saveAthlete}
          onDeleteAthlete={removeAthlete}
          onRefreshData={refreshData}
        />
      </TabsContent>
      
      {isManager && (
        <>
          <TabsContent value="users">
            <UsersTab
              coaches={coaches}
              onSaveCoach={saveCoach}
              onDeleteCoach={removeCoach}
              onRefreshData={refreshData}
            />
          </TabsContent>
          
          <TabsContent value="reasons">
            <AbsenceReasonsTab
              absenceReasons={absenceReasons}
              onRefreshData={refreshData}
            />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}