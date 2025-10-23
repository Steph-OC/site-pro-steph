import { LazyMotion, domAnimation } from "framer-motion";
import React from "react";

/** À utiliser une seule fois par page qui contient des motions */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
