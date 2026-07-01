"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCourseRoster } from "@/app/(dashboard)/exams/roster"

type ActionResult = { error?: string }

async function assertNotFinalized(
  supabase: ReturnType<typeof createClient>,
  examId: number
): Promise<string | null> {
  const { data: exam } = await supabase
    .from("exams")
    .select("finalized")
    .eq("id", examId)
    .single()
  if (!exam) return "الامتحان غير موجود"
  if (exam.finalized) return "تم اعتماد هذا الامتحان، لا يمكن تعديل الدرجات"
  return null
}

export async function upsertExamStudent(
  examId: number,
  studentId: number,
  attended: boolean,
  grade: number
): Promise<ActionResult> {
  const supabase = createClient(await cookies())
  const guardError = await assertNotFinalized(supabase, examId)
  if (guardError) return { error: guardError }

  if (!Number.isFinite(grade) || grade < 0) return { error: "الدرجة غير صالحة" }

  const { error } = await supabase
    .from("exams_students")
    .upsert(
      { exam_id: examId, student_id: studentId, attended, grade },
      { onConflict: "exam_id,student_id" }
    )

  if (error) {
    console.error("upsertExamStudent failed:", error)
    return { error: "فشل حفظ الدرجة" }
  }

  revalidatePath(`/exams/${examId}/grade`)
  return {}
}

export async function bulkUpsertAttendance(
  examId: number,
  updates: { student_id: number; grade: number }[],
  attended: boolean
): Promise<ActionResult> {
  const supabase = createClient(await cookies())
  const guardError = await assertNotFinalized(supabase, examId)
  if (guardError) return { error: guardError }

  const { error } = await supabase.from("exams_students").upsert(
    updates.map((u) => ({
      exam_id: examId,
      student_id: u.student_id,
      attended,
      grade: u.grade,
    })),
    { onConflict: "exam_id,student_id" }
  )

  if (error) {
    console.error("bulkUpsertAttendance failed:", error)
    return { error: "فشل تحديث حالة الحضور" }
  }

  revalidatePath(`/exams/${examId}/grade`)
  return {}
}

export async function finalizeExam(examId: number): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const { data: exam } = await supabase
    .from("exams")
    .select("finalized, course_id")
    .eq("id", examId)
    .single()
  if (!exam) return { error: "الامتحان غير موجود" }
  if (exam.finalized) return {}

  // Snapshot the full current roster first — upsert any enrolled student who was
  // never touched during grading — then lock the exam. This order fails safe:
  // if it's interrupted here, the exam is simply still not finalized and the
  // teacher can retry; flipping the flag first would risk locking an incomplete record.
  const roster = await getCourseRoster(supabase, exam.course_id)
  const { data: existing } = await supabase
    .from("exams_students")
    .select("student_id")
    .eq("exam_id", examId)
  const existingIds = new Set((existing ?? []).map((e) => e.student_id))
  const missing = roster.filter((r) => !existingIds.has(r.student_id))

  if (missing.length > 0) {
    const { error: snapshotError } = await supabase.from("exams_students").upsert(
      missing.map((r) => ({
        exam_id: examId,
        student_id: r.student_id,
        attended: true,
        grade: 0,
      })),
      { onConflict: "exam_id,student_id" }
    )
    if (snapshotError) {
      console.error("finalizeExam snapshot failed:", snapshotError)
      return { error: "فشل حفظ بيانات الطلاب قبل الاعتماد" }
    }
  }

  const { error: finalizeError } = await supabase
    .from("exams")
    .update({ finalized: true })
    .eq("id", examId)
  if (finalizeError) {
    console.error("finalizeExam failed:", finalizeError)
    return { error: "فشل اعتماد الامتحان" }
  }

  revalidatePath(`/exams/${examId}/grade`)
  revalidatePath("/exams")
  return {}
}
