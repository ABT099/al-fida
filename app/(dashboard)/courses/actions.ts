"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { error?: string }

function isUniqueViolation(error: { code?: string }) {
  return error.code === "23505"
}

function buildPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const visible = formData.get("visible") === "on"
  const bookIdRaw = String(formData.get("book_id") ?? "")
  const book_id = bookIdRaw ? Number(bookIdRaw) : null

  return {
    name,
    metadata: { description, visible },
    book_id,
  }
}

export async function createCourse(formData: FormData): Promise<ActionResult> {
  const supabase = createClient(await cookies())
  const payload = buildPayload(formData)

  if (!payload.name) return { error: "اسم المادة مطلوب" }

  const { error } = await supabase.from("courses").insert(payload)

  if (error) {
    if (isUniqueViolation(error)) {
      return { error: "اسم المادة مستخدم من قبل" }
    }
    return { error: "فشل حفظ المادة" }
  }

  revalidatePath("/courses")
  return {}
}

export async function updateCourse(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  const supabase = createClient(await cookies())
  const payload = buildPayload(formData)

  if (!payload.name) return { error: "اسم المادة مطلوب" }

  const { error } = await supabase.from("courses").update(payload).eq("id", id)

  if (error) {
    if (isUniqueViolation(error)) {
      return { error: "اسم المادة مستخدم من قبل" }
    }
    return { error: "فشل تحديث المادة" }
  }

  revalidatePath("/courses")
  return {}
}

export async function deleteCourse(id: number): Promise<ActionResult> {
  const supabase = createClient(await cookies())
  const { error } = await supabase.from("courses").delete().eq("id", id)

  if (error) return { error: "فشل حذف المادة" }

  revalidatePath("/courses")
  return {}
}
