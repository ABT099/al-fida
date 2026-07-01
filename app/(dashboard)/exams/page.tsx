import { cookies } from "next/headers"
import { PlusIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ExamFormDialog } from "@/components/exams/exam-form-dialog"
import {
  ExamsTable,
  type Exam,
  type CourseOption,
} from "@/components/exams/exams-table"

export default async function Page() {
  const supabase = createClient(await cookies())

  const [{ data: exams }, { data: courses }] = await Promise.all([
    supabase
      .from("exams")
      .select("*, course:courses!course_id(id, name)")
      .order("created_at", { ascending: false }),
    supabase.from("courses").select("id, name").order("name"),
  ])

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">الامتحانات</h1>
        <ExamFormDialog
          courses={(courses as CourseOption[]) ?? []}
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              إضافة امتحان
            </Button>
          }
        />
      </div>
      <ExamsTable
        exams={(exams as Exam[]) ?? []}
        courses={(courses as CourseOption[]) ?? []}
      />
    </div>
  )
}
