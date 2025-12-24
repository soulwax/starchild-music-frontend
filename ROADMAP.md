# 🎨 WebGL Unified Renderer - Migration Roadmap

## Executive Summary

This document outlines the plan to migrate the current visualization system from multiple Canvas2D contexts to a single, unified WebGL rendering pipeline. This architectural shift will improve performance, visual quality, maintainability, and enable advanced GPU-accelerated effects.

**Current State:** 11,192 lines of Canvas2D code (FlowFieldRenderer.ts) with 80+ patterns  
**Target State:** Modular WebGL shader system with composable effects  
**Estimated Timeline:** 3-4 months  
**Risk Level:** Medium (manageable with proper planning)

---

## 📊 Current Architecture Analysis

### Existing Components

1. **FlowFieldRenderer.ts** (11,192 lines)
   - 80+ visualization patterns
   - Canvas2D-based rendering
   - Particle systems and sacred geometry
   - Pattern transitions and audio reactivity

2. **KaleidoscopeRenderer.ts**
   - Separate Canvas2D renderer
   - Used in draggable AudioVisualizer component

3. **LightweightParticleBackground**
   - Fallback particle system
   - Canvas2D-based

4. **Audio-Reactive CSS Variables**
   - `--audio-intensity`, `--audio-bass`, etc.
   - Used for DOM element styling

### Pain Points

- **Performance bottleneck:** Canvas2D drawing operations on main thread
- **Code duplication:** Similar patterns implemented multiple times
- **Maintainability:** Monolithic 11k line file
- **Limited visual effects:** No hardware-accelerated post-processing
- **Mobile performance:** CPU-intensive rendering affects battery life

---

## 🎯 Goals & Benefits

### Primary Goals

1. **Unified Rendering:** Single WebGL canvas for all visual effects
2. **Performance:** 60fps at 4K, better mobile battery life
3. **Maintainability:** Modular, shader-based pattern system
4. **Visual Quality:** GPU-accelerated post-processing and effects
5. **Extensibility:** Easy to add new patterns and effects

### Expected Benefits

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Background FPS (1080p) | ~45-55 | 60 | +10-25% |
| Background FPS (4K) | ~20-30 | 60 | +100-200% |
| CPU Usage | ~15-20% | ~5-8% | -60% |
| Mobile Battery Impact | High | Low | -50% |
| Code Size (patterns) | 11k lines | ~3-4k lines | -65% |
| Pattern Addition Time | ~4-8 hours | ~1-2 hours | -75% |

---

## 🗺️ Migration Strategy

### Approach: Gradual, Feature-Flagged Migration

We'll use a **phased approach** with feature flags to ensure stability and allow rollback at any point.

```typescript
// Feature flag system
const USE_WEBGL_RENDERER = process.env.NEXT_PUBLIC_WEBGL_RENDERER === 'true';

// Graceful fallback
if (USE_WEBGL_RENDERER && supportsWebGL()) {
  return <WebGLUnifiedRenderer />;
} else {
  return <FlowFieldBackground />; // Current system
}
```

---

## 📅 Implementation Phases

## Phase 0: Foundation & Research (Week 1-2)

### Research & Prototyping
- [ ] Evaluate WebGL libraries (Three.js, PixiJS, raw WebGL)
- [ ] Create performance benchmarks (Canvas2D vs WebGL)
- [ ] Build proof-of-concept for 3-5 patterns
- [ ] Test on target devices (desktop, mobile, tablets)

### Technical Decisions
- [ ] Choose WebGL abstraction layer (if any)
- [ ] Decide on shader architecture (multi-layer vs uber-shader)
- [ ] Define pattern specification format (JSON + GLSL)
- [ ] Plan audio data pipeline (uniforms vs textures)

### Deliverables
- Technical specification document
- PoC demo with 3-5 converted patterns
- Performance comparison report
- Device compatibility matrix

---

## Phase 1: Core Infrastructure (Week 3-5)

### WebGL Renderer Foundation
- [ ] Create `UnifiedWebGLRenderer` class
- [ ] Implement WebGL context initialization with fallbacks
- [ ] Build shader compilation and caching system
- [ ] Add context loss/restore handling
- [ ] Implement resize and DPI scaling

### Audio Integration
- [ ] Create audio data texture pipeline
- [ ] Implement audio uniform system
- [ ] Build frequency data processing utilities
- [ ] Add beat detection integration

