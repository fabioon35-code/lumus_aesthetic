"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const SERVICES = [
  { name: "Rejuvenecimiento Facial", price: "$85.000", duration: "60 min", icon: "✦" },
  { name: "Masaje Terapéutico", price: "$70.000", duration: "75 min", icon: "◈" },
  { name: "Nail Art Studio", price: "$35.000", duration: "45 min", icon: "◆" },
  { name: "Hair & Color", price: "$60.000", duration: "120 min", icon: "◉" },
  { name: "Depilación & Threading", price: "$25.000", duration: "30 min", icon: "◇" },
  { name: "Tratamiento Corporal", price: "$90.000", duration: "90 min", icon: "⬡" },
];

const GALLERY_SERVICES = [
  {
    label: "Rejuvenecimiento Facial",
    imgs: [
      { src: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=85", alt: "Masaje facial" },
      { src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=85", alt: "Facial premium" },
    ],
  },
  {
    label: "Nail Art Studio",
    imgs: [
      { src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=85", alt: "Nail art diseño" },
      { src: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&q=85", alt: "Nail art colores" },
    ],
  },
  {
    label: "Masaje Terapéutico",
    imgs: [
      { src: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=85", alt: "Masaje relajante" },
      { src: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=85", alt: "Masaje terapéutico" },
    ],
  },
  {
    label: "Hair & Color",
    imgs: [
      { src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=85", alt: "Hair color profesional" },
      { src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=85", alt: "Coloración premium" },
    ],
  },
  {
    label: "Tratamiento Corporal",
    imgs: [
      { src: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=85", alt: "Tratamiento corporal" },
      { src: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&q=85", alt: "Exfoliación corporal" },
    ],
  },
  {
    label: "Spa & Ambiente",
    imgs: [
      { src: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=85", alt: "Spa masaje profesional" },
      { src: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800&q=85", alt: "Sala spa de lujo" },
    ],
  },
];
const GALLERY_ALL_IMGS = GALLERY_SERVICES.flatMap((s) => s.imgs.map((i) => i.src));

type Message = {
  type: "bot" | "user";
  html: string;
  time: string;
};

type QuickReply = {
  text: string;
  action: string;
  value?: string;
};

function getTime() {
  const d = new Date();
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
}

export default function Home() {
  // UI state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatBadgeVisible, setChatBadgeVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [typingVisible, setTypingVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lightboxActive, setLightboxActive] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoClicked, setLogoClicked] = useState(false);
  const [wppClicked, setWppClicked] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [calSelected, setCalSelected] = useState<Date | null>(null);
  const [calView, setCalView] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const calRef = useRef<HTMLDivElement>(null);
  const [svcOpen, setSvcOpen] = useState(false);
  const [svcSelected, setSvcSelected] = useState("");
  const svcRef = useRef<HTMLDivElement>(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const [timeSelected, setTimeSelected] = useState("");
  const timeRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = () => {
    setLogoClicked(true);
    setTimeout(() => setLogoClicked(false), 450);
  };
  const handleWppClick = () => {
    setWppClicked(true);
    setTimeout(() => setWppClicked(false), 450);
  };

  // Chatbot state (refs to avoid stale closures in async)
  const chatStateRef = useRef("idle");
  const bookingRef = useRef<Record<string, string>>({});
  const chatHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const chatInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Dropdown click-outside close ──────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (calRef.current && !calRef.current.contains(t)) setCalOpen(false);
      if (svcRef.current && !svcRef.current.contains(t)) setSvcOpen(false);
      if (timeRef.current && !timeRef.current.contains(t)) setTimeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Calendar helpers ───────────────────────────────────────────────
  const calDays = (() => {
    const year = calView.getFullYear();
    const month = calView.getMonth();
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(first === 0 ? 6 : first - 1).fill(null);
    for (let d = 1; d <= total; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  })();

  const calSelectDay = (day: number) => {
    const d = new Date(calView.getFullYear(), calView.getMonth(), day);
    setCalSelected(d);
    setCalOpen(false);
  };

  const calIsPast = (day: number) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(calView.getFullYear(), calView.getMonth(), day) < today;
  };

  const calIsSelected = (day: number) =>
    calSelected?.getFullYear() === calView.getFullYear() &&
    calSelected?.getMonth() === calView.getMonth() &&
    calSelected?.getDate() === day;

  const calIsToday = (day: number) => {
    const t = new Date();
    return t.getFullYear() === calView.getFullYear() && t.getMonth() === calView.getMonth() && t.getDate() === day;
  };

  const calPrevMonth = () => setCalView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const calNextMonth = () => setCalView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1));

  const calLabel = calSelected
    ? calSelected.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    : "Seleccionar fecha";

  const calIsoValue = calSelected ? calSelected.toISOString().split("T")[0] : "";

  const CAL_MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const CAL_DAYS_HDR = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

  // ── Scroll messages to bottom ──────────────────────────────────────
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingVisible]);

  // ── Init AOS + cursor + parallax + particles + counters ───────────
  useEffect(() => {
    // AOS
    import("aos").then((AOS) => {
      AOS.default.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 60 });
    });
    // Dynamically load AOS CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/aos@2.3.1/dist/aos.css";
    document.head.appendChild(link);

    // Cursor
    const cursor = document.getElementById("cursor");
    const follower = document.getElementById("cursor-follower");
    let mx = 0, my = 0, fx = 0, fy = 0;
    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (cursor) { cursor.style.left = mx + "px"; cursor.style.top = my + "px"; }
    };
    document.addEventListener("mousemove", onMouseMove);
    let rafId: number;
    const animFollower = () => {
      fx += (mx - fx) * 0.12;
      fy += (my - fy) * 0.12;
      if (follower) { follower.style.left = fx + "px"; follower.style.top = fy + "px"; }
      rafId = requestAnimationFrame(animFollower);
    };
    animFollower();

    // Cursor scale on interactive elements
    const interactives = document.querySelectorAll("a,button,.service-card,.gallery-item,.team-card");
    const onEnter = () => {
      if (cursor) { cursor.style.width = "20px"; cursor.style.height = "20px"; }
      if (follower) { follower.style.width = "56px"; follower.style.height = "56px"; }
    };
    const onLeave = () => {
      if (cursor) { cursor.style.width = "12px"; cursor.style.height = "12px"; }
      if (follower) { follower.style.width = "36px"; follower.style.height = "36px"; }
    };
    interactives.forEach((el) => { el.addEventListener("mouseenter", onEnter); el.addEventListener("mouseleave", onLeave); });

    // Scroll progress + nav
    const prog = document.getElementById("scroll-progress");
    const nav = document.getElementById("main-nav");
    const heroBg = document.getElementById("hero-bg");
    const onScroll = () => {
      const s = document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (prog) prog.style.width = (s / h * 100) + "%";
      if (nav) nav.classList.toggle("scrolled", s > 40);
      if (heroBg && s < window.innerHeight) heroBg.style.transform = `translateY(${s * 0.35}px)`;
    };
    window.addEventListener("scroll", onScroll);

    // Particles
    const pc = document.getElementById("particles");
    if (pc) {
      for (let i = 0; i < 28; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        const size = Math.random() * 2.5 + 1;
        p.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-duration:${Math.random() * 12 + 8}s;animation-delay:${Math.random() * 8}s;opacity:.5;`;
        pc.appendChild(p);
      }
    }

    // Counter animation
    const counters = document.querySelectorAll<HTMLElement>(".stat-number");
    let counted = false;
    const statsEl = counters[0]?.closest(".about-stats");
    if (statsEl) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !counted) {
          counted = true;
          counters.forEach((el, i) => {
            const target = +(el.dataset.target || 0);
            const delay = i * 120;
            setTimeout(() => {
              const duration = 1800;
              const start = performance.now();
              const tick = (now: number) => {
                const t = Math.min((now - start) / duration, 1);
                const ease = 1 - Math.pow(1 - t, 4); // quartic easeOut
                el.textContent = Math.floor(ease * target) + "+";
                if (t < 1) requestAnimationFrame(tick);
              };
              requestAnimationFrame(tick);
            }, delay);
          });
        }
      }, { threshold: 0.2 });
      observer.observe(statsEl);
    }

    // Testimonials auto-rotate
    let currentSlide = 0;
    const slides = document.querySelectorAll<HTMLElement>(".test-slide");
    const dots = document.querySelectorAll<HTMLElement>(".test-dot");
    const goToSlide = (n: number) => {
      slides[currentSlide]?.classList.remove("active");
      dots[currentSlide]?.classList.remove("active");
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide]?.classList.add("active");
      dots[currentSlide]?.classList.add("active");
    };
    (window as typeof window & { goToSlide: (n: number) => void }).goToSlide = goToSlide;
    const autoSlide = setInterval(() => goToSlide(currentSlide + 1), 5000);

    // Service card 3D tilt
    document.querySelectorAll<HTMLElement>(".service-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        card.style.transform = `perspective(800px) rotateY(${x / 30}deg) rotateX(${-y / 30}deg) translateZ(8px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });

    // Keyboard for lightbox
    const onKeyDown = (e: KeyboardEvent) => {
      setLightboxActive((active) => {
        if (active) {
          if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + GALLERY_ALL_IMGS.length) % GALLERY_ALL_IMGS.length);
          if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % GALLERY_ALL_IMGS.length);
          if (e.key === "Escape") return false;
        }
        return active;
      });
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(rafId);
      clearInterval(autoSlide);
    };
  }, []);

  // ── Chatbot helpers ────────────────────────────────────────────────
  const addBotMsg = useCallback((html: string) => {
    setMessages((prev) => [...prev, { type: "bot", html, time: getTime() }]);
  }, []);

  const addUserMsg = useCallback((text: string) => {
    setMessages((prev) => [...prev, { type: "user", html: text, time: getTime() }]);
  }, []);

  const showTyping = useCallback(() => setTypingVisible(true), []);
  const hideTyping = useCallback(() => setTypingVisible(false), []);

  // ── Init chat on first open ────────────────────────────────────────
  const initChat = useCallback(() => {
    showTyping();
    setTimeout(() => {
      hideTyping();
      addBotMsg("¡Hola! Soy el asistente virtual de <strong>LUMUS Estética</strong>. ¿En qué puedo ayudarte hoy? ✦");
      setQuickReplies([
        { text: "📅 Reservar cita", action: "book" },
        { text: "💆 Ver servicios", action: "services" },
        { text: "🕐 Horarios", action: "hours" },
        { text: "💰 Precios", action: "prices" },
        { text: "📍 Ubicación", action: "location" },
      ]);
    }, 1200);
  }, [addBotMsg, hideTyping, showTyping]);

  // ── Toggle chat ────────────────────────────────────────────────────
  const toggleChat = useCallback(() => {
    setChatOpen((prev) => {
      if (!prev && !chatInitialized.current) {
        chatInitialized.current = true;
        setTimeout(initChat, 100);
      }
      return !prev;
    });
    setChatBadgeVisible(false);
  }, [initChat]);

  // ── AI call ────────────────────────────────────────────────────────
  const callAI = useCallback(async (userText: string) => {
    chatHistoryRef.current = [...chatHistoryRef.current, { role: "user", content: userText }];
    showTyping();
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistoryRef.current,
          bookingContext: bookingRef.current,
          today,
        }),
      });
      const data = await res.json();

      if (data.booking && typeof data.booking === "object") {
        const b = data.booking as Record<string, string>;
        for (const key of ["name", "service", "dateISO", "dateLabel", "time", "phone", "email"]) {
          if (b[key] != null && b[key] !== "") bookingRef.current[key] = b[key];
        }
      }

      if (data.intent === "booking") chatStateRef.current = "booking_llm";

      let reply = (data.message as string) || "Lo siento, no pude procesar tu mensaje. ¿Te puedo ayudar con algo más?";
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const errLines = (data.errors as { field?: string; message: string }[])
          .map((e) => `⚠️ ${e.field ? `<strong>${e.field}</strong>: ` : ""}${e.message}`)
          .join("<br>");
        reply += "<br><br>" + errLines;
      }

      chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: reply }];
      hideTyping();
      addBotMsg(reply);

      const REQUIRED = ["name", "service", "dateISO", "time", "phone", "email"];
      const missing = REQUIRED.filter((f) => !bookingRef.current[f]);

      if (chatStateRef.current === "booking_llm" && missing.length === 0) {
        const b = bookingRef.current;
        setTimeout(() => {
          const card = `<div style="margin-top:8px"><div class="confirm-card">
            <div class="confirm-row"><span class="confirm-label">Nombre</span><span class="confirm-val">${b.name}</span></div>
            <div class="confirm-row"><span class="confirm-label">Servicio</span><span class="confirm-val">${b.service}</span></div>
            <div class="confirm-row"><span class="confirm-label">Fecha</span><span class="confirm-val">${b.dateLabel || b.dateISO}</span></div>
            <div class="confirm-row"><span class="confirm-label">Hora</span><span class="confirm-val">${b.time}</span></div>
            <div class="confirm-row"><span class="confirm-label">Teléfono</span><span class="confirm-val">${b.phone}</span></div>
            ${b.email ? `<div class="confirm-row"><span class="confirm-label">Email</span><span class="confirm-val">${b.email}</span></div>` : ""}
          </div></div>`;
          addBotMsg("¿Todo correcto? Confirma tu reserva. " + card);
          setQuickReplies([
            { text: "✦ Confirmar reserva", action: "confirm_booking" },
            { text: "✏️ Modificar datos", action: "restart_booking" },
          ]);
        }, 400);
        return;
      }

      if (chatStateRef.current === "booking_llm" && missing.length > 0) {
        if (missing[0] === "service") {
          setQuickReplies(SERVICES.map((s) => ({ text: s.icon + " " + s.name, action: "select_service", value: s.name })));
          return;
        }
        if (missing[0] === "dateISO") {
          const base = new Date();
          const dates: QuickReply[] = [];
          for (let i = 1; i <= 5; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const label = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
            const iso = d.toISOString().split("T")[0];
            dates.push({ text: label, action: "select_date", value: `${iso}|${label}` });
          }
          setQuickReplies(dates);
          return;
        }
        if (missing[0] === "time") {
          setQuickReplies(["09:00", "10:30", "12:00", "15:00", "17:00", "19:00"].map((t) => ({ text: t, action: "select_time", value: t })));
          return;
        }
        setQuickReplies([]);
        return;
      }

      setQuickReplies([
        { text: "📅 Reservar cita", action: "book" },
        { text: "💆 Ver servicios", action: "services" },
        { text: "🏠 Menú", action: "restart" },
      ]);
    } catch {
      hideTyping();
      addBotMsg("Lo siento, hay un problema de conexión. Llámanos al <strong>+54 385 400 0000</strong>.");
      setQuickReplies([{ text: "🏠 Menú", action: "restart" }]);
    }
  }, [addBotMsg, hideTyping, showTyping]);

  // ── Booking flow ───────────────────────────────────────────────────
  const startBooking = useCallback(() => {
    chatStateRef.current = "booking_llm";
    bookingRef.current = {};
    addBotMsg("¡Perfecto! Vamos a agendar tu cita. 📅<br><br>¿Cuál es tu <strong>nombre completo</strong>?");
    setQuickReplies([]);
  }, [addBotMsg]);

  const continueBooking = useCallback((step: string) => {
    if (step === "email") {
      // Async: call booking API
      const confirmNum = "LM-" + Math.floor(Math.random() * 9000 + 1000);
      chatStateRef.current = "done";
      showTyping();
      fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bookingRef.current.name,
          service: bookingRef.current.service,
          dateLabel: bookingRef.current.dateLabel,
          dateISO: bookingRef.current.dateISO,
          time: bookingRef.current.time,
          phone: bookingRef.current.phone,
          email: bookingRef.current.email,
          confirmNum,
        }),
      })
        .then((r) => r.json())
        .catch(() => ({ success: false }))
        .then((data) => {
          hideTyping();
          const ok = data.success !== false;
          const card = `
            <div style="margin-top:8px">
              <div class="confirm-card">
                <div class="confirm-row"><span class="confirm-label">Cliente</span><span class="confirm-val">${bookingRef.current.name}</span></div>
                <div class="confirm-row"><span class="confirm-label">Servicio</span><span class="confirm-val">${bookingRef.current.service}</span></div>
                <div class="confirm-row"><span class="confirm-label">Fecha</span><span class="confirm-val">${bookingRef.current.dateLabel}</span></div>
                <div class="confirm-row"><span class="confirm-label">Hora</span><span class="confirm-val">${bookingRef.current.time}</span></div>
                <div class="confirm-row"><span class="confirm-label">Teléfono</span><span class="confirm-val">${bookingRef.current.phone}</span></div>
                <div class="confirm-row"><span class="confirm-label">Email</span><span class="confirm-val">${bookingRef.current.email}</span></div>
                <div class="confirm-number">${confirmNum}</div>
                <div style="text-align:center;font-size:10px;color:var(--text-muted);letter-spacing:1px">N° DE CONFIRMACIÓN</div>
              </div>
            </div>`;
          const emailNote = ok && bookingRef.current.email
            ? `<br><small style="color:var(--text-muted)">📧 Confirmación enviada a ${bookingRef.current.email}</small>`
            : "";
          const calNote = data.calendar
            ? `<br><small style="color:var(--text-muted)">📅 <a href="${data.calendar}" target="_blank" style="color:var(--gold)">Ver en Google Calendar</a></small>`
            : "";
          addBotMsg("✦ <strong>¡Reserva registrada con éxito!</strong>" + emailNote + calNote + card);
          setTimeout(() => {
            setQuickReplies([
              { text: "🏠 Menú principal", action: "restart" },
              { text: "📋 Ver formulario", action: "scroll_booking" },
            ]);
          }, 500);
        });
      return;
    }

    showTyping();
    setTimeout(() => {
      hideTyping();
      if (step === "name") {
        chatStateRef.current = "await_service";
        addBotMsg(`Encantada, <strong>${bookingRef.current.name}</strong>. ¿Qué servicio te gustaría reservar?`);
        setQuickReplies(SERVICES.map((s) => ({ text: s.icon + " " + s.name, action: "select_service", value: s.name })));
      } else if (step === "service") {
        chatStateRef.current = "await_date";
        const svc = SERVICES.find((s) => s.name === bookingRef.current.service);
        addBotMsg(`Excelente elección. <strong>${bookingRef.current.service}</strong> (${svc?.duration || ""}).<br><br>¿Qué fecha prefieres?`);
        const today = new Date();
        const dates: QuickReply[] = [];
        for (let i = 1; i <= 5; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const label = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
          const iso = d.toISOString().split("T")[0];
          dates.push({ text: label, action: "select_date", value: `${iso}|${label}` });
        }
        setQuickReplies(dates);
      } else if (step === "date") {
        chatStateRef.current = "await_time";
        addBotMsg(`Anotado: <strong>${bookingRef.current.dateLabel}</strong>. ¿A qué hora te viene mejor?`);
        setQuickReplies([
          { text: "09:00", action: "select_time", value: "09:00" },
          { text: "10:30", action: "select_time", value: "10:30" },
          { text: "12:00", action: "select_time", value: "12:00" },
          { text: "15:00", action: "select_time", value: "15:00" },
          { text: "17:00", action: "select_time", value: "17:00" },
          { text: "19:00", action: "select_time", value: "19:00" },
        ]);
      } else if (step === "time") {
        chatStateRef.current = "await_phone";
        addBotMsg(`Perfecto, las <strong>${bookingRef.current.time}</strong>. ¿Tu número de teléfono?`);
        setQuickReplies([]);
      } else if (step === "phone") {
        chatStateRef.current = "await_email";
        addBotMsg(`Anotado. Por último, ¿tu <strong>email</strong> para enviarte la confirmación?`);
        setQuickReplies([]);
      }
    }, 700);
  }, [addBotMsg, hideTyping, showTyping]);

  // ── Process quick-reply actions ────────────────────────────────────
  const processAction = useCallback((action: string, value?: string) => {
    if (action === "confirm_booking") { continueBooking("email"); return; }
    if (action === "restart_booking") {
      chatStateRef.current = "booking_llm";
      bookingRef.current = {};
      chatHistoryRef.current = [];
      addBotMsg("¡Claro! Empecemos de nuevo. ¿Cuál es tu <strong>nombre completo</strong>?");
      setQuickReplies([]);
      return;
    }
    showTyping();
    setTimeout(() => {
      hideTyping();
      switch (action) {
        case "book":
          startBooking();
          break;
        case "services": {
          let html = "<strong>Nuestros Servicios:</strong><br><br>";
          SERVICES.forEach((s) => { html += `${s.icon} <strong>${s.name}</strong><br><small style="color:var(--text-muted)">${s.price} · ${s.duration}</small><br>`; });
          addBotMsg(html);
          setTimeout(() => setQuickReplies([{ text: "📅 Reservar cita", action: "book" }, { text: "💰 Ver precios", action: "prices" }, { text: "🏠 Menú", action: "restart" }]), 300);
          break;
        }
        case "hours":
          addBotMsg("<strong>Horarios LUMUS:</strong><br><br>🗓 <strong>Lunes – Sábado</strong><br>9:00 – 20:00<br><br>🗓 <strong>Domingo</strong><br>10:00 – 18:00<br><br>📞 +54 385 400 0000");
          setTimeout(() => setQuickReplies([{ text: "📅 Reservar cita", action: "book" }, { text: "📍 Ubicación", action: "location" }, { text: "🏠 Menú", action: "restart" }]), 300);
          break;
        case "prices": {
          let html = "<strong>Lista de Precios:</strong><br><br>";
          SERVICES.forEach((s) => { html += `${s.icon} ${s.name} — <strong>${s.price}</strong><br>`; });
          html += "<br><small style=\"color:var(--text-muted)\">* Precios desde. Consultar opciones premium.</small>";
          addBotMsg(html);
          setTimeout(() => setQuickReplies([{ text: "📅 Reservar cita", action: "book" }, { text: "💬 Hablar con asesor", action: "advisor" }, { text: "🏠 Menú", action: "restart" }]), 300);
          break;
        }
        case "location":
          addBotMsg("<strong>Dónde encontrarnos:</strong><br><br>📍 <strong>Av. Belgrano 450</strong><br>Santiago del Estero, Argentina<br><br>🚌 Acceso en transporte urbano<br><br><a href=\"https://maps.google.com?q=Av+Belgrano+450+Santiago+del+Estero+Argentina\" target=\"_blank\" style=\"color:var(--gold)\">Ver en Google Maps →</a>");
          setTimeout(() => setQuickReplies([{ text: "📅 Reservar cita", action: "book" }, { text: "🕐 Horarios", action: "hours" }, { text: "🏠 Menú", action: "restart" }]), 300);
          break;
        case "advisor":
          addBotMsg("Conectándote con un asesor... 💬<br><br><a href=\"https://wa.me/543854000000\" target=\"_blank\" style=\"display:inline-block;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;padding:10px 20px;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:1px;margin-top:8px\">💬 WhatsApp Directo</a><br><br>📞 +54 385 400 0000");
          setTimeout(() => setQuickReplies([{ text: "📅 Reservar cita", action: "book" }, { text: "🏠 Menú", action: "restart" }]), 300);
          break;
        case "select_service":
          bookingRef.current.service = value || "";
          continueBooking("service");
          break;
        case "select_date": {
          const [iso, label] = (value || "").split("|");
          bookingRef.current.dateISO = iso;
          bookingRef.current.dateLabel = label;
          continueBooking("date");
          break;
        }
        case "select_time":
          bookingRef.current.time = value || "";
          continueBooking("time");
          break;
        case "scroll_booking":
          setChatOpen(false);
          document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
          break;
        case "restart":
          chatStateRef.current = "idle";
          bookingRef.current = {};
          chatHistoryRef.current = [];
          addBotMsg("¿En qué más puedo ayudarte? ✦");
          setTimeout(() => setQuickReplies([
            { text: "📅 Reservar cita", action: "book" },
            { text: "💆 Ver servicios", action: "services" },
            { text: "🕐 Horarios", action: "hours" },
            { text: "💰 Precios", action: "prices" },
            { text: "📍 Ubicación", action: "location" },
          ]), 300);
          break;
      }
    }, 900);
  }, [addBotMsg, continueBooking, hideTyping, showTyping, startBooking]);

  // ── Handle quick reply click ───────────────────────────────────────
  const handleQR = useCallback((opt: QuickReply) => {
    addUserMsg(opt.text);
    setQuickReplies([]);
    processAction(opt.action, opt.value);
  }, [addUserMsg, processAction]);

  // ── Handle free-text send ──────────────────────────────────────────
  const sendUserMessage = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    addUserMsg(text);
    setQuickReplies([]);

    callAI(text);
  }, [addUserMsg, callAI, inputValue]);

  // ── Lightbox ───────────────────────────────────────────────────────
  const openLightbox = (i: number) => { setLightboxIndex(i); setLightboxActive(true); };
  const closeLightbox = () => setLightboxActive(false);
  const lbNav = (dir: number) => setLightboxIndex((i) => (i + dir + GALLERY_ALL_IMGS.length) % GALLERY_ALL_IMGS.length);

  // ── Booking form ───────────────────────────────────────────────────
  const [formSubmitting, setFormSubmitting] = useState(false);

  const submitBooking = async (e: { preventDefault(): void; target: EventTarget }) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const dateISO = fd.get("date") as string;
    const dateLabel = dateISO
      ? new Date(dateISO + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })
      : dateISO;
    const confirmNum = "LM-" + Math.floor(Math.random() * 9000 + 1000);
    setFormSubmitting(true);
    try {
      await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          service: fd.get("service"),
          dateISO,
          dateLabel,
          time: fd.get("time"),
          confirmNum,
        }),
      });
    } catch { /* show modal anyway */ }
    setFormSubmitting(false);
    setSuccessModalOpen(true);
    form.reset();
    setSvcSelected("");
    setCalSelected(null);
    setTimeSelected("");
  };

  return (
    <>
      <div id="cursor" className="cursor" />
      <div id="cursor-follower" className="cursor-follower" />
      <div id="scroll-progress" />

      {/* NAV */}
      <nav id="main-nav">
        <a href="https://lumuslabs.com" target="_blank" rel="noopener noreferrer" className={`nav-logo${logoClicked ? " logo-clicked" : ""}`} onClick={handleLogoClick}>LUM<span>US</span></a>
        <ul className="nav-links">
          <li><a href="#services">Servicios</a></li>
          <li><a href="#about">Nosotros</a></li>
          <li><a href="#team">Equipo</a></li>
          <li><a href="#gallery">Galería</a></li>
          <li><a href="#testimonials">Opiniones</a></li>
          <li><a href="#booking" className="btn-nav">Reservar Cita</a></li>
        </ul>
        <div className="hamburger" id="hamburger" onClick={() => setMobileMenuOpen((v) => !v)}>
          <span /><span /><span />
        </div>
      </nav>
      <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`}>
        <a href="#services" onClick={() => setMobileMenuOpen(false)}>Servicios</a>
        <a href="#about" onClick={() => setMobileMenuOpen(false)}>Nosotros</a>
        <a href="#team" onClick={() => setMobileMenuOpen(false)}>Equipo</a>
        <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Galería</a>
        <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Opiniones</a>
        <a href="#booking" onClick={() => setMobileMenuOpen(false)}>Reservar Cita</a>
      </div>

      {/* HERO */}
      <section id="hero">
        <div className="hero-bg" id="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-particles" id="particles" />
        <div className="hero-content">
          <p className="hero-eyebrow">Estética de Alta Gama · Santiago del Estero</p>
          <h1 className="hero-title">Donde la Belleza<br /><em>Encuentra su Esencia</em></h1>
          <p className="hero-sub">Rituales de belleza exclusivos que transforman cuerpo y mente. Una experiencia sensorial diseñada para ti.</p>
          <div className="hero-ctas">
            <a href="#booking" className="btn-primary">Reservar Ahora</a>
            <a href="#services" className="btn-outline">Ver Servicios</a>
          </div>
        </div>
        <div className="hero-scroll">
          <span>Descubrir</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* SERVICES */}
      <section id="services">
        <div className="services-header" data-aos="fade-up">
          <p className="section-label">Nuestros Tratamientos</p>
          <h2 className="section-title">Arte & <em>Bienestar</em></h2>
          <div className="section-divider" />
          <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto", lineHeight: "1.9" }}>
            Cada servicio es una obra de arte diseñada para realzar tu belleza natural con técnicas premium.
          </p>
        </div>
        <div className="services-grid">
          <div className="service-card" data-aos="fade-up" data-aos-delay="0">
            <svg className="service-icon" width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="14" stroke="currentColor" strokeWidth="1.2" /><circle cx="22" cy="22" r="7" stroke="currentColor" strokeWidth="1.2" />
              <line x1="22" y1="2" x2="22" y2="8" stroke="currentColor" strokeWidth="1.2" /><line x1="22" y1="36" x2="22" y2="42" stroke="currentColor" strokeWidth="1.2" />
              <line x1="2" y1="22" x2="8" y2="22" stroke="currentColor" strokeWidth="1.2" /><line x1="36" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <h3 className="service-name">Rejuvenecimiento Facial</h3>
            <p className="service-desc">Tratamientos faciales con tecnología de última generación. Hidratación profunda, lifting sin cirugía y luminosidad excepcional.</p>
            <p className="service-price">Desde <strong>$ 85.000</strong></p>
          </div>
          <div className="service-card" data-aos="fade-up" data-aos-delay="80">
            <svg className="service-icon" width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M8 36 C12 28, 20 24, 28 20 C34 16, 38 10, 36 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M14 38 C18 30, 26 26, 34 22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
              <circle cx="36" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="36" r="3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <h3 className="service-name">Masaje Terapéutico</h3>
            <p className="service-desc">Desde masajes relajantes hasta terapéuticos con piedras calientes y aceites esenciales de origen botánico.</p>
            <p className="service-price">Desde <strong>$ 70.000</strong></p>
          </div>
          <div className="service-card" data-aos="fade-up" data-aos-delay="160">
            <svg className="service-icon" width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect x="14" y="6" width="16" height="32" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <line x1="14" y1="22" x2="30" y2="22" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="22" cy="14" r="2" fill="currentColor" opacity=".6" /><circle cx="22" cy="30" r="2" fill="currentColor" opacity=".6" />
            </svg>
            <h3 className="service-name">Nail Art Studio</h3>
            <p className="service-desc">Arte en tus manos. Diseños personalizados, semipermanente, extensiones y tratamientos de uñas con productos premium.</p>
            <p className="service-price">Desde <strong>$ 35.000</strong></p>
          </div>
          <div className="service-card" data-aos="fade-up" data-aos-delay="0">
            <svg className="service-icon" width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M22 8 C14 10, 8 16, 10 24 C12 32, 20 36, 28 34 C36 32, 40 24, 36 18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M28 8 L36 8 L36 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="22" cy="22" r="4" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <h3 className="service-name">Hair & Color</h3>
            <p className="service-desc">Coloración profesional, mechas, balayage y tratamientos capilares de recuperación con las mejores marcas del mercado.</p>
            <p className="service-price">Desde <strong>$ 60.000</strong></p>
          </div>
          <div className="service-card" data-aos="fade-up" data-aos-delay="80">
            <svg className="service-icon" width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M12 12 L32 32" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M12 20 L24 32" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
              <path d="M20 12 L32 24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
              <rect x="8" y="8" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <rect x="22" y="22" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <h3 className="service-name">Depilación & Threading</h3>
            <p className="service-desc">Técnicas de depilación láser, cera y threading para un resultado suave y duradero. Piel perfectamente cuidada.</p>
            <p className="service-price">Desde <strong>$ 25.000</strong></p>
          </div>
          <div className="service-card" data-aos="fade-up" data-aos-delay="160">
            <svg className="service-icon" width="44" height="44" viewBox="0 0 44 44" fill="none">
              <ellipse cx="22" cy="26" rx="14" ry="10" stroke="currentColor" strokeWidth="1.2" />
              <path d="M14 20 C14 14, 30 14, 30 20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M18 12 C18 8, 26 8, 26 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
            </svg>
            <h3 className="service-name">Tratamientos Corporales</h3>
            <p className="service-desc">Envolturas, exfoliaciones, reducción de medidas y drenaje linfático para una silueta perfecta y una piel radiante.</p>
            <p className="service-price">Desde <strong>$ 90.000</strong></p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section-pad">
        <div className="about-grid">
          <div className="about-text" data-aos="fade-right">
            <p className="section-label">Nuestra Historia</p>
            <h2 className="section-title">Pasión por la<br /><em>Excelencia</em></h2>
            <div className="section-divider" />
            <p>LUMUS nació en 2016 con una visión clara: crear un espacio donde la belleza y el bienestar se encuentran en perfecta armonía. Nuestro equipo de especialistas, formados en las mejores academias de Europa, trabaja con dedicación para ofrecerte resultados excepcionales.</p>
            <p>Usamos exclusivamente marcas premium y técnicas de vanguardia para garantizar que cada visita sea una experiencia transformadora. No somos solo una estética, somos tu ritual de autocuidado.</p>
            <div className="about-stats">
              <div className="stat-item"><span className="stat-number" data-target="500">0</span><span className="stat-label">Clientes Felices</span></div>
              <div className="stat-item"><span className="stat-number" data-target="8">0</span><span className="stat-label">Años de Excelencia</span></div>
              <div className="stat-item"><span className="stat-number" data-target="15">0</span><span className="stat-label">Expertos</span></div>
            </div>
          </div>
          <div className="about-image" data-aos="fade-left">
            <div className="about-img-main">
              <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80" alt="LUMUS Estética interior" />
            </div>
            <div className="about-badge"><span>N°1</span><span>Sgo. Estero</span></div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team">
        <div className="section-pad">
          <div className="team-header" data-aos="fade-up">
            <p className="section-label">Nuestros Especialistas</p>
            <h2 className="section-title">El Equipo <em>LUMUS</em></h2>
            <div className="section-divider" />
          </div>
          <div className="team-grid">
            {[
              { name: "Sofía Martínez", role: "Directora & Facial Expert", bio: "12 años de experiencia en tratamientos faciales premium. Certificada en Paris y Londres en técnicas de rejuvenecimiento.", img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80" },
              { name: "Elena Ruiz", role: "Masaje & Bienestar", bio: "Terapeuta holística con especialización en técnicas orientales y drenaje linfático. Tu aliada en el camino al equilibrio.", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80" },
              { name: "Carmen López", role: "Nail Artist & Color", bio: "Artista de uñas con más de 200 diseños exclusivos. Especializada en nail art geométrico y técnicas japonesas.", img: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&q=80" },
              { name: "Isabella Torres", role: "Colorista & Estilista", bio: "Colorista senior formada en la Escuela Vidal Sassoon. Especialista en balayage y técnicas de coloración orgánica.", img: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&q=80" },
            ].map((member, i) => (
              <div className="team-card" data-aos="fade-up" data-aos-delay={String(i * 100)} key={member.name}>
                <div className="team-photo-wrap">
                  <img className="team-photo" src={member.img} alt={member.name} />
                  <div className="team-overlay" />
                </div>
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-bio">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery">
        <div className="section-pad">
          <div className="gallery-header" data-aos="fade-up">
            <p className="section-label">Nuestro Trabajo</p>
            <h2 className="section-title">La <em>Galería</em> LUMUS</h2>
            <div className="section-divider" />
          </div>
          <div className="gallery-services-grid">
            {(() => {
              let flatIdx = 0;
              return GALLERY_SERVICES.map((service, si) => (
                <div className="gallery-service-col" key={service.label} data-aos="fade-up" data-aos-delay={String(si * 80)}>
                  <p className="gallery-service-label">{service.label}</p>
                  {service.imgs.map((img) => {
                    const idx = flatIdx++;
                    return (
                      <div className="gallery-item" key={img.src} onClick={() => openLightbox(idx)}>
                        <img src={img.src} alt={img.alt} />
                        <div className="gallery-item-overlay">
                          <div className="gallery-zoom">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="M11 8v6M8 11h6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <div id="lightbox" className={lightboxActive ? "active" : ""} onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}>
        <button className="lb-close" onClick={closeLightbox}>×</button>
        <button className="lb-prev" onClick={() => lbNav(-1)}>‹</button>
        <img src={GALLERY_ALL_IMGS[lightboxIndex]} alt="Gallery" />
        <button className="lb-next" onClick={() => lbNav(1)}>›</button>
      </div>

      {/* TESTIMONIALS */}
      <section id="testimonials">
        <div className="section-pad">
          <div className="test-header" data-aos="fade-up">
            <p className="section-label">Lo Que Dicen</p>
            <h2 className="section-title">Clientes <em>Satisfechos</em></h2>
            <div className="section-divider" />
          </div>
          <div className="test-carousel" data-aos="fade-up" data-aos-delay="100">
            <div className="test-track">
              {[
                { quote: '"La experiencia en LUMUS es absolutamente incomparable. Sofía transformó mi piel en solo una sesión. Nunca me había sentido tan bella y cuidada. Es mi lugar de retiro cada mes."', name: "Ana García", service: "Rejuvenecimiento Facial", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" },
                { quote: '"El masaje con piedras calientes fue una experiencia mística. Elena tiene manos mágicas y la ambientación del salón es de otro nivel. Volveré sin duda."', name: "María Fernández", service: "Masaje Terapéutico", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80" },
                { quote: '"Carmen es una artista. Vine con una foto de inspiración y superó todas mis expectativas. El nail art que me hizo fue increíble. Todo el mundo me pregunta dónde me las hago."', name: "Lucía Moreno", service: "Nail Art Studio", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80" },
                { quote: '"El balayage que me hizo Isabella es lo mejor que me han hecho en el pelo en toda mi vida. Natural, luminoso, perfecto. Y el ambiente de LUMUS es absolutamente lujoso."', name: "Patricia Jiménez", service: "Hair & Color", img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&q=80" },
                { quote: '"Me hice el tratamiento corporal completo y perdí 3 cm de cintura en una sesión. El equipo es profesional, amable y los productos que usan son de calidad premium."', name: "Beatriz Sánchez", service: "Tratamiento Corporal", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&q=80" },
              ].map((t, i) => (
                <div className={`test-slide${i === 0 ? " active" : ""}`} key={i}>
                  <div className="test-stars">★★★★★</div>
                  <p className="test-quote">{t.quote}</p>
                  <div className="test-author">
                    <img className="test-avatar" src={t.img} alt={t.name} />
                    <div><div className="test-name">{t.name}</div><div className="test-service">{t.service}</div></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="test-dots">
              {[0, 1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  className={`test-dot${i === 0 ? " active" : ""}`}
                  onClick={() => (window as typeof window & { goToSlide: (n: number) => void }).goToSlide?.(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking">
        <div className="section-pad">
          <div className="booking-inner">
            <p className="section-label" data-aos="fade-up">Agenda Tu Cita</p>
            <h2 className="section-title" data-aos="fade-up" data-aos-delay="50">Reserva Tu Momento<br />de <em>Bienestar</em></h2>
            <div className="section-divider" data-aos="fade-up" data-aos-delay="100" style={{ margin: "24px auto" }} />
            <p data-aos="fade-up" data-aos-delay="150">Completa el formulario y uno de nuestros especialistas confirmará tu reserva en menos de 2 horas.</p>
            <form className="booking-form" onSubmit={submitBooking} data-aos="fade-up" data-aos-delay="200">
              <div className="form-group"><label>Nombre Completo</label><input name="name" type="text" placeholder="Tu nombre" required /></div>
              <div className="form-group"><label>Teléfono</label><input name="phone" type="tel" placeholder="+34 600 000 000" required /></div>
              <div className="form-group"><label>Email</label><input name="email" type="email" placeholder="tu@email.com" required /></div>
              <div className="form-group" style={{ position: "relative" }} ref={svcRef}>
                <label>Servicio</label>
                <input type="hidden" name="service" value={svcSelected} required />
                <button
                  type="button"
                  className={`cal-trigger${svcSelected ? " cal-trigger--selected" : ""}`}
                  onClick={() => { setSvcOpen(o => !o); setCalOpen(false); setTimeOpen(false); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  <span>{svcSelected || "Seleccionar servicio..."}</span>
                  <svg style={{ marginLeft: "auto" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {svcOpen && (
                  <div className="svc-dropdown">
                    {SERVICES.map(s => (
                      <button
                        key={s.name}
                        type="button"
                        className={`svc-option${svcSelected === s.name ? " svc-option--selected" : ""}`}
                        onClick={() => { setSvcSelected(s.name); setSvcOpen(false); }}
                      >
                        <span className="svc-option-icon">{s.icon}</span>
                        <span className="svc-option-name">{s.name}</span>
                        <span className="svc-option-meta">{s.duration} · {s.price}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ position: "relative" }} ref={calRef}>
                <label>Fecha Preferida</label>
                <input type="hidden" name="date" value={calIsoValue} required />
                <button
                  type="button"
                  className={`cal-trigger${calSelected ? " cal-trigger--selected" : ""}`}
                  onClick={() => { setCalOpen(o => !o); setSvcOpen(false); setTimeOpen(false); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <span style={{ textTransform: calSelected ? "capitalize" : "none" }}>{calLabel}</span>
                </button>
                {calOpen && (
                  <div className="cal-dropdown">
                    <div className="cal-header">
                      <button type="button" className="cal-nav" onClick={calPrevMonth}>‹</button>
                      <span className="cal-month-label">{CAL_MONTHS[calView.getMonth()]} {calView.getFullYear()}</span>
                      <button type="button" className="cal-nav" onClick={calNextMonth}>›</button>
                    </div>
                    <div className="cal-grid">
                      {CAL_DAYS_HDR.map(d => <span key={d} className="cal-day-hdr">{d}</span>)}
                      {calDays.map((day, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`cal-day${!day ? " cal-day--empty" : ""}${day && calIsPast(day) ? " cal-day--past" : ""}${day && calIsToday(day) ? " cal-day--today" : ""}${day && calIsSelected(day) ? " cal-day--selected" : ""}`}
                          onClick={() => day && !calIsPast(day) && calSelectDay(day)}
                          disabled={!day || calIsPast(day)}
                        >
                          {day ?? ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group" style={{ position: "relative" }} ref={timeRef}>
                <label>Hora Preferida</label>
                <input type="hidden" name="time" value={timeSelected} required />
                <button
                  type="button"
                  className={`cal-trigger${timeSelected ? " cal-trigger--selected" : ""}`}
                  onClick={() => { setTimeOpen(o => !o); setSvcOpen(false); setCalOpen(false); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>{timeSelected || "Seleccionar hora..."}</span>
                  <svg style={{ marginLeft: "auto" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {timeOpen && (
                  <div className="time-dropdown">
                    {["09:00","10:30","12:00","15:00","17:00","19:00"].map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`time-slot-btn${timeSelected === t ? " time-slot-btn--selected" : ""}`}
                        onClick={() => { setTimeSelected(t); setTimeOpen(false); }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group full"><label>Notas Adicionales</label><input type="text" placeholder="Alergias, preferencias especiales..." /></div>
              <div className="form-group full"><button type="submit" className="btn-primary" disabled={formSubmitting}>{formSubmitting ? "Enviando..." : "Confirmar Reserva"}</button></div>
            </form>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      <div id="success-modal" className={successModalOpen ? "active" : ""}>
        <div className="modal-box">
          <div className="modal-icon">✦</div>
          <h3>¡Reserva Confirmada!</h3>
          <p>Hemos recibido tu solicitud. Recibirás una confirmación por email y nuestro equipo te contactará en menos de 2 horas.</p>
          <button className="modal-close" onClick={() => setSuccessModalOpen(false)}>Entendido</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="https://lumuslabs.com" target="_blank" rel="noopener noreferrer" className="nav-logo">LUM<span>US</span></a>
            <p>Estética de alta gama en el corazón de Santiago del Estero. Tu bienestar es nuestra pasión desde 2016.</p>
            <div className="social-links">
              <a href="https://instagram.com/lumuslabs" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="https://instagram.com/lumuslabs" target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
              <a href="https://wa.me/5493855067240" target="_blank" rel="noopener noreferrer" className="social-link" title="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Servicios</h4>
            <ul>
              {["Facial","Masajes","Nail Art","Hair & Color","Depilación","Corporales"].map((s) => <li key={s}><a href="#services">{s}</a></li>)}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Horarios</h4>
            <p>Lunes – Sábado<br />9:00 – 20:00</p>
            <p style={{ marginTop: "12px" }}>Domingo<br />10:00 – 18:00</p>
            <p style={{ marginTop: "16px", color: "var(--gold)", fontSize: "12px" }}>+54 385 400 0000</p>
            <p style={{ color: "var(--gold)", fontSize: "12px" }}>lumus@estetica.com.ar</p>
          </div>
          <div className="footer-col">
            <h4>Newsletter</h4>
            <p style={{ marginBottom: "0" }}>Recibe ofertas exclusivas y consejos de belleza.</p>
            <div className="newsletter-form">
              <input type="email" placeholder="tu@email.com" />
              <button type="button">→</button>
            </div>
            <p style={{ marginTop: "16px", fontSize: "11px" }}>Av. Belgrano 450<br />Santiago del Estero, Argentina</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2024 LUMUS Estética. Todos los derechos reservados.</span>
          <span>Hecho con ♥ por LumusLabs</span>
        </div>
      </footer>

      {/* WHATSAPP BUTTON */}
      <a
        id="whatsapp-btn"
        href="https://wa.me/5493855067240"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className={wppClicked ? "wpp-clicked" : ""}
        onClick={handleWppClick}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* CHATBOT BUTTON */}
      <button id="chat-btn" onClick={toggleChat} aria-label="Abrir chat">
        {!chatOpen ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
        {chatBadgeVisible && <div className="chat-badge">1</div>}
      </button>

      {/* CHAT WINDOW */}
      <div id="chat-window" className={chatOpen ? "open" : ""}>
        <div className="chat-header">
          <div className="chat-avatar">L</div>
          <div className="chat-header-info">
            <div className="chat-header-name">LUMUS Asistente</div>
            <div className="chat-status"><span className="status-dot" /> En línea ahora</div>
          </div>
          <button className="chat-close" onClick={toggleChat}>×</button>
        </div>

        <div className="chat-messages" id="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.type}`}>
              <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: msg.html }} />
              <div className="msg-time">{msg.time}</div>
            </div>
          ))}
          {typingVisible && (
            <div className="typing-indicator show">
              <div className="typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {quickReplies.length > 0 && (
          <div className="quick-replies">
            {quickReplies.map((qr, i) => (
              <button key={i} className="qr-btn" onClick={() => handleQR(qr)}>{qr.text}</button>
            ))}
          </div>
        )}

        <div className="chat-input-area">
          <input
            ref={inputRef}
            type="text"
            id="chat-input"
            placeholder="Escribe tu mensaje..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendUserMessage(); }}
          />
          <button id="chat-send" onClick={sendUserMessage}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
