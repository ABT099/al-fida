import { createClient } from "@/lib/supabase/server"

export type RosterStudent = {
  student_id: number
  first_name: string
  last_name: string
}

// Students enrolled in a course, derived from course -> semesters_courses -> semester_enrollements -> students.
// This can't be a single PostgREST nested select: semesters_courses and semester_enrollements are only
// related to each other through semester_id, not a direct FK chain, so we resolve it in two queries.
export async function getCourseRoster(
  supabase: ReturnType<typeof createClient>,
  courseId: number
): Promise<RosterStudent[]> {
  const { data: links } = await supabase
    .from("semesters_courses")
    .select("semester_id")
    .eq("course_id", courseId)

  const semesterIds = (links ?? []).map((l) => l.semester_id)
  if (semesterIds.length === 0) return []

  const { data: enrollments } = await supabase
    .from("semester_enrollements")
    .select("student_id, students(id, first_name, last_name)")
    .in("semester_id", semesterIds)

  const byId = new Map<number, RosterStudent>()
  for (const e of enrollments ?? []) {
    const s = e.students as unknown as
      | { id: number; first_name: string; last_name: string }
      | null
    if (s) byId.set(s.id, { student_id: s.id, first_name: s.first_name, last_name: s.last_name })
  }
  return [...byId.values()]
}
