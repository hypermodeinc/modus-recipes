import "./globals.css"
import "@aichatkit/ui/dist/base.css"
import type { Metadata } from "next"
import { ApolloWrapper } from "./apollo-wrapper"

export const metadata: Metadata = {
  title: "Hypermode Chat Interface",
  description: "A modern chat interface built with Hypermode components",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-hypermode-bg text-white h-screen w-screen overflow-hidden">
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  )
}
