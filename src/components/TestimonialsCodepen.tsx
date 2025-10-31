// src/components/TestimonialsCodepen.tsx
import type React from "react";
import { useEffect, useRef, useState, type SVGProps } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import "@/styles/testimonials-codepen.css";

export type Testimonial = {
  id: string | number;
  quote: string;
  full_name?: string;
  author?: string;
  role?: string;
  avatar?: string;
  source?: "google" | "linkedin";
  sourceUrl?: string;
};

type AvatarMode = "none" | "initials" | "generic" | "image";

type Props = {
  items: Testimonial[];
  speedMs?: number;
  autoplay?: boolean;
  avatarMode?: AvatarMode;
};

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

/* ---------- Logos officiels ---------- */
function GoogleLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path
        fill="#FBBC05"
        d="M43.6 20.1H24v7.9h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.6C33.8 6 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#EA4335"
        d="M6.3 14.7l6.6 4.8C14.7 16.4 19 14 24 14c3.1 0 5.8 1.1 7.9 3l5.7-5.6C33.8 6 29.1 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.5 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5c3.3 6.4 10 10.9 17.8 10.9z"
      />
      <path
        fill="#4285F4"
        d="M43.6 20.1H24v7.9h11.3c-1.4 4-5.2 6.9-9.9 6.9-1.8 0-3.5-.5-5-1.3l-6.5 5C16.2 39.5 20 41 24 41c9.9 0 18-8.1 18-18 0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}
function LinkedinLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <circle cx="6.5" cy="7" r="1.3" fill="#fff" />
      <rect x="5.4" y="9" width="2.2" height="9" rx="1.1" fill="#fff" />
      <path
        fill="#fff"
        d="M18.7 18h-2.2v-4.7c0-1.4-.6-2.1-1.6-2.1-1 0-1.7.7-1.7 2.1V18h-2.2V9h2.1v1c.5-.7 1.3-1.2 2.5-1.2 1.9 0 3.1 1.2 3.1 3.6V18z"
      />
    </svg>
  );
}

/* ---------- Initiales (fallback) ---------- */
function getInitials(name = "") {
  const cleaned = name
    .replace(/\(.*?\)|\[.*?]|<.*?>/g, "")
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'\-\u2011]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!cleaned) return "•";
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length === 1)
    return (words[0][0] + (words[0][1] || "")).toUpperCase();
  const first = words[0][0] || "";
  const lastParts = (words[words.length - 1] || "")
    .split(/[\-\u2011]/)
    .filter(Boolean);
  const last = (lastParts[0]?.[0] || "") + (lastParts[1]?.[0] || "");
  return (first + last).toUpperCase() || "•";
}

/* =========================
   Composant principal
   ========================= */
