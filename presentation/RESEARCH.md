# Animated HTML Presentation — Research (March 2026)

## 🏆 Recommendation: Reveal.js 5.0

**Reveal.js is the clear winner** for animated HTML presentations. It's the most mature, feature-rich, and well-documented framework available. Version 5.0 (released March 2026) adds Lightbox and Scroll View features.

---

## 1. Reveal.js — Full Feature Breakdown

### Core Features
- **Open-source**, 67k+ GitHub stars, actively maintained
- Pure HTML5/CSS3/JS — works in any modern browser
- Nested slides (horizontal + vertical navigation)
- Markdown support (inline or external .md files)
- Speaker notes with timer
- PDF export
- Code syntax highlighting (built-in)
- Mobile/touch support
- Plugin ecosystem
- **New in 5.0:** Lightbox overlay, Scroll View, official React wrapper (`@revealjs/react`)

### Animation Capabilities

#### Auto-Animate (the killer feature)
Automatically animates matching elements between consecutive slides. Supports:
- Position, size, color, background, padding, margin, font-size, line-height
- CSS transforms (rotate, scale, translate)
- Matching by text content, node type, `src` attribute, or explicit `data-id`
- Configurable: duration, easing, delay, unmatched element behavior

#### Slide Transitions
Built-in transitions: `none`, `fade`, `slide`, `convex`, `concave`, `zoom`
- Apply globally or per-slide via `data-transition` attribute
- Separate in/out transitions: `data-transition="slide-in fade-out"`

#### Fragments (element-by-element reveal)
Built-in fragment styles:
- `fade-in`, `fade-out`, `fade-up`, `fade-down`, `fade-left`, `fade-right`
- `grow`, `shrink`, `strike`
- `highlight-red`, `highlight-green`, `highlight-blue`
- `current-visible` (visible only while active)
- Custom fragments via CSS classes
- Ordered via `data-fragment-index`
- Nestable for sequential animations on same element

#### CSS Animations
Since it's HTML — any CSS animation, keyframe, or library (Animate.css, GSAP, Motion One) works.

### Dark Theme Support
Built-in dark themes:
- `black` (default dark)
- `night` (deep dark)
- `moon` (dark with serif)
- `dracula` (popular dev theme)

Custom theming via:
- Sass variables (`.scss` theme files)
- CSS custom properties (`:root` variables)
- Direct CSS override after theme stylesheet

### Setup Instructions

#### Quick CDN Setup (simplest)
```html
<!doctype html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/black.css">
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section>Slide 1</section>
      <section>Slide 2</section>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      transition: 'slide',
      autoPlayMedia: true
    });
  </script>
</body>
</html>
```

#### NPM Setup (for dev projects)
```bash
npm install reveal.js
```

#### Full Local Setup
```bash
git clone https://github.com/hakimel/reveal.js.git
cd reveal.js
npm install
npm start   # dev server at localhost:8000
```

---

## 2. Alternatives Considered

| Framework | Pros | Cons | Verdict |
|-----------|------|------|---------|
| **Impress.js** | Prezi-like 3D zoom/pan, dramatic transitions | Steep learning curve, less ecosystem | Good for wow-factor, but overkill for most |
| **Slidev** | Vue-based, Markdown-driven, live coding, modern DX | Some bugs reported, Vue dependency | Great for dev talks, less for general use |
| **Marp** | Markdown → PDF/PPTX/HTML, VS Code integration | Limited animation support, possibly unmaintained | Best for quick simple decks |
| **WebSlides** | 120+ ready-to-use slide templates | Less animation control | Good for quick prototypes |
| **Flowtime.js** | Full-page grid layout, CSS3 hardware-accelerated | Smaller community | Niche use |

**Verdict: Reveal.js wins on animation richness, ecosystem, dark themes, and documentation.**

---

## 3. Embedding Videos & GIFs — Best Practices

### Videos (preferred over GIFs)

#### Inline Video
```html
<section>
  <h2>Demo Video</h2>
  <video data-autoplay loop muted playsinline
         style="max-width: 80%; border-radius: 12px;">
    <source src="media/demo.mp4" type="video/mp4">
  </video>
</section>
```

#### Video as Full Background
```html
<section data-background-video="media/bg-loop.mp4"
         data-background-video-loop
         data-background-video-muted
         data-background-opacity="0.3">
  <h2>Text Over Video</h2>
</section>
```

