import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
