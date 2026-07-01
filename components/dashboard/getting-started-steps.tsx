import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { gettingStartedSteps } from "@/components/dashboard/dashboard-content"

export function GettingStartedSteps() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">خطوات البدء</h2>
        <p className="text-sm text-muted-foreground">
          اتبعوا هذا الترتيب عند إعداد النظام لأول مرة
        </p>
      </div>
      <ol className="flex flex-col gap-3">
        {gettingStartedSteps.map((step, i) => (
          <li key={step.href}>
            <Link
              href={step.href}
              className="group/step flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 shadow-xs transition-colors hover:bg-muted/50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <step.icon className="size-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
              <ArrowLeftIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/step:-translate-x-1 rtl:rotate-180 rtl:group-hover/step:translate-x-1" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
