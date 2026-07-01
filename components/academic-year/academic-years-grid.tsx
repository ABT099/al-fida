"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  CalendarIcon,
  MoreVerticalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { format } from "date-fns"

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
import { deleteAcademicYear } from "@/app/(dashboard)/academic-year/actions"
import { AcademicYearFormDialog } from "@/components/academic-year/academic-year-form-dialog"

export type SemesterOption = {
  id: number
  name: string
  acedemic_year_id: number | null
}

export type AcademicYear = {
  id: number
  created_at: string
  label: string
  starts_at: string
  ends_at: string
  current_semester: number | null
  current_semester_ref?: { id: number; name: string } | null
}

export function AcademicYearsGrid({
  years,
  semesters,
}: {
  years: AcademicYear[]
  semesters: SemesterOption[]
}) {
  const [query, setQuery] = React.useState("")
  const [yearToEdit, setYearToEdit] = React.useState<AcademicYear | null>(null)
  const [yearToDelete, setYearToDelete] = React.useState<AcademicYear | null>(null)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return years
    return years.filter(
      (y) =>
        y.label.toLowerCase().includes(q) ||
        (y.current_semester_ref?.name ?? "").toLowerCase().includes(q)
    )
  }, [years, query])

  async function handleDelete(year: AcademicYear) {
    const result = await deleteAcademicYear(year.id)
    setYearToDelete(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("تم حذف السنة الدراسية")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم السنة أو الفصل الحالي"
          className="ps-8"
        />
      </div>

      {years.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <CalendarIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">لا توجد سنوات دراسية بعد</p>
          <p className="text-sm text-muted-foreground">
            اضغط على زر &quot;إضافة سنة دراسية&quot; أعلى الصفحة للبدء
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>السنة الدراسية</TableHead>
                <TableHead>تاريخ البداية</TableHead>
                <TableHead>تاريخ النهاية</TableHead>
                <TableHead>الفصل الحالي</TableHead>
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
                    لم يتم العثور على سنوات مطابقة لـ &quot;{query}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.label}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(year.starts_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(year.ends_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={year.current_semester_ref ? "default" : "outline"}
                      >
                        {year.current_semester_ref?.name ?? "لا يوجد"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVerticalIcon />
                            <span className="sr-only">خيارات</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setYearToEdit(year)}>
                            <PencilIcon />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setYearToDelete(year)}
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

      {yearToEdit && (
        <AcademicYearFormDialog
          key={yearToEdit.id}
          year={yearToEdit}
          semesters={semesters}
          open={Boolean(yearToEdit)}
          onOpenChange={(open) => !open && setYearToEdit(null)}
        />
      )}

      <AlertDialog
        open={Boolean(yearToDelete)}
        onOpenChange={(open) => !open && setYearToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف السنة الدراسية</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{yearToDelete?.label}&quot;؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => yearToDelete && handleDelete(yearToDelete)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
