import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: session } = await supabase.auth.getSession()

  return (
    <div>
      <h1>اهلا بكم</h1>
      {session?.session ? (
        <p>أنت مسجل الدخول كـ {session.session.user.email}</p>
      ) : (
        <p>أنت غير مسجل الدخول.</p>
      )}
    </div>
  )
}