### Pattern System Architecture
- [ ] Design pattern registry and loader
- [ ] Create `ShaderProgram` wrapper class
- [ ] Implement pattern transition system
- [ ] Build pattern parameter system

### Development Tools
- [ ] Set up shader hot module replacement
- [ ] Create shader compilation error overlay
- [ ] Build pattern preview/debug tool
- [ ] Add performance profiling hooks

### Deliverables
```
src/
├── components/
│   └── visualizers/
│       └── webgl/
│           ├── UnifiedWebGLRenderer.ts
│           ├── ShaderProgram.ts
│           ├── PatternRegistry.ts
│           ├── AudioTexture.ts
│           └── types.ts
└── shaders/
    ├── common/
    │   ├── audio.glsl
    │   └── utils.glsl
    └── patterns/
        └── (patterns added in Phase 2)
```

---

## Phase 2: Pattern Migration (Week 6-10)

### Batch 1: Core Patterns (Week 6-7)
Priority: Most popular/visible patterns

- [ ] **kaleidoscope** - Current default pattern
- [ ] **galaxy** - Spiral arms and star particles
- [ ] **fractal** - Mandelbrot/Julia sets
- [ ] **rays** - Radial light rays
- [ ] **waves** - Sine wave animations

### Batch 2: Particle Systems (Week 7-8)
- [ ] **bubbles** - Floating bubble effect
- [ ] **fireworks** - Explosive particle effects
- [ ] **starfield** - Moving star particles
- [ ] **swarm** - Flocking behavior
- [ ] **constellation** - Connected star patterns

### Batch 3: Sacred Geometry (Week 8-9)
- [ ] **flowerOfLife** - Sacred circles
- [ ] **metatron** - Metatron's cube
- [ ] **sriYantra** - Sri Yantra pattern
- [ ] **merkaba** - 3D sacred geometry
- [ ] **vesicaPiscis** - Overlapping circles

### Batch 4: Advanced Effects (Week 9-10)
- [ ] **portal** - Vortex/portal effects
- [ ] **tunnel** - 3D tunnel animation
- [ ] **torusField** - Torus geometry
- [ ] **dimensionalRift** - Reality distortion
- [ ] **vortexSpiral** - Spiral vortex

### Batch 5: Remaining Patterns (Week 11-12)
- [ ] Convert remaining 60+ patterns
- [ ] Ensure feature parity with Canvas2D versions
- [ ] Cross-device testing for each pattern

### Pattern Conversion Template
Each pattern should follow this structure:

```glsl
// shaders/patterns/kaleidoscope.frag
precision mediump float;

// Standard uniforms (provided by renderer)
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioBass;
uniform float uAudioTreble;
uniform float uAudioIntensity;
uniform sampler2D uAudioTexture;

// Pattern-specific uniforms
uniform float uSegments;
uniform float uRotationSpeed;
uniform float uHueShift;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 center = uv - 0.5;
  
  // Kaleidoscope logic...
  float angle = atan(center.y, center.x);
  float radius = length(center);
  
  // Audio reactivity
  float bass = uAudioBass * 0.5;
  angle += uTime * uRotationSpeed + bass;
  
  // Segment repetition
  angle = mod(angle, 3.14159 / uSegments);
  
  // ... pattern implementation
  
  gl_FragColor = vec4(color, 1.0);
}
```

---

## Phase 3: Post-Processing Pipeline (Week 11-12)

### Effect Stack
- [ ] **Blur** - Gaussian and box blur
- [ ] **Bloom** - Bright area extraction and glow
- [ ] **Color Grading** - HSV adjustments, color curves
- [ ] **Chromatic Aberration** - RGB channel splitting
- [ ] **Vignette** - Edge darkening
- [ ] **Film Grain** - Noise overlay
- [ ] **Distortion** - Lens and barrel distortion

### Multi-Pass Rendering
```
Frame Pipeline:
1. Render pattern to mainFBO
2. Extract bright areas to bloomFBO
3. Blur bloomFBO (ping-pong)
4. Composite main + bloom + effects
5. Apply final color grading
6. Render to screen
```

### Implementation
```typescript
class PostProcessingPipeline {
  effects: PostEffect[];
  framebuffers: Map<string, Framebuffer>;
  
  addEffect(effect: PostEffect): void;
  removeEffect(name: string): void;
  render(inputTexture: WebGLTexture): void;
}
```

