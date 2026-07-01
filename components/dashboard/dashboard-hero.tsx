import { GraduationCapIcon } from "lucide-react"

export function DashboardHero() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-t from-primary/10 to-card p-6 ring-1 ring-foreground/10 sm:p-8">
      <div className="flex items-center gap-2 text-primary">
        <GraduationCapIcon className="size-5" />
        <span className="text-sm font-medium">دار الفداء</span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        أهلاً بكم في نظام إدارة دار الفداء
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
        من هنا يمكنكم إدارة المكتبة والمواد الدراسية والسنوات والفصول
        والطلاب والامتحانات في مكان واحد. ابدأوا بالخطوات التالية أو انتقلوا
        مباشرة إلى القسم الذي تحتاجونه.
      </p>
    </div>
  )
}
