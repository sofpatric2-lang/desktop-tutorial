/* ============================================================
   مؤسسة الإتقان — motion.js · GSAP + ScrollTrigger motion system
   Loads AFTER gsap.min.js / ScrollTrigger.min.js (defer, local files).
   If GSAP is absent or reduced-motion is requested, this module
   stays inert and main.js vanilla fallback stays in charge.
   Reveals, hero intro, scroll choreography, tilt/magnetic belong
   here; form/menu/contact logic stays in main.js.
   ============================================================ */
"use strict";

(() => {
  if (window.__ETQAN_MOTION) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const mm = gsap.matchMedia();

  document.documentElement.classList.add("mgsap");
  window.__ETQAN_MOTION = true;

  const $ = (s, sc = document) => sc.querySelector(s);
  const $$ = (s, sc = document) => Array.from(sc.querySelectorAll(s));

  /* every element animated here is flagged so the final generic pass
     never double-animates it */
  const handled = new WeakSet();
  const mark = (els) => (els || []).forEach((el) => handled.add(el));

  /* ------------------------------------------------------------
     0 — split headlines into line masks (same-mask typography)
     RTL-safe: split only at <br>, nodes preserved inside .line-inner
  ------------------------------------------------------------ */
  function maskHeads() {
    const targets = $$(".hero-title") /* line-splitted (has <br>) */
      .concat($$(".section-head h2, .inquiry-copy h2, .contractors-head h2"));
    targets.forEach((h) => {
      if (h.dataset.masked) return;
      h.dataset.masked = "1";
      const lines = [];
      let current = [];
      const flush = () => { if (current.length) lines.push(current); current = []; };
      Array.from(h.childNodes).forEach((node) => {
        if (node.nodeType === 1 && node.tagName === "BR") { flush(); }
        else current.push(node);
      });
      flush();
      if (lines.length === 1) {
        /* single-line heading: one mask, one inner */
        const wrap = (nodes) => {
          const mask = document.createElement("span");
          mask.className = "line-mask";
          const inner = document.createElement("span");
          inner.className = "line-inner";
          nodes.forEach((n) => inner.appendChild(n));
          mask.appendChild(inner);
          h.textContent = "";
          h.appendChild(mask);
          return [mask];
        };
        wrap(lines[0]);
      } else {
        h.textContent = "";
        lines.forEach((nodes) => {
          const mask = document.createElement("span");
          mask.className = "line-mask";
          const inner = document.createElement("span");
          inner.className = "line-inner";
          nodes.forEach((n) => inner.appendChild(n));
          mask.appendChild(inner);
          h.appendChild(mask);
        });
      }
    });
  }
  maskHeads();
  mark($$(".line-mask, .line-inner, .hero-title"));
  mark($$(".section-head h2 em, .inquiry-copy h2 em, .contractors-head h2 em")); /* inside masks */

  /* ------------------------------------------------------------
     1 — NAV: animated golden cue (slides between active links)
  ------------------------------------------------------------ */
  function initNavCue() {
    const nav = $(".main-nav");
    if (!nav || nav.dataset.cue) return;
    nav.dataset.cue = "1";
    const cue = document.createElement("span");
    cue.className = "nav-cue";
    cue.setAttribute("aria-hidden", "true");
    nav.appendChild(cue);

    let current = null;
    const place = (instant) => {
      const r = current && current.getBoundingClientRect();
      const nr = nav.getBoundingClientRect();
      if (!r || !nr.width) { gsap.to(cue, { opacity: 0, duration: instant ? 0 : .3 }); return; }
      gsap.to(cue, {
        x: r.left - nr.left + r.width / 2 - cue.offsetWidth / 2,
        width: r.width * 0.62,
        opacity: 1,
        duration: instant ? 0 : .5,
        ease: "power3.out",
      });
    };
    $$(".main-nav a").forEach((a) => {
      new MutationObserver(() => {
        const isActive = a.classList.contains("active");
        if (isActive) { current = a; place(); } else if (current === a && !isActive) { /* keep last */ }
      }).observe(a, { attributes: true, attributeFilter: ["class"] });
    });

    const sync = () => place(true);
    const relayout = () => place();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
    window.addEventListener("load", sync);
    window.addEventListener("resize", relayout, { passive: true });
    if (ScrollTrigger.addEventListener) ScrollTrigger.addEventListener("refreshInit", relayout);
    setTimeout(sync, 450);
  }
  initNavCue();

  /* ------------------------------------------------------------
     2 — HERO: cinematic master timeline (doors → art → type → CTA)
  ------------------------------------------------------------ */
  function initHero() {
    const heroTitle = $(".hero-title");
    if (!heroTitle) return;

    /* initial states (preloader still covers the page) */
    gsap.set(".hero-copy .kicker, .hero-sub, .hero-cta", { opacity: 0, y: 26 });
    gsap.set(".hero-cta .btn", { opacity: 0, y: 18 });
    gsap.set(".hero-title .line-inner", { yPercent: 118 });
    gsap.set(".hero-art", { clipPath: "inset(100% 0% 0% 0%)", opacity: 1 });
    gsap.set(".motif-door", { opacity: 0, scale: .96 });
    gsap.set(".motif-window", { opacity: 0, y: 14 });
    gsap.set(".motif-floor", { scaleX: 0.4, opacity: .4, transformOrigin: "center" });
    gsap.set(".hero-scroll", { opacity: 0 });

    let started = false;
    const playIntro = () => {
      if (started) return;
      started = true;
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      /* doors part (single owner: GSAP tweens the halves) */
      tl.to(".preloader-half--start", { xPercent: -104, duration: .95, ease: "power4.inOut" }, 0)
        .to(".preloader-half--end", { xPercent: 104, duration: .95, ease: "power4.inOut" }, 0)
        .to(".preloader-stage", { opacity: 0, scale: .98, duration: .35 }, 0)
        .add(() => document.body.classList.add("doors-open"), 0)
        .add(() => {
          const pre = $("#preloader");
          if (pre) pre.remove();
        }, .98)

      /* brand heart of the site: the art grows from the floor */
        .to(".hero-art", { clipPath: "inset(0% 0% 0% 0%)", duration: 1.05, ease: "power4.inOut" }, .55)
        .to(".motif-door", { opacity: 1, scale: 1, duration: .8 }, .7)
        .to(".motif-floor", { scaleX: 1, opacity: 1, duration: .8, ease: "power3.out" }, .75)
        .to(".motif-window", { opacity: 1, y: 0, duration: .7 }, .95)

      /* typography in masked lines */
        .to(".hero-copy .kicker", { opacity: 1, y: 0, duration: .6 }, .8)
        .to(".hero-title .line-inner", { yPercent: 0, duration: .95, stagger: .13 }, .9)
        .to(".hero-sub", { opacity: 1, y: 0, duration: .75 }, 1.25)
        .to(".hero-cta", { opacity: 1, y: 0, duration: .7 }, 1.4)
        .to(".hero-cta .btn", { opacity: 1, y: 0, duration: .75, stagger: .09 }, 1.45)
        .to(".hero-scroll", { opacity: 1, duration: .6 }, 1.9);

      /* subtle parallax once the intro settles */
      gsap.to(".hero-copy", {
        yPercent: -7, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero-art", {
        yPercent: 9, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    };

    document.addEventListener("etqan:doors", playIntro);
    /* safety: if the preloader was never in the flow (or already gone) */
    if (!$("#preloader")) gsap.delayedCall(.05, playIntro);
  }
  initHero();

  /* ------------------------------------------------------------
     3 — SCROLL systems (each section gets its own character)
     mark() means "owned exclusively by motion.js"
  ------------------------------------------------------------ */
  function initScroll() {
    const progress = $(".scroll-progress-bar");
    if (progress) {
      gsap.to(progress, {
        scaleX: 1, ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
          scrub: .2,
          invalidateOnRefresh: true,
        },
      });
    }
    /* — Collections: masked title wipe + stacked card rise + image parallax — */
    mark($$(".section-head, .inquiry-copy, .contractors-head"));
    $$(".section-head").forEach((head) => {
      const k = $(".kicker", head);
      if (!k) return;
      mark([k]);
      gsap.from(k, {
        opacity: 0, y: 16, duration: .6, ease: "power2.out",
        scrollTrigger: { trigger: head, start: "top 84%" },
      });
    });
    $$(".section-head h2, .inquiry-copy h2, .contractors-head h2").forEach((h) => {
      if (h.dataset.headDone) return;
      h.dataset.headDone = "1";
      const lines = $$(".line-inner", h);
      if (!lines.length) return;
      gsap.from(lines, {
        yPercent: 115, duration: .9, ease: "power4.out", stagger: .1,
        scrollTrigger: { trigger: h, start: "top 84%" },
      });
    });

    const cards = $$(".card").map((c) => { mark([c, $(".card-media", c), $(".card-img", c)]); return c; });

    gsap.from(cards, {
      y: 64, opacity: 0, rotateX: 5, duration: .85, ease: "power3.out", stagger: .09,
      scrollTrigger: { trigger: "#materialCards", start: "top 80%" },
    });
    cards.forEach((card) => {
      const media = $(".card-media", card);
      if (!media) return;
      gsap.fromTo(media, { yPercent: 5 }, {
        yPercent: -5, ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    /* — Process: line draws as you scroll, steps arrive in sequence — */
    const pp = $(".process-progress");
    if (pp) {
      mark([pp]);
      gsap.fromTo(pp, { scaleX: 0 }, {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: "#process", start: "top 60%", end: "bottom 70%", scrub: .6 },
      });
    }
    const steps = $$(".step").map((s) => { mark([s]); return s; });
    gsap.from(steps, {
      y: 56, opacity: 0, duration: .7, ease: "power3.out", stagger: .12,
      scrollTrigger: { trigger: ".steps", start: "top 78%" },
    });
    {
      const stats = $$(".stat").map((s) => { mark([s]); return s; });
      if (stats.length) {
        gsap.fromTo(stats,
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: .65, stagger: .07, ease: "power3.out", immediateRender: false, clearProps: "transform,opacity", overwrite: "auto",
            scrollTrigger: { trigger: ".stats", start: "top 88%", once: true, invalidateOnRefresh: true } });
      }
      $$(".stats .stat-title, .stats .stat-desc").forEach((n) => {
        mark([n]);
      });
    }

    /* — Projects: RTL-aware wipe reveal, staggered gallery — */
    const tiles = $$(".gallery .ph").map((t) => { mark([t]); return t; });
    const rtl = document.dir === "rtl" || document.documentElement.dir === "rtl";
    tiles.forEach((tile) => {
      const fromClip = rtl ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
      gsap.fromTo(tile,
        { clipPath: fromClip, opacity: 1, scale: .985 },
        { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, scale: 1,
          duration: .9, ease: "power3.inOut",
          scrollTrigger: { trigger: tile, start: "top 86%" } });
    });

    /* — Contractors: tracks rise with stagger (heading handled by line reveal) — */
    $$(".contractors .track").forEach((t, i) => {
      mark([t]);
      gsap.from(t, {
        y: 60, opacity: 0, duration: .85, delay: i * .12, ease: "power3.out",
        scrollTrigger: { trigger: t, start: "top 85%" },
      });
    });

    /* — Testimonials: soft spring rise — */
    const quotes = $$(".quote").map((q) => { mark([q]); return q; });
    gsap.from(quotes, {
      y: 42, opacity: 0, duration: .8, stagger: .13, ease: "back.out(1.4)",
      scrollTrigger: { trigger: ".quotes", start: "top 82%" },
    });

    /* — Inquiry: form clip reveal + chips pop — */
    const form = $(".form-card");
    if (form) {
      mark([form, ...$$(".field", form), ...$$(".chips button", form)]);
      gsap.fromTo(form,
        { clipPath: "inset(14% 8% 14% 8% round 22px)", opacity: .3, y: 60 },
        { clipPath: "inset(0% 0% 0% 0% round 22px)", opacity: 1, y: 0,
          duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: form, start: "top 80%" } });
      gsap.from($$(".chips button", form), {
        scale: .7, opacity: 0, duration: .5, stagger: .05, ease: "back.out(2)",
        scrollTrigger: { trigger: ".chips", start: "top 88%" },
      });
    }

    /* — FAQ: accordion rows surface — */
    const faqs = $$(".faq").map((f) => { mark([f]); return f; });
    gsap.from(faqs, {
      y: 36, opacity: 0, duration: .6, stagger: .07, ease: "power2.out",
      scrollTrigger: { trigger: ".faq-wrap", start: "top 82%" },
    });

    /* — Footer: columns settle last — */
    const footCols = $$(".footer-grid > *").map((c) => { mark([c]); return c; });
    if (footCols.length) {
      gsap.from(footCols, {
        y: 30, opacity: 0, duration: .7, stagger: .1, ease: "power2.out",
        scrollTrigger: { trigger: ".footer-grid", start: "top 92%" },
      });
    }

    /* — generic pass: nothing left behind — */
    $$(".reveal").forEach((el) => {
      if (handled.has(el) || el.closest(".hero")) return;
      gsap.from(el, {
        opacity: 0, y: 30, duration: .7, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    /* — atmospheric backgrounds: scroll-driven depth (transform-only) — */
    $$(".scene").forEach((scene) => {
      const mesh = $(".scene-mesh", scene);
      const orbs = $$(".scene-orb", scene);
      if (mesh) {
        gsap.to(mesh, {
          yPercent: 6, scale: 1.04, ease: "none",
          scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
      orbs.forEach((orb, i) => {
        gsap.to(orb, {
          yPercent: i % 2 ? -18 : 14,
          xPercent: i % 2 ? 8 : -10,
          ease: "none",
          scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    });
  }

  /* ------------------------------------------------------------
     4 — MOBILE MENU: orchestrated stagger (open / close)
  ------------------------------------------------------------ */
  function initMenuMotion() {
    const menu = $("#mobileMenu");
    if (!menu) return;
    const links = $$("nav a", menu);
    document.addEventListener("etqan:menu", (e) => {
      const open = !!(e.detail && e.detail.open);
      if (open) {
        gsap.fromTo(links,
          { opacity: 0, y: 42, scale: .98 },
          { opacity: 1, y: 0, scale: 1, duration: .55, stagger: .07, ease: "power3.out", delay: .1, overwrite: "auto" });
      } else {
        gsap.to(links, { opacity: 0, y: 18, duration: .3, stagger: .025, ease: "power2.in", overwrite: "auto" });
      }
    });
  }
  initMenuMotion();

  /* ------------------------------------------------------------
     5 — POINTER PHYSICS (desktop, hover devices only):
     card tilt + magnetic CTAs — GSAP quickTo (rAF-throttled)
  ------------------------------------------------------------ */
  mm.add("(hover: hover) and (pointer: fine)", () => {
    const cards = $$(".card");
    const tilts = cards.map((card) => {
      const rotY = gsap.quickTo(card, "rotationY", { duration: .55, ease: "power3.out" });
      const rotX = gsap.quickTo(card, "rotationX", { duration: .55, ease: "power3.out" });
      const lift = gsap.quickTo(card, "y", { duration: .45, ease: "power3.out" });
      const move = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        rotY(-px * 9);
        rotX(py * 6);
        lift(-8);
      };
      const leave = () =>
        gsap.to(card, { rotationY: 0, rotationX: 0, y: 0, duration: .9, ease: "elastic.out(1,.55)", overwrite: "auto" });
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      return () => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); };
    });

    const magnets = $$(".hero-cta .btn, .header-call, .inquiry-direct .btn")
      .filter((b) => !b.classList.contains("btn--block"));
    const mags = magnets.map((btn) => {
      btn.classList.add("magnetic");
      const xTo = gsap.quickTo(btn, "x", { duration: .4, ease: "power3.out" });
      const yTo = gsap.quickTo(btn, "y", { duration: .4, ease: "power3.out" });
      const rTo = gsap.quickTo(btn, "rotation", { duration: .5, ease: "power3.out" });
      const move = (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * .22); yTo(dy * .3); rTo(dx * .008);
      };
      const leave = () =>
        gsap.to(btn, { x: 0, y: 0, rotation: 0, duration: .9, ease: "elastic.out(1,.45)", overwrite: "auto" });
      btn.addEventListener("pointermove", move);
      btn.addEventListener("pointerleave", leave);
      return () => { btn.removeEventListener("pointermove", move); btn.removeEventListener("pointerleave", leave); };
    });

    return () => { tilts.forEach((off) => off()); mags.forEach((off) => off()); };
  });

  /* ------------------------------------------------------------
     6 — TAP FEEDBACK: WA bubble + to-top press physics
  ------------------------------------------------------------ */
  function initTapFeedback() {
    [$("#waFloat"), $("#toTop")].forEach((el) => {
      if (!el || el.dataset.tap) return;
      el.dataset.tap = "1";
      el.addEventListener("pointerdown", () =>
        gsap.to(el, { scale: .86, duration: .14, ease: "power2.in", overwrite: "auto" }));
      const up = () =>
        gsap.to(el, { scale: 1, duration: .7, ease: "elastic.out(1,.4)", overwrite: "auto" });
      el.addEventListener("pointerup", up);
      el.addEventListener("pointerleave", up);
    });
  }
  initTapFeedback();

  /* ------------------------------------------------------------
     boot: wait for fonts/layout/images, then refresh triggers
  ------------------------------------------------------------ */
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener("load", refresh);
  // images can shift layout after fonts; refresh once they settle
  if (document.readyState === "complete") refresh();
  else setTimeout(refresh, 700);
  $$("img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", () => setTimeout(refresh, 50), { once: true });
  });

  initScroll();
})();
