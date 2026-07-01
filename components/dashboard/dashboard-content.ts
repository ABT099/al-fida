import {
  BookIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  LibraryBigIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type DashboardStep = {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

export const gettingStartedSteps: DashboardStep[] = [
  {
    title: "التقويم الدراسي",
    description:
      "أنشئوا السنة الدراسية الحالية وحدّدوا فصولها الدراسية، فهي الأساس الذي يرتبط به الطلاب والمواد.",
    href: "/academic-year",
    icon: CalendarIcon,
  },
  {
    title: "المكتبة",
    description: "أضيفوا الكتب الدراسية التي ستُستخدم كمرجع للمواد.",
    href: "/library",
    icon: LibraryBigIcon,
  },
  {
    title: "المواد",
    description: "أنشئوا المواد الدراسية واربطوا كل مادة بكتابها من المكتبة.",
    href: "/courses",
    icon: BookIcon,
  },
  {
    title: "الطلاب",
    description: "أضيفوا الطلاب وسجّلوهم في السنة والفصل الدراسي المناسب.",
    href: "/students",
    icon: UsersIcon,
  },
  {
    title: "الامتحانات",
    description:
      "أنشئوا الامتحانات المرتبطة بالمواد، صحّحوها، ثم أصدروا التقارير.",
    href: "/exams",
    icon: ClipboardCheckIcon,
  },
]

export type DashboardFeature = {
  title: string
  description: string
  href: string
  cta: string
  icon: LucideIcon
}

export const featureCards: DashboardFeature[] = [
  {
    title: "المكتبة",
    description:
      "إدارة الكتب الدراسية المستخدمة في المواد، بما يشمل الغلاف والمؤلف وتحميل الملفات.",
    href: "/library",
    cta: "عرض المكتبة",
    icon: LibraryBigIcon,
  },
  {
    title: "المواد",
    description: "إنشاء المواد الدراسية وربطها بكتب المكتبة وتحديد حالة ظهورها.",
    href: "/courses",
    cta: "عرض المواد",
    icon: BookIcon,
  },
  {
    title: "التقويم الدراسي",
    description: "إدارة السنوات الدراسية وفصولها وتحديد الفصل الحالي لكل سنة.",
    href: "/academic-year",
    cta: "عرض التقويم الدراسي",
    icon: CalendarIcon,
  },
  {
    title: "الطلاب",
    description:
      "إدارة سجلات الطلاب وبياناتهم وتسجيلهم في السنوات والفصول الدراسية.",
    href: "/students",
    cta: "عرض الطلاب",
    icon: UsersIcon,
  },
  {
    title: "الامتحانات",
    description:
      "إنشاء الامتحانات وتصحيحها وإصدار تقارير قابلة للطباعة بالنتائج والحضور.",
    href: "/exams",
    cta: "عرض الامتحانات",
    icon: ClipboardCheckIcon,
  },
]
