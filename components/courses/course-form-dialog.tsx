"use client"

import * as React from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { createCourse, updateCourse } from "@/app/(dashboard)/courses/actions"
import type { Course } from "@/components/courses/courses-grid"

export type BookOption = {
  id: number
  name: string
  cover_url: string | null
}

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
  const [pending, setPending] = React.useState(false)
  const [bookId, setBookId] = React.useState<number | null>(
    course?.book_id ?? null
  )

  async function handleSubmit(formData: FormData) {
    setPending(true)
    try {
      const result = isEdit
        ? await updateCourse(course!.id, formData)
        : await createCourse(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? "تم تحديث المادة" : "تمت إضافة المادة")
      setOpen(false)
    } catch (err) {
      console.error("course form submit failed", err)
      toast.error("حدث خطأ غير متوقع")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        if (next) setBookId(course?.book_id ?? null)
        setOpen(next)
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={!pending}
        onInteractOutside={(e) => pending && e.preventDefault()}
        onEscapeKeyDown={(e) => pending && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل مادة" : "إضافة مادة"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "عدّل بيانات المادة"
              : "أدخل بيانات المادة الجديدة واختر الكتاب المرتبط بها (اختياري)"}
          </DialogDescription>
        </DialogHeader>
        <form
          action={handleSubmit}
          className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto text-sm"
        >
          <input type="hidden" name="book_id" value={bookId ?? ""} />
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">اسم المادة</Label>
            <Input
              id="name"
              name="name"
              defaultValue={course?.name}
              required
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={course?.metadata?.description}
              disabled={pending}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="visible"
              name="visible"
              defaultChecked={course?.metadata?.visible ?? true}
              disabled={pending}
            />
            <Label htmlFor="visible">إظهار المادة للطلاب</Label>
          </div>
          <div className="flex flex-col gap-3">
            <Label>الكتاب المرتبط</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              <button
                type="button"
                disabled={pending}
                onClick={() => setBookId(null)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-2 text-center",
                  bookId === null && "border-primary ring-1 ring-primary"
                )}
              >
                <div className="flex aspect-3/4 w-full items-center justify-center rounded bg-muted">
                  {bookId === null && (
                    <CheckIcon className="size-5 text-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  بدون كتاب
                </span>
              </button>
              {books.map((book) => {
                const selected = bookId === book.id
                return (
                  <button
                    key={book.id}
                    type="button"
                    disabled={pending}
                    onClick={() => setBookId(book.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-center",
                      selected && "border-primary ring-1 ring-primary"
                    )}
                  >
                    <div className="relative aspect-3/4 w-full overflow-hidden rounded bg-muted">
                      {book.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.cover_url}
                          alt={book.name}
                          className="size-full object-cover"
                        />
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
                    <span className="w-full truncate text-xs" title={book.name}>
                      {book.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={pending}>
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
