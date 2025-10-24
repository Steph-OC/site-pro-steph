// src/components/HeroDevices.tsx
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

type Props = {
  intensity?: number; // force du parallax (px)
  tilt?: number; // tilt max au survol (deg)
  zDepth?: number; // profondeur 3D (px)
  screenshots?: {
    laptop: string; // URL capture laptop
    tablet: string; // URL capture tablet
    phone: string; // URL capture phone
  };
};

export default function HeroDevices({
  intensity = 40,
  tilt = 4,
  zDepth = 260,
  screenshots = {
    laptop: "/images/mock-home.webp",
    tablet: "/images/mock-services.webp",
    phone: "/images/mock-badges.webp",
  },
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // parallax local à la zone
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const p1 = useTransform(
    scrollYProgress,
    [0, 1],
    [reduce ? 0 : intensity, reduce ? 0 : -intensity]
  );
  const p2 = useTransform(
    scrollYProgress,
    [0, 1],
    [reduce ? 0 : intensity * 0.6, reduce ? 0 : -intensity * 0.6]
  );
  const p3 = useTransform(
    scrollYProgress,
    [0, 1],
    [reduce ? 0 : intensity * 1.1, reduce ? 0 : -intensity * 1.1]
  );

  // util hover tilt
  const hover = reduce
    ? {}
    : {
        rotateX: -tilt,
        rotateY: tilt,
        transition: { type: "spring", stiffness: 120, damping: 14 },
      };

  return (
    <div
      ref={ref}
      className="hero-devices"
      aria-hidden="true"
      style={{
        perspective: 1000,
        position: "relative",
        height: "min(48vw, 520px)",
      }}
    >
      {/* Laptop */}
      <motion.div
        className="device device--laptop"
        style={{ translateY: p1, translateZ: zDepth * 0.2 }}
      >
        <motion.div className="shell" whileHover={hover}>
          <svg
            viewBox="0 0 900 560"
            className="frame"
            role="img"
            aria-label="Maquette laptop"
          >
            <rect
              x="30"
              y="20"
              width="840"
              height="520"
              rx="22"
              fill="var(--pc-surface)"
              stroke="var(--pc-contour)"
            />
            <rect
              x="56"
              y="46"
              width="788"
              height="472"
              rx="12"
              fill="var(--bg)"
            />
          </svg>
          <img
            className="screen"
            src={screenshots.laptop}
            loading="lazy"
            alt=""
          />
        </motion.div>
      </motion.div>

      {/* Tablet */}
      <motion.div
        className="device device--tablet"
        style={{ translateY: p2, translateZ: zDepth * 0.4 }}
      >
        <motion.div className="shell" whileHover={hover}>
          <svg
            viewBox="0 0 520 740"
            className="frame"
            role="img"
            aria-label="Maquette tablette"
          >
            <rect
              x="16"
              y="16"
              width="488"
              height="708"
              rx="36"
              fill="var(--pc-surface-2)"
              stroke="var(--pc-contour)"
            />
            <rect
              x="40"
              y="56"
              width="440"
              height="628"
              rx="22"
              fill="var(--bg)"
            />
            <circle cx="260" cy="36" r="6" fill="var(--pc-chrome)" />
          </svg>
          <img
            className="screen"
            src={screenshots.tablet}
            loading="lazy"
            alt=""
          />
        </motion.div>
      </motion.div>

      {/* Phone */}
      <motion.div
        className="device device--phone"
        style={{ translateY: p3, translateZ: zDepth * 0.6 }}
      >
        <motion.div className="shell" whileHover={hover}>
          <svg
            viewBox="0 0 340 700"
            className="frame"
            role="img"
            aria-label="Maquette smartphone"
          >
            <rect
              x="20"
              y="10"
              width="300"
              height="680"
              rx="40"
              fill="var(--pc-surface)"
              stroke="var(--pc-contour)"
            />
            <rect
              x="40"
              y="80"
              width="260"
              height="560"
              rx="26"
              fill="var(--bg)"
            />
            <rect
              x="120"
              y="38"
              width="100"
              height="14"
              rx="7"
              fill="var(--pc-chrome)"
            />
          </svg>
          <img
            className="screen"
            src={screenshots.phone}
            loading="lazy"
            alt=""
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
