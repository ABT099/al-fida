import { cookies } from "next/headers"
import { PlusIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { SemesterFormDialog } from "@/components/semesters/semester-form-dialog"
import {
  SemestersGrid,
  type Semester,
  type YearOption,
  type CourseOption,
} from "@/components/semesters/semesters-grid"

export default async function Page() {
  const supabase = createClient(await cookies())

  const [{ data: semesters }, { data: years }, { data: courses }] =
    await Promise.all([
      supabase
        .from("semesters")
        .select(
          "*, academic_year:academic_years!acedemic_year_id(id, label), semesters_courses(course_id)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("academic_years")
        .select("id, label")
        .order("starts_at", { ascending: false }),
      supabase.from("courses").select("id, name").order("name"),
    ])

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">الفصول الدراسية</h1>
        <SemesterFormDialog
          years={(years as YearOption[]) ?? []}
          courses={(courses as CourseOption[]) ?? []}
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              إضافة فصل دراسي
            </Button>
          }
        />
      </div>
      <SemestersGrid
        semesters={(semesters as Semester[]) ?? []}
        years={(years as YearOption[]) ?? []}
        courses={(courses as CourseOption[]) ?? []}
      />
    </div>
  )
}
