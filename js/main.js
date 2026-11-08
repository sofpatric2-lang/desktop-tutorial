/* ============================================================
   مؤسسة الإتقان — main.js · vanilla JS, zero dependencies
   Preloader double-door reveal · menu · reveals · WhatsApp/phone
   TODO before launch: real contact numbers in CONTACT below.
   ============================================================ */
"use strict";

/* ------------------------------------------------------------------
   CONTACT CONFIG — قابل للإعداد (بانتظار اعتماد رقم الجزائر).
   لا تُضاف أرقام تجريبية/سعودية. عند اعتماد الرقم:
   - whatsapp: أرقام فقط بصيغة دولية بدون + (مثال توضيحي للصيغة فقط: 213XXXXXXXXX)
   - tel: بصيغة tel مع + (مثال توضيحي للصيغة فقط: +213XXXXXXXXX)
   - phoneDisplay: النص الظاهر للرقم
------------------------------------------------------------------- */
const CONTACT = {
  whatsapp: "",            // بانتظار اعتماد رقم واتساب (الجزائر)
  phoneDisplay: "",        // بانتظار اعتماد رقم الهاتف للعرض
  tel: "",                 // بانتظار اعتماد رقم الهاتف (tel:)
};

const WA_BASE = "https://wa.me/" + CONTACT.whatsapp;
const NUMS_READY = Boolean(CONTACT.whatsapp && CONTACT.tel && !/[X?]/.test(CONTACT.whatsapp + CONTACT.tel + CONTACT.phoneDisplay));

/* ---------- helpers ---------- */
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

function waLink(message) {
  return WA_BASE + "?text=" + encodeURIComponent(message);
}

let warnTimer = null;
function contactMissing() {
  console.warn(
    "[etqan] أرقام التواصل غير مُعدّة بعد (بانتظار اعتماد رقم الجزائر) — حدّث CONTACT في js/main.js."
  );
  const warn = $("#formWarn");
  if (warn) {
    warn.hidden = false;
    clearTimeout(warnTimer);
    warnTimer = setTimeout(() => (warn.hidden = true), 4000);
  }
}

function openWhatsApp(el) {
  const msg = (el.getAttribute("data-wa") || "").trim() ||
    "مرحباً، أود الاستفسار عن أعمالكم.";
  if (!NUMS_READY) return contactMissing();
  window.open(waLink(msg), "_blank", "noopener");
}

function openPhone() {
  if (!NUMS_READY) return contactMissing();
  window.location.href = "tel:" + CONTACT.tel;
}

/* ---------- reduced motion ---------- */
const REDUCED =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- reveal-on-scroll ---------- */
let revealObserver = null;
function initReveals() {
  const items = $$(".reveal");
  if (REDUCED || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  /* When GSAP ScrollTrigger is driving motion, skip the vanilla observer
     to avoid fighting GSAP's from/to states. */
  if (window.__ETQAN_MOTION) return;
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((el) => revealObserver.observe(el));
}

/* Hero reveals fire right after the doors part (they sit above the
   initial threshold). Called by the preloader when it finishes. */
function revealNow() {
  $$(".hero .reveal").forEach((el) => el.classList.add("in"));
}

/* ---------- preloader: double-door reveal ---------- */
function runPreloader() {
  const pre = $("#preloader");
  if (!pre) {
    document.dispatchEvent(new CustomEvent("etqan:doors"));
    return;
  }
  if (REDUCED) {
    pre.remove();
    revealNow();
    document.dispatchEvent(new CustomEvent("etqan:doors"));
    return;
  }
  /* GSAP owns the cinematic intro when available; dispatch the handoff. */
  if (window.__ETQAN_MOTION) {
    document.dispatchEvent(new CustomEvent("etqan:doors"));
    return;
  }
  const finish = () => {
    document.body.classList.add("doors-open");
    setTimeout(() => {
      pre.remove();
      revealNow();
    }, 1000);
  };
  window.setTimeout(finish, 2100);
}

/* ---------- header ---------- */
function initHeader() {
  const header = $("#siteHeader");
  if (!header) return;
  const update = () =>
    header.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ---------- mobile menu ---------- */
function initMenu() {
  const btn = $("#menuToggle");
  const menu = $("#mobileMenu");
  if (!btn || !menu) return;

  const header = $("#siteHeader");
  const setOpen = (open) => {
    const wasOpen = menu.classList.contains("open");
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", String(!open));
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    document.body.style.overflow = open ? "hidden" : "";
    if (header) header.classList.toggle("menu-open", open);
    document.dispatchEvent(new CustomEvent("etqan:menu", { detail: { open } }));
    if (open) {
      const links = $$("a, button", menu);
      (links[0] || btn).focus();
    } else if (wasOpen) {
      btn.focus();
    }
  };
  window.__closeMenu = () => setOpen(false);

  btn.addEventListener("click", () =>
    setOpen(btn.getAttribute("aria-expanded") !== "true")
  );
  $$("a", menu).forEach((a) =>
    a.addEventListener("click", () => setOpen(false))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("open")) setOpen(false);
  });
}

