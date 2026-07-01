"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { error?: string }

export async function createStudent(formData: FormData): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const first_name = String(formData.get("first_name") ?? "").trim()
  const last_name = String(formData.get("last_name") ?? "").trim()
  const phone_number = String(formData.get("phone_number") ?? "").trim()
  const year_id = Number(formData.get("year_id"))
  const semesterIds = formData.getAll("semester_ids").map(Number).filter(Boolean)

  if (!first_name) return { error: "الاسم الأول مطلوب" }
  if (!last_name) return { error: "اسم العائلة مطلوب" }
  if (!phone_number) return { error: "رقم الهاتف مطلوب" }
  if (!year_id) return { error: "السنة الدراسية مطلوبة" }

  const { data: student, error } = await supabase
    .from("students")
    .insert({ first_name, last_name, phone_number, year_id })
    .select("id")
    .single()

  if (error || !student) return { error: "فشل حفظ بيانات الطالب" }

  if (semesterIds.length > 0) {
    const { error: enrollError } = await supabase
      .from("semester_enrollements")
      .insert(semesterIds.map((semester_id) => ({ semester_id, student_id: student.id, enrolled_at: null })))
    if (enrollError) return { error: "تم حفظ الطالب لكن فشل تسجيل الفصول" }
  }

  revalidatePath("/students")
  return {}
}

export async function updateStudent(id: number, formData: FormData): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const first_name = String(formData.get("first_name") ?? "").trim()
  const last_name = String(formData.get("last_name") ?? "").trim()
  const phone_number = String(formData.get("phone_number") ?? "").trim()
  const year_id = Number(formData.get("year_id"))
  const semesterIds = formData.getAll("semester_ids").map(Number).filter(Boolean)

  if (!first_name) return { error: "الاسم الأول مطلوب" }
  if (!last_name) return { error: "اسم العائلة مطلوب" }
  if (!phone_number) return { error: "رقم الهاتف مطلوب" }
  if (!year_id) return { error: "السنة الدراسية مطلوبة" }

  const { error } = await supabase
    .from("students")
    .update({ first_name, last_name, phone_number, year_id })
    .eq("id", id)

  if (error) return { error: "فشل تحديث بيانات الطالب" }

  await supabase.from("semester_enrollements").delete().eq("student_id", id)

  if (semesterIds.length > 0) {
    const { error: enrollError } = await supabase
      .from("semester_enrollements")
      .insert(semesterIds.map((semester_id) => ({ semester_id, student_id: id, enrolled_at: null })))
    if (enrollError) return { error: "تم تحديث الطالب لكن فشل تحديث الفصول" }
  }

  revalidatePath("/students")
  return {}
}

export async function deleteStudent(id: number): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  await supabase.from("semester_enrollements").delete().eq("student_id", id)

  const { error } = await supabase.from("students").delete().eq("id", id)
  if (error) return { error: "فشل حذف الطالب" }

  revalidatePath("/students")
  return {}
}
