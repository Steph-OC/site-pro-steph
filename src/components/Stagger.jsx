// src/components/Stagger.jsx
import { motion, useReducedMotion } from "framer-motion";

export default function Stagger({
  children,
  once = true,
  amount = 0.25,     // % de l'élément visible pour déclencher
  gap = 0.08,        // délai automatique entre enfants
  delay = 0,         // délai initial du parent
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount, margin: "0px 0px -10% 0px" }}
      variants={{
        hidden: {},
        show: {
          transition: reduce
            ? { delayChildren: 0, staggerChildren: 0 }
            : { delayChildren: delay, staggerChildren: gap },
        },
      }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
