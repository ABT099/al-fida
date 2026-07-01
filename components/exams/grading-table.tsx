"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckIcon, SearchIcon, UsersIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  upsertExamStudent,
  bulkUpsertAttendance,
  finalizeExam,
} from "@/app/(dashboard)/exams/[id]/grade/actions"

export type GradingRow = {
  student_id: number
  first_name: string
  last_name: string
  attended: boolean
  grade: number
}

export function GradingTable({
  examId,
  finalized,
  initialRows,
}: {
  examId: number
  finalized: boolean
  initialRows: GradingRow[]
}) {
  const router = useRouter()
  const [rows, setRows] = React.useState(initialRows)
  const [query, setQuery] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [savingIds, setSavingIds] = React.useState<Set<number>>(new Set())
  const [savedIds, setSavedIds] = React.useState<Set<number>>(new Set())
  const [finalizing, setFinalizing] = React.useState(false)
  const gradeInputRefs = React.useRef<Map<number, HTMLInputElement>>(new Map())

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(q)
    )
  }, [rows, query])

  function flashSaved(student_id: number) {
    setSavedIds((prev) => new Set(prev).add(student_id))
    setTimeout(() => {
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(student_id)
        return next
      })
    }, 1500)
  }

  // Always sends the row's full current {attended, grade} — never a partial patch —
  // since both columns are NOT NULL and a partial upsert could silently zero out
  // an already-saved grade when only attendance changes (or vice versa).
  async function persist(
    student_id: number,
    patch: Partial<Pick<GradingRow, "attended" | "grade">>
  ) {
    const row = rows.find((r) => r.student_id === student_id)
    if (!row) return
    const next = { ...row, ...patch }

    setSavingIds((prev) => new Set(prev).add(student_id))
    const result = await upsertExamStudent(examId, student_id, next.attended, next.grade)
    setSavingIds((prev) => {
      const n = new Set(prev)
      n.delete(student_id)
      return n
    })
    if (result.error) {
      toast.error(result.error)
      return
    }
    flashSaved(student_id)
  }

  function handleAttendedChange(student_id: number, attended: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.student_id === student_id ? { ...r, attended } : r))
    )
    persist(student_id, { attended })
  }

  function handleGradeChange(student_id: number, value: string) {
    const grade = value === "" ? 0 : Number(value)
    setRows((prev) =>
      prev.map((r) => (r.student_id === student_id ? { ...r, grade } : r))
    )
  }

  function handleGradeBlur(student_id: number) {
    const row = rows.find((r) => r.student_id === student_id)
    if (!row) return
    persist(student_id, { grade: row.grade })
  }

  function toggleSelect(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.student_id))
  const someFilteredSelected = filtered.some((r) => selectedIds.has(r.student_id))

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      filtered.forEach((r) => (checked ? next.add(r.student_id) : next.delete(r.student_id)))
      return next
    })
  }

  async function bulkSetAttended(attended: boolean) {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    setRows((prev) =>
      prev.map((r) => (ids.includes(r.student_id) ? { ...r, attended } : r))
    )
    setSavingIds((prev) => new Set([...prev, ...ids]))
    const updates = ids.map((id) => {
      const row = rows.find((r) => r.student_id === id)!
      return { student_id: id, grade: row.grade }
    })
    const result = await bulkUpsertAttendance(examId, updates, attended)
    setSavingIds((prev) => {
      const n = new Set(prev)
      ids.forEach((id) => n.delete(id))
      return n
    })
    if (result.error) {
      toast.error(result.error)
      return
    }
    ids.forEach(flashSaved)
    toast.success("تم تحديث حالة الحضور")
  }

  function handleGradeKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault()
      const next = filtered[index + 1]
      if (next) gradeInputRefs.current.get(next.student_id)?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prev = filtered[index - 1]
      if (prev) gradeInputRefs.current.get(prev.student_id)?.focus()
    }
  }

  async function handleFinalize() {
    setFinalizing(true)
    const result = await finalizeExam(examId)
    setFinalizing(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("تم اعتماد الامتحان بنجاح")
    router.refresh()
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
        <UsersIcon className="size-8 text-muted-foreground" />
        <p className="font-medium">لا يوجد طلاب مسجلون في هذه المادة حالياً</p>
        <p className="text-sm text-muted-foreground">
          تأكد من تسجيل الطلاب في فصل دراسي يتضمن هذه المادة
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {finalized && (
        <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
          تم اعتماد هذا الامتحان. الدرجات مقفلة ولا يمكن تعديلها.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-48 flex-1">
          <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم الطالب"
            className="ps-8"
          />
        </div>
        {!finalized && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" disabled={finalizing}>
                إنهاء التصحيح
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>اعتماد الامتحان نهائياً</AlertDialogTitle>
                <AlertDialogDescription>
                  بعد الاعتماد، لن تتمكن من تعديل أي درجة أو بيانات حضور لهذا
                  الامتحان، كما لن يمكن تعديل أو حذف الامتحان نفسه. سيتم اعتماد
                  الدرجات الحالية لجميع الطلاب المسجلين، وستصبح إمكانية إنشاء
                  التقرير متاحة بعد ذلك. هذا الإجراء نهائي ولا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleFinalize}>
                  تأكيد الاعتماد
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {!finalized && selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
          <p className="text-sm text-muted-foreground">تم تحديد {selectedIds.size} طالب</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => bulkSetAttended(true)}>
              تحديد كحاضر
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulkSetAttended(false)}>
              تحديد كغائب
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allFilteredSelected || (someFilteredSelected && "indeterminate")}
                  onCheckedChange={(v) => toggleSelectAll(!!v)}
                  disabled={finalized}
                  aria-label="تحديد الكل"
                />
              </TableHead>
              <TableHead>الطالب</TableHead>
              <TableHead className="w-32">الحضور</TableHead>
              <TableHead className="w-40">الدرجة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  لم يتم العثور على طلاب مطابقين لبحثك
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, index) => (
                <TableRow key={row.student_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(row.student_id)}
                      onCheckedChange={(v) => toggleSelect(row.student_id, !!v)}
                      disabled={finalized}
                      aria-label="تحديد الطالب"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.first_name} {row.last_name}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={row.attended}
                      onCheckedChange={(v) => handleAttendedChange(row.student_id, !!v)}
                      disabled={finalized}
                      aria-label="حاضر"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`grade-${row.student_id}`} className="sr-only">
                        الدرجة
                      </Label>
                      <Input
                        id={`grade-${row.student_id}`}
                        type="number"
                        min={0}
                        className="h-8 w-20"
                        value={row.grade}
                        disabled={finalized || !row.attended}
                        ref={(el) => {
                          if (el) gradeInputRefs.current.set(row.student_id, el)
                          else gradeInputRefs.current.delete(row.student_id)
                        }}
                        onChange={(e) => handleGradeChange(row.student_id, e.target.value)}
                        onBlur={() => handleGradeBlur(row.student_id)}
                        onKeyDown={(e) => handleGradeKeyDown(e, index)}
                      />
                      {savingIds.has(row.student_id) && (
                        <span className="text-xs text-muted-foreground">جارٍ الحفظ...</span>
                      )}
                      {savedIds.has(row.student_id) && (
                        <CheckIcon className="size-3.5 text-primary" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
