"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { BookIcon, CheckIcon } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { createCourse, updateCourse } from "@/app/(dashboard)/courses/actions"
import type { Course } from "@/components/courses/courses-grid"

export type BookOption = {
  id: number
  name: string
  cover_url: string | null
}

const schema = z.object({
  name: z.string().min(1, "اسم المادة مطلوب"),
  description: z.string(),
  visible: z.boolean(),
})
type Values = z.infer<typeof schema>

export function CourseFormDialog({
  course,
  books,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  course?: Course
  books: BookOption[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = Boolean(course)
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [bookId, setBookId] = React.useState<number | null>(course?.book_id ?? null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: course?.name ?? "",
      description: course?.metadata?.description ?? "",
      visible: course?.metadata?.visible ?? true,
    },
  })

  async function onSubmit(values: Values) {
    setServerError(null)
    const fd = new FormData()
    fd.set("name", values.name)
    fd.set("description", values.description)
    fd.set("visible", values.visible ? "on" : "")
    fd.set("book_id", String(bookId ?? ""))

    const result = isEdit
      ? await updateCourse(course!.id, fd)
      : await createCourse(fd)
    if (result.error) { setServerError(result.error); return }
    toast.success(isEdit ? "تم تحديث المادة" : "تمت إضافة المادة")
    reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return
    if (next) setBookId(course?.book_id ?? null)
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
          <DialogTitle>{isEdit ? "تعديل مادة" : "إضافة مادة"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "عدّل بيانات المادة"
              : "أدخل بيانات المادة الجديدة واختر الكتاب المرتبط بها (اختياري)"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="max-h-[70vh] overflow-y-auto gap-4">
            <Field>
              <FieldLabel htmlFor="name">اسم المادة</FieldLabel>
              <Input
                id="name"
                aria-invalid={!!errors.name}
                disabled={isSubmitting}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">الوصف</FieldLabel>
              <Textarea
                id="description"
                disabled={isSubmitting}
                {...register("description")}
              />
            </Field>
            <Field orientation="horizontal">
              <Controller
                control={control}
                name="visible"
                render={({ field }) => (
                  <Checkbox
                    id="visible"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
              <FieldLabel htmlFor="visible">إظهار المادة للطلاب</FieldLabel>
            </Field>
            <Field>
              <FieldLabel>الكتاب المرتبط</FieldLabel>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setBookId(null)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors",
                    bookId === null && "border-primary ring-1 ring-primary"
                  )}
                >
                  <div className="flex aspect-3/4 w-full items-center justify-center rounded bg-muted">
                    {bookId === null && <CheckIcon className="size-5 text-primary" />}
                  </div>
                  <span className="text-xs text-muted-foreground">بدون كتاب</span>
                </button>
                {books.map((book) => {
                  const selected = bookId === book.id
                  return (
                    <button
                      key={book.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setBookId(book.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors",
                        selected && "border-primary ring-1 ring-primary"
                      )}
                    >
                      <div className="relative aspect-3/4 w-full overflow-hidden rounded bg-muted">
                        {book.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={book.cover_url} alt={book.name} className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <BookIcon className="size-5 text-muted-foreground" />
                          </div>
                        )}
                        {selected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <CheckIcon className="size-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <span className="w-full truncate text-xs" title={book.name}>{book.name}</span>
                    </button>
                  )
                })}
              </div>
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
