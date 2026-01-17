import LogDashboard from "@/components/LogDashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">LogStream</h1>
          <p className="text-muted-foreground text-lg">
            Distributed Log Aggregator & Visualizer
          </p>
        </div>
        
        <LogDashboard />
      </main>
    </div>
  );
}
