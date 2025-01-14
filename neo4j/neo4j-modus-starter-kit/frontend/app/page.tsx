import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">Modus Neo4j Movie Search</h1>
        <div className="text-sm">Be sure to generate embeddings before searching for movies!</div>
        <Link href="/movies">
          <Button size="sm" className="mt-4">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  )
}
