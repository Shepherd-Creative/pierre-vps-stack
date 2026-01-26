'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';
import { useTheme } from './ThemeProvider';

export function ParticlesBackground() {
  const { theme } = useTheme();
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = useMemo(() => {
    const fgColor = theme === 'dark' ? '#cbd5e1' : '#475569';

    return {
      fullScreen: { enable: true, zIndex: -1 },
      fpsLimit: 60,
      particles: {
        number: {
          value: 100,
          density: { enable: true, width: 800, height: 800 },
        },
        color: { value: fgColor },
        shape: { type: 'circle' },
        opacity: { value: 0.55 },
        size: { value: { min: 1, max: 3 } },
        links: {
          enable: true,
          distance: 120,
          color: fgColor,
          opacity: 0.35,
          width: 1,
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: false,
          outModes: { default: 'bounce' },
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'grab' },
        },
        modes: {
          grab: { distance: 140, links: { opacity: 0.5 } },
        },
      },
    };
  }, [theme]);

  if (!init) {
    return null;
  }

  return <Particles id="tsparticles" options={options} />;
}
