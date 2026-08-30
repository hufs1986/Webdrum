import { useEffect, useRef } from "react";
import { Drum, Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { drumEngine } from "@/lib/drum/engine";
import { KEY_TO_PAD, PADS, PRESETS, type PadId } from "@/lib/drum/pads";
import { useDrum } from "@/lib/drum/store";

export function DrumMachine() {
  const bpm = useDrum((s) => s.bpm);
  const swing = useDrum((s) => s.swing);
  const volume = useDrum((s) => s.volume);
  const playing = useDrum((s) => s.playing);
  const currentStep = useDrum((s) => s.currentStep);
  const selectedPad = useDrum((s) => s.selectedPad);
  const pattern = useDrum((s) => s.pattern);
  const hits = useDrum((s) => s.hits);
  const presetId = useDrum((s) => s.presetId);
  const togglePlay = useDrum((s) => s.togglePlay);
  const stop = useDrum((s) => s.stop);
  const setBpm = useDrum((s) => s.setBpm);
  const setSwing = useDrum((s) => s.setSwing);
  const setVolume = useDrum((s) => s.setVolume);
  const hitPad = useDrum((s) => s.hitPad);
  const selectPad = useDrum((s) => s.selectPad);
  const toggleStep = useDrum((s) => s.toggleStep);
  const clearPattern = useDrum((s) => s.clearPattern);
  const loadPreset = useDrum((s) => s.loadPreset);

  const held = useRef(new Set<string>());

  useEffect(() => {
    drumEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!held.current.has("space")) {
          held.current.add("space");
          togglePlay();
        }
        return;
      }
      const pad = KEY_TO_PAD[e.key.toLowerCase()];
      if (!pad) return;
      if (held.current.has(pad)) return;
      held.current.add(pad);
      e.preventDefault();
      hitPad(pad);
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") held.current.delete("space");
      const pad = KEY_TO_PAD[e.key.toLowerCase()];
      if (pad) held.current.delete(pad);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [hitPad, togglePlay]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[0.68rem] font-semibold tracking-[0.28em] text-muted uppercase">
            WEBDRUM
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            웹드럼
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            패드를 두드리거나 키를 누르세요. 스페이스는 재생입니다.
          </p>
        </div>
        <div className="hidden size-11 items-center justify-center rounded-xl bg-elevated text-fg shadow-[var(--shadow-border)] sm:flex">
          <Drum className="size-5" strokeWidth={1.75} />
        </div>
      </header>

      <section aria-label="트랜스포트" className="rounded-3xl bg-surface p-2 shadow-[var(--shadow-border)] sm:p-3">
        <div className="rounded-2xl bg-elevated/40 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="default"
              size="icon"
              aria-label={playing ? "일시정지" : "재생"}
              onClick={() => togglePlay()}
            >
              <span className="relative size-4">
                <Play
                  className={cn(
                    "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-[var(--motion-fast)] ease-[var(--ease-in-out)]",
                    playing
                      ? "scale-[0.25] opacity-0 blur-[4px]"
                      : "ml-0.5 scale-100 opacity-100 blur-none",
                  )}
                />
                <Pause
                  className={cn(
                    "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-[var(--motion-fast)] ease-[var(--ease-in-out)]",
                    playing
                      ? "scale-100 opacity-100 blur-none"
                      : "scale-[0.25] opacity-0 blur-[4px]",
                  )}
                />
              </span>
            </Button>
            <Button variant="secondary" size="icon" aria-label="정지" onClick={() => stop()}>
              <Square className="size-3.5 fill-current" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearPattern()} className="ml-auto sm:ml-0">
              <RotateCcw className="size-3.5" />
              지우기
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SliderField
              label="템포"
              value={`${bpm}`}
              unit="BPM"
              min={60}
              max={200}
              step={1}
              current={bpm}
              onChange={setBpm}
            />
            <SliderField
              label="스윙"
              value={`${Math.round(swing * 100)}`}
              unit="%"
              min={0}
              max={45}
              step={1}
              current={Math.round(swing * 100)}
              onChange={(n) => setSwing(n / 100)}
            />
            <SliderField
              label="볼륨"
              value={`${Math.round(volume * 100)}`}
              unit="%"
              min={0}
              max={100}
              step={1}
              current={Math.round(volume * 100)}
              onChange={(n) => setVolume(n / 100)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadPreset(preset.id)}
                className={cn(
                  "h-9 rounded-full px-3.5 text-xs font-medium transition-[background-color,color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                  presetId === preset.id
                    ? "bg-fg text-bg"
                    : "bg-elevated text-muted shadow-[var(--shadow-border)] hover:text-fg",
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="드럼 패드" className="rounded-3xl bg-surface p-2 shadow-[var(--shadow-border)] sm:p-3">
        <div className="grid grid-cols-4 gap-2">
          {PADS.map((pad) => (
            <PadButton
              key={pad.id}
              pad={pad}
              selected={selectedPad === pad.id}
              hitAt={hits[pad.id]}
              onHit={hitPad}
              onSelect={selectPad}
            />
          ))}
        </div>
      </section>

      <section aria-label="시퀀서" className="rounded-3xl bg-surface p-2 shadow-[var(--shadow-border)] sm:p-3">
        <div className="rounded-2xl p-3 sm:p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xs font-medium tracking-wide text-muted uppercase">시퀀서</h2>
            <p className="text-xs text-subtle">
              {PADS.find((p) => p.id === selectedPad)?.name} · 16스텝
            </p>
          </div>
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-16">
            {Array.from({ length: 16 }, (_, i) => {
              const on = pattern[selectedPad][i];
              const current = currentStep === i;
              const beat = i % 4 === 0;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`스텝 ${i + 1}`}
                  aria-pressed={on}
                  onClick={() => toggleStep(selectedPad, i)}
                  className={cn(
                    "h-10 rounded-md transition-[background-color,box-shadow,transform] duration-[var(--motion-quick)] ease-[var(--ease-out)] active:scale-[0.96] sm:h-11",
                    on ? "bg-fg" : beat ? "bg-elevated" : "bg-pad",
                    current && "shadow-[0_0_0_1px_var(--color-accent)]",
                    !on && "shadow-[var(--shadow-border)]",
                  )}
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function SliderField({
  label,
  value,
  unit,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs">
        <span className="font-medium tracking-wide text-muted uppercase">{label}</span>
        <span className="font-mono tabular-nums text-fg">
          {value}
          <span className="ml-1 text-subtle">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-elevated accent-fg"
      />
    </label>
  );
}

function PadButton({
  pad,
  selected,
  hitAt,
  onHit,
  onSelect,
}: {
  pad: { id: PadId; name: string; sub: string; key: string };
  selected: boolean;
  hitAt?: number;
  onHit: (id: PadId, velocity?: number) => void;
  onSelect: (id: PadId) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hitAt) return;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "pad-hit 160ms var(--ease-out)";
  }, [hitAt]);

  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const y = (e.clientY - rect.top) / rect.height;
        const velocity = 0.35 + (1 - Math.min(1, Math.max(0, y))) * 0.65;
        onHit(pad.id, velocity);
      }}
      onContextMenu={(e) => e.preventDefault()}
      onFocus={() => onSelect(pad.id)}
      className={cn(
        "flex min-h-18 flex-col items-start justify-between rounded-2xl bg-pad p-2.5 text-left text-fg touch-manipulation select-none transition-[box-shadow,transform] duration-[var(--motion-micro)] ease-[var(--ease-out)] sm:min-h-22 sm:p-3",
        "active:scale-[0.96]",
        selected ? "shadow-[0_0_0_1px_var(--color-accent)]" : "shadow-[var(--shadow-border)]",
      )}
    >
      <span className="font-mono text-[0.65rem] tracking-wider text-subtle">{pad.key}</span>
      <span>
        <span className="block text-sm leading-tight font-medium">{pad.name}</span>
        <span className="mt-0.5 hidden font-mono text-[0.6rem] tracking-widest text-subtle sm:block">
          {pad.sub}
        </span>
      </span>
    </button>
  );
}
