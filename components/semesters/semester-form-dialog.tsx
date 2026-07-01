"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { createSemester, updateSemester } from "@/app/(dashboard)/semesters/actions"
import type { Semester, YearOption, CourseOption } from "@/components/semesters/semesters-grid"

const schema = z.object({
  name: z.string().min(1, "اسم الفصل الدراسي مطلوب"),
  acedemic_year_id: z.string(),
})
type Values = z.infer<typeof schema>

export function SemesterFormDialog({
  semester,
  years,
  courses,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  semester?: Semester
  years: YearOption[]
  courses: CourseOption[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = Boolean(semester)
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [serverError, setServerError] = React.useState<string | null>(null)

  const existingCourseIds = React.useMemo(
    () => new Set(semester?.semesters_courses?.map((sc) => sc.course_id) ?? []),
    [semester]
  )
  const [selectedCourseIds, setSelectedCourseIds] = React.useState<Set<number>>(existingCourseIds)

  function toggleCourse(id: number) {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: semester?.name ?? "",
      acedemic_year_id: semester?.acedemic_year_id?.toString() ?? "none",
    },
  })

  async function onSubmit(values: Values) {
    setServerError(null)
    const fd = new FormData()
    fd.set("name", values.name)
    fd.set("acedemic_year_id", values.acedemic_year_id)
    selectedCourseIds.forEach((id) => fd.append("course_ids", String(id)))

    const result = isEdit
      ? await updateSemester(semester!.id, fd)
      : await createSemester(fd)
    if (result.error) { setServerError(result.error); return }
    toast.success(isEdit ? "تم تحديث الفصل الدراسي" : "تمت إضافة الفصل الدراسي")
    reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return
    if (!next) { reset(); setServerError(null); setSelectedCourseIds(existingCourseIds) }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={!isSubmitting}
        onInteractOutside={(e) => isSubmitting && e.preventDefault()}
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل الفصل الدراسي" : "إضافة فصل دراسي"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "عدّل بيانات الفصل الدراسي والمواد المرتبطة به"
              : "أدخل بيانات الفصل الدراسي واختر المواد المرتبطة به"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="max-h-[70vh] overflow-y-auto gap-4">
            <Field>
              <FieldLabel htmlFor="name">اسم الفصل الدراسي</FieldLabel>
              <Input
                id="name"
                aria-invalid={!!errors.name}
                disabled={isSubmitting}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="acedemic_year_id">السنة الدراسية</FieldLabel>
              <Controller
                control={control}
                name="acedemic_year_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="acedemic_year_id">
                      <SelectValue placeholder="اختر السنة الدراسية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="none">بدون سنة دراسية</SelectItem>
                        {years.map((y) => (
                          <SelectItem key={y.id} value={y.id.toString()}>
                            {y.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel>المواد الدراسية</FieldLabel>
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد مواد متاحة</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {courses.map((course) => {
                    const selected = selectedCourseIds.has(course.id)
                    return (
                      <button
                        key={course.id}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => toggleCourse(course.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-3 text-start transition-colors",
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {selected && <CheckIcon className="size-3" />}
                        </div>
                        <span className="truncate text-sm font-medium">{course.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </Field>
            {serverError && <FieldError>{serverError}</FieldError>}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={isSubmitting}>إلغاء</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
