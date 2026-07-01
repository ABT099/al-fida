"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { error?: string }

function isUniqueViolation(error: { code?: string }) {
  return error.code === "23505"
}

export async function createAcademicYear(
  formData: FormData
): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const label = String(formData.get("label") ?? "").trim()
  const starts_at = String(formData.get("starts_at") ?? "").trim()
  const ends_at = String(formData.get("ends_at") ?? "").trim()

  if (!label) return { error: "اسم السنة الدراسية مطلوب" }
  if (!starts_at) return { error: "تاريخ البداية مطلوب" }
  if (!ends_at) return { error: "تاريخ النهاية مطلوب" }

  const { error } = await supabase
    .from("academic_years")
    .insert({ label, starts_at, ends_at })

  if (error) {
    if (isUniqueViolation(error)) return { error: "هذه السنة الدراسية موجودة مسبقاً" }
    return { error: "فشل حفظ السنة الدراسية" }
  }

  revalidatePath("/academic-year")
  return {}
}

export async function updateAcademicYear(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const label = String(formData.get("label") ?? "").trim()
  const starts_at = String(formData.get("starts_at") ?? "").trim()
  const ends_at = String(formData.get("ends_at") ?? "").trim()
  const currentSemesterRaw = String(formData.get("current_semester") ?? "").trim()
  const current_semester =
    currentSemesterRaw && currentSemesterRaw !== "none"
      ? Number(currentSemesterRaw)
      : null

  if (!label) return { error: "اسم السنة الدراسية مطلوب" }
  if (!starts_at) return { error: "تاريخ البداية مطلوب" }
  if (!ends_at) return { error: "تاريخ النهاية مطلوب" }

  const { error } = await supabase
    .from("academic_years")
    .update({ label, starts_at, ends_at, current_semester })
    .eq("id", id)

  if (error) {
    if (isUniqueViolation(error)) return { error: "هذه السنة الدراسية موجودة مسبقاً" }
    return { error: "فشل تحديث السنة الدراسية" }
  }

  revalidatePath("/academic-year")
  return {}
}

export async function deleteAcademicYear(id: number): Promise<ActionResult> {
  const supabase = createClient(await cookies())
  const { error } = await supabase
    .from("academic_years")
    .delete()
    .eq("id", id)

  if (error) return { error: "فشل حذف السنة الدراسية" }

  revalidatePath("/academic-year")
  return {}
}
