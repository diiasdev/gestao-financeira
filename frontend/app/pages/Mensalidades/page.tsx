import { MensalidadesDashboard } from "@/components/mensalidades";
import { BottomNavigation, Header } from "@/components/layout/Header";

export default function MensalidadesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header activeTab="mensalidades" />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
        <MensalidadesDashboard />
      </main>

      <BottomNavigation activeTab="mensalidades" />
    </div>
  );
}
