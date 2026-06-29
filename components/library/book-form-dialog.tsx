"use client"

import * as React from "react"
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
import { Label } from "@/components/ui/label"
import { createBook, updateBook } from "@/app/(dashboard)/library/actions"
import type { Book } from "@/components/library/books-grid"

const MAX_COVER_SIZE_MB = 5
const MAX_FILE_SIZE_MB = 20

function validateFileSize(file: File | undefined, maxMb: number) {
  if (!file || file.size === 0) return null
  if (file.size > maxMb * 1024 * 1024) {
    return `حجم الملف يتجاوز ${maxMb} ميجابايت`
  }
  return null
}

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
  const [pending, setPending] = React.useState(false)

  async function handleSubmit(formData: FormData) {
    const coverError = validateFileSize(
      formData.get("cover") as File,
      MAX_COVER_SIZE_MB
    )
    if (coverError) {
      toast.error(coverError)
      return
    }
    const fileError = validateFileSize(
      formData.get("file") as File,
      MAX_FILE_SIZE_MB
    )
    if (fileError) {
      toast.error(fileError)
      return
    }

    setPending(true)
    try {
      const result = isEdit
        ? await updateBook(book!.id, formData)
        : await createBook(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? "تم تحديث الكتاب" : "تمت إضافة الكتاب")
      setOpen(false)
    } catch (err) {
      console.error("book form submit failed", err)
      toast.error("حدث خطأ غير متوقع")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل كتاب" : "إضافة كتاب"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "عدّل بيانات الكتاب، واترك الملفات بدون تغيير إن لم ترد تحديثها"
              : "أدخل بيانات الكتاب الجديد"}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">اسم الكتاب</Label>
            <Input
              id="name"
              name="name"
              defaultValue={book?.name}
              required
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="author">المؤلف</Label>
            <Input
              id="author"
              name="author"
              defaultValue={book?.metadata?.author}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="cover">
              صورة الغلاف{" "}
              <span className="text-muted-foreground">
                (الحد الأقصى {MAX_COVER_SIZE_MB} ميجابايت)
              </span>
            </Label>
            <Input
              id="cover"
              name="cover"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const error = validateFileSize(
                  e.target.files?.[0],
                  MAX_COVER_SIZE_MB
                )
                if (error) {
                  toast.error(error)
                  e.target.value = ""
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="file">
              ملف الكتاب{" "}
              <span className="text-muted-foreground">
                (الحد الأقصى {MAX_FILE_SIZE_MB} ميجابايت)
              </span>
            </Label>
            <Input
              id="file"
              name="file"
              type="file"
              required={!isEdit}
              onChange={(e) => {
                const error = validateFileSize(
                  e.target.files?.[0],
                  MAX_FILE_SIZE_MB
                )
                if (error) {
                  toast.error(error)
                  e.target.value = ""
                }
              }}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                إلغاء
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
