export type NavItem = {
  title: string
  url: string
  children?: NavItem[]
}

export const navItems: NavItem[] = [
  { title: "الصفحة الرئيسية", url: "/" },
  { title: "المكتبة", url: "/library" },
  { title: "المواد", url: "/courses" },
  {
    title: "التقويم الدراسي",
    url: "/academic-year",
    children: [
      { title: "السنوات الدراسية", url: "/academic-year" },
      { title: "الفصول الدراسية", url: "/semesters" },
    ],
  },
  { title: "الطلاب", url: "/students" },
  { title: "الامتحانات", url: "/exams" },
]
