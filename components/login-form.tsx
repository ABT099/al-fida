"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { GalleryVerticalEndIcon } from "lucide-react"

const loginSchema = z.object({
  email: z.email("أدخل بريدًا إلكترونيًا صالحًا."),
  password: z.string().min(6, "يجب أن تكون كلمة المرور 6 أحرف على الأقل."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(values)

    if (error) {
      setServerError("البريد الإلكتروني أو كلمة المرور غير صحيحة.")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEndIcon className="size-6" />
              </div>
              <span className="sr-only">دار الفداء</span>
            </a>
            <h1 className="text-xl font-bold">مرحبًا بكم في دار الفداء</h1>
            <FieldDescription>
              أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول إلى حسابك.
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">البريد الإلكتروني</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">كلمة المرور</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          {serverError && <FieldError>{serverError}</FieldError>}
          <Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
