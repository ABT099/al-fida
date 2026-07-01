import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { ExamReportSection, type ExamWithRoster } from "@/components/exams/exam-report"
import { PrintButton } from "@/components/exams/print-button"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const { ids: idsParam } = await searchParams
  const ids = (idsParam ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)

  if (ids.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">لم يتم تحديد أي امتحان لعرض تقريره</p>
        <p className="text-sm text-muted-foreground">
          ارجع إلى صفحة الامتحانات وحدد امتحاناً واحداً على الأقل لإنشاء التقرير
        </p>
      </div>
    )
  }

  const supabase = createClient(await cookies())
  const { data: exams } = await supabase
    .from("exams")
    .select(
      "*, course:courses!course_id(id, name), exams_students(student_id, attended, grade, students(id, first_name, last_name))"
    )
    .in("id", ids)
    .eq("finalized", true)
    .order("created_at", { ascending: false })

  const skippedCount = ids.length - (exams?.length ?? 0)

  if (!exams || exams.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
        <p className="font-medium">لا يمكن عرض التقرير</p>
        <p className="text-sm text-muted-foreground">
          الامتحانات المحددة غير معتمدة بعد. يجب اعتماد الامتحان أولاً من صفحة التصحيح.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8 print:px-0 print:gap-0">
      <div className="flex items-center justify-between border-b pb-4 print:border-none print:pb-2">
        <div>
          <h1 className="text-2xl font-semibold">تقرير الامتحانات</h1>
          <p className="text-sm text-muted-foreground">
            تم إنشاؤه في {new Date().toLocaleDateString("ar")}
          </p>
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>
      {skippedCount > 0 && (
        <p className="text-sm text-muted-foreground print:hidden">
          تم تجاهل {skippedCount} امتحان غير معتمد من هذا التقرير.
        </p>
      )}
      <div className="flex flex-col gap-6 print:gap-0">
        {exams.map((exam, index) => (
          <ExamReportSection
            key={exam.id}
            exam={exam as unknown as ExamWithRoster}
            isLast={index === exams.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
