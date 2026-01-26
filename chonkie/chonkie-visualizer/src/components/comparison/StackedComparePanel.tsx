'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ConfigPanel } from '@/components/chunking/ConfigPanel';
import { Eye, Pencil } from 'lucide-react';
import type { ChunkConfig, ChunkResponse } from '@/types/chonkie';
import {
  getChunkColor,
  getChunkHighlightBg,
  getChunkOverlaps,
  calculateTextSegments
} from '@/lib/chunkVisualization';

interface StackedComparePanelProps {
  title: string;
  config: ChunkConfig;
  result: ChunkResponse | null;
  loading: boolean;
  error: string | null;
  sharedText: string;
  onTextChange: (text: string) => void;
  onConfigChange: (updates: Partial<ChunkConfig>) => void;
  onProcess: () => Promise<void>;
}

export function StackedComparePanel({
  title,
  config,
  result,
  loading,
  error,
  sharedText,
  onTextChange,
  onConfigChange,
  onProcess,
}: StackedComparePanelProps) {
  const [isEditingText, setIsEditingText] = useState(false);

  const handleProcess = useCallback(async () => {
    if (!sharedText.trim()) return;
    await onProcess();
  }, [sharedText, onProcess]);

  // Render highlighted input text showing chunk boundaries
  const renderHighlightedInput = () => {
    if (!result) return null;

    const segments = calculateTextSegments(sharedText, result);

    return (
      <div className="min-h-[200px] max-h-[300px] p-3 bg-background rounded-md border font-mono text-sm whitespace-pre-wrap overflow-auto leading-7">
        {segments.map((segment, idx) => (
          <span
            key={idx}
            className={`${
              segment.chunkIndex >= 0 ? getChunkHighlightBg(segment.chunkIndex) : ''
            } ${segment.isOverlap ? 'underline decoration-2 decoration-gray-500' : ''} py-1 box-decoration-clone`}
          >
            {segment.text}
          </span>
        ))}
      </div>
    );
  };

  // Render chunked output with colors and overlap detection
  const renderChunkedOutput = () => {
    if (!result) return null;

    const overlaps = getChunkOverlaps(result, config, sharedText);
    const hasOverlaps = Object.values(overlaps).some(o => o.overlapWithPrev || o.overlapWithNext);

    return (
      <>
        <div className="min-h-[300px] max-h-[500px] p-4 bg-muted/30 rounded-md border overflow-auto space-y-3">
          {result.chunks.map((chunk, index) => {
            const chunkOverlap = overlaps[index] || {};
            const overlapWithPrev = chunkOverlap.overlapWithPrev;
            const overlapWithNext = chunkOverlap.overlapWithNext;

            // Split content into: main content and overlap portions
            let mainContent = chunk.content;
            let prefixOverlap = '';
            let suffixOverlap = '';

            if (config.chunkerType === 'TokenChunker') {
              if (overlapWithPrev && mainContent.startsWith(overlapWithPrev)) {
                prefixOverlap = overlapWithPrev;
                mainContent = mainContent.substring(overlapWithPrev.length);
              }
              if (overlapWithNext && mainContent.endsWith(overlapWithNext)) {
                suffixOverlap = overlapWithNext;
                mainContent = mainContent.substring(0, mainContent.length - overlapWithNext.length);
              }
            }

            return (
              <div
                key={index}
                className={`${getChunkColor(index)} border-2 rounded-lg p-3 text-gray-900 dark:text-gray-100`}
              >
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-current/20">
                  <span className="text-xs font-semibold opacity-70">
                    Chunk {index + 1}
                  </span>
                  <span className="text-xs opacity-50">
                    {chunk.token_count} tokens
                  </span>
                </div>
                <div className="font-mono text-sm whitespace-pre-wrap">
                  {prefixOverlap && (
                    <span className="bg-gray-300/50 dark:bg-gray-600/50 rounded px-0.5 border-b-2 border-dashed border-gray-400" title={`Overlap with Chunk ${index}`}>
                      {prefixOverlap}
                    </span>
                  )}
                  {mainContent}
                  {suffixOverlap && (
                    <span className="bg-gray-300/50 dark:bg-gray-600/50 rounded px-0.5 border-b-2 border-dashed border-gray-400" title={`Overlap with Chunk ${index + 2}`}>
                      {suffixOverlap}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 bg-muted/20 rounded-md border">
          <div className="text-sm font-medium mb-2">Legend:</div>
          <div className="flex flex-wrap gap-2">
            {result.chunks.map((_, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded border-2 ${getChunkColor(index)}`} />
                <span className="text-xs">Chunk {index + 1}</span>
              </div>
            ))}
            {hasOverlaps && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border">
                <div className="w-4 h-4 rounded bg-gray-300/50 dark:bg-gray-600/50 border-b-2 border-dashed border-gray-400" />
                <span className="text-xs">Overlap</span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="grid grid-rows-subgrid row-span-3 gap-4">
      {/* Section 1: Chunking Configuration */}
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

      {/* Section 2: Input Text */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Input Text
              {result && !isEditingText && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(Highlighted)</span>
              )}
            </CardTitle>
            {result && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingText(!isEditingText)}
                className="h-7 text-xs"
              >
                {isEditingText ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    View Highlights
                  </>
                ) : (
                  <>
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {result && !isEditingText ? (
            renderHighlightedInput()
          ) : (
            <Textarea
              placeholder="Enter your text here..."
              value={sharedText}
              onChange={(e) => onTextChange(e.target.value)}
              className="min-h-[200px] max-h-[300px] font-mono text-sm"
            />
          )}
        </CardContent>
      </Card>

      {/* Section 3: Chunked Text Visualization */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Chunked Text Visualization
            </CardTitle>
            {result && (
              <span className="text-xs text-muted-foreground">
                {result.total_chunks} chunks | {result.total_tokens} tokens | {result.processing_time.toFixed(2)}ms
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          {result ? (
            renderChunkedOutput()
          ) : !error ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Configure settings and click "Visualize Chunks" to see results</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
