import { useState } from 'react';
import { HERO_IMAGES, type HeroImage } from '../data/heroImages';

const SESSION_KEY = 'moar_hero_index';

function getSessionHero(): HeroImage {
  // Pick one per session (tab open). Store index in sessionStorage so
  // it stays consistent during a single visit but changes next time.
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored !== null) {
    const idx = parseInt(stored, 10);
    if (idx >= 0 && idx < HERO_IMAGES.length) {
      return HERO_IMAGES[idx];
    }
  }

  const idx = Math.floor(Math.random() * HERO_IMAGES.length);
  sessionStorage.setItem(SESSION_KEY, idx.toString());
  return HERO_IMAGES[idx];
}

/**
 * Returns a random hero image (consistent within a browser session).
 * Also applies the hero's accent color as CSS custom properties on :root
 * so all accent-colored elements adapt automatically.
 */
export function useHeroImage(): HeroImage {
  const [hero] = useState<HeroImage>(getSessionHero);

  // Apply accent color to CSS custom properties
  // This overrides the Tailwind @theme --color-accent value
  useState(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', hero.accent);

    // Compute a slightly darker hover variant
    const r = parseInt(hero.accent.slice(1, 3), 16);
    const g = parseInt(hero.accent.slice(3, 5), 16);
    const b = parseInt(hero.accent.slice(5, 7), 16);
    const darker = '#' + [r, g, b]
      .map(c => Math.max(0, Math.round(c * 0.82)).toString(16).padStart(2, '0'))
      .join('');
    root.style.setProperty('--color-accent-hover', darker);
  });

  return hero;
}
