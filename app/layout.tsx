import { Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        ibmPlexSansArabic.variable
      )}
    >
      <body>{children}</body>
    </html>
  )
}
