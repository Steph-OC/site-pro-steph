// src/components/StaggerItem.jsx
import { motion, useReducedMotion } from "framer-motion";

/**
 * dir: "up" | "down" | "left" | "right" | "none"
 * distance: px ou "screen" (≈20vw) pour venir de hors écran
 */
export default function StaggerItem({
  children,
  dir = "up",
  distance = 24,
  duration = 0.45,
}) {
  const reduce = useReducedMotion();
  const useScreen = distance === "screen";
  const d = useScreen ? "20vw" : distance;

  const hidden = reduce
    ? { opacity: 1, x: 0, y: 0 }
    : {
        opacity: 0,
        x: dir === "left" ? (useScreen ? `-${d}` : -d) : dir === "right" ? (useScreen ? `${d}` : d) : 0,
        y: dir === "up" ? (useScreen ? `${d}` : d) : dir === "down" ? (useScreen ? `-${d}` : -d) : 0,
      };

  return (
    <motion.div
      variants={{
        hidden,
        show: { opacity: 1, x: 0, y: 0, transition: { duration, ease: "easeOut" } },
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
