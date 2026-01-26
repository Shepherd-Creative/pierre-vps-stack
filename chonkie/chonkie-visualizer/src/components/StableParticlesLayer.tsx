'use client';

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ParticlesBackground } from './ParticlesBackground';
import { ThemeProvider } from './ThemeProvider';

export function StableParticlesLayer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let host = document.getElementById('particles-root');

    if (!host) {
      host = document.createElement('div');
      host.id = 'particles-root';
      host.style.cssText = 'position: fixed; inset: 0; z-index: -1; pointer-events: none;';
      document.body.appendChild(host);

      const root = createRoot(host);
      root.render(
        <ThemeProvider>
          <ParticlesBackground />
        </ThemeProvider>
      );
    }

    return () => {
      // Cleanup handled by React
    };
  }, []);

  return null;
}