#### Lazy Loading (performance)
```html
<video data-src="media/heavy-video.mp4" data-autoplay loop muted></video>
<!-- Only loads when near the current slide -->
```

### GIFs

#### GIF as Background (auto-restarts on slide enter)
```html
<section data-background-image="media/animation.gif"
         data-background-size="contain">
  <h2 style="color: white; text-shadow: 2px 2px 4px #000;">Title</h2>
</section>
```

#### Inline GIF
```html
<img src="media/demo.gif" style="max-width: 60%; border-radius: 8px;">
```

### Pro Tips
- **Use MP4 over GIF** — better compression, playback controls, smaller files
- **Add `muted` attribute** — required for autoplay in most browsers
- **Add `playsinline`** — prevents fullscreen on mobile
- **Use `data-src` for lazy loading** heavy media
- Media auto-pauses when navigating away (disable with `data-ignore`)
- Global control: `Reveal.initialize({ autoPlayMedia: true })`

---

## 4. Smooth Transitions & Element-by-Element Animations

### Auto-Animate: Position & Size Change
```html
<section data-auto-animate>
  <h1 style="font-size: 2em; color: #e74c3c;">Hello</h1>
</section>
<section data-auto-animate>
  <h1 style="font-size: 4em; color: #3498db; margin-top: 200px;">Hello</h1>
</section>
```

### Auto-Animate: List Items Appearing
```html
<section data-auto-animate>
  <ul>
    <li>First point</li>
  </ul>
</section>
<section data-auto-animate>
  <ul>
    <li>First point</li>
    <li>Second point</li>
    <li>Third point</li>
  </ul>
</section>
```

### Auto-Animate: Code Block Morphing
```html
<section data-auto-animate>
  <pre data-id="code"><code data-line-numbers class="language-js">
let x = 1;
  </code></pre>
</section>
<section data-auto-animate>
  <pre data-id="code"><code data-line-numbers class="language-js">
let x = 1;
let y = 2;
let sum = x + y;
  </code></pre>
</section>
```

### Custom Easing & Duration
```html
<section data-auto-animate
         data-auto-animate-duration="1.5"
         data-auto-animate-easing="cubic-bezier(0.68, -0.55, 0.27, 1.55)">
```

### Fragment Animations (within a single slide)
```html
<section>
  <h2>Step by Step</h2>
  <p class="fragment fade-up">Step 1: Research</p>
  <p class="fragment fade-up">Step 2: Design</p>
  <p class="fragment fade-up">Step 3: Build</p>
  <p class="fragment grow">Step 4: Launch! 🚀</p>
</section>
```

### Combining Fragments with Custom CSS
```html
<style>
  .fragment.blur-in {
    filter: blur(10px);
    opacity: 0;
    transition: all 0.8s ease;
  }
  .fragment.blur-in.visible {
    filter: blur(0);
    opacity: 1;
  }
</style>

<section>
  <p class="fragment blur-in">Appears with blur effect</p>
</section>
```

---

