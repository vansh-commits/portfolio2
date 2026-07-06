/**
 * Canvas frame-sequence scrubber.
 * Loads /frames/hero/manifest.json -> { count, pad, ext, path }
 * Falls back to a procedural "orbit ring + portrait" placeholder
 * when the frame set hasn't been generated yet.
 */
export class FrameSequence {
  constructor(canvas, { onProgress } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.frames = [];
    this.count = 0;
    this.loaded = 0;
    this.current = -1;
    this.target = 0;
    this.smooth = 0;
    this.placeholder = false;
    this.portrait = null;
    this.onProgress = onProgress || (() => {});
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
  }

  async init() {
    try {
      const res = await fetch("/frames/hero/manifest.json", { cache: "no-store" });
      if (!res.ok) throw new Error("no manifest");
      const m = await res.json();
      this.count = m.count;
      this.pad = m.pad ?? 4;
      this.ext = m.ext ?? "jpg";
      this.path = m.path ?? "/frames/hero";
      this.frames = new Array(this.count).fill(null);
      await this.loadFrame(0);
      this.draw();
      this.loadAll();
    } catch {
      this.placeholder = true;
      this.portrait = new Image();
      this.portrait.src = "/assets/vansh-portrait.jpg";
      await new Promise((r) => {
        this.portrait.onload = r;
        this.portrait.onerror = r;
      });
      // simulate load for the preloader
      let p = 0;
      const tick = () => {
        p = Math.min(1, p + 0.06);
        this.onProgress(p);
        if (p < 1) setTimeout(tick, 40);
      };
      tick();
      this.draw();
    }
    this.startLoop();
  }

  async loadFrame(i) {
    const name = String(i + 1).padStart(this.pad, "0");
    const res = await fetch(`${this.path}/frame_${name}.${this.ext}`);
    const blob = await res.blob();
    this.frames[i] = await createImageBitmap(blob);
    this.loaded++;
    this.onProgress(this.loaded / this.count);
  }

  loadAll() {
    const queue = [];
    for (let i = 1; i < this.count; i++) queue.push(i);
    const workers = Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const i = queue.shift();
        try {
          await this.loadFrame(i);
        } catch {
          this.loaded++;
          this.onProgress(this.loaded / this.count);
        }
      }
    });
    return Promise.all(workers);
  }

  resize() {
    const { innerWidth: w, innerHeight: h } = window;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.current = -1; // force redraw
  }

  setProgress(p) {
    this.target = Math.max(0, Math.min(1, p));
  }

  nearestLoaded(i) {
    if (this.frames[i]) return i;
    for (let d = 1; d < this.count; d++) {
      if (this.frames[i - d]) return i - d;
      if (this.frames[i + d]) return i + d;
    }
    return -1;
  }

  startLoop() {
    const loop = () => {
      this.smooth += (this.target - this.smooth) * 0.16;
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  draw() {
    if (this.placeholder) return this.drawPlaceholder();
    if (!this.count) return;
    let idx = Math.round(this.smooth * (this.count - 1));
    idx = this.nearestLoaded(idx);
    if (idx < 0 || idx === this.current) return;
    this.current = idx;
    const img = this.frames[idx];
    const { width: cw, height: ch } = this.canvas;
    const scale = Math.max(cw / img.width, ch / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  /* Pre-generation fallback: portrait medallion + orbit ring that
     still responds to scroll so the layout is fully testable. */
  drawPlaceholder() {
    const ctx = this.ctx;
    const { width: w, height: h } = this.canvas;
    const cx = w / 2;
    const cy = h * 0.44;
    const angle = this.smooth * Math.PI * 2;

    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
    bg.addColorStop(0, "#0d1411");
    bg.addColorStop(1, "#060807");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const R = Math.min(w, h) * 0.23;

    // portrait medallion
    if (this.portrait && this.portrait.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      const img = this.portrait;
      const s = Math.max((R * 2) / img.width, (R * 2) / img.height);
      // slight horizontal sway to fake parallax while orbiting
      const sway = Math.sin(angle) * R * 0.08;
      ctx.drawImage(
        img,
        cx - (img.width * s) / 2 + sway,
        cy - (img.height * s) / 2,
        img.width * s,
        img.height * s
      );
      ctx.restore();
    }

    // orbit ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = "rgba(12,240,140,0.85)";
    ctx.lineWidth = 2 * this.dpr;
    ctx.setLineDash([4 * this.dpr, 14 * this.dpr]);
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 1.45, R * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // orbiting dot
    ctx.setLineDash([]);
    ctx.fillStyle = "#0cf08c";
    ctx.shadowColor = "#0cf08c";
    ctx.shadowBlur = 18 * this.dpr;
    ctx.beginPath();
    ctx.arc(R * 1.45, 0, 5 * this.dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // rim light
    ctx.save();
    ctx.strokeStyle = "rgba(12,240,140,0.5)";
    ctx.lineWidth = 2 * this.dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 1, -Math.PI * 0.85 + angle * 0.5, -Math.PI * 0.35 + angle * 0.5);
    ctx.stroke();
    ctx.restore();
  }
}
