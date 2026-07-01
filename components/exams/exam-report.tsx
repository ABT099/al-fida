import {
  CalendarIcon,
  ClockIcon,
  GraduationCapIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function formatExamTime(t: string | null) {
  if (!t) return "بدون موعد محدد"
  const [h, m] = t.split(":")
  return `${h}:${m}`
}

export type ExamReportRow = {
  student_id: number
  attended: boolean
  grade: number
  students: { id: number; first_name: string; last_name: string } | null
}

export type ExamWithRoster = {
  id: number
  name: string
  created_at: string
  exam_time: string | null
  course: { id: number; name: string } | null
  exams_students: ExamReportRow[]
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&>svg]:size-5">
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {label}
          {sub && <span className="ms-1">({sub})</span>}
        </p>
      </div>
    </div>
  )
}

export function ExamReportSection({
  exam,
  isLast,
}: {
  exam: ExamWithRoster
  isLast?: boolean
}) {
  const rows = exam.exams_students ?? []
  const attendedCount = rows.filter((r) => r.attended).length
  const gradesOfAttended = rows.filter((r) => r.attended).map((r) => r.grade)
  const attendanceRate = rows.length
    ? Math.round((attendedCount / rows.length) * 100)
    : 0
  const average = gradesOfAttended.length
    ? (gradesOfAttended.reduce((a, b) => a + b, 0) / gradesOfAttended.length).toFixed(2)
    : "—"

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border shadow-sm break-inside-avoid",
        "print:rounded-none print:border print:shadow-none",
        !isLast && "print:break-after-page"
      )}
    >
      <header className="bg-primary px-6 py-5 text-primary-foreground">
        <h2 className="text-xl font-semibold">{exam.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-primary-foreground/85">
          <span className="inline-flex items-center gap-1.5">
            <GraduationCapIcon className="size-3.5" />
            {exam.course?.name ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {formatExamTime(exam.exam_time)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            {new Date(exam.created_at).toLocaleDateString("ar")}
          </span>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard icon={<UsersIcon />} label="إجمالي الطلاب" value={rows.length} />
          <StatCard
            icon={<UsersIcon />}
            label="نسبة الحضور"
            value={`${attendanceRate}%`}
            sub={`${attendedCount} من ${rows.length}`}
          />
          <StatCard icon={<TrendingUpIcon />} label="متوسط الدرجات" value={average} />
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/60">
              <th className="p-2.5 text-start font-medium text-muted-foreground">الطالب</th>
              <th className="p-2.5 text-start font-medium text-muted-foreground">الحضور</th>
              <th className="p-2.5 text-start font-medium text-muted-foreground">الدرجة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.student_id}
                className={cn("border-b", i % 2 === 1 && "bg-muted/30")}
              >
                <td className="p-2.5">
                  {r.students?.first_name} {r.students?.last_name}
                </td>
                <td className="p-2.5">
                  {r.attended ? (
                    <Badge>حاضر</Badge>
                  ) : (
                    <Badge variant="destructive">غائب</Badge>
                  )}
                </td>
                <td className="p-2.5 font-medium tabular-nums">
                  {r.attended ? r.grade : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
