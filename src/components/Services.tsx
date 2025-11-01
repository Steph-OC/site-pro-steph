import React from "react";
import { Settings, BadgeCheck, MessageSquareText } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import "@/styles/components/services.css";

export default function Services() {
  const prefersReduced = useReducedMotion();
  const OFFSET = prefersReduced ? 0 : 160; // arrive de plus bas
  const STAGGER = prefersReduced ? 0 : 0.12;

  const listVariants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: STAGGER, delayChildren: 0.05 },
    },
  };

  const cardVariants: Variants = prefersReduced
    ? {
        hidden: { opacity: 0, y: 0 },
        show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
      }
    : {
        hidden: { opacity: 0, y: OFFSET },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 300, // ↓ moins de raideur
            damping: 38, // ↑ amortissement → plus doux, sans “glitch”
            mass: 0.9,
            restDelta: 0.5,
            restSpeed: 40,
          },
        },
      };

  const hoverLift = prefersReduced
    ? undefined
    : {
        y: -4,
        transition: { type: "spring", stiffness: 420, damping: 28 },
      };

  return (
    <motion.ul
      className="services__grid"
      role="list"
      variants={listVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35, margin: "0px 0px -12% 0px" }}
      aria-label="Liste des services"
    >
      <motion.li
        className="service-card"
        variants={cardVariants}
        whileHover={hoverLift}
        style={{ willChange: "transform" }}
      >
        <div className="service-card__icon" aria-hidden="true">
          <Settings width={44} height={44} strokeWidth={1.8} />
        </div>
        <h3 className="service-card__title">Création sur mesure</h3>
        <p className="service-card__desc">
          Un site unique, pensé pour vos besoins.
        </p>
      </motion.li>

      <motion.li
        className="service-card"
        variants={cardVariants}
        whileHover={hoverLift}
        style={{ willChange: "transform" }}
      >
        <div
          className="service-card__icon service-card__icon--accent"
          aria-hidden="true"
        >
          <BadgeCheck width={44} height={44} strokeWidth={1.8} />
        </div>
        <h3 className="service-card__title">Refonte &amp; optimisation</h3>
        <p className="service-card__desc">
          Vitesse, SEO, accessibilité améliorées.
        </p>
      </motion.li>

      <motion.li
        className="service-card"
        variants={cardVariants}
        whileHover={hoverLift}
        style={{ willChange: "transform" }}
      >
        <div
          className="service-card__icon service-card__icon--dark"
          aria-hidden="true"
        >
          <MessageSquareText width={44} height={44} strokeWidth={1.8} />
        </div>
        <h3 className="service-card__title">Accompagnement durable</h3>
        <p className="service-card__desc">
          Je vous accompagne après la mise en ligne.
        </p>
      </motion.li>
    </motion.ul>
  );
}
