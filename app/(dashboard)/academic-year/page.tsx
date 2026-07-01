import { cookies } from "next/headers"
import { PlusIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AcademicYearFormDialog } from "@/components/academic-year/academic-year-form-dialog"
import {
  AcademicYearsGrid,
  type AcademicYear,
  type SemesterOption,
} from "@/components/academic-year/academic-years-grid"

export default async function Page() {
  const supabase = createClient(await cookies())

  const [{ data: years }, { data: semesters }] = await Promise.all([
    supabase
      .from("academic_years")
      .select("*, current_semester_ref:semesters!current_semester(id, name)")
      .order("starts_at", { ascending: false }),
    supabase
      .from("semesters")
      .select("id, name, acedemic_year_id"),
  ])

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">السنوات الدراسية</h1>
        <AcademicYearFormDialog
          semesters={[]}
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              إضافة سنة دراسية
            </Button>
          }
        />
      </div>
      <AcademicYearsGrid
        years={(years as AcademicYear[]) ?? []}
        semesters={(semesters as SemesterOption[]) ?? []}
      />
    </div>
  )
}
