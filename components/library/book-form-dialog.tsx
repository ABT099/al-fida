"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { createBook, updateBook } from "@/app/(dashboard)/library/actions"
import type { Book } from "@/components/library/books-grid"

const MAX_COVER_MB = 5
const MAX_FILE_MB = 20

const schema = z.object({
  name: z.string().min(1, "اسم الكتاب مطلوب"),
  author: z.string(),
})
type Values = z.infer<typeof schema>

export function BookFormDialog({
  book,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  book?: Book
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = Boolean(book)
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [fileErrors, setFileErrors] = React.useState<{ cover?: string; file?: string }>({})


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: book?.name ?? "", author: book?.metadata?.author ?? "" },
  })

  async function onSubmit(values: Values, event?: React.BaseSyntheticEvent) {
    const fd = new FormData(event?.target as HTMLFormElement)
    const coverFile = fd.get("cover") as File | null
    const bookFile = fd.get("file") as File | null
    const errs: { cover?: string; file?: string } = {}
    if (coverFile && coverFile.size > MAX_COVER_MB * 1024 * 1024)
      errs.cover = `حجم الغلاف يتجاوز ${MAX_COVER_MB} ميجابايت`
    if (!isEdit && (!bookFile || bookFile.size === 0)) errs.file = "ملف الكتاب مطلوب"
    else if (bookFile && bookFile.size > MAX_FILE_MB * 1024 * 1024)
      errs.file = `حجم الملف يتجاوز ${MAX_FILE_MB} ميجابايت`
    if (Object.keys(errs).length) { setFileErrors(errs); return }
    setFileErrors({})
    setServerError(null)

    fd.set("name", values.name)
    fd.set("author", values.author ?? "")

    const result = isEdit ? await updateBook(book!.id, fd) : await createBook(fd)
    if (result.error) { setServerError(result.error); return }
    toast.success(isEdit ? "تم تحديث الكتاب" : "تمت إضافة الكتاب")
    reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return
    if (!next) { reset(); setServerError(null); setFileErrors({}) }
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
          <DialogTitle>{isEdit ? "تعديل كتاب" : "إضافة كتاب"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "عدّل بيانات الكتاب، واترك الملفات فارغة إن لم ترد تغييرها"
              : "أدخل بيانات الكتاب الجديد"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="name">اسم الكتاب</FieldLabel>
              <Input
                id="name"
                aria-invalid={!!errors.name}
                disabled={isSubmitting}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="author">المؤلف</FieldLabel>
              <Input id="author" disabled={isSubmitting} {...register("author")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="cover">
                صورة الغلاف{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (الحد الأقصى {MAX_COVER_MB} ميجابايت)
                </span>
              </FieldLabel>
              <Input
                id="cover"
                name="cover"
                type="file"
                accept="image/*"
                aria-invalid={!!fileErrors.cover}
                disabled={isSubmitting}
              />
              {fileErrors.cover && <FieldError>{fileErrors.cover}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="file">
                ملف الكتاب{" "}
                {!isEdit && <span className="text-destructive">*</span>}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (الحد الأقصى {MAX_FILE_MB} ميجابايت)
                </span>
              </FieldLabel>
              <Input
                id="file"
                name="file"
                type="file"
                aria-invalid={!!fileErrors.file}
                disabled={isSubmitting}
              />
              {fileErrors.file && <FieldError>{fileErrors.file}</FieldError>}
            </Field>
            {serverError && <FieldError>{serverError}</FieldError>}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  إلغاء
                </Button>
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
