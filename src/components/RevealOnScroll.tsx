import React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  distance?: number; // px de décalage initial
  delay?: number; // s
  className?: string;
};

export default function RevealOnScroll({
  children,
  direction = "left",
  distance = 60,
  delay = 0,
  className,
}: Props) {
  const reduce = useReducedMotion();

  const axis = (d: typeof direction) =>
    d === "left"
      ? { x: -distance }
      : d === "right"
      ? { x: distance }
      : d === "up"
      ? { y: -distance }
      : { y: distance };

  const initial = reduce ? { opacity: 1 } : { opacity: 0, ...axis(direction) };
  const animate = { opacity: 1, x: 0, y: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, amount: 0.3 }} // déclenche à ~30% visible, une seule fois
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
