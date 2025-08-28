
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ClipboardList,
  Lightbulb,
  FileText,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { AppLogo } from "@/components/icons";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/", label: "לוח אימונים", icon: ClipboardList },
  { href: "/analysis", label: "ניתוח הערות", icon: Lightbulb },
  { href: "/reports", label: "דוחות", icon: FileText },
  { href: "/settings", label: "הגדרות", icon: Settings },
];

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <Link href={href}>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setOpen(false)}
        >
            <Icon />
            <span>{label}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}

function UserProfile() {
    const { user, coachName, signOut } = useAuth();
    if (!user) return null;

    const fallback = coachName ? coachName.charAt(0).toUpperCase() : 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 w-full justify-start px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage data-ai-hint="avatar" src={user.photoURL || `https://placehold.co/40x40.png`} alt={coachName || 'User'} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start ms-2 text-start">
                  <p className="font-medium text-sm">{coachName || 'מאמן'}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.phoneNumber || 'מנהל'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{coachName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.phoneNumber}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="ms-2 h-4 w-4" />
                <span>פרופיל</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="ms-2 h-4 w-4" />
                <span>התנתקות</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
    )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user && pathname !== '/login') {
      return null; // Or a loading spinner, handled by AuthProvider
  }
  
  if (pathname === '/login') {
      return <>{children}</>;
  }


  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="offcanvas" className="border-l bg-background">
        <SidebarHeader>
          <Button variant="ghost" className="h-10 w-full justify-start px-2">
            <AppLogo className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg">ShuttleTrack</span>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <UserProfile />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {navItems.find((item) => item.href === pathname)?.label}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
