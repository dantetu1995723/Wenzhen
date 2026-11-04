/**
 * ============================================================================
 * HEARTMED 哈瑞特医疗 — 极简双态 3D 粒子光球引擎 (Minimalist 2-State 3D Particle Orb)
 * ============================================================================
 * 严格遵循极简交互准则：
 *   1. 仅保留 2 种状态：「正常状态 (idle)」与「对话状态 (listening)」
 *      （AI 思考分析与文字回复不再干扰光球状态，结束通话即刻回到正常状态）
 *   2. 零无规则抖动：
 *      完全去除任何球面噪声与不规则凹凸抖动，所有粒子严格保持规整、纯净的 3D 球体几何结构。
 *   3. 简单恒定慢旋 + 简单放大缩小：
 *      - 正常状态 (idle)：粒子球保持 0.85× 尺寸，以 0.20 rad/s 恒定慢速平稳自转；
 *      - 对话状态 (listening)：点击「点击开始」后，粒子球一边继续平稳自转，一边整体平滑放大至 1.25×
 *        （伴随均匀、规律的整球轻微呼吸缩放 1.21× ~ 1.28×）；
 *      - 点击「点击结束」：粒子球立即平滑缩小回 0.85× 正常状态。
 */
(function (global) {
  "use strict";

  const STATE_CONFIG = {
    idle: {
      key: "idle",
      name: "正常状态 (Idle · 1.00× 舒适占比慢旋)",
      rotSpeed: 0.20,
      scale: 1.0,
      breathAmp: 0.0,
      mistAlpha: 0.22,
      desc: "正常状态：规整饱满的 3D 粒子球保持 1.00× 舒适主视觉占比（约占舞台 70%），以 0.20 rad/s 恒定慢速平稳旋转。"
    },
    listening: {
      key: "listening",
      name: "对话状态 (Active · 恒定平稳慢旋)",
      rotSpeed: 0.20,
      scale: 1.08,
      breathAmp: 0.0,
      mistAlpha: 0.28,
      desc: "对话状态：3D 粒子球保持恒定慢速平稳自转，不随音波抖动或跳动，简洁纯粹。"
    }
  };

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  class HeartMedParticleOrb {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.state = options.state === "listening" ? "listening" : "idle";
      this.target = { ...STATE_CONFIG[this.state] };
      this.cur = { ...STATE_CONFIG[this.state] };

      this.rotAngle = 0.5;
      this.time = 0;
      this.typingBoost = 0;

      // 5 Layer Visibility Flags (for Step 5 Spec View inspection)
      this.layers = {
        haloAndRing: true,         // L1: 对话放大 / 结束缩小整球缩放 (Uniform Scale Up/Down)
        crystalShell: true,        // L2: 球心柔和青蓝底光雾 (Central Soft Cyan-Blue Mist)
        interlockingRibbons: true, // L3: 远景深层粒子群 (Back Hemisphere Particles)
        quantumNodes: true,        // L4: 中景主体粒子群 (Midground Sphere Particles)
        coreAndMatrix: true        // L5: 前景柔光大微粒 (Foreground Soft-Glow Particles)
      };

      // Generate 260 clean, evenly distributed 3D Fibonacci Sphere Particles
      this.particles = [];
      const count = 260;
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;
        const shell = i % 7 === 0 ? 0.78 : (i % 3 === 0 ? 0.90 : 1.0);
        const isHero = i % 8 === 0;
        this.particles.push({
          x0: Math.cos(theta) * r * shell,
          y0: y * shell,
          z0: Math.sin(theta) * r * shell,
          isCyan: i % 2 === 0,
          isHero,
          size: isHero ? 2.5 : (1.15 + (i % 3) * 0.38)
        });
      }

      this.width = 0;
      this.height = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.resize();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
    }

    setState(newState) {
      // Strictly map any state to the 2 clean states: 'listening' (对话状态) or 'idle' (正常状态)
      const normalized = newState === "listening" ? "listening" : "idle";
      this.state = normalized;
      this.target = { ...STATE_CONFIG[normalized] };
      if (this.time < 0.08) {
        this.cur = { ...this.target };
      }
    }

    setVoiceLevel() {}

    triggerTypingPulse() {
      // No sound-wave or typing jitter: keep orb calm and steady
    }

    update(dt) {
      const k = Math.min(1, dt * 4.5);
      this.cur.rotSpeed = lerp(this.cur.rotSpeed, this.target.rotSpeed, k);
      this.cur.scale = lerp(this.cur.scale, this.target.scale, k);
      this.cur.breathAmp = lerp(this.cur.breathAmp, this.target.breathAmp, k);
      this.cur.mistAlpha = lerp(this.cur.mistAlpha, this.target.mistAlpha, k);

      this.typingBoost = Math.max(0, this.typingBoost - dt * 0.32);

      // Simple, steady, uniform rotation
      this.rotAngle += dt * this.cur.rotSpeed;
      this.time += dt;
    }

    draw() {
      if (!this.width || !this.height) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.scale(this.dpr, this.dpr);
      ctx.clearRect(0, 0, this.width, this.height);

      const cx = this.width / 2;
      const cy = this.height / 2;
      const minDim = Math.min(this.width, this.height);
      const isCompact = minDim < 80;

      // Comfortable full-bodied base radius (adaptive for micro text-sized orb vs full stage orb)
      const baseR = minDim <= 22 ? minDim * 0.43 : isCompact ? minDim * 0.36 : minDim * 0.335;

      // Uniform whole-sphere scale (no irregular jitter!)
      const uniformBreath = Math.sin(this.time * 2.0) * this.cur.breathAmp;
      const activeScale = this.layers.haloAndRing
        ? this.cur.scale + uniformBreath + this.typingBoost
        : 1.0;

      const R = baseR * activeScale;
      const maxSafeMistR = Math.min(minDim * 0.485, R * 1.26);
      const mistAlpha = isCompact ? this.cur.mistAlpha * 0.42 : this.cur.mistAlpha;

      // ======================================================================
      // L2: Central Soft Cyan-Blue Mist (纯粹球心柔雾，随球体均匀放大缩小)
      // ======================================================================
      if (this.layers.crystalShell) {
        const mist = ctx.createRadialGradient(
          cx,
          cy,
          R * 0.04,
          cx,
          cy,
          maxSafeMistR
        );
        mist.addColorStop(0, `rgba(28, 188, 208, ${mistAlpha.toFixed(3)})`);
        mist.addColorStop(
          0.48,
          `rgba(44, 136, 220, ${(mistAlpha * 0.45).toFixed(3)})`
        );
        mist.addColorStop(
          0.78,
          `rgba(44, 136, 220, ${(mistAlpha * 0.14).toFixed(3)})`
        );
        mist.addColorStop(1, "rgba(44, 136, 220, 0)");
        ctx.fillStyle = mist;
        ctx.beginPath();
        ctx.arc(cx, cy, maxSafeMistR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ======================================================================
      // L3, L4, L5: Clean, Non-Jittering, Smoothly Rotating 3D Particle Sphere
      // ======================================================================
      this.drawCleanRotatingSphere(ctx, cx, cy, R, activeScale, minDim, isCompact);

      ctx.restore();
    }

    drawCleanRotatingSphere(ctx, cx, cy, R, activeScale, minDim, isCompact) {
      const rotY = this.rotAngle;
      const rotX = 0.26; // Fixed gentle axial tilt (like a globe) — zero wobble!
      const cosY = Math.cos(rotY),
        sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX),
        sinX = Math.sin(rotX);

      const proj = [];

      for (let i = 0; i < this.particles.length; i++) {
        // For compact navbar orb, sample 1/4 of Fibonacci lattice so particles remain airy & distinct
        if (isCompact && i % 4 !== 0) continue;
        const p = this.particles[i];

        // Pure rigid-body 3D sphere rotation (ZERO irregular surface jitter!)
        const rx1 = p.x0 * cosY - p.z0 * sinY;
        const rz1 = p.z0 * cosY + p.x0 * sinY;
        const ry2 = p.y0 * cosX - rz1 * sinX;
        const rz2 = rz1 * cosX + p.y0 * sinX;

        const persp = 3.2 / (3.2 - rz2 * 0.45);
        const px = cx + rx1 * R * persp;
        const py = cy + ry2 * R * persp;

        proj.push({ px, py, z: rz2, persp, p });
      }

      proj.sort((a, b) => a.z - b.z);

      const sizeScale = (0.92 + 0.14 * activeScale) * (isCompact ? Math.max(0.36, minDim / 92) : 1.0);

      for (let i = 0; i < proj.length; i++) {
        const item = proj[i];
        const p = item.p;

        // Layer visibility switches for Step 5 Lab
        if (item.z < -0.05 && !this.layers.interlockingRibbons) continue;
        if (item.z >= -0.05 && !p.isHero && !this.layers.quantumNodes) continue;
        if (item.z >= -0.05 && p.isHero && !this.layers.coreAndMatrix) continue;

        const normZ = Math.max(0, Math.min(1, (item.z + 1.05) / 2.1));
        const alpha = 0.18 + 0.75 * Math.pow(normZ, 1.3);
        const rad = p.size * item.persp * (0.68 + normZ * 0.42) * sizeScale;

        // L5: Soft glow around foreground hero particles
        if (this.layers.coreAndMatrix && p.isHero && item.z > 0.08) {
          const glowR = rad * (isCompact ? 1.55 : 2.4);
          const glowAlpha = alpha * (isCompact ? 0.18 : 0.34);
          const g = ctx.createRadialGradient(
            item.px,
            item.py,
            0,
            item.px,
            item.py,
            glowR
          );
          if (p.isCyan) {
            g.addColorStop(0, `rgba(28, 188, 208, ${glowAlpha.toFixed(3)})`);
            g.addColorStop(1, "rgba(28, 188, 208, 0)");
          } else {
            g.addColorStop(0, `rgba(44, 136, 220, ${glowAlpha.toFixed(3)})`);
            g.addColorStop(1, "rgba(44, 136, 220, 0)");
          }
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(item.px, item.py, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = p.isCyan
          ? `rgba(28, 188, 208, ${alpha.toFixed(3)})`
          : `rgba(44, 136, 220, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(item.px, item.py, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const OrbManager = {
    instances: new Map(),
    lastTime: performance.now(),
    running: false,

    register(id, canvas, options = {}) {
      if (!canvas) return null;
      const inst = new HeartMedParticleOrb(canvas, options);
      this.instances.set(id, inst);
      if (!this.running) {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
      }
      return inst;
    },

    get(id) {
      return this.instances.get(id) || null;
    },

    setAllState(state) {
      this.instances.forEach((inst) => inst.setState(state));
    },

    setState(id, state) {
      const inst = this.instances.get(id);
      if (inst) inst.setState(state);
    },

    triggerAllTypingPulse() {
      this.instances.forEach((inst) => inst.triggerTypingPulse());
    },

    setAllVoiceLevel(level) {
      this.instances.forEach((inst) => inst.setVoiceLevel(level));
    },

    resizeAll() {
      this.instances.forEach((inst) => inst.resize());
    },

    loop(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;

      this.instances.forEach((inst) => {
        if (inst.canvas.isConnected) {
          if (inst.width === 0 && inst.canvas.clientWidth > 0) {
            inst.resize();
          }
          inst.update(dt);
          inst.draw();
        }
      });

      requestAnimationFrame((t) => this.loop(t));
    }
  };

  window.addEventListener("resize", () => OrbManager.resizeAll());

  global.TechOrbManager = OrbManager;
  global.TechOrbStateConfig = STATE_CONFIG;
})(window);