---

## Phase 4: Transition System (Week 13-14)

### Transition Effects
- [ ] **Crossfade** - Simple alpha blending
- [ ] **Dissolve** - Noise-based transition
- [ ] **Wipe** - Directional wipe effects
- [ ] **Kaleidoscope Rotate** - Rotational transition
- [ ] **Pixelate** - Pixelation transition
- [ ] **Wave Distort** - Wave-based morph
- [ ] **Audio-Synced** - Beat-triggered transitions

### Implementation
```glsl
// Transition shader
uniform sampler2D uPatternA;
uniform sampler2D uPatternB;
uniform float uProgress; // 0.0 to 1.0
uniform int uTransitionType;

void main() {
  vec4 colorA = texture2D(uPatternA, uv);
  vec4 colorB = texture2D(uPatternB, uv);
  
  vec4 result = mix(colorA, colorB, uProgress);
  // Apply transition effect based on type...
  
  gl_FragColor = result;
}
```

---

## Phase 5: Integration & Testing (Week 15-16)

### Component Integration
- [ ] Create `WebGLBackground` component (replaces `FlowFieldBackground`)
- [ ] Integrate with `PersistentPlayer`
- [ ] Update `PatternControls` for WebGL parameters
- [ ] Ensure audio pipeline compatibility
- [ ] Add feature flag for gradual rollout

### Testing Matrix
```
Devices:
├── Desktop: Chrome, Firefox, Safari, Edge
├── Mobile: iOS Safari, Chrome Android
├── Tablets: iPad, Android tablets
└── Low-end devices: Performance testing

Scenarios:
├── Pattern switching (all 80+ patterns)
├── Audio reactivity at various volumes
├── Long-duration playback (memory leaks)
├── Resize and orientation changes
├── Context loss recovery
└── Feature flag toggling
```

### Performance Profiling
- [ ] FPS monitoring across all patterns
- [ ] Memory usage tracking
- [ ] GPU utilization metrics
- [ ] Battery impact on mobile
- [ ] Bundle size comparison

---

## Phase 6: Polish & Optimization (Week 17-18)

### Performance Optimization
- [ ] Implement quality presets (low/medium/high/ultra)
- [ ] Add automatic quality adjustment based on FPS
- [ ] Optimize shader code (reduce instruction count)
- [ ] Implement shader LOD system
- [ ] Add instance rendering for particles

### User Experience
- [ ] Smooth fallback to Canvas2D on WebGL failure
- [ ] Loading states during shader compilation
- [ ] Error boundaries with helpful messages
- [ ] Accessibility: respect `prefers-reduced-motion`
- [ ] Pattern favorites and recently used

### Developer Experience
- [ ] Pattern creation documentation
- [ ] Shader debugging guide
- [ ] Performance optimization tips
- [ ] Contributing guidelines for new patterns

---

## Phase 7: Launch & Monitoring (Week 19-20)

### Gradual Rollout
```
Week 19:
├── Enable for 10% of users (via feature flag)
├── Monitor error rates and performance
└── Collect user feedback

Week 20:
├── Enable for 50% of users
├── Address any critical issues
└── Prepare for full rollout

Week 21:
├── Enable for 100% of users
├── Remove Canvas2D fallback (optional)
└── Deprecation notice for old system
```

### Monitoring & Metrics
- [ ] Set up error tracking (Sentry/similar)
- [ ] Add performance metrics to analytics
- [ ] Monitor FPS distribution across devices
- [ ] Track pattern popularity
- [ ] Measure user engagement changes

### Documentation
- [ ] User-facing pattern guide
- [ ] Developer documentation
- [ ] Migration notes
- [ ] Performance best practices
- [ ] Troubleshooting guide

---

## 🏗️ Technical Architecture

### Proposed Structure

