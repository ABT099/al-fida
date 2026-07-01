"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { error?: string }

function buildPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const examTimeRaw = String(formData.get("exam_time") ?? "").trim()
  const exam_time = examTimeRaw ? examTimeRaw : null
  const courseIdRaw = String(formData.get("course_id") ?? "")
  const course_id = courseIdRaw ? Number(courseIdRaw) : null

  return { name, exam_time, course_id }
}

export async function createExam(formData: FormData): Promise<ActionResult> {
  const supabase = createClient(await cookies())
  const payload = buildPayload(formData)

  if (!payload.name) return { error: "اسم الامتحان مطلوب" }
  if (!payload.course_id) return { error: "المادة مطلوبة" }

  const { error } = await supabase.from("exams").insert(payload)

  if (error) {
    console.error("createExam failed:", error)
    return { error: "فشل حفظ الامتحان" }
  }

  revalidatePath("/exams")
  return {}
}

export async function updateExam(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const { data: existing } = await supabase
    .from("exams")
    .select("finalized")
    .eq("id", id)
    .single()
  if (existing?.finalized) return { error: "لا يمكن تعديل امتحان تم اعتماده" }

  const payload = buildPayload(formData)

  if (!payload.name) return { error: "اسم الامتحان مطلوب" }
  if (!payload.course_id) return { error: "المادة مطلوبة" }

  const { error } = await supabase.from("exams").update(payload).eq("id", id)

  if (error) {
    console.error("updateExam failed:", error)
    return { error: "فشل تحديث الامتحان" }
  }

  revalidatePath("/exams")
  return {}
}

export async function deleteExam(id: number): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const { data: existing } = await supabase
    .from("exams")
    .select("finalized")
    .eq("id", id)
    .single()
  if (existing?.finalized) return { error: "لا يمكن حذف امتحان تم اعتماده" }

  await supabase.from("exams_students").delete().eq("exam_id", id)

  const { error } = await supabase.from("exams").delete().eq("id", id)
  if (error) {
    console.error("deleteExam failed:", error)
    return { error: "فشل حذف الامتحان" }
  }

  revalidatePath("/exams")
  return {}
}
