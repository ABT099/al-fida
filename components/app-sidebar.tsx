"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { navItems } from "@/lib/nav-items"
import {
  LayoutDashboardIcon,
  UsersIcon,
  LibraryBigIcon,
  BookIcon,
  CalendarIcon,
} from "lucide-react"

const icons: Record<string, React.ReactNode> = {
  "/": <LayoutDashboardIcon />,
  "/library": <LibraryBigIcon />,
  "/courses": <BookIcon />,
  "/academic-year": <CalendarIcon />,
  "/students": <UsersIcon />,
}

const data = {
  navMain: navItems.map((item) => ({ ...item, icon: icons[item.url] })),
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar: string | null
  }
}) {
  return (
    <Sidebar side="right" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="p-1.5!">
            <a href="#">
              <span className="text-base font-semibold">دار الفداء</span>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
