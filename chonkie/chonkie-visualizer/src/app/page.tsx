'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StableParticlesLayer } from '@/components/StableParticlesLayer';
import ChunkVisualizer from '@/components/ChunkVisualizer';
import { ComparisonProvider } from '@/contexts/ComparisonContext';
import { ComparisonView } from '@/components/comparison/ComparisonView';

export default function Home() {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="min-h-screen relative">
      <StableParticlesLayer />
      <Header
        showComparison={showComparison}
        onToggleComparison={() => setShowComparison(!showComparison)}
      />
      <main className="py-8">
        {showComparison ? (
          <ComparisonProvider>
            <ComparisonView />
          </ComparisonProvider>
        ) : (
          <ChunkVisualizer />
        )}
      </main>
      <Footer />
    </div>
  );
}