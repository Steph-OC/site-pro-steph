import initBubbleCloud from "./bubbles";

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    const el = document.querySelector(
      ".services-hero__illu .bubble-cloud"
    ) as HTMLElement | null;

    if (el) {
      initBubbleCloud(el);
    }
  });
}
