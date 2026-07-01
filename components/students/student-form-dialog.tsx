"use client"

import * as React from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
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
import { createStudent, updateStudent } from "@/app/(dashboard)/students/actions"
import type { Student, YearOption, SemesterOption } from "@/components/students/students-table"

const schema = z.object({
  first_name: z.string().min(1, "الاسم الأول مطلوب"),
  last_name: z.string().min(1, "اسم العائلة مطلوب"),
  phone_number: z.string().min(1, "رقم الهاتف مطلوب"),
  year_id: z.string().min(1, "السنة الدراسية مطلوبة"),
})
type Values = z.infer<typeof schema>

export function StudentFormDialog({
  student,
  years,
  semesters,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  student?: Student
  years: YearOption[]
  semesters: SemesterOption[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = Boolean(student)
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [serverError, setServerError] = React.useState<string | null>(null)

  const existingIds = React.useMemo(
    () => new Set(student?.semester_enrollements?.map((e) => e.semester_id) ?? []),
    [student]
  )
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(existingIds)

  function toggle(id: number) {
    setSelectedIds((prev) => {
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
      first_name: student?.first_name ?? "",
      last_name: student?.last_name ?? "",
      phone_number: student?.phone_number ?? "",
      year_id: student?.year_id?.toString() ?? "",
    },
  })

  const selectedYearId = useWatch({ control, name: "year_id" })

  const yearSemesters = React.useMemo(
    () => semesters.filter((s) => s.acedemic_year_id === Number(selectedYearId)),
    [semesters, selectedYearId]
  )

  async function onSubmit(values: Values) {
    setServerError(null)
    const fd = new FormData()
    fd.set("first_name", values.first_name)
    fd.set("last_name", values.last_name)
    fd.set("phone_number", values.phone_number)
    fd.set("year_id", values.year_id)
    selectedIds.forEach((id) => fd.append("semester_ids", String(id)))

    const result = isEdit
      ? await updateStudent(student!.id, fd)
      : await createStudent(fd)
    if (result.error) { setServerError(result.error); return }
    toast.success(isEdit ? "تم تحديث بيانات الطالب" : "تمت إضافة الطالب")
    reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return
    if (next) { setSelectedIds(existingIds) }
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
          <DialogTitle>{isEdit ? "تعديل بيانات الطالب" : "إضافة طالب"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "عدّل بيانات الطالب والفصول المسجل فيها"
              : "أدخل بيانات الطالب، ثم اختر السنة الدراسية لتحديد الفصول المتاحة"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="max-h-[70vh] overflow-y-auto gap-5">
            {/* Step 1 — basic info */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                البيانات الأساسية
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="first_name">الاسم الأول</FieldLabel>
                  <Input
                    id="first_name"
                    aria-invalid={!!errors.first_name}
                    disabled={isSubmitting}
                    {...register("first_name")}
                  />
                  <FieldError errors={[errors.first_name]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="last_name">اسم العائلة</FieldLabel>
                  <Input
                    id="last_name"
                    aria-invalid={!!errors.last_name}
                    disabled={isSubmitting}
                    {...register("last_name")}
                  />
                  <FieldError errors={[errors.last_name]} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="phone_number">رقم الهاتف</FieldLabel>
                <Input
                  id="phone_number"
                  type="tel"
                  aria-invalid={!!errors.phone_number}
                  disabled={isSubmitting}
                  {...register("phone_number")}
                />
                <FieldError errors={[errors.phone_number]} />
              </Field>
            </div>

            {/* Step 2 — year */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                السنة الدراسية
              </p>
              <Field>
                <Controller
                  control={control}
                  name="year_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val)
                        setSelectedIds(new Set())
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger aria-invalid={!!errors.year_id}>
                        <SelectValue placeholder="اختر السنة الدراسية أولاً" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
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
                <FieldError errors={[errors.year_id]} />
              </Field>
            </div>

            {/* Step 3 — semesters, only after year selected */}
            {selectedYearId && (
              <div className="flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  الفصول الدراسية
                </p>
                {yearSemesters.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    لا توجد فصول دراسية مرتبطة بهذه السنة
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {yearSemesters.map((semester) => {
                      const selected = selectedIds.has(semester.id)
                      return (
                        <button
                          key={semester.id}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => toggle(semester.id)}
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
                          <span className="truncate text-sm font-medium">{semester.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

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