```
src/
├── components/
│   ├── WebGLBackground.tsx          # Main component (replaces FlowFieldBackground)
│   └── visualizers/
│       ├── webgl/
│       │   ├── UnifiedWebGLRenderer.ts   # Core renderer
│       │   ├── ShaderProgram.ts          # Shader wrapper
│       │   ├── PatternRegistry.ts        # Pattern management
│       │   ├── AudioTexture.ts           # Audio → GPU pipeline
│       │   ├── PostProcessing.ts         # Effect pipeline
│       │   ├── TransitionManager.ts      # Pattern transitions
│       │   └── types.ts                  # TypeScript types
│       └── FlowFieldRenderer.ts      # Legacy (deprecate later)
│
├── shaders/
│   ├── common/
│   │   ├── audio.glsl              # Audio utility functions
│   │   ├── noise.glsl              # Noise generators
│   │   ├── math.glsl               # Math utilities
│   │   └── colors.glsl             # Color utilities
│   │
│   ├── patterns/
│   │   ├── kaleidoscope.frag
│   │   ├── galaxy.frag
│   │   ├── fractal.frag
│   │   ├── ... (80+ patterns)
│   │   └── index.ts                # Pattern registry
│   │
│   ├── postprocessing/
│   │   ├── blur.frag
│   │   ├── bloom.frag
│   │   ├── colorgrade.frag
│   │   └── composite.frag
│   │
│   ├── transitions/
│   │   ├── crossfade.frag
│   │   ├── dissolve.frag
│   │   └── wipe.frag
│   │
│   └── base/
│       ├── fullscreen.vert         # Standard vertex shader
│       └── passthrough.frag        # Passthrough fragment
│
├── utils/
│   ├── webgl/
│   │   ├── context.ts              # WebGL context utilities
│   │   ├── shaderCompiler.ts      # Shader compilation
│   │   ├── framebuffer.ts         # FBO management
│   │   └── textureLoader.ts       # Texture utilities
│   │
│   └── performance/
│       ├── fpsMonitor.ts
│       └── qualityManager.ts
│
└── hooks/
    ├── useWebGLRenderer.ts
    └── useShaderProgram.ts
```

---

## 🔧 Core Classes

### UnifiedWebGLRenderer

```typescript
export class UnifiedWebGLRenderer {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private patternRegistry: PatternRegistry;
  private postProcessing: PostProcessingPipeline;
  private transitionManager: TransitionManager;
  private audioTexture: AudioTexture;
  
  // Pattern state
  private currentPattern: ShaderProgram | null = null;
  private nextPattern: ShaderProgram | null = null;
  private transitionProgress = 0;
  
  // Framebuffers
  private mainFBO: Framebuffer;
  private transitionFBO: Framebuffer;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = this.initWebGL();
    this.patternRegistry = new PatternRegistry(this.gl);
    this.postProcessing = new PostProcessingPipeline(this.gl);
    this.transitionManager = new TransitionManager(this.gl);
    this.audioTexture = new AudioTexture(this.gl);
    this.initFramebuffers();
  }
  
  public setPattern(patternName: string, immediate = false): void {
    const pattern = this.patternRegistry.get(patternName);
    if (!pattern) return;
    
    if (immediate || !this.currentPattern) {
      this.currentPattern = pattern;
    } else {
      this.nextPattern = pattern;
      this.transitionProgress = 0;
    }
  }
  
  public render(audioData: Float32Array, time: number): void {
    // Update audio texture
    this.audioTexture.update(audioData);
    
    // Render current pattern
    if (this.nextPattern && this.transitionProgress < 1.0) {
      this.renderTransition(time);
    } else {
      this.renderPattern(this.currentPattern, time);
    }
    
    // Apply post-processing
    this.postProcessing.render(this.mainFBO.texture);
  }
  
  private renderPattern(pattern: ShaderProgram, time: number): void {
    this.mainFBO.bind();
    pattern.use();
    pattern.setUniforms({
      uTime: time,
      uResolution: [this.canvas.width, this.canvas.height],
      uAudioTexture: this.audioTexture.texture,
      // ... audio uniforms
    });
    this.renderFullscreenQuad();
    this.mainFBO.unbind();
  }
  
  private renderTransition(time: number): void {
    // Render both patterns to separate FBOs
    // Use transition shader to blend them
    this.transitionProgress += 0.015;
    
    if (this.transitionProgress >= 1.0) {
      this.currentPattern = this.nextPattern;
      this.nextPattern = null;
    }
  }
  
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    this.mainFBO.resize(width, height);
  }
  
  public dispose(): void {
    this.patternRegistry.dispose();
    this.postProcessing.dispose();
    this.mainFBO.dispose();
  }
}
```

### PatternRegistry

