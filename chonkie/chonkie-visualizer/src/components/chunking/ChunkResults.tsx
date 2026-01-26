'use client';

import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import type { ChunkResponse } from '@/types/chonkie';

interface ChunkResultsProps {
  result: ChunkResponse | null;
  error: string | null;
  loading: boolean;
}

const getChunkColor = (index: number): string => {
  const colors = [
    'bg-blue-100 border-blue-300',
    'bg-green-100 border-green-300',
    'bg-yellow-100 border-yellow-300',
    'bg-purple-100 border-purple-300',
    'bg-pink-100 border-pink-300',
    'bg-indigo-100 border-indigo-300',
    'bg-red-100 border-red-300',
    'bg-orange-100 border-orange-300',
  ];
  return colors[index % colors.length];
};

export function ChunkResults({ result, error, loading }: ChunkResultsProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Chunk Results</CardTitle>
        {result && (
          <CardDescription>
            {result.total_chunks} chunks created in {result.processing_time.toFixed(2)}ms
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {result.chunks.map((chunk, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border-2 ${getChunkColor(index)}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Chunk {index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {chunk.content.length} chars
                    {chunk.token_count && ` • ${chunk.token_count} tokens`}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{chunk.content}</p>
              </div>
            ))}
          </div>
        )}

        {!result && !error && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Configure your settings and click "Process" to see results</p>
          </div>
        )}
      </CardContent>
    </>
  );
}
