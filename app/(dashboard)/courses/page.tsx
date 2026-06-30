import { cookies } from "next/headers"
import { PlusIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CourseFormDialog } from "@/components/courses/course-form-dialog"
import { CoursesGrid, type Course } from "@/components/courses/courses-grid"

export default async function Page() {
  const supabase = createClient(await cookies())
  const [{ data: courses }, { data: books }] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("books").select("id, name, cover_url").order("name"),
  ])

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">المواد</h1>
        <CourseFormDialog
          books={books ?? []}
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              إضافة مادة
            </Button>
          }
        />
      </div>
      <CoursesGrid courses={(courses as Course[]) ?? []} books={books ?? []} />
    </div>
  )
}
