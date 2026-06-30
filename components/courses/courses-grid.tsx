"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  BookIcon,
  GraduationCapIcon,
  MoreVerticalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { deleteCourse } from "@/app/(dashboard)/courses/actions"
import {
  CourseFormDialog,
  type BookOption,
} from "@/components/courses/course-form-dialog"

export type Course = {
  id: number
  created_at: string
  name: string
  metadata: { description?: string; visible?: boolean }
  book_id: number | null
}

export function CoursesGrid({
  courses,
  books,
}: {
  courses: Course[]
  books: BookOption[]
}) {
  const [query, setQuery] = React.useState("")
  const [courseToEdit, setCourseToEdit] = React.useState<Course | null>(null)
  const [courseToDelete, setCourseToDelete] = React.useState<Course | null>(
    null
  )

  const booksById = React.useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books]
  )

  const filteredCourses = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(q) ||
        (course.metadata?.description ?? "").toLowerCase().includes(q)
    )
  }, [courses, query])

  async function handleDelete(course: Course) {
    const result = await deleteCourse(course.id)
    setCourseToDelete(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("تم حذف المادة")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم المادة أو الوصف"
          aria-label="ابحث باسم المادة أو الوصف"
          className="ps-8"
        />
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <GraduationCapIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">لا توجد مواد بعد</p>
          <p className="text-sm text-muted-foreground">
            اضغط على زر &quot;إضافة مادة&quot; أعلى الصفحة لإضافة أول مادة
          </p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <SearchIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">لا توجد نتائج</p>
          <p className="text-sm text-muted-foreground">
            لم يتم العثور على مواد مطابقة لـ &quot;{query}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const book = course.book_id
              ? booksById.get(course.book_id)
              : undefined
            return (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="truncate" title={course.name}>
                    {course.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.metadata?.description || "بدون وصف"}
                  </CardDescription>
                  <CardAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVerticalIcon />
                          <span className="sr-only">خيارات المادة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setCourseToEdit(course)}
                        >
                          <PencilIcon />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setCourseToDelete(course)}
                        >
                          <Trash2Icon />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                      {book?.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.cover_url}
                          alt={book.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <BookIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="truncate text-sm text-muted-foreground">
                      {book?.name ?? "بدون كتاب"}
                    </span>
                  </div>
                  <Badge variant={course.metadata?.visible ? "default" : "outline"}>
                    {course.metadata?.visible ? "مرئية" : "مسودة"}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {courseToEdit && (
        <CourseFormDialog
          key={courseToEdit.id}
          course={courseToEdit}
          books={books}
          open={Boolean(courseToEdit)}
          onOpenChange={(open) => !open && setCourseToEdit(null)}
        />
      )}

      <AlertDialog
        open={Boolean(courseToDelete)}
        onOpenChange={(open) => !open && setCourseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المادة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{courseToDelete?.name}&quot;؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => courseToDelete && handleDelete(courseToDelete)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
