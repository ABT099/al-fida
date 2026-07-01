"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

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
import { createExam, updateExam } from "@/app/(dashboard)/exams/actions"
import type { Exam, CourseOption } from "@/components/exams/exams-table"

const schema = z.object({
  name: z.string().min(1, "اسم الامتحان مطلوب"),
  exam_time: z.string(),
  course_id: z.string().min(1, "المادة مطلوبة"),
})
type Values = z.infer<typeof schema>

export function ExamFormDialog({
  exam,
  courses,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  exam?: Exam
  courses: CourseOption[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = Boolean(exam)
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: exam?.name ?? "",
      exam_time: exam?.exam_time?.slice(0, 5) ?? "",
      course_id: exam?.course_id?.toString() ?? "",
    },
  })

  async function onSubmit(values: Values) {
    setServerError(null)
    const fd = new FormData()
    fd.set("name", values.name)
    fd.set("exam_time", values.exam_time)
    fd.set("course_id", values.course_id)

    const result = isEdit
      ? await updateExam(exam!.id, fd)
      : await createExam(fd)
    if (result.error) { setServerError(result.error); return }
    toast.success(isEdit ? "تم تحديث الامتحان" : "تمت إضافة الامتحان")
    reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return
    if (!next) { reset(); setServerError(null) }
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
          <DialogTitle>{isEdit ? "تعديل امتحان" : "إضافة امتحان"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "عدّل بيانات الامتحان" : "أدخل بيانات الامتحان الجديد"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="max-h-[70vh] overflow-y-auto gap-4">
            <Field>
              <FieldLabel htmlFor="name">اسم الامتحان</FieldLabel>
              <Input
                id="name"
                aria-invalid={!!errors.name}
                disabled={isSubmitting}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="course_id">المادة</FieldLabel>
              <Controller
                control={control}
                name="course_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="course_id" aria-invalid={!!errors.course_id}>
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.course_id]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="exam_time">موعد الامتحان (اختياري)</FieldLabel>
              <Input
                id="exam_time"
                type="time"
                step={60}
                disabled={isSubmitting}
                {...register("exam_time")}
              />
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