/* ---------- bind contact actions (mouse + keyboard parity) ---------- */
function makeActivator(el, handler) {
  if (!el.hasAttribute("href")) {
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
  }
  el.addEventListener("click", (e) => {
    const href = el.getAttribute("href");
    if (!el.hasAttribute("href") || href === "#") e.preventDefault();
    handler(el);
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler(el);
    }
  });
}

function initActions() {
  $$("[data-tel-display]").forEach((el) => {
    el.textContent = CONTACT.phoneDisplay || "بانتظار اعتماد الرقم";
    el.setAttribute("dir", "ltr");
  });
  $$("[data-wa]").forEach((el) => makeActivator(el, openWhatsApp));
  $$("[data-tel]").forEach((el) => makeActivator(el, openPhone));
}

/* ---------- inquiry form ---------- */
function initForm() {
  const form = $("#inquiryForm");
  if (!form) return;
  const chips = $$("#materialChips button");
  chips.forEach((ch) =>
    ch.addEventListener("click", () => ch.classList.toggle("on"))
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const name = ($("#fName") || {}).value || "";
    const city = ($("#fCity") || {}).value || "";
    const msg = ($("#fMsg") || {}).value || "";
    const materials = chips
      .filter((c) => c.classList.contains("on"))
      .map((c) => c.dataset.material);
    const lines = [
      "مرحباً مؤسسة الإتقان،",
      name && "الاسم: " + name,
      city && "المدينة: " + city,
      materials.length && "المطلوب: " + materials.join("، "),
      msg && "تفاصيل: " + msg,
    ].filter(Boolean);
    openWhatsApp({ getAttribute: () => lines.join("\n") });
  });
}

/* ---------- active section in navbar ---------- */
function initActiveNav() {
  const map = new Map();
  $$(".main-nav a").forEach((a) => {
    const id = (a.getAttribute("href") || "").replace("#", "");
    const sec = document.getElementById(id);
    if (sec) map.set(sec, a);
  });
  if (!map.size) return;
  const setActive = () => {
    let current = null;
    map.forEach((a, sec) => {
      const r = sec.getBoundingClientRect();
      if (r.top <= window.innerHeight * 0.4 && r.bottom >= window.innerHeight * 0.2) current = a;
    });
    map.forEach((a) => a.classList.toggle("active", a === current));
  };
  window.addEventListener("scroll", setActive, { passive: true });
  setActive();
}

/* anchor smooth-scroll already covered by CSS scroll-behavior +
   scroll-padding-top; JS guarantee for non-smooth-motion browsers */
function initSmoothAnchors() {
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.__closeMenu && window.__closeMenu();
      const reduce = REDUCED;
      const behavior = reduce ? "auto" : "smooth";
      target.scrollIntoView({ behavior, block: "start" });
      history.replaceState(null, "", id);
    })
  );
}

/* show the logo click = home (already #hero; make it exact top) */
function initHomeLink() {
  const brand = $(".brand");
  if (!brand) return;
  brand.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: REDUCED ? "auto" : "smooth",
    });
    history.replaceState(null, "", location.pathname);
  });
}

/* ---------- back to top ---------- */
function initToTop() {
  const btn = $("#toTop");
  if (!btn) return;
  /* hide near the footer so the button never sits over the contact/hours text */
  let footerVisible = false;
  const footer = $("#footer");
  const update = () =>
    btn.classList.toggle(
      "show",
      !footerVisible && window.scrollY > window.innerHeight * 1.2
    );
  if (footer && "IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        footerVisible = entry.isIntersecting;
        update();
      },
      { threshold: 0.04 }
    ).observe(footer);
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" })
  );
}

/* ---------- floating WhatsApp bubble ---------- */
function initWaFloat() {
  const float = $("#waFloat");
  if (!float) return;
  const ticker = () => {
    const inquiry = $("#inquiry");
    const nearInquiry =
      inquiry &&
      Math.abs(
        inquiry.getBoundingClientRect().top - window.innerHeight
      ) < window.innerHeight * 0.55;
    float.classList.toggle("show", window.scrollY > window.innerHeight * 0.65 && !nearInquiry);
  };
  window.addEventListener("scroll", ticker, { passive: true });
  ticker();
  if (!REDUCED) {
    setTimeout(() => float.classList.add("pulse"), 3000);
  }
}

/* ---------- footer year ---------- */
function initYear() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
}

/* ---------- boot ---------- */
function boot() {
  if (REDUCED) document.documentElement.classList.add("no-motion");
  runPreloader();
  initHeader();
  initMenu();
  initReveals();
  initActions();
  initForm();
  initActiveNav();
  initSmoothAnchors();
  initHomeLink();
  initToTop();
  initWaFloat();
  initYear();
  if (!NUMS_READY) console.info("[etqan] وضع العرض بمحتوى مؤقت — أرقام التواصل (الجزائر) غير معتمدة/غير مضافة بعد.");
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