```typescript
export class PatternRegistry {
  private patterns = new Map<string, ShaderProgram>();
  private gl: WebGLRenderingContext;
  
  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.loadPatterns();
  }
  
  private async loadPatterns(): Promise<void> {
    // Dynamic import of shader modules
    const patternModules = import.meta.glob('../shaders/patterns/*.frag', {
      as: 'raw',
      eager: false,
    });
    
    for (const [path, loader] of Object.entries(patternModules)) {
      const name = path.match(/patterns\/(.+)\.frag/)?.[1];
      if (!name) continue;
      
      const fragmentSource = await loader();
      const program = new ShaderProgram(
        this.gl,
        baseVertexShader,
        fragmentSource
      );
      
      this.patterns.set(name, program);
    }
  }
  
  public get(name: string): ShaderProgram | undefined {
    return this.patterns.get(name);
  }
  
  public list(): string[] {
    return Array.from(this.patterns.keys());
  }
  
  public dispose(): void {
    for (const program of this.patterns.values()) {
      program.dispose();
    }
  }
}
```

---

## 🚨 Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Poor mobile performance | Medium | High | Quality presets, automatic downscaling, extensive testing |
| WebGL context loss | Medium | High | Context restore handlers, state recovery system |
| Shader compilation errors | Medium | Medium | Comprehensive error handling, fallback shaders |
| Pattern parity issues | High | Medium | Side-by-side testing, visual regression tests |
| Browser compatibility | Low | High | Extensive cross-browser testing, Canvas2D fallback |
| Memory leaks | Medium | High | Profiling, proper resource disposal, stress testing |

### Development Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Timeline overrun | Medium | Medium | Phased approach, adjust scope if needed |
| Team WebGL knowledge gap | High | Medium | Training period, pair programming, documentation |
| User resistance to change | Low | Low | Feature flag, gather feedback, iterate |
| Regression in existing features | Medium | High | Comprehensive testing, gradual rollout |

### Mitigation Strategies

1. **Feature Flags:** Enable rollback at any point
2. **Parallel Development:** Keep Canvas2D system until WebGL is stable
3. **Comprehensive Testing:** Automated and manual testing across devices
4. **Performance Monitoring:** Real-time metrics and alerts
5. **User Feedback Loop:** Beta testing group, feedback collection
6. **Documentation:** Extensive docs for maintenance and troubleshooting

---

## 📊 Success Metrics

### Performance Metrics

- **FPS Stability:** 95%+ of frames at target 60fps (desktop), 30fps (mobile)
- **CPU Usage:** <10% average CPU usage during playback
- **Memory:** No memory growth over 30-minute playback session
- **Battery Impact:** <20% battery drain over 1-hour playback (mobile)

### Code Quality Metrics

- **Code Reduction:** 60%+ reduction in pattern implementation code
- **Bundle Size:** <5% increase in bundle size (shaders are small)
- **Maintainability:** New pattern addition <2 hours
- **Test Coverage:** >80% coverage for core renderer

### User Experience Metrics

- **Load Time:** No perceptible delay in visualization start
- **Visual Quality:** Matches or exceeds Canvas2D quality
- **Smooth Transitions:** No frame drops during pattern transitions
- **Crash Rate:** <0.1% crash/error rate
- **User Satisfaction:** No increase in negative feedback

---

## 📚 Resources & References

### Learning Resources

- **WebGL Fundamentals:** https://webglfundamentals.org/
- **The Book of Shaders:** https://thebookofshaders.com/
- **ShaderToy:** https://www.shadertoy.com/ (pattern inspiration)
- **Three.js Examples:** https://threejs.org/examples/

### Technical References

- **WebGL Specification:** https://www.khronos.org/webgl/
- **GLSL Reference:** https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language
- **GPU Gems:** https://developer.nvidia.com/gpugems/

### Tools

- **Shader Playground:** http://shader-playground.timjones.io/
- **GLSL Sandbox:** http://glslsandbox.com/
- **SpectorJS:** WebGL debugging extension

---

## 🎯 Quick Start (For Developers)

### Phase 0 Setup

1. **Install dependencies:**
```bash
npm install --save-dev @types/webgl-ext
npm install three # optional, if using Three.js
```

2. **Create initial structure:**
```bash
mkdir -p src/components/visualizers/webgl
mkdir -p src/shaders/{common,patterns,postprocessing,transitions,base}
```

