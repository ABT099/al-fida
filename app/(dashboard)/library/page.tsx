import { cookies } from "next/headers"
import { PlusIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { BookFormDialog } from "@/components/library/book-form-dialog"
import { BooksGrid, type Book } from "@/components/library/books-grid"

export default async function Page() {
  const supabase = createClient(await cookies())
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">المكتبة</h1>
        <BookFormDialog
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              إضافة كتاب
            </Button>
          }
        />
      </div>
      <BooksGrid books={(books as Book[]) ?? []} />
    </div>
  )
}
