import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
  type TargetAndTransition,
} from "framer-motion";
import {
  Accessibility,
  Leaf,
  AlignLeft,
  Wrench,
  Shield,
  Gauge,
} from "lucide-react";
import "./BadgesMotion.css";

type Item = { label: string };
type Props = { items?: Item[] };

const DEFAULTS: Item[] = [
  { label: "Accessibilité" },
  { label: "Sobriété" },
  { label: "Lisibilité" },
  { label: "Maintenance" },
  { label: "Sécurité" },
  { label: "Performance" },
];

const key = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function getIcon(label: string) {
  switch (key(label)) {
    case "accessibilite":
      return Accessibility;
    case "sobriete":
      return Leaf;
    case "lisibilite":
      return AlignLeft;
    case "maintenance":
      return Wrench;
    case "securite":
      return Shield;
    case "performance":
      return Gauge;
    default:
      return Gauge;
  }
}

const colorByKey: Record<string, string> = {
  accessibilite: "#2C84DB",
  sobriete: "#EE8E48",
  lisibilite: "#D84A7D",
  maintenance: "#C13A2E",
  securite: "#7256C2",
  performance: "#148B7E",
};

export default function BadgesMotion({ items = DEFAULTS }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // 👉 Déclenche PLUS TÔT : zone de détection agrandie vers le bas,
  // et amount faible = 10% visible suffisent
  const inView = useInView(ref, {
    margin: "0px 0px 25% 0px", // +25% sous le viewport → déclenche avant d’arriver
    amount: 0.01, // 10% visibles suffisent
    once: true,
  });

  const STAGGER = prefersReduced ? 0 : 0.08;
  const CIRCLE_DUR = prefersReduced ? 0.2 : 0.8; // un chouia plus vif
  const LABEL_OFFSET = prefersReduced ? 0 : 0.3;

  const listVariants: Variants = {
    hidden: {},
    show: {
      transition: prefersReduced ? undefined : { staggerChildren: STAGGER },
    },
  };

  const circleVariants: Variants = prefersReduced
    ? {
        hidden: { opacity: 0, x: 0, y: 0 },
        show: { opacity: 1, x: 0, y: 0, transition: { duration: CIRCLE_DUR } },
      }
    : {
        hidden: { opacity: 0, x: "-60vw", y: -40, scale: 0.95, rotateZ: -4 },
        show: {
          opacity: 1,
          x: 0,
          y: [-24, 0, -14, 0, -6, 0],
          scale: [0.95, 1, 1, 1, 1, 1],
          rotateZ: [-4, 0, 0, 0, 0, 0],
          transition: {
            times: [0, 0.55, 0.72, 0.85, 0.93, 1],
            duration: CIRCLE_DUR,
            ease: ["easeOut", "easeInOut", "easeOut", "easeInOut", "easeOut"],
          },
        },
      };

  const hoverBounce: TargetAndTransition = prefersReduced
    ? {
        y: [-4, 0],
        scale: [1.0, 1.0],
        transition: { duration: 0.25, ease: "easeOut" },
      }
    : {
        y: [-10, 0, -6, 0, -3, 0],
        scale: [1.0, 1.0, 1.02, 1.0, 1.01, 1.0],
        transition: {
          duration: 0.6,
          times: [0, 0.35, 0.55, 0.75, 0.9, 1],
          ease: ["easeOut", "easeInOut", "easeOut", "easeInOut", "easeOut"],
        },
      };

  const labelVariants: Variants = prefersReduced
    ? {
        hidden: { opacity: 0, y: 0 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.2, delay: CIRCLE_DUR + LABEL_OFFSET },
        },
      }
    : {
        hidden: { opacity: 0, y: 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 320,
            damping: 26,
            delay: CIRCLE_DUR + LABEL_OFFSET,
          },
        },
      };

  return (
    <div
      className="hex-badges"
      ref={ref}
      style={{ ["--n" as any]: items.length } as React.CSSProperties}
    >
      <motion.ul
        className="row"
        role="list"
        variants={listVariants}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {items.map(({ label }) => {
          const cls = key(label);
          const Icon = getIcon(label);
          const color = colorByKey[cls] ?? "#333";

          return (
            <motion.li
              key={label}
              className={`badge cursor-hover-item ${cls}`}
              style={{ ["--icon" as any]: color } as any}
              title={label}
              data-cursor-text={label.toUpperCase()}
              data-cursor-text-repeat="6"
              data-cursor-color={color}
            >
              <motion.div
                className="circle"
                aria-hidden="true"
                variants={circleVariants}
                whileHover={hoverBounce}
                whileTap={{ scale: prefersReduced ? 0.99 : 0.98 }}
              >
                <Icon strokeWidth={2} />
              </motion.div>

              <motion.span
                className="badge__label"
                variants={labelVariants}
                style={{ color }}
              >
                {label}
              </motion.span>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
