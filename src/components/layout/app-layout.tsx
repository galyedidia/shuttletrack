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
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "לוח נוכחות", icon: ClipboardList },
  { href: "/analysis", label: "ניתוח הערות", icon: Lightbulb },
  { href: "/reports", label: "דוחות", icon: FileText },
  { href: "/settings", label: "הגדרות", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar side="right" collapsible="icon" className="border-l">
        <SidebarHeader>
          <Button variant="ghost" className="h-10 w-full justify-start px-2">
            <AppLogo className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg">ShuttleTrack</span>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label }}
                  >
                    <a>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 w-full justify-start px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="מאמן" />
                  <AvatarFallback>M</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start ms-2 text-start">
                  <p className="font-medium text-sm">מאמן ראשי</p>
                  <p className="text-xs text-muted-foreground">מנהל</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">מאמן ראשי</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    coach@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="ms-2 h-4 w-4" />
                <span>פרופיל</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="ms-2 h-4 w-4" />
                <span>התנתקות</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