export default function TestimonialsCodepen({
  items,
  speedMs = 4500,
  autoplay = true,
  avatarMode = "initials",
}: Props) {
  const total = items?.length ?? 0;
  if (!items || total === 0) return null;

  const [current, setCurrent] = useState(0);

  // Autoplay + inView
  const intervalRef = useRef<number | null>(null);
  const paused = useRef(false);

  const prefersReduce = useReducedMotion();
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.01, // ← déclenche plus tard (~60% visible)
    rootMargin: "0px 0px -25% 0px",
    triggerOnce: true,
  });

  // racine pour gérer le clavier localement
  const rootRef = useRef<HTMLElement | null>(null);
  const setRefs = (node: HTMLElement | null) => {
    rootRef.current = node;
    inViewRef(node);
  };

  // gèle l’autoplay hors viewport
  useEffect(() => {
    paused.current = !inView;
  }, [inView]);

  const start = () => {
    if (!autoplay || total <= 1) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (!paused.current) setCurrent((c) => mod(c + 1, total));
    }, speedMs) as unknown as number;
  };
  const stop = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, speedMs, total]);

  // Gestion clavier locale (section)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCurrent((c) => mod(c - 1, total));
      start();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setCurrent((c) => mod(c + 1, total));
      start();
    }
  };

  const goto = (n: number) => setCurrent(() => mod(n, total));
  const prev = () => goto(current - 1);
  const next = () => goto(current + 1);

  /* ---------- Animations (wipe top→bottom + spring rebond) ---------- */
  // Wipe vertical via clip-path (ne déforme pas le contenu)
  const revealVariants = {
    hidden: {
      opacity: 0.001,
      clipPath: "inset(0% 0% 100% 0%)", // masqué depuis le bas -> visible du haut vers le bas
    },
    show: {
      opacity: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      transition: {
        duration: prefersReduce ? 0.28 : 0.55,
        ease: [0.22, 0.61, 0.36, 1],
        when: "beforeChildren", // d'abord le wipe, puis les enfants
        delayChildren: prefersReduce ? 0.02 : 0.12,
        staggerChildren: prefersReduce ? 0.04 : 0.1,
      },
    },
  } as const;

  const baseSpring = prefersReduce
    ? { type: "spring" as const, stiffness: 220, damping: 30, mass: 0.7 }
    : { type: "spring" as const, stiffness: 380, damping: 26, mass: 0.6 };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: prefersReduce ? 4 : 18,
      scale: prefersReduce ? 1 : 0.985,
    },
    show: { opacity: 1, y: 0, scale: 1, transition: { ...baseSpring } },
  } as const;

  /* ---------- Avatars ---------- */
  const renderAvatar = (displayName: string, t: Testimonial) => {
    if (avatarMode === "none") return null;

    if (avatarMode === "image" && t.avatar) {
      const img = (
        <img
          src={t.avatar}
          alt=""
          loading="lazy"
          style={{ width: 100, height: 100, borderRadius: "50%" }}
        />
      );
      return t.sourceUrl ? (
        <a
          href={t.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Voir l'avis à la source"
        >
          {img}
        </a>
      ) : (
        img
      );
    }

    if (t.source === "google" || t.source === "linkedin") {
      const isGoogle = t.source === "google";
      const logo = isGoogle ? (
        <GoogleLogo width={48} height={48} />
      ) : (
        <LinkedinLogo width={48} height={48} />
      );
      const badge = (
        <div
          className="t-avatar"
          aria-hidden="true"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,.25)",
            margin: "0 auto",
            color: "inherit",
          }}
          title={isGoogle ? "Avis Google" : "Avis LinkedIn"}
        >
          {logo}
        </div>
      );
      return t.sourceUrl ? (
        <a
          href={t.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Voir l'avis sur ${isGoogle ? "Google" : "LinkedIn"}`}
        >
          {badge}
        </a>
      ) : (
        badge
      );
    }

    if (avatarMode === "initials") {
      return (
        <div
          className="t-avatar t-avatar--initials"
          aria-hidden="true"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background:
              "color-mix(in srgb, var(--gray, #444) 20%, transparent)",
            color: "var(--fg, #eee)",
            border: "1px solid var(--border, #444)",
            fontFamily:
              "Inter, system-ui, -apple-system, Segoe UI, Arial, sans-serif",
            fontVariantLigatures: "none",
            letterSpacing: "0.02em",
            lineHeight: 1,
            fontWeight: 800,
            fontSize: "1.8rem",
            userSelect: "none",
            margin: "0 auto",
          }}
        >
          {getInitials(displayName)}
        </div>
      );
    }

    return (
      <div
        className="t-avatar t-avatar--generic"
        aria-hidden="true"
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "color-mix(in srgb, var(--gray, #444) 20%, transparent)",
          border: "1px solid var(--border, #444)",
          margin: "0 auto",
        }}
      />
    );
  };

  return (
    <motion.section
      id="testim"
      className="testim"
      aria-label="Témoignages"
      aria-roledescription="carousel"
      ref={setRefs}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setCurrent((c) => mod(c - 1, total));
          start();
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setCurrent((c) => mod(c + 1, total));
          start();
        }
      }}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
      onTouchEnd={() => (paused.current = false)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05, margin: "0px 0px -20% 0px" }} // déclenche plus tard
      transition={{ ...baseSpring }}
    >
      {/* Révélation du container du haut vers le bas */}
      <motion.div
        className="wrap"
        variants={revealVariants}
        style={{ willChange: "clip-path, opacity" }}
      >
        {/* Contenu interne avec rebond léger */}
        <motion.button
          variants={itemVariants}
          id="left-arrow"
          className="arrow left"
          aria-controls="testim-content"
          aria-keyshortcuts="ArrowLeft"
          aria-label="Témoignage précédent"
          onClick={() => {
            prev();
            start();
          }}
        >
          ‹
        </motion.button>

        <motion.button
          variants={itemVariants}
          id="right-arrow"
          className="arrow right"
          aria-controls="testim-content"
          aria-keyshortcuts="ArrowRight"
          aria-label="Témoignage suivant"
          onClick={() => {
            next();
            start();
          }}
        >
          ›
        </motion.button>

        <motion.div
          variants={itemVariants}
          id="testim-content"
          className="cont"
          role="region"
          aria-live="off"
        >
          {items.map((t, i) => {
            const displayName = (t.full_name || t.author || "").trim();
            const isActive = i === current;
            const cls = isActive
              ? "active"
              : i === mod(current - 1, total)
              ? "inactive"
              : "";
            const slideId = `slide-${t.id}`;

            return (
              <div
                key={t.id}
                id={slideId}
                role="group"
                aria-roledescription="slide"
                aria-label={`Témoignage ${i + 1} sur ${total}`}
                aria-hidden={!isActive}
                tabIndex={isActive ? 0 : -1}
                className={cls}
                style={{
                  position: isActive ? ("relative" as const) : undefined,
                }}
              >
                <div className="img">{renderAvatar(displayName, t)}</div>
                <h2>
                  {displayName}
                  {t.role ? ` — ${t.role}` : ""}
                </h2>
                <p>{t.quote}</p>
              </div>
            );
          })}
        </motion.div>

        <motion.ul
          variants={itemVariants}
          id="testim-dots"
          className="tc-dots"
          role="tablist"
          aria-label="Choisir un témoignage"
        >
          {items.map((t, i) => {
            const slideId = `slide-${t.id}`;
            const selected = i === current;
            return (
              <li key={i} role="presentation">
                <button
                  role="tab"
                  aria-controls={slideId}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  className={`tc-dot ${selected ? "active" : ""}`}
                  aria-label={`Aller au témoignage ${i + 1} sur ${total}`}
                  onClick={() => {
                    setCurrent(i);
                    start();
                  }}
                />
              </li>
            );
          })}
        </motion.ul>
      </motion.div>
    </motion.section>
  );
}
