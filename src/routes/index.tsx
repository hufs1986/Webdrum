import { createFileRoute } from "@tanstack/react-router";
import { DrumMachine } from "@/components/drum/drum-machine";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="min-h-dvh bg-bg text-fg">
      <DrumMachine />
    </main>
  );
}
