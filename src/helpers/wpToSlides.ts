// helpers/wpToSlides.ts
import type { Slide } from "@/components/ProjectSlider";

export function acfToSlides(acf: any): Slide[] {
  const s = (n: 1|2|3|4) => ({
    img: acf[`slide_${n}_img`] ?? acf[`slide_${n}_img_`] ?? "",
    title: acf[`slide_${n}_title`] || "",
    text: acf[`slide_${n}_text`] || "",
    meta: acf[`slide_${n}_meta`] || "",
    cta: acf[`slide_${n}_cta_url`] ? { href: acf[`slide_${n}_cta_url`] } : undefined,
  });

  // filtre les slides vides (pas d'image ni de titre)
  return [s(1), s(2), s(3), s(4)].filter(slide => slide.img || slide.title);
}
