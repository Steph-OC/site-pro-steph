import React, { useRef, useEffect } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useAnimation,
  type Variants,
} from "framer-motion";

/* =============================
   1) Reveal — entrée simple
   ============================= */
export type Dir = "left" | "right" | "up" | "down";

type RevealProps = {
  children: React.ReactNode;
  direction?: Dir;
  distance?: number; // px
  delay?: number; // s
  className?: string;
  once?: boolean; // true = ne joue qu'une fois
  amount?: number; // 0..1, % visible pour déclencher
};

export function Reveal({
  children,
  direction = "left",
  distance = 60,
  delay = 0,
  className,
  once = true,
  amount = 0.12,
}: RevealProps) {
  const reduce = useReducedMotion();

  const axis =
    direction === "left"
      ? { x: -distance }
      : direction === "right"
        ? { x: distance }
        : direction === "up"
          ? { y: -distance }
          : { y: distance };

  const initial = reduce ? { opacity: 1 } : { opacity: 0, ...axis };
  const animate = { opacity: 1, x: 0, y: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={animate}
      viewport={{ once, amount }}
      transition={{
        duration: reduce ? 0 : 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: "transform,opacity" }}
    >
      {children}
    </motion.div>
  );
}

/* =============================
   2) RevealGroup — cascade/stagger
   ============================= */
type MotionTag = "div" | "section" | "ul" | "li" | "h2" | "h3" | "p" | "span";
const M = {
  div: motion.div,
  section: motion.section,
  ul: motion.ul,
  li: motion.li,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
} as const;

export type RevealGroupProps = {
  as?: MotionTag;
  children: React.ReactNode;
  dir?: Dir;
  delay?: number;
  cascade?: boolean;
  className?: string;
  amount?: number; // threshold 0..1
  once?: boolean; // true = ne joue qu'une fois
  rootMargin?: string; // ex: "0px 0px -20% 0px"
};

const OFFSETS: Record<Dir, [number, number]> = {
  up: [16, 0],
  down: [-16, 0],
  left: [0, 16],
  right: [0, -16],
};

export function RevealGroup({
  as = "div",
  children,
  dir = "up",
  delay = 0,
  cascade = true,
  className,
  amount = 0.15,
  once = true,
  rootMargin = "0px 0px -3% 0px",
}: RevealGroupProps) {
  const reduce = useReducedMotion();
  const controls = useAnimation();
  const ref = useRef<HTMLElement | null>(null);
  const [y, x] = OFFSETS[dir];

  const parent: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08 } },
  };
  const child: Variants = {
    hidden: { opacity: 0, y, x },
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: reduce ? 0 : 0.45,
        ease: [0.22, 0.8, 0.2, 1],
        delay,
      },
    },
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // déclenche si déjà dans le viewport au mount
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top <= vh * 1.0 && rect.bottom >= 0) controls.start("show");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start("show");
          if (once) observer.disconnect();
        } else if (!once) {
          controls.start("hidden");
        }
      },
      { root: null, rootMargin, threshold: amount }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [controls, amount, once, rootMargin]);

  const Tag = M[as];

  const inner = cascade ? (
    React.Children.map(children, (c, i) => (
      <motion.div
        key={i}
        variants={child}
        style={{ willChange: "transform,opacity" }}
      >
        {c}
      </motion.div>
    ))
  ) : (
    <motion.div variants={child} style={{ willChange: "transform,opacity" }}>
      {children}
    </motion.div>
  );

  return (
    <Tag
      ref={ref as any}
      className={className}
      initial="hidden"
      animate={controls}
      variants={parent}
      style={{ willChange: "transform,opacity" }}
    >
      {inner}
    </Tag>
  );
}

/* =============================
   3) Spectacle — rail/parallax 3D
   ============================= */
/* Headless: tu peux passer tes propres classes. Fournit un
   minimum de styles inline si tu ne passes pas de classes. */

export type SpectacleCard = {
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string; // accent de la carte & curseur
};

type SpectacleProps = {
  cards: SpectacleCard[];
  className?: string; // conteneur principal (section)
  stageClassName?: string; // rail 3D
  bgClassName?: string; // “blob” de fond
};

export function Spectacle({
  cards,
  className,
  stageClassName,
  bgClassName,
}: SpectacleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rot = useTransform(scrollYProgress, [0, 0.5, 1], [-12, 0, 12]);
  const zParallax = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.4]);

  return (
    <section
      ref={ref}
      className={className}
      aria-label="Showcase au scroll"
      style={{
        position: "relative",
        overflow: "visible",
        paddingBlock: "min(10vh, 120px)",
      }}
    >
      {/* Fond “blob” parallax */}
      <motion.div
        aria-hidden
        className={bgClassName}
        style={{
          position: "absolute",
          inset: "-10% -5% auto -5%",
          height: "60vh",
          borderRadius: "999px",
          background:
            "radial-gradient(50% 50% at 30% 40%, color-mix(in srgb, var(--orange) 20%, transparent) 0%, transparent 70%), radial-gradient(40% 40% at 70% 30%, color-mix(in srgb, var(--green) 22%, transparent) 0%, transparent 70%)",
          zIndex: 0,
          scale: reduce ? 1 : bgScale,
          translateY: reduce ? 0 : zParallax,
          filter: "blur(20px) saturate(110%)",
        }}
      />

      {/* Rail 3D */}
      <motion.div
        className={stageClassName}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "clamp(12px, 2vw, 18px)",
          transformStyle: "preserve-3d",
          rotateZ: reduce ? 0 : rot,
          zIndex: 1,
        }}
      >
        {cards.map((c, i) => {
          const start = i / cards.length;
          const end = start + 0.6;
          const p = useTransform(scrollYProgress, [start, end], [0, 1], {
            clamp: false,
          });

          const rY = reduce ? 0 : useTransform(p, [0, 1], [-18, 18]);
          const rX = reduce ? 0 : useTransform(p, [0, 1], [6, -6]);
          const tZ = reduce ? 0 : useTransform(p, [0, 0.5, 1], [-140, 0, -60]);
          const tY = reduce ? 0 : useTransform(p, [0, 1], [40, -40]);
          const scale = reduce
            ? 1
            : useTransform(p, [0, 0.5, 1], [0.86, 1, 0.94]);

          const Icon = c.icon;

          return (
            <motion.article
              key={c.title}
              className="cursor-hover-item"
              data-cursor-text={c.title.toUpperCase()}
              data-cursor-text-repeat="5"
              data-cursor-color={c.color}
              style={{
                rotateY: rY,
                rotateX: rX,
                translateZ: tZ,
                translateY: tY,
                scale,
                border: "1px solid var(--border)",
                background: "var(--card)",
                borderRadius: 14,
                padding: "clamp(12px, 2vw, 18px)",
                boxShadow: "var(--shadow)",
                willChange: "transform",
              }}
            >
              <div
                style={{
                  color: c.color,
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 10,
                }}
              >
                <Icon />
              </div>
              <h3 style={{ margin: "6px 0 6px", fontWeight: 700 }}>
                {c.title}
              </h3>
              <p className="muted" style={{ margin: 0 }}>
                {c.desc}
              </p>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}

/* =============================
   Export par défaut pratique
   ============================= */
export default { Reveal, RevealGroup, Spectacle };
