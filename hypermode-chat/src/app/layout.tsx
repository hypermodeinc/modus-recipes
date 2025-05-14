import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

const allianceNo2 = localFont({
  src: [
    {
      path: "./fonts/alliance-no2-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/alliance-no2-regular-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/alliance-no2-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-alliance-no2",
  preload: true,
})

const inter = localFont({
  src: [
    {
      path: "./fonts/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Inter-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/Inter-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Inter-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/Inter-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Inter-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "./fonts/Inter-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Inter-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  preload: true,
})

const geistMono = localFont({
  src: [
    {
      path: "./fonts/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  preload: true,
})

export const metadata: Metadata = {
  title: "Hypermode Demo App",
  description: "Created by Hypermode",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const fontClasses = [
    allianceNo2.variable,
    inter.variable,
    geistMono.variable,
    "antialiased",
    "bg-surface-bg",
  ].join(" ")

  return (
    <html lang="en">
      <body className={fontClasses}>{children}</body>
    </html>
  )
}
