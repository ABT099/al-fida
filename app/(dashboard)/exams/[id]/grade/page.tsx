import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { FileTextIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getCourseRoster } from "@/app/(dashboard)/exams/roster"
import { Button } from "@/components/ui/button"
import { GradingTable, type GradingRow } from "@/components/exams/grading-table"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const examId = Number(id)
  const supabase = createClient(await cookies())

  const { data: exam } = await supabase
    .from("exams")
    .select("*, course:courses!course_id(id, name)")
    .eq("id", examId)
    .single()

  if (!exam) notFound()

  const [roster, { data: examStudents }] = await Promise.all([
    getCourseRoster(supabase, exam.course_id),
    supabase.from("exams_students").select("*").eq("exam_id", examId),
  ])

  const examStudentsMap = new Map(
    (examStudents ?? []).map((es) => [es.student_id, es])
  )
  const initialRows: GradingRow[] = roster.map((r) => {
    const existing = examStudentsMap.get(r.student_id)
    return {
      student_id: r.student_id,
      first_name: r.first_name,
      last_name: r.last_name,
      attended: existing?.attended ?? true,
      grade: existing?.grade ?? 0,
    }
  })

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{exam.name}</h1>
          <p className="text-sm text-muted-foreground">{exam.course?.name}</p>
        </div>
        {exam.finalized && (
          <Button asChild variant="outline">
            <Link href={`/exams/report?ids=${exam.id}`}>
              <FileTextIcon data-icon="inline-start" />
              عرض التقرير
            </Link>
          </Button>
        )}
      </div>
      <GradingTable examId={exam.id} finalized={exam.finalized} initialRows={initialRows} />
    </div>
  )
}
