import React from "react";
import { Settings, BadgeCheck, MessageSquareText } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export default function Services() {
  return (
    <section id="services" className="container services" aria-labelledby="services-title">
      <h2 id="services-title" className="services__title">Mes services</h2>

      <ScrollReveal as="div" cascade dir="up" amount={0.2} rootMargin="0px 0px -25% 0px">
        <ul className="services__grid" role="list">
          <li className="service-card">
            <div className="service-card__icon" aria-hidden="true">
              <Settings width={44} height={44} strokeWidth={1.8} />
            </div>
            <h3 className="service-card__title">Création sur mesure</h3>
            <p className="service-card__desc">Un site unique, pensé pour vos besoins.</p>
          </li>

          <li className="service-card">
            <div className="service-card__icon service-card__icon--accent" aria-hidden="true">
              <BadgeCheck width={44} height={44} strokeWidth={1.8} />
            </div>
            <h3 className="service-card__title">Refonte &amp; optimisation</h3>
            <p className="service-card__desc">Vitesse, SEO, accessibilité améliorées.</p>
          </li>

          <li className="service-card">
            <div className="service-card__icon service-card__icon--dark" aria-hidden="true">
              <MessageSquareText width={44} height={44} strokeWidth={1.8} />
            </div>
            <h3 className="service-card__title">Accompagnement durable</h3>
            <p className="service-card__desc">Je vous accompagne après la mise en ligne.</p>
          </li>
        </ul>
      </ScrollReveal>
    </section>
  );
}
