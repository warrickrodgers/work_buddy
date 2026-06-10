// web-ui/src/components/app-sidebar.tsx
import * as React from "react"
import { useEffect, useState } from "react"
import {
  Command,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import getAppNavigationData, { type OutlineNav } from "@/lib/appNavigationData"
import { challengeApi } from "@/lib/api"
import api from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const [navData, setNavData] = useState(getAppNavigationData());

  useEffect(() => {
    const fetchNav = async () => {
      if (!user?.id) return;

      const challenges = await challengeApi.getAll(user.id);
      const simpleChallenges = challenges.map(c => ({ id: c.id, title: c.title }));

      // Fetch outlines for each challenge in parallel
      const outlineResults = await Promise.all(
        challenges.map(c =>
          api.get(`/challenges/${c.id}/outlines`)
            .then(r => (r.data.outlines as any[]).map((o): OutlineNav => ({
              id: o.id,
              title: o.title,
              challengeId: c.id,
            })))
            .catch(() => [] as OutlineNav[])
        )
      );
      const outlines = outlineResults.flat();

      setNavData(getAppNavigationData(simpleChallenges, outlines));
    };

    fetchNav();
  }, [user?.id]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Work Buddy</span>
                  <span className="truncate text-xs">Empowering You</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}