'use client';

import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useComparison } from '@/contexts/ComparisonContext';
import { ComparisonPanel } from './ComparisonPanel';
import type { ChunkResponse } from '@/types/chonkie';

export function ComparisonView() {
  const { state, dispatch } = useComparison();

  const processPanel = useCallback(async (panel: 'left' | 'right') => {
    const config = panel === 'left' ? state.leftPanel.config : state.rightPanel.config;
    const setLoading = panel === 'left' ? 'SET_LEFT_LOADING' : 'SET_RIGHT_LOADING';
    const setResult = panel === 'left' ? 'SET_LEFT_RESULT' : 'SET_RIGHT_RESULT';
    const setError = panel === 'left' ? 'SET_LEFT_ERROR' : 'SET_RIGHT_ERROR';

    dispatch({ type: setLoading, loading: true });
    dispatch({ type: setError, error: null });

    try {
      const response = await fetch('/api/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: state.sharedText, config }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ChunkResponse = await response.json();
      dispatch({ type: setResult, result: data });
    } catch (err) {
      dispatch({ type: setError, error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      dispatch({ type: setLoading, loading: false });
    }
  }, [state.sharedText, state.leftPanel.config, state.rightPanel.config, dispatch]);

  return (
    <div className="w-[95%] max-w-[1400px] mx-auto space-y-6">
      {/* Shared Text Input */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Input Text (Shared)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your text here to compare chunking strategies..."
            value={state.sharedText}
            onChange={(e) => dispatch({ type: 'SET_TEXT', text: e.target.value })}
            className="min-h-[150px]"
          />
        </CardContent>
      </Card>

      {/* Side-by-Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComparisonPanel
          title="Configuration A"
          config={state.leftPanel.config}
          result={state.leftPanel.result}
          loading={state.leftPanel.loading}
          error={state.leftPanel.error}
          sharedText={state.sharedText}
          onConfigChange={(updates) => dispatch({ type: 'UPDATE_LEFT_CONFIG', config: updates })}
          onProcess={() => processPanel('left')}
        />

        <ComparisonPanel
          title="Configuration B"
          config={state.rightPanel.config}
          result={state.rightPanel.result}
          loading={state.rightPanel.loading}
          error={state.rightPanel.error}
          sharedText={state.sharedText}
          onConfigChange={(updates) => dispatch({ type: 'UPDATE_RIGHT_CONFIG', config: updates })}
          onProcess={() => processPanel('right')}
        />
      </div>
    </div>
  );
}
