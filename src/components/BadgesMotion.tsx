import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Accessibility,
  Leaf,
  AlignLeft,
  Wrench,
  Shield,
  Gauge,
} from "lucide-react";

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

// clé CSS (minuscules sans accents)
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
  const inView = useInView(ref, { margin: "-10% 0px -10% 0px", once: true });

  const listVariants: Variants = {
    hidden: {},
    show: {
      transition: prefersReduced ? undefined : { staggerChildren: 0.08 },
    },
  };

  // Rebond “balle” : on entre depuis la gauche, puis y rebondit en s’amortissant.
  const badgeVariants: Variants = prefersReduced
    ? {
        hidden: { opacity: 0, x: 0, y: 0 },
        show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.2 } },
      }
    : {
        hidden: { opacity: 0, x: "-60vw", y: -40, scale: 0.95, rotateZ: -4 },
        show: {
          opacity: 1,
          x: 0,
          // y keyframes = rebonds amortis (peut être ajusté)
          y: [-24, 0, -14, 0, -6, 0],
          scale: [0.95, 1, 1, 1, 1, 1],
          rotateZ: [-4, 0, 0, 0, 0, 0],
          transition: {
            // keyframes times = progression (0→1)
            times: [0, 0.55, 0.72, 0.85, 0.93, 1],
            duration: 0.95, // vitesse globale
            ease: ["easeOut", "easeInOut", "easeOut", "easeInOut", "easeOut"],
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
              title={label}
              data-cursor-text={label.toUpperCase()}
              data-cursor-text-repeat="6"
              data-cursor-color={color}
              variants={badgeVariants}
              style={{ ["--icon" as any]: color } as any}
              whileHover={
                prefersReduced
                  ? undefined
                  : {
                      scale: 1.04,
                      y: -2,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      },
                    }
              }
            >
              <div className="circle" aria-hidden="true">
                <Icon strokeWidth={2} />
              </div>
              <span className="sr-only">{label}</span>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
