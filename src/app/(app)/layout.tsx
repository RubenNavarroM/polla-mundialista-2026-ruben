import { Navbar } from "@/components/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
