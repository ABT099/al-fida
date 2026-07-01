"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import {
  createAcademicYear,
  updateAcademicYear,
} from "@/app/(dashboard)/academic-year/actions"
import type { AcademicYear, SemesterOption } from "@/components/academic-year/academic-years-grid"

function DatePickerField({
  value,
  onChange,
  disabled,
  placeholder,
  invalid,
}: {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  disabled?: boolean
  placeholder: string
  invalid?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-start font-normal ${invalid ? "border-destructive text-destructive" : !value ? "text-muted-foreground" : ""}`}
          disabled={disabled}
        >
          <CalendarIcon className="me-2 size-4" />
          {value ? format(value, "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} captionLayout="dropdown" />
      </PopoverContent>
    </Popover>
  )
}

const schema = z.object({
  label: z.string().min(1, "اسم السنة الدراسية مطلوب"),
  starts_at: z.date({ error: "تاريخ البداية مطلوب" }),
  ends_at: z.date({ error: "تاريخ النهاية مطلوب" }),
  current_semester: z.string().optional(),
})
type Values = z.infer<typeof schema>

export function AcademicYearFormDialog({
  year,
  semesters,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  year?: AcademicYear
  semesters: SemesterOption[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = Boolean(year)
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [serverError, setServerError] = React.useState<string | null>(null)

  const yearSemesters = semesters.filter((s) => s.acedemic_year_id === year?.id)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: year?.label ?? "",
      starts_at: year?.starts_at ? new Date(year.starts_at) : undefined,
      ends_at: year?.ends_at ? new Date(year.ends_at) : undefined,
      current_semester: year?.current_semester?.toString() ?? "none",
    },
  })

  async function onSubmit(values: Values) {
    setServerError(null)
    const fd = new FormData()
    fd.set("label", values.label)
    fd.set("starts_at", format(values.starts_at, "yyyy-MM-dd"))
    fd.set("ends_at", format(values.ends_at, "yyyy-MM-dd"))
    if (isEdit) fd.set("current_semester", values.current_semester ?? "none")

    const result = isEdit
      ? await updateAcademicYear(year!.id, fd)
      : await createAcademicYear(fd)
    if (result.error) { setServerError(result.error); return }
    toast.success(isEdit ? "تم تحديث السنة الدراسية" : "تمت إضافة السنة الدراسية")
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
        showCloseButton={!isSubmitting}
        onInteractOutside={(e) => isSubmitting && e.preventDefault()}
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل السنة الدراسية" : "إضافة سنة دراسية"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "عدّل بيانات السنة الدراسية" : "أدخل بيانات السنة الدراسية الجديدة"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="label">اسم السنة الدراسية</FieldLabel>
              <Input
                id="label"
                placeholder="مثال: 2024-2025"
                aria-invalid={!!errors.label}
                disabled={isSubmitting}
                {...register("label")}
              />
              <FieldError errors={[errors.label]} />
            </Field>
            <Field>
              <FieldLabel>تاريخ البداية</FieldLabel>
              <Controller
                control={control}
                name="starts_at"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="اختر تاريخ البداية"
                    invalid={!!errors.starts_at}
                  />
                )}
              />
              <FieldError errors={[errors.starts_at]} />
            </Field>
            <Field>
              <FieldLabel>تاريخ النهاية</FieldLabel>
              <Controller
                control={control}
                name="ends_at"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="اختر تاريخ النهاية"
                    invalid={!!errors.ends_at}
                  />
                )}
              />
              <FieldError errors={[errors.ends_at]} />
            </Field>
            {isEdit && (
              <Field>
                <FieldLabel htmlFor="current_semester">الفصل الدراسي الحالي</FieldLabel>
                <Controller
                  control={control}
                  name="current_semester"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={field.onChange}
                      disabled={isSubmitting || yearSemesters.length === 0}
                    >
                      <SelectTrigger id="current_semester">
                        <SelectValue
                          placeholder={
                            yearSemesters.length === 0
                              ? "لا توجد فصول دراسية لهذه السنة"
                              : "اختر الفصل الحالي"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">بدون فصل محدد</SelectItem>
                          {yearSemesters.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
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