3. **Set up feature flag:**
```env
# .env.local
NEXT_PUBLIC_WEBGL_RENDERER=false  # Start with false, flip when ready
```

4. **Create proof of concept:**
- Start with `kaleidoscope` pattern
- Get it working in isolation
- Measure performance vs Canvas2D

---

## 📞 Communication Plan

### Stakeholder Updates

- **Weekly:** Progress updates in team standup
- **Bi-weekly:** Written progress report with metrics
- **Monthly:** Demo session with stakeholders
- **Phase Completion:** Comprehensive review and sign-off

### Documentation Updates

- **Code Comments:** Document all shader code thoroughly
- **README Updates:** Keep main README in sync
- **Changelog:** Track all breaking changes
- **Migration Guide:** Document for other developers

---

## ✅ Phase Checklist Template

For each phase:

- [ ] Planning complete (requirements, design, estimates)
- [ ] Development complete (code, tests, docs)
- [ ] Code review passed
- [ ] Testing complete (unit, integration, E2E)
- [ ] Performance validated (meets targets)
- [ ] Documentation updated
- [ ] Stakeholder review complete
- [ ] Merged to main branch

---

## 🏁 Conclusion

This migration represents a significant architectural improvement that will:
- **Enhance performance** across all devices
- **Improve maintainability** with modular shader system
- **Enable advanced effects** previously impossible with Canvas2D
- **Future-proof** the visualization system

With careful planning, phased implementation, and comprehensive testing, we can achieve a smooth transition that delights users and empowers developers.

**Let's build something beautiful! ✨**

---

## 📝 Appendix

### A. Pattern Conversion Checklist

For each pattern being converted:

- [ ] Study Canvas2D implementation
- [ ] Identify audio-reactive elements
- [ ] Write GLSL fragment shader
- [ ] Test on desktop browsers
- [ ] Test on mobile devices
- [ ] Verify audio reactivity
- [ ] Compare visual output (screenshots)
- [ ] Performance benchmark
- [ ] Add to pattern registry
- [ ] Update documentation

### B. Device Test Matrix

| Device Type | Browser | Min FPS | Max CPU | Status |
|-------------|---------|---------|---------|--------|
| Desktop - High | Chrome | 60 | 10% | - |
| Desktop - High | Firefox | 60 | 10% | - |
| Desktop - High | Safari | 60 | 10% | - |
| Desktop - Mid | Chrome | 60 | 15% | - |
| MacBook Pro M1 | Safari | 60 | 8% | - |
| iPhone 14 Pro | Safari | 60 | 15% | - |
| iPhone 12 | Safari | 30 | 20% | - |
| iPad Pro | Safari | 60 | 12% | - |
| Pixel 7 | Chrome | 60 | 18% | - |
| Samsung S21 | Chrome | 30 | 20% | - |

### C. Shader Template

```glsl
// shaders/patterns/template.frag
precision mediump float;

// === STANDARD UNIFORMS (provided by renderer) ===
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioBass;
uniform float uAudioMid;
uniform float uAudioTreble;
uniform float uAudioIntensity;
uniform sampler2D uAudioTexture;

// === PATTERN-SPECIFIC UNIFORMS ===
// uniform float uMyParameter;

// === COMMON FUNCTIONS ===
#include <noise>
#include <colors>
#include <audio>

void main() {
  // Normalized coordinates (0.0 to 1.0)
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  // Centered coordinates (-0.5 to 0.5)
  vec2 center = uv - 0.5;
  center.x *= uResolution.x / uResolution.y; // Aspect ratio correction
  
  // Your pattern logic here...
  vec3 color = vec3(0.0);
  
  // Example: Audio-reactive hue
  float hue = uTime * 0.1 + uAudioBass;
  color = hsv2rgb(vec3(hue, 0.8, 0.9));
  
  gl_FragColor = vec4(color, 1.0);
}
```

### D. Performance Budget

| Category | Budget | Notes |
|----------|--------|-------|
| Initial Load | +100KB | Shader code + WebGL utils |
| Pattern Add | +1-2KB | Per pattern shader |
| Memory (Desktop) | <100MB | Including all framebuffers |
| Memory (Mobile) | <50MB | Reduced quality textures |
| Shader Compile | <100ms | Per pattern, with caching |
| Pattern Switch | <16ms | Must not drop frames |

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-24  
**Maintained By:** Development Team  
**Status:** Planning Phase