## 5. Full Example: Dark-Themed Animated Presentation

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Niko Rolovic — Presentation</title>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/black.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/plugin/highlight/monokai.css">

  <style>
    /* Custom dark theme overrides */
    :root {
      --r-background-color: #0a0a0a;
      --r-main-color: #e0e0e0;
      --r-heading-color: #ffffff;
      --r-link-color: #4fc3f7;
      --r-link-color-hover: #81d4fa;
      --r-selection-background-color: #4fc3f7;
    }

    .reveal {
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    /* Accent gradient text */
    .gradient-text {
      background: linear-gradient(135deg, #4fc3f7, #e040fb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Subtle glow effect */
    .glow {
      text-shadow: 0 0 20px rgba(79, 195, 247, 0.5);
    }

    /* Custom blur-in fragment */
    .fragment.blur-in {
      filter: blur(8px);
      opacity: 0;
      transition: all 0.6s ease-out;
    }
    .fragment.blur-in.visible {
      filter: blur(0);
      opacity: 1;
    }

    /* Slide-specific styling */
    .dark-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2em;
      backdrop-filter: blur(10px);
    }

    /* Image styling */
    .reveal img {
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">

      <!-- SLIDE 1: Title with auto-animate -->
      <section data-auto-animate data-background-color="#0a0a0a">
        <h1 class="gradient-text" style="font-size: 1.5em;">Niko Rolovic</h1>
      </section>
      <section data-auto-animate data-background-color="#0a0a0a">
        <h1 class="gradient-text" style="font-size: 3em;">Niko Rolovic</h1>
        <p class="fragment fade-up" style="color: #999; font-size: 1.2em;">
          Creative Developer & Designer
        </p>
      </section>

      <!-- SLIDE 2: Key points with fragments -->
      <section data-transition="slide">
        <h2 class="glow">What I Do</h2>
        <div class="dark-card">
          <p class="fragment blur-in">🎨 UI/UX Design</p>
          <p class="fragment blur-in">💻 Frontend Development</p>
          <p class="fragment blur-in">🚀 Creative Projects</p>
        </div>
      </section>

      <!-- SLIDE 3: Image with auto-animate grow -->
      <section data-auto-animate>
        <img data-id="project-img" src="media/project.jpg"
             style="width: 200px; opacity: 0.6;">
        <h3 data-id="project-title">Featured Project</h3>
      </section>
      <section data-auto-animate>
        <img data-id="project-img" src="media/project.jpg"
             style="width: 600px; opacity: 1;">
        <h3 data-id="project-title" style="color: #4fc3f7;">Featured Project</h3>
        <p class="fragment fade-up">Built with modern web technologies</p>
      </section>

      <!-- SLIDE 4: Video background -->
      <section data-background-video="media/showreel.mp4"
               data-background-video-loop
               data-background-video-muted
               data-background-opacity="0.3">
        <h2 class="glow" style="font-size: 2.5em;">Showreel</h2>
      </section>

      <!-- SLIDE 5: Code auto-animate -->
      <section data-auto-animate>
        <pre data-id="code-block"><code class="language-js" data-line-numbers>
const niko = {
  name: 'Niko Rolovic'
};
        </code></pre>
      </section>
      <section data-auto-animate>
        <pre data-id="code-block"><code class="language-js" data-line-numbers>
const niko = {
  name: 'Niko Rolovic',
  skills: ['Design', 'Code', 'Creative'],
  available: true
};
        </code></pre>
      </section>

      <!-- SLIDE 6: Contact / closing -->
      <section data-transition="zoom">
        <h2 class="gradient-text">Let's Connect</h2>
        <p class="fragment fade-up">📧 niko@example.com</p>
        <p class="fragment fade-up">🌐 nikorolovic.com</p>
        <p class="fragment fade-up">💼 GitHub / LinkedIn</p>
      </section>

    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5/plugin/highlight/highlight.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      transition: 'slide',
      transitionSpeed: 'default',    // 'default', 'fast', 'slow'
      backgroundTransition: 'fade',
      autoPlayMedia: true,
      center: true,
      controls: true,
      progress: true,
      plugins: [RevealHighlight]
    });
  </script>
</body>
</html>
```

---

## 6. Key Config Options Reference

```javascript
Reveal.initialize({
  // Transitions
  transition: 'slide',              // none/fade/slide/convex/concave/zoom
  transitionSpeed: 'default',       // default/fast/slow
  backgroundTransition: 'fade',     // background transition

  // Auto-Animate defaults
  autoAnimateDuration: 1.0,         // seconds
  autoAnimateEasing: 'ease',        // CSS easing
  autoAnimateUnmatched: true,       // animate unmatched elements

  // Media
  autoPlayMedia: null,              // null=per-element, true=all, false=none

  // Navigation
  hash: true,                       // URL hash for slide
  history: false,                   // push each slide to browser history
  loop: false,                      // loop presentation
  shuffle: false,                   // randomize slide order

  // Display
  center: true,                     // vertical center
  controls: true,                   // nav arrows
  progress: true,                   // progress bar
  slideNumber: false,               // 'c/t' for current/total

  // Behavior
  touch: true,                      // touch navigation
  keyboard: true,                   // keyboard shortcuts
  mouseWheel: false,                // mousewheel navigation
  embedded: false,                  // run in iframe mode
  viewDistance: 3,                   // lazy-load distance
});
```

---

## Summary

| Need | Solution |
|------|----------|
| Framework | **Reveal.js 5.0** via CDN or npm |
| Dark theme | `black.css` + custom CSS variables |
| Slide transitions | `data-transition="slide/fade/zoom/convex/concave"` |
| Element animations | `data-auto-animate` + `data-id` matching |
| Progressive reveal | Fragment classes (`fade-up`, `grow`, custom) |
| Videos | `<video data-autoplay loop muted>` or `data-background-video` |
| GIFs | `<img>` inline or `data-background-image` |
| Custom effects | CSS keyframes, Animate.css, GSAP integration |
