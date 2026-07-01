"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  CalendarDaysIcon,
  MoreVerticalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
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
import { deleteSemester } from "@/app/(dashboard)/semesters/actions"
import { SemesterFormDialog } from "@/components/semesters/semester-form-dialog"

export type CourseOption = { id: number; name: string }
export type YearOption = { id: number; label: string }

export type Semester = {
  id: number
  created_at: string
  name: string
  acedemic_year_id: number | null
  academic_year?: { id: number; label: string } | null
  semesters_courses?: { course_id: number }[]
}

export function SemestersGrid({
  semesters,
  years,
  courses,
}: {
  semesters: Semester[]
  years: YearOption[]
  courses: CourseOption[]
}) {
  const [query, setQuery] = React.useState("")
  const [semesterToEdit, setSemesterToEdit] = React.useState<Semester | null>(null)
  const [semesterToDelete, setSemesterToDelete] = React.useState<Semester | null>(null)

  const courseMap = React.useMemo(
    () => new Map(courses.map((c) => [c.id, c.name])),
    [courses]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return semesters
    return semesters.filter((s) => {
      if (s.name.toLowerCase().includes(q)) return true
      if ((s.academic_year?.label ?? "").toLowerCase().includes(q)) return true
      return s.semesters_courses?.some((sc) =>
        (courseMap.get(sc.course_id) ?? "").toLowerCase().includes(q)
      )
    })
  }, [semesters, query, courseMap])

  async function handleDelete(semester: Semester) {
    const result = await deleteSemester(semester.id)
    setSemesterToDelete(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("تم حذف الفصل الدراسي")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالفصل أو السنة أو اسم المادة"
          className="ps-8"
        />
      </div>

      {semesters.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <CalendarDaysIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">لا توجد فصول دراسية بعد</p>
          <p className="text-sm text-muted-foreground">
            اضغط على زر &quot;إضافة فصل دراسي&quot; أعلى الصفحة للبدء
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>الفصل الدراسي</TableHead>
                <TableHead>السنة الدراسية</TableHead>
                <TableHead>المواد</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    لم يتم العثور على فصول مطابقة لـ &quot;{query}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((semester) => {
                  const semesterCourses = (semester.semesters_courses ?? [])
                    .map((sc) => courseMap.get(sc.course_id))
                    .filter(Boolean) as string[]

                  return (
                    <TableRow key={semester.id}>
                      <TableCell className="font-medium">
                        {semester.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {semester.academic_year?.label ?? (
                          <span className="italic">غير مرتبطة بسنة</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {semesterCourses.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            لا توجد مواد
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {semesterCourses.map((name) => (
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
                              <span className="sr-only">خيارات الفصل</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSemesterToEdit(semester)}
                            >
                              <PencilIcon />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setSemesterToDelete(semester)}
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

      {semesterToEdit && (
        <SemesterFormDialog
          key={semesterToEdit.id}
          semester={semesterToEdit}
          years={years}
          courses={courses}
          open={Boolean(semesterToEdit)}
          onOpenChange={(open) => !open && setSemesterToEdit(null)}
        />
      )}

      <AlertDialog
        open={Boolean(semesterToDelete)}
        onOpenChange={(open) => !open && setSemesterToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الفصل الدراسي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{semesterToDelete?.name}&quot;؟ سيتم
              إزالة جميع المواد المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => semesterToDelete && handleDelete(semesterToDelete)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
