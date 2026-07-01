"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  MoreVerticalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { deleteStudent } from "@/app/(dashboard)/students/actions"
import { StudentFormDialog } from "@/components/students/student-form-dialog"

export type YearOption = { id: number; label: string }
export type SemesterOption = { id: number; name: string; acedemic_year_id: number | null }

export type Student = {
  id: number
  created_at: string
  first_name: string
  last_name: string
  phone_number: string
  year_id: number
  academic_year?: { id: number; label: string } | null
  semester_enrollements?: { semester_id: number }[]
}

const ALL = "all"

export function StudentsTable({
  students,
  years,
  semesters,
}: {
  students: Student[]
  years: YearOption[]
  semesters: SemesterOption[]
}) {
  const [query, setQuery] = React.useState("")
  const [yearFilter, setYearFilter] = React.useState(ALL)
  const [semesterFilter, setSemesterFilter] = React.useState(ALL)
  const [studentToEdit, setStudentToEdit] = React.useState<Student | null>(null)
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null)
  const [importOpen, setImportOpen] = React.useState(false)

  const semesterMap = React.useMemo(
    () => new Map(semesters.map((s) => [s.id, s.name])),
    [semesters]
  )

  // Semesters available for the semester filter dropdown — scoped to the selected year
  const filteredSemesterOptions = React.useMemo(() => {
    if (yearFilter === ALL) return semesters
    return semesters.filter((s) => s.acedemic_year_id === Number(yearFilter))
  }, [semesters, yearFilter])

  // Reset semester filter when year changes
  function handleYearFilterChange(value: string) {
    setYearFilter(value)
    setSemesterFilter(ALL)
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      if (yearFilter !== ALL && s.year_id !== Number(yearFilter)) return false
      if (semesterFilter !== ALL) {
        const enrolled = s.semester_enrollements?.some(
          (e) => e.semester_id === Number(semesterFilter)
        )
        if (!enrolled) return false
      }
      if (!q) return true
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
      if (fullName.includes(q)) return true
      if (s.phone_number.includes(q)) return true
      if ((s.academic_year?.label ?? "").toLowerCase().includes(q)) return true
      return s.semester_enrollements?.some((e) =>
        (semesterMap.get(e.semester_id) ?? "").toLowerCase().includes(q)
      )
    })
  }, [students, query, yearFilter, semesterFilter, semesterMap])

  const hasActiveFilters = query || yearFilter !== ALL || semesterFilter !== ALL

  function clearFilters() {
    setQuery("")
    setYearFilter(ALL)
    setSemesterFilter(ALL)
  }

  async function handleDelete(student: Student) {
    const result = await deleteStudent(student.id)
    setStudentToDelete(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("تم حذف الطالب")
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
            placeholder="ابحث بالاسم أو الهاتف"
            className="ps-8"
          />
        </div>
        <Select value={yearFilter} onValueChange={handleYearFilterChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل السنوات" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL}>كل السنوات</SelectItem>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id.toString()}>
                  {y.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={semesterFilter}
          onValueChange={setSemesterFilter}
          disabled={filteredSemesterOptions.length === 0}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل الفصول" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL}>كل الفصول</SelectItem>
              {filteredSemesterOptions.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
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

      {/* Import button row — shown separately so it doesn't crowd filters */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} طالب
          {hasActiveFilters && ` من أصل ${students.length}`}
        </p>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <UploadIcon />
          استيراد من Excel
        </Button>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">لا يوجد طلاب بعد</p>
          <p className="text-sm text-muted-foreground">
            اضغط على زر &quot;إضافة طالب&quot; أعلى الصفحة للبدء
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>السنة الدراسية</TableHead>
                <TableHead>الفصول المسجلة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    لم يتم العثور على طلاب مطابقين للفلاتر المحددة
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((student) => {
                  const enrolledSemesters = (student.semester_enrollements ?? [])
                    .map((e) => semesterMap.get(e.semester_id))
                    .filter(Boolean) as string[]

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span dir="ltr">{student.phone_number}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.academic_year?.label ?? (
                          <span className="italic">غير محدد</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrolledSemesters.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            لا يوجد
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {enrolledSemesters.map((name) => (
                              <Badge key={name} variant="secondary">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVerticalIcon />
                              <span className="sr-only">خيارات الطالب</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setStudentToEdit(student)}
                            >
                              <PencilIcon />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setStudentToDelete(student)}
                            >
                              <Trash2Icon />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit dialog */}
      {studentToEdit && (
        <StudentFormDialog
          key={studentToEdit.id}
          student={studentToEdit}
          years={years}
          semesters={semesters}
          open={Boolean(studentToEdit)}
          onOpenChange={(open) => !open && setStudentToEdit(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(studentToDelete)}
        onOpenChange={(open) => !open && setStudentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الطالب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الطالب &quot;{studentToDelete?.first_name}{" "}
              {studentToDelete?.last_name}&quot;؟ سيتم إلغاء تسجيله من جميع
              الفصول. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => studentToDelete && handleDelete(studentToDelete)}
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
