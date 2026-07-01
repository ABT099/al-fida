"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ClipboardCheckIcon,
  FileTextIcon,
  GraduationCapIcon,
  MoreVerticalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteExam } from "@/app/(dashboard)/exams/actions"
import { ExamFormDialog } from "@/components/exams/exam-form-dialog"

export type CourseOption = { id: number; name: string }

export type Exam = {
  id: number
  created_at: string
  name: string
  exam_time: string | null
  course_id: number
  finalized: boolean
  course?: { id: number; name: string } | null
}

const ALL = "all"

function formatExamTime(t: string | null) {
  if (!t) return "غير محدد"
  const [h, m] = t.split(":")
  return `${h}:${m}`
}

export function ExamsTable({
  exams,
  courses,
}: {
  exams: Exam[]
  courses: CourseOption[]
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [courseFilter, setCourseFilter] = React.useState(ALL)
  const [statusFilter, setStatusFilter] = React.useState(ALL)
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [examToEdit, setExamToEdit] = React.useState<Exam | null>(null)
  const [examToDelete, setExamToDelete] = React.useState<Exam | null>(null)
  const [importOpen, setImportOpen] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return exams.filter((e) => {
      if (courseFilter !== ALL && e.course_id !== Number(courseFilter)) return false
      if (statusFilter === "finalized" && !e.finalized) return false
      if (statusFilter === "in_progress" && e.finalized) return false
      if (!q) return true
      return (
        e.name.toLowerCase().includes(q) ||
        (e.course?.name ?? "").toLowerCase().includes(q)
      )
    })
  }, [exams, query, courseFilter, statusFilter])

  const hasActiveFilters = query || courseFilter !== ALL || statusFilter !== ALL

  function clearFilters() {
    setQuery("")
    setCourseFilter(ALL)
    setStatusFilter(ALL)
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id))
  const someFilteredSelected = filtered.some((e) => selectedIds.has(e.id))

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      filtered.forEach((e) => (checked ? next.add(e.id) : next.delete(e.id)))
      return next
    })
  }

  function toggleSelect(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectedFinalizedIds = React.useMemo(
    () => exams.filter((e) => selectedIds.has(e.id) && e.finalized).map((e) => e.id),
    [exams, selectedIds]
  )

  function handleGenerateReport() {
    if (selectedFinalizedIds.length === 0) return
    router.push(`/exams/report?ids=${selectedFinalizedIds.join(",")}`)
  }

  async function handleDelete(exam: Exam) {
    const result = await deleteExam(exam.id)
    setExamToDelete(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("تم حذف الامتحان")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم الامتحان أو المادة"
            className="ps-8"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل المواد" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL}>كل المواد</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL}>كل الحالات</SelectItem>
              <SelectItem value="in_progress">قيد التصحيح</SelectItem>
              <SelectItem value="finalized">منتهي ومعتمد</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon />
            مسح الفلاتر
          </Button>
        )}
      </div>

      {/* Count + import button row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} امتحان
          {hasActiveFilters && ` من أصل ${exams.length}`}
        </p>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <UploadIcon />
          استيراد من Excel
        </Button>
      </div>

      {/* Bulk report toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
          <p className="text-sm text-muted-foreground">
            تم تحديد {selectedIds.size} امتحان
            {selectedFinalizedIds.length < selectedIds.size &&
              ` — سيتم تجاهل ${selectedIds.size - selectedFinalizedIds.length} امتحان غير معتمد بعد`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              إلغاء التحديد
            </Button>
            <Button
              size="sm"
              disabled={selectedFinalizedIds.length === 0}
              onClick={handleGenerateReport}
            >
              <FileTextIcon />
              إنشاء تقرير
            </Button>
          </div>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <GraduationCapIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">لا توجد امتحانات بعد</p>
          <p className="text-sm text-muted-foreground">
            اضغط على زر &quot;إضافة امتحان&quot; أعلى الصفحة للبدء
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      allFilteredSelected || (someFilteredSelected && "indeterminate")
                    }
                    onCheckedChange={(v) => toggleSelectAll(!!v)}
                    aria-label="تحديد الكل"
                  />
                </TableHead>
                <TableHead>اسم الامتحان</TableHead>
                <TableHead>المادة</TableHead>
                <TableHead>الموعد</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    لم يتم العثور على امتحانات مطابقة للفلاتر المحددة
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((exam) => (
                  <TableRow key={exam.id} data-state={selectedIds.has(exam.id) && "selected"}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(exam.id)}
                        onCheckedChange={(v) => toggleSelect(exam.id, !!v)}
                        aria-label="تحديد الامتحان"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {exam.course?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatExamTime(exam.exam_time)}
                    </TableCell>
                    <TableCell>
                      {exam.finalized ? (
                        <Badge>منتهي ومعتمد</Badge>
                      ) : (
                        <Badge variant="outline">قيد التصحيح</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVerticalIcon />
                            <span className="sr-only">خيارات الامتحان</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/exams/${exam.id}/grade`}>
                              <ClipboardCheckIcon />
                              تصحيح
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={exam.finalized}
                            title={exam.finalized ? "لا يمكن تعديل امتحان تم اعتماده" : undefined}
                            onClick={() => !exam.finalized && setExamToEdit(exam)}
                          >
                            <PencilIcon />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={exam.finalized}
                            title={exam.finalized ? "لا يمكن حذف امتحان تم اعتماده" : undefined}
                            onClick={() => !exam.finalized && setExamToDelete(exam)}
                          >
                            <Trash2Icon />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit dialog */}
      {examToEdit && (
        <ExamFormDialog
          key={examToEdit.id}
          exam={examToEdit}
          courses={courses}
          open={Boolean(examToEdit)}
          onOpenChange={(open) => !open && setExamToEdit(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(examToDelete)}
        onOpenChange={(open) => !open && setExamToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الامتحان</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{examToDelete?.name}&quot;؟ سيتم حذف جميع
              الدرجات المسجلة لهذا الامتحان. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => examToDelete && handleDelete(examToDelete)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excel import placeholder */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
              <UploadIcon className="size-6 text-muted-foreground" />
            </div>
            <DialogTitle>استيراد من Excel</DialogTitle>
            <DialogDescription className="text-balance">
              هذه الميزة غير متاحة في النسخة التجريبية. ستكون متاحة في الإصدار الكامل من التطبيق.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setImportOpen(false)}>
            حسناً
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
