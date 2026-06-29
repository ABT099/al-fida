"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  BookIcon,
  DownloadIcon,
  MoreVerticalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
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
import { deleteBook, getSignedBookUrl } from "@/app/(dashboard)/library/actions"
import { BookFormDialog } from "@/components/library/book-form-dialog"

export type Book = {
  id: number
  created_at: string
  name: string
  metadata: { author?: string } | null
  cover_url: string | null
  book_url: string
}

export function BooksGrid({ books }: { books: Book[] }) {
  const [query, setQuery] = React.useState("")
  const [bookToEdit, setBookToEdit] = React.useState<Book | null>(null)
  const [bookToDelete, setBookToDelete] = React.useState<Book | null>(null)

  const filteredBooks = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return books
    return books.filter(
      (book) =>
        book.name.toLowerCase().includes(q) ||
        (book.metadata?.author ?? "").toLowerCase().includes(q)
    )
  }, [books, query])

  async function handleDownload(book: Book) {
    const result = await getSignedBookUrl(book.book_url)
    if (result.error || !result.url) {
      toast.error(result.error ?? "فشل إنشاء رابط الملف")
      return
    }
    window.open(result.url, "_blank")
  }

  async function handleDelete(book: Book) {
    const result = await deleteBook(book.id)
    setBookToDelete(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("تم حذف الكتاب")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم الكتاب أو المؤلف"
          aria-label="ابحث باسم الكتاب أو المؤلف"
          className="ps-8"
        />
      </div>

      {books.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <BookIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">لا توجد كتب في المكتبة بعد</p>
          <p className="text-sm text-muted-foreground">
            اضغط على زر &quot;إضافة كتاب&quot; أعلى الصفحة لإضافة أول كتاب
          </p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <SearchIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">لا توجد نتائج</p>
          <p className="text-sm text-muted-foreground">
            لم يتم العثور على كتب مطابقة لـ &quot;{query}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredBooks.map((book) => (
            <Card key={book.id} size="sm">
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover_url}
                  alt={book.name}
                  className="aspect-3/4 w-full object-cover"
                />
              ) : (
                <div className="flex aspect-3/4 w-full items-center justify-center bg-muted">
                  <BookIcon className="size-8 text-muted-foreground" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="truncate" title={book.name}>
                  {book.name}
                </CardTitle>
                <CardDescription className="truncate">
                  {book.metadata?.author ?? "بدون مؤلف"}
                </CardDescription>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon />
                        <span className="sr-only">خيارات الكتاب</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(book)}>
                        <DownloadIcon />
                        تحميل
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setBookToEdit(book)}>
                        <PencilIcon />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setBookToDelete(book)}
                      >
                        <Trash2Icon />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {bookToEdit && (
        <BookFormDialog
          key={bookToEdit.id}
          book={bookToEdit}
          open={Boolean(bookToEdit)}
          onOpenChange={(open) => !open && setBookToEdit(null)}
        />
      )}

      <AlertDialog
        open={Boolean(bookToDelete)}
        onOpenChange={(open) => !open && setBookToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الكتاب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{bookToDelete?.name}&quot;؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => bookToDelete && handleDelete(bookToDelete)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
