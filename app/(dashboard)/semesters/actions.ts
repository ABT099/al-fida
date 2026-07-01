"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { error?: string }

function parseCourseIds(formData: FormData): number[] {
  return formData
    .getAll("course_ids")
    .map((v) => Number(v))
    .filter((n) => !isNaN(n) && n > 0)
}

export async function createSemester(
  formData: FormData
): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const name = String(formData.get("name") ?? "").trim()
  const yearIdRaw = String(formData.get("acedemic_year_id") ?? "").trim()
  const acedemic_year_id =
    yearIdRaw && yearIdRaw !== "none" ? Number(yearIdRaw) : null
  const courseIds = parseCourseIds(formData)

  if (!name) return { error: "اسم الفصل الدراسي مطلوب" }

  const { data: semester, error } = await supabase
    .from("semesters")
    .insert({ name, acedemic_year_id })
    .select("id")
    .single()

  if (error || !semester) return { error: "فشل حفظ الفصل الدراسي" }

  if (courseIds.length > 0) {
    const { error: joinError } = await supabase
      .from("semesters_courses")
      .insert(courseIds.map((course_id) => ({ semester_id: semester.id, course_id })))
    if (joinError) return { error: "تم حفظ الفصل لكن فشل ربط المواد" }
  }

  revalidatePath("/semesters")
  return {}
}

export async function updateSemester(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const name = String(formData.get("name") ?? "").trim()
  const yearIdRaw = String(formData.get("acedemic_year_id") ?? "").trim()
  const acedemic_year_id =
    yearIdRaw && yearIdRaw !== "none" ? Number(yearIdRaw) : null
  const courseIds = parseCourseIds(formData)

  if (!name) return { error: "اسم الفصل الدراسي مطلوب" }

  const { error } = await supabase
    .from("semesters")
    .update({ name, acedemic_year_id })
    .eq("id", id)

  if (error) return { error: "فشل تحديث الفصل الدراسي" }

  await supabase.from("semesters_courses").delete().eq("semester_id", id)

  if (courseIds.length > 0) {
    const { error: joinError } = await supabase
      .from("semesters_courses")
      .insert(courseIds.map((course_id) => ({ semester_id: id, course_id })))
    if (joinError) return { error: "تم تحديث الفصل لكن فشل ربط المواد" }
  }

  revalidatePath("/semesters")
  return {}
}

export async function deleteSemester(id: number): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  await supabase.from("semesters_courses").delete().eq("semester_id", id)

  const { error } = await supabase.from("semesters").delete().eq("id", id)
  if (error) return { error: "فشل حذف الفصل الدراسي" }

  revalidatePath("/semesters")
  return {}
}
