# Vansh Malhotra — Cinematic 3D-Scroll Portfolio

Award-style personal portfolio: a scroll-driven cinematic experience with a
Seedance-generated 360° orbit of Vansh as the central "3D element", scrubbed
frame-by-frame on a canvas as you scroll.

## Stack

- **Vite** + vanilla JS
- **Lenis** smooth scroll + **GSAP ScrollTrigger** choreography
- Canvas frame-sequence scrubbing (hero orbit)
- Seedance 2.0 (Higgsfield) generated clips, identity-referenced
- Self-hosted fonts: Anton (display), Space Grotesk (body), JetBrains Mono (labels)

## Run

```bash
npm install
npm run dev      # localhost:5173
npm run build    # production build -> dist/
```

## Structure

- `index.html` — hero orbit / stats / pillars / work / finale
- `src/main.js` — scroll choreography
- `src/sequence.js` — canvas frame-sequence engine (procedural fallback when
  frames are absent)
- `public/frames/hero/` — orbit frame sequence + `manifest.json`
- `public/clips/` — builder.mp4 (pillars bg), closer.mp4 (work bg)
- `scripts/extract-frames.sh` — regenerate the frame sequence from a clip
