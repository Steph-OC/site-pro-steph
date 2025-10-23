import styles from "./ScrollSpectacle.module.css";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import {
  Rocket,
  ShieldCheck,
  Accessibility as A11y,
  Gauge,
  Search,
  Zap,
} from "lucide-react";

type Card = {
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string; // couleur d’accent pour la carte & curseur
};

const CARDS: Card[] = [
  {
    title: "Performance",
    desc: "Pages légères, LCP & TTI serrés.",
    icon: Gauge,
    color: "#148B7E",
  },
  {
    title: "Accessibilité",
    desc: "Lecture confortable, clavier & ARIA.",
    icon: A11y,
    color: "#F3C94A",
  },
  {
    title: "SEO local",
    desc: "Balises clean, schema, vitesse.",
    icon: Search,
    color: "#D98A4D",
  },
  {
    title: "Sécurité",
    desc: "Mises à jour & durcissement.",
    icon: ShieldCheck,
    color: "#7256C2",
  },
  {
    title: "Vitesse",
    desc: "CDN, images, cache & minify.",
    icon: Zap,
    color: "#ee8e48",
  },
  {
    title: "WordPress sur mesure",
    desc: "Hooks, ACF, blocs & thèmes.",
    icon: Rocket,
    color: "#d84a7d",
  },
];

export default function ScrollSpectacle() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Progression du scroll sur la section
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"], // 0 quand la section entre, 1 quand elle sort
  });

  // Transformations globales
  const rot = useTransform(scrollYProgress, [0, 0.5, 1], [-12, 0, 12]); // rotation globale
  const zParallax = useTransform(scrollYProgress, [0, 1], [0, -120]); // léger “fly” vers le haut
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.4]); // blob de fond

  return (
    <section
      ref={ref}
      className={`${styles.spectacle} container container--xl`}
      aria-label="Showcase au scroll"
    >
      {/* Fond “blob” parallax */}
      <motion.div
        aria-hidden={true}
        className={styles.bg}
        style={{
          scale: prefersReduced ? 1 : bgScale,
          translateY: prefersReduced ? 0 : zParallax,
        }}
      />

      {/* Rail 3D */}
      <motion.div
        className={styles.stage}
        style={{
          rotateZ: prefersReduced ? 0 : rot,
          transformStyle: "preserve-3d",
        }}
      >
        {CARDS.map((c, i) => {
          // Chaque carte a sa propre orbite
          const start = i / CARDS.length;
          const end = start + 0.6; // fenêtre d’animation
          const p = useTransform(scrollYProgress, [start, end], [0, 1], {
            clamp: false,
          });

          const rY = prefersReduced ? 0 : useTransform(p, [0, 1], [-18, 18]); // oscillation Y
          const rX = prefersReduced ? 0 : useTransform(p, [0, 1], [6, -6]); // oscillation X
          const tZ = prefersReduced
            ? 0
            : useTransform(p, [0, 0.5, 1], [-140, 0, -60]); // approche/éloignement
          const tY = prefersReduced ? 0 : useTransform(p, [0, 1], [40, -40]); // drift vertical
          const scale = prefersReduced
            ? 1
            : useTransform(p, [0, 0.5, 1], [0.86, 1, 0.94]);

          return (
            <motion.article
              key={c.title}
              className={`${styles.card} cursor-hover-item`}
              data-cursor-text={c.title.toUpperCase()}
              data-cursor-text-repeat="5"
              data-cursor-color={c.color}
              style={{
                rotateY: rY,
                rotateX: rX,
                translateZ: tZ,
                translateY: tY,
                scale,
              }}
            >
              <div className={styles.icon} style={{ color: c.color }}>
                <c.icon />
              </div>
              <h3>{c.title}</h3>
              <p className="muted">{c.desc}</p>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
