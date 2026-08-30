import type { PadId } from "./pads";

export class DrumEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  now() {
    return this.ensure().currentTime;
  }

  async resume() {
    const ctx = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();
    return ctx;
  }

  setVolume(v: number) {
    const master = this.master;
    if (master) master.gain.value = v;
  }

  trigger(id: PadId, velocity = 0.9, when?: number) {
    const ctx = this.ctx ?? this.ensure();
    const t = when ?? ctx.currentTime;
    const vel = Math.max(0.15, Math.min(1, velocity));
    switch (id) {
      case "kick":
        this.kick(t, vel);
        break;
      case "snare":
        this.snare(t, vel);
        break;
      case "clap":
        this.clap(t, vel);
        break;
      case "rim":
        this.rim(t, vel);
        break;
      case "chh":
        this.hat(t, vel, 0.045);
        break;
      case "ohh":
        this.hat(t, vel, 0.32);
        break;
      case "phh":
        this.hat(t, vel, 0.09);
        break;
      case "crash":
        this.cymbal(t, vel, 1.6, 400);
        break;
      case "tomL":
        this.tom(t, vel, 95, 0.38);
        break;
      case "tomM":
        this.tom(t, vel, 145, 0.3);
        break;
      case "tomH":
        this.tom(t, vel, 220, 0.24);
        break;
      case "cowbell":
        this.cowbell(t, vel);
        break;
      case "shaker":
        this.shaker(t, vel);
        break;
      case "ride":
        this.cymbal(t, vel, 0.9, 900);
        break;
      case "clave":
        this.clave(t, vel);
        break;
      case "zap":
        this.zap(t, vel);
        break;
    }
  }

  private ensure(): AudioContext {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 10;
    comp.ratio.value = 3.2;
    comp.attack.value = 0.003;
    comp.release.value = 0.14;
    master.connect(comp);
    comp.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.noise = this.makeNoise(ctx);
    return ctx;
  }

  private out(): GainNode {
    this.ensure();
    return this.master!;
  }

  private makeNoise(ctx: AudioContext) {
    const length = ctx.sampleRate * 1.5;
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private noiseSrc(t: number, dur: number, filterType: BiquadFilterType, freq: number, q = 1) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;
    src.connect(filter);
    src.start(t);
    src.stop(t + dur);
    return filter;
  }

  private env(t: number, a: number, d: number, peak: number) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(this.out());
    return g;
  }

  private osc(type: OscillatorType, t: number, dur: number) {
    const o = this.ctx!.createOscillator();
    o.type = type;
    o.start(t);
    o.stop(t + dur);
    return o;
  }

  private kick(t: number, vel: number) {
    const body = this.osc("sine", t, 0.42);
    body.frequency.setValueAtTime(168, t);
    body.frequency.exponentialRampToValueAtTime(38, t + 0.09);
    body.connect(this.env(t, 0.002, 0.38, vel * 1.05));

    const click = this.osc("square", t, 0.03);
    click.frequency.value = 980;
    const cg = this.env(t, 0.001, 0.018, vel * 0.18);
    const hp = this.ctx!.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 700;
    click.connect(hp);
    hp.connect(cg);
  }

  private snare(t: number, vel: number) {
    const tone = this.osc("triangle", t, 0.22);
    tone.frequency.setValueAtTime(198, t);
    tone.frequency.exponentialRampToValueAtTime(160, t + 0.12);
    tone.connect(this.env(t, 0.001, 0.16, vel * 0.42));

    const n = this.noiseSrc(t, 0.22, "highpass", 1400, 0.7);
    n.connect(this.env(t, 0.001, 0.18, vel * 0.7));
  }

  private clap(t: number, vel: number) {
    const offsets = [0, 0.011, 0.021, 0.038];
    for (const o of offsets) {
      const n = this.noiseSrc(t + o, 0.09, "bandpass", 1800, 1.4);
      n.connect(this.env(t + o, 0.001, 0.06, vel * (o === 0.038 ? 0.55 : 0.32)));
    }
  }

  private rim(t: number, vel: number) {
    const a = this.osc("square", t, 0.06);
    a.frequency.value = 410;
    a.connect(this.env(t, 0.001, 0.045, vel * 0.28));
    const b = this.osc("sine", t, 0.08);
    b.frequency.value = 820;
    b.connect(this.env(t, 0.001, 0.05, vel * 0.22));
  }

  private hat(t: number, vel: number, decay: number) {
    const n = this.noiseSrc(t, decay + 0.04, "highpass", decay > 0.2 ? 6200 : 7800, 0.6);
    n.connect(this.env(t, 0.001, decay, vel * (decay > 0.2 ? 0.38 : 0.32)));
  }

  private cymbal(t: number, vel: number, decay: number, freq: number) {
    const n = this.noiseSrc(t, decay, "highpass", freq, 0.5);
    n.connect(this.env(t, 0.002, decay, vel * 0.34));
    const metal = this.osc("square", t, decay * 0.4);
    metal.frequency.value = freq * 1.6;
    const bp = this.ctx!.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq * 2;
    bp.Q.value = 4;
    metal.connect(bp);
    bp.connect(this.env(t, 0.001, decay * 0.35, vel * 0.08));
  }

  private tom(t: number, vel: number, freq: number, decay: number) {
    const o = this.osc("sine", t, decay + 0.05);
    o.frequency.setValueAtTime(freq * 1.55, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
    o.connect(this.env(t, 0.002, decay, vel * 0.85));
    const n = this.noiseSrc(t, 0.05, "bandpass", freq * 2, 1);
    n.connect(this.env(t, 0.001, 0.04, vel * 0.12));
  }

  private cowbell(t: number, vel: number) {
    for (const f of [540, 800]) {
      const o = this.osc("square", t, 0.22);
      o.frequency.value = f;
      const bp = this.ctx!.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = f;
      bp.Q.value = 8;
      o.connect(bp);
      bp.connect(this.env(t, 0.001, 0.18, vel * 0.16));
    }
  }

  private shaker(t: number, vel: number) {
    const n = this.noiseSrc(t, 0.09, "bandpass", 7000, 1.8);
    n.connect(this.env(t, 0.004, 0.07, vel * 0.28));
  }

  private clave(t: number, vel: number) {
    const o = this.osc("triangle", t, 0.12);
    o.frequency.setValueAtTime(2450, t);
    o.frequency.exponentialRampToValueAtTime(1800, t + 0.04);
    o.connect(this.env(t, 0.001, 0.08, vel * 0.45));
  }

  private zap(t: number, vel: number) {
    const o = this.osc("sawtooth", t, 0.28);
    o.frequency.setValueAtTime(720, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.22);
    const lp = this.ctx!.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(400, t + 0.22);
    o.connect(lp);
    lp.connect(this.env(t, 0.001, 0.24, vel * 0.4));
  }
}

export const drumEngine = new DrumEngine();
