'use client';

import { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { ConfigPanel } from '@/components/chunking/ConfigPanel';
import { ChunkResults } from '@/components/chunking/ChunkResults';
import type { ChunkConfig, ChunkResponse } from '@/types/chonkie';

interface ComparisonPanelProps {
  title: string;
  config: ChunkConfig;
  result: ChunkResponse | null;
  loading: boolean;
  error: string | null;
  sharedText: string;
  onConfigChange: (updates: Partial<ChunkConfig>) => void;
  onProcess: () => Promise<void>;
}

export function ComparisonPanel({
  title,
  config,
  result,
  loading,
  error,
  sharedText,
  onConfigChange,
  onProcess,
}: ComparisonPanelProps) {
  const handleProcess = useCallback(async () => {
    if (!sharedText.trim()) return;
    await onProcess();
  }, [sharedText, onProcess]);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="p-4">
          <ConfigPanel
            config={config}
            onConfigChange={onConfigChange}
            onProcess={handleProcess}
            loading={loading}
            disabled={!sharedText.trim()}
          />
        </div>
      </Card>

      {(result || error) && (
        <Card className="glass-card">
          <ChunkResults result={result} error={error} loading={loading} />
        </Card>
      )}
    </div>
  );
}
