import { GraphQLProvider } from "./urql"
import "./globals.css"

export const metadata = {
  title: "Agent Events Dashboard",
  description: "Real-time monitoring of Modus agent activities and events",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GraphQLProvider>{children}</GraphQLProvider>
      </body>
    </html>
  )
}
