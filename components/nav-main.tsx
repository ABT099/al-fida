"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDownIcon, CirclePlusIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { StudentFormDialog } from "@/components/students/student-form-dialog"
import type { YearOption, SemesterOption } from "@/components/students/students-table"
import type { NavItem } from "@/lib/nav-items"

export function NavMain({
  items,
}: {
  items: (NavItem & { icon?: React.ReactNode })[]
}) {
  const pathname = usePathname()
  const [quickCreateOpen, setQuickCreateOpen] = React.useState(false)
  const [years, setYears] = React.useState<YearOption[]>([])
  const [semesters, setSemesters] = React.useState<SemesterOption[]>([])
  const dataFetched = React.useRef(false)

  async function openQuickCreate() {
    setQuickCreateOpen(true)
    if (dataFetched.current) return
    dataFetched.current = true
    const supabase = createClient()
    const [{ data: yearsData }, { data: semestersData }] = await Promise.all([
      supabase.from("academic_years").select("id, label").order("starts_at", { ascending: false }),
      supabase.from("semesters").select("id, name, acedemic_year_id").order("name"),
    ])
    setYears((yearsData as YearOption[]) ?? [])
    setSemesters((semestersData as SemesterOption[]) ?? [])
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="انشاء طالب جديد"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              onClick={openQuickCreate}
            >
              <CirclePlusIcon />
              <span>انشاء طالب جديد</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) =>
            item.children ? (
              <Collapsible
                key={item.url}
                defaultOpen={pathname.startsWith(item.url)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={pathname.startsWith(item.url)}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                      <ChevronDownIcon className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === child.url}
                          >
                            <Link href={child.url}>{child.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  asChild
                >
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>

      <StudentFormDialog
        years={years}
        semesters={semesters}
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
      />
    </SidebarGroup>
  )
}
