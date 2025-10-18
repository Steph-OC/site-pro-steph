// src/components/FadeIn.jsx
import { motion, useReducedMotion } from "framer-motion";

/**
 * dir: "left" | "right" | "up" | "down" | "none"
 * distance: nombre (px) ou "screen" (~20vw pour venir hors écran)
 */
export default function FadeIn({
  children,
  dir = "up",
  distance = 60,
  delay = 0,
  once = true,
  amount = 0.3,
  duration = 0.5,
  easing = "easeOut",
}) {
  const reduce = useReducedMotion();
  const useScreen = distance === "screen";
  const d = useScreen ? "20vw" : distance;

  const initial = reduce
    ? { opacity: 1, x: 0, y: 0 }
    : {
        opacity: 0,
        x: dir === "left" ? (useScreen ? `-${d}` : -d) : dir === "right" ? (useScreen ? `${d}` : d) : 0,
        y: dir === "up" ? (useScreen ? `${d}` : d) : dir === "down" ? (useScreen ? `-${d}` : -d) : 0,
      };

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount, margin: "0px 0px -10% 0px" }}
      transition={{ duration, ease: easing, delay }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
