import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import LogDashboard from "@/components/LogDashboard"

export default async function Home() {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background font-[family-name:var(--font-geist-sans)] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <main className="relative z-10">
        <LogDashboard />
      </main>
    </div>
  )
}
