type Options = {
  color?: string;
  size?: number;       // côté du carré par défaut
  radius?: number;     // coins arrondis
  pad?: number;        // marge autour de la cible quand on « entoure »
  magnetRadius?: number; // distance d’aimantation (px)
  targets?: string;    // sélecteur des éléments interactifs
  enableOnCoarse?: boolean; // activer sur mobile ? (false par défaut)
};

export default function initPointerCursor(opts: Options = {}) {
  const {
    color = getComputedStyle(document.documentElement).getPropertyValue('--brand') || '#ffd166',
    size = 14,
    radius = 12,
    pad = 10,
    magnetRadius = 90,
    targets = "[data-pointer], a, button, [role='button'], [tabindex]:not([tabindex='-1'])",
    enableOnCoarse = false,
  } = opts;

  // Respect des préférences / support
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (reduce || (!enableOnCoarse && coarse)) return;

  // Élément curseur
  const el = document.createElement('div');
  el.className = 'pointer-cursor pointer-cursor--idle';
  el.style.setProperty('--pointer-color', color.trim());
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = `${radius}px`;
  document.body.appendChild(el);

  // Active la classe qui masque le curseur natif
  document.documentElement.classList.add('use-ios-pointer');

  let mx = -9999, my = -9999;   // position souris
  let x = mx, y = my;           // lissées
  let sx = 1, sy = 1;           // scale (pour entourer la cible)
  let down = false;
  let raf = 0;

  let activeEl: HTMLElement | null = null;
  let rectCache: DOMRect | null = null;

  // rAF loop
  const loop = () => {
    raf = 0;

    // Lissage simple façon spring (sans physique lourde)
    const ease = 0.20;
    x += (mx - x) * ease;
    y += (my - y) * ease;

    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${sx}, ${sy})`;

    raf = requestAnimationFrame(loop);
  };

  const ensureRAF = () => { if (!raf) raf = requestAnimationFrame(loop); };

  // Input
  const onMove = (e: PointerEvent) => {
    mx = e.clientX - el.offsetWidth / 2;
    my = e.clientY - el.offsetHeight / 2;

    if (!el.classList.contains('pointer-cursor--active')) {
      el.classList.add('pointer-cursor--active');
    }
    ensureRAF();

    // Recherche de cible sous le pointeur
    const node = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const target = node?.closest(targets) as HTMLElement | null;

    if (!target) {
      // redevient un petit carré
      if (activeEl) {
        activeEl.classList.remove('magnet-on');
        resetMagnet(activeEl);
        activeEl = null;
        rectCache = null;
      }
      sx = 1; sy = 1;
      el.classList.remove('pointer-cursor--rect');
      el.classList.add('pointer-cursor--idle');
      return;
    }

    // aimantation si proche
    if (activeEl !== target) {
      if (activeEl) {
        activeEl.classList.remove('magnet-on');
        resetMagnet(activeEl);
      }
      activeEl = target;
      rectCache = target.getBoundingClientRect();
    } else if (!rectCache) {
      rectCache = target.getBoundingClientRect();
    }

    const r = rectCache!;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist <= magnetRadius) {
      // entourer la cible
      const ww = Math.max(size, r.width + pad * 2);
      const hh = Math.max(size, r.height + pad * 2);

      // place le coin haut-gauche du curseur (transform-origin 0 0 implicite)
      mx = r.left - pad;
      my = r.top - pad;

      sx = ww / size;
      sy = hh / size;
      el.classList.remove('pointer-cursor--idle');
      el.classList.add('pointer-cursor--rect');

      // léger tilt/translation de la cible (réutilise tes variables CSS)
      const maxDeg = 2, maxShift = 6, maxZ = 1.2;
      const rotX = clamp((-dy / (r.height / 2)) * maxDeg, -maxDeg, maxDeg);
      const rotY = clamp(( dx / (r.width  / 2)) * maxDeg, -maxDeg, maxDeg);
      const tx   = (dx / (r.width  / 2)) * maxShift;
      const ty   = (dy / (r.height / 2)) * maxShift;
      const rotZ = clamp((dx / (r.width/2)) * 0.8 + (-dy / (r.height/2)) * 0.4, -maxZ, maxZ);

      target.classList.add('magnet-on');
      target.style.setProperty('--magnet-rotX', `${rotX.toFixed(2)}deg`);
      target.style.setProperty('--magnet-rotY', `${rotY.toFixed(2)}deg`);
      target.style.setProperty('--magnet-rotZ', `${rotZ.toFixed(2)}deg`);
      target.style.setProperty('--magnet-tx',  `${tx.toFixed(2)}px`);
      target.style.setProperty('--magnet-ty',  `${ty.toFixed(2)}px`);
      target.style.setProperty('--magnet-scale', '1.03');
    } else {
      // trop loin → point normal
      sx = 1; sy = 1;
      el.classList.remove('pointer-cursor--rect');
      el.classList.add('pointer-cursor--idle');
      if (activeEl) {
        activeEl.classList.remove('magnet-on');
        resetMagnet(activeEl);
        activeEl = null;
        rectCache = null;
      }
    }
  };

  const onDown = () => { down = true; el.classList.add('pointer-cursor--down'); };
  const onUp   = () => { down = false; el.classList.remove('pointer-cursor--down'); };
  const onEnter = () => el.classList.remove('pointer-cursor--hide');
  const onLeave = () => el.classList.add('pointer-cursor--hide');

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointerenter', onEnter, { passive: true });
  window.addEventListener('pointerleave', onLeave, { passive: true });

  // Arrêt propre (au besoin)
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove as any);
    window.removeEventListener('pointerdown', onDown as any);
    window.removeEventListener('pointerup', onUp as any);
    window.removeEventListener('pointerenter', onEnter as any);
    window.removeEventListener('pointerleave', onLeave as any);
    document.documentElement.classList.remove('use-ios-pointer');
    el.remove();
  };
}

function resetMagnet(t: HTMLElement) {
  t.style.removeProperty('--magnet-scale');
  t.style.removeProperty('--magnet-rotX');
  t.style.removeProperty('--magnet-rotY');
  t.style.removeProperty('--magnet-rotZ');
  t.style.removeProperty('--magnet-tx');
  t.style.removeProperty('--magnet-ty');
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
