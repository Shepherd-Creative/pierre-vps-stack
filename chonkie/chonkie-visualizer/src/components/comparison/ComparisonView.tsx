'use client';

import { useCallback } from 'react';
import { useComparison } from '@/contexts/ComparisonContext';
import { StackedComparePanel } from './StackedComparePanel';
import type { ChunkResponse } from '@/types/chonkie';

export function ComparisonView() {
  const { state, dispatch } = useComparison();

  const handleTextChange = useCallback((text: string) => {
    dispatch({ type: 'SET_TEXT', text });
  }, [dispatch]);

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
    <div className="w-[95%] max-w-[1600px] mx-auto">
      {/* Side-by-Side Stacked Panels with aligned rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr] gap-6">
        <StackedComparePanel
          title="Configuration A"
          config={state.leftPanel.config}
          result={state.leftPanel.result}
          loading={state.leftPanel.loading}
          error={state.leftPanel.error}
          sharedText={state.sharedText}
          onTextChange={handleTextChange}
          onConfigChange={(updates) => dispatch({ type: 'UPDATE_LEFT_CONFIG', config: updates })}
          onProcess={() => processPanel('left')}
        />

        <StackedComparePanel
          title="Configuration B"
          config={state.rightPanel.config}
          result={state.rightPanel.result}
          loading={state.rightPanel.loading}
          error={state.rightPanel.error}
          sharedText={state.sharedText}
          onTextChange={handleTextChange}
          onConfigChange={(updates) => dispatch({ type: 'UPDATE_RIGHT_CONFIG', config: updates })}
          onProcess={() => processPanel('right')}
        />
      </div>
    </div>
  );
}
