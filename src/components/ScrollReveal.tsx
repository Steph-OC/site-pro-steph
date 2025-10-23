import React, { useEffect, useRef } from "react";
import { motion, useAnimation, useReducedMotion, type Variants } from "framer-motion";

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

type MotionTag = keyof typeof M;
type Dir = "up" | "down" | "left" | "right";

interface Props {
  as?: MotionTag;
  children: React.ReactNode;
  dir?: Dir;
  delay?: number;
  cascade?: boolean;
  className?: string;
  amount?: number;       // threshold 0..1
  once?: boolean;        // true = ne joue qu'une fois
  rootMargin?: string;   // ex: "0px 0px -20% 0px"
}

const offsets: Record<Dir, [number, number]> = {
  up: [16, 0], down: [-16, 0], left: [0, 16], right: [0, -16],
};

export default function ScrollReveal({
  as = "div",
  children,
  dir = "up",
  delay = 0,
  cascade = false,
  className,
  amount = 0.25,
  once = true,
  rootMargin = "0px 0px -15% 0px",
}: Props) {
  const reduce = useReducedMotion();
  const controls = useAnimation();
  const ref = useRef<HTMLElement | null>(null);
  const [y, x] = offsets[dir];

  const parent: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } };
  const child: Variants = {
    hidden: { opacity: 0, y, x },
    show: {
      opacity: 1, y: 0, x: 0,
      transition: { duration: reduce ? 0 : 0.45, ease: [0.22, 0.8, 0.2, 1], delay },
    },
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top <= vh * 0.9 && rect.bottom >= 0) controls.start("show");

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

  const inner = cascade
    ? React.Children.map(children, (c) => (
        <motion.div variants={child} style={{ willChange: "transform,opacity" }}>{c}</motion.div>
      ))
    : <motion.div variants={child} style={{ willChange: "transform,opacity" }}>{children}</motion.div>;

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
