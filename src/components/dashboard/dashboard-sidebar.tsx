
'use client';
import Link from "next/link";
import React, { useState } from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
} from "@/components/ui/sidebar"
import { TheEmpowersYouthGroupLogo } from "../icons";
import { dashboardNavLinks } from "@/lib/data";
import { Home, LineChart, Package, Package2, ShoppingCart, Users, Vote, FileText, DollarSign, TrendingUp, Calendar, Settings, BookOpen, LogOut, Video } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const icons: { [key: string]: React.ElementType } = {
  Home,
  Vote,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  BookOpen,
  Settings,
  Video,
};

interface UserProfile {
    role: string;
}

export function DashboardSidebar() {
    const { user } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const pathname = usePathname();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'userProfiles', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

    const userRole = userProfile?.role || "Member"; 
    const navItems = dashboardNavLinks(userRole);

    const handleLogout = async () => {
        try {
          await signOut(auth);
          toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
          });
          window.location.href = "/";
        } catch (error) {
          console.error("Logout Error: ", error);
          toast({
            variant: "destructive",
            title: "Logout Failed",
            description: "Something went wrong. Please try again.",
          });
        }
    };

    return (
        <>
            <Sidebar>
                <SidebarHeader>
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg">
                        <TheEmpowersYouthGroupLogo className="h-6 w-6 text-primary" />
                        <span>The Empowers youth group</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {navItems.map(item => {
                            const Icon = icons[item.icon];
                            const isActive = pathname === item.href;
                            const isExternal = item.href.startsWith('http');

                            const linkProps = isExternal 
                                ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
                                : { href: item.href };

                            return (
                                <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton asChild tooltip={item.label} isActive={isActive}>
                                        <Link {...linkProps}>
                                            {Icon && <Icon />}
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                                <LogOut />
                                <span>Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
        </>
    )
}
