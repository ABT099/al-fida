import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: session } = await supabase.auth.getSession()

  return (
    <div>
      <h1>Welcome</h1>
      {session?.session ? (
        <p>You are logged in as {session.session.user.email}</p>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  )
}
