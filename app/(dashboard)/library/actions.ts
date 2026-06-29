"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

const COVERS_BUCKET = "book-covers"
const FILES_BUCKET = "book-files"

type ActionResult = { error?: string }

function uniqueFileName(file: File) {
  return `${crypto.randomUUID()}-${file.name}`
}

function isUniqueViolation(error: { code?: string }) {
  return error.code === "23505"
}

export async function createBook(formData: FormData): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const name = String(formData.get("name") ?? "").trim()
  const author = String(formData.get("author") ?? "").trim()
  const cover = formData.get("cover") as File | null
  const file = formData.get("file") as File | null

  if (!name) return { error: "اسم الكتاب مطلوب" }
  if (!file || file.size === 0) return { error: "ملف الكتاب مطلوب" }

  let coverPath: string | null = null
  if (cover && cover.size > 0) {
    coverPath = uniqueFileName(cover)
    const { error } = await supabase.storage
      .from(COVERS_BUCKET)
      .upload(coverPath, cover)
    if (error) return { error: "فشل رفع صورة الغلاف" }
  }

  const filePath = uniqueFileName(file)
  const { error: fileError } = await supabase.storage
    .from(FILES_BUCKET)
    .upload(filePath, file)
  if (fileError) return { error: "فشل رفع ملف الكتاب" }

  const coverUrl = coverPath
    ? supabase.storage.from(COVERS_BUCKET).getPublicUrl(coverPath).data
        .publicUrl
    : null

  const { error: insertError } = await supabase.from("books").insert({
    name,
    metadata: author ? { author } : null,
    cover_url: coverUrl,
    book_url: filePath,
  })

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      return { error: "اسم الكتاب مستخدم من قبل" }
    }
    return { error: "فشل حفظ الكتاب" }
  }

  revalidatePath("/library")
  return {}
}

export async function updateBook(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const name = String(formData.get("name") ?? "").trim()
  const author = String(formData.get("author") ?? "").trim()
  const cover = formData.get("cover") as File | null
  const file = formData.get("file") as File | null

  if (!name) return { error: "اسم الكتاب مطلوب" }

  const update: Record<string, unknown> = {
    name,
    metadata: author ? { author } : null,
  }

  if (cover && cover.size > 0) {
    const coverPath = uniqueFileName(cover)
    const { error } = await supabase.storage
      .from(COVERS_BUCKET)
      .upload(coverPath, cover)
    if (error) return { error: "فشل رفع صورة الغلاف" }
    update.cover_url = supabase.storage
      .from(COVERS_BUCKET)
      .getPublicUrl(coverPath).data.publicUrl
  }

  if (file && file.size > 0) {
    const filePath = uniqueFileName(file)
    const { error } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(filePath, file)
    if (error) return { error: "فشل رفع ملف الكتاب" }
    update.book_url = filePath
  }

  const { error: updateError } = await supabase
    .from("books")
    .update(update)
    .eq("id", id)

  if (updateError) {
    if (isUniqueViolation(updateError)) {
      return { error: "اسم الكتاب مستخدم من قبل" }
    }
    return { error: "فشل تحديث الكتاب" }
  }

  revalidatePath("/library")
  return {}
}

export async function deleteBook(id: number): Promise<ActionResult> {
  const supabase = createClient(await cookies())

  const { data: book } = await supabase
    .from("books")
    .select("cover_url, book_url")
    .eq("id", id)
    .single()

  const { error: deleteError } = await supabase
    .from("books")
    .delete()
    .eq("id", id)

  if (deleteError) return { error: "فشل حذف الكتاب" }

  if (book?.book_url) {
    await supabase.storage.from(FILES_BUCKET).remove([book.book_url])
  }
  if (book?.cover_url) {
    const coverPath = book.cover_url.split(`${COVERS_BUCKET}/`).pop()
    if (coverPath) {
      await supabase.storage.from(COVERS_BUCKET).remove([coverPath])
    }
  }

  revalidatePath("/library")
  return {}
}

export async function getSignedBookUrl(
  path: string
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient(await cookies())
  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(path, 60)

  if (error || !data) return { error: "فشل إنشاء رابط الملف" }
  return { url: data.signedUrl }
}
