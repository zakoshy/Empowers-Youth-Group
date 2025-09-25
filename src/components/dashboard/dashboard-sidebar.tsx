'use client';
import Link from "next/link";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
} from "@/components/ui/sidebar"
import { EmpowerHubLogo } from "../icons";
import { dashboardNavLinks } from "@/lib/data";
import { Bell, Home, LineChart, Package, Package2, ShoppingCart, Users, Vote, FileText, DollarSign, TrendingUp, Calendar, Settings, BookOpen } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

const icons: { [key: string]: React.ElementType } = {
  Home,
  Vote,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  BookOpen,
  Settings
};

interface UserProfile {
    role: string;
}

export function DashboardSidebar() {
    const { user } = useUser();
    const firestore = useFirestore();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'userProfiles', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

    // In a real app, you'd get the user's role from the session.
    const userRole = userProfile?.role || "Member"; 
    const navItems = dashboardNavLinks(userRole);

    return (
        <Sidebar>
            <SidebarHeader>
                 <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg">
                    <EmpowerHubLogo className="h-6 w-6 text-primary" />
                    <span>EmpowerHub</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map(item => {
                        const Icon = icons[item.icon];
                        return (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton asChild tooltip={item.label}>
                                    <Link href={item.href}>
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
                <Card>
                    <CardHeader className="p-2 pt-0 md:p-4">
                        <CardTitle>Need Help?</CardTitle>
                        <CardDescription>
                            Contact support for any questions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                        <Button size="sm" className="w-full">
                            Contact Us
                        </Button>
                    </CardContent>
                </Card>
            </SidebarFooter>
        </Sidebar>
    )
}
