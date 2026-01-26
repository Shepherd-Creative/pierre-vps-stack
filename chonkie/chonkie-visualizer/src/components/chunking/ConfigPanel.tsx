'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings, Loader2, Eye } from 'lucide-react';
import type { ChunkConfig } from '@/types/chonkie';

const CHUNKER_OPTIONS = [
  { value: 'TokenChunker', label: 'Token Chunker', description: 'Split by token count', requiresEmbeddings: false },
  { value: 'SentenceChunker', label: 'Sentence Chunker', description: 'Split by sentences', requiresEmbeddings: false },
  { value: 'RecursiveChunker', label: 'Recursive Chunker', description: 'Recursive splitting', requiresEmbeddings: false },
  { value: 'SemanticChunker', label: 'Semantic Chunker', description: 'Semantic similarity', requiresEmbeddings: true },
  { value: 'CodeChunker', label: 'Code Chunker', description: 'Code-aware splitting', requiresEmbeddings: false },
  { value: 'NeuralChunker', label: 'Neural Chunker', description: 'AI-powered chunking', requiresEmbeddings: true },
];

const TOKENIZER_OPTIONS = [
  { value: 'CharacterTokenizer', label: 'Character Tokenizer' },
  { value: 'WordTokenizer', label: 'Word Tokenizer' },
];

const EMBEDDING_PROVIDERS = [
  { value: 'sentence-transformers', label: 'Sentence Transformers (Local)', description: 'Free, runs locally' },
  { value: 'openai', label: 'OpenAI Embeddings', description: 'Requires API key' },
  { value: 'cohere', label: 'Cohere Embeddings', description: 'Requires API key' },
  { value: 'gemini', label: 'Google Gemini', description: 'Requires API key' },
  { value: 'jina', label: 'Jina AI', description: 'Requires API key' },
  { value: 'voyage', label: 'Voyage AI', description: 'Requires API key' },
  { value: 'auto', label: 'Auto (Best Available)', description: 'Automatically selects' },
];

const EMBEDDING_MODELS: { [key: string]: string[] } = {
  'sentence-transformers': [
    'all-MiniLM-L6-v2',
    'all-mpnet-base-v2',
    'multi-qa-MiniLM-L6-cos-v1',
    'paraphrase-multilingual-MiniLM-L12-v2'
  ],
  'openai': [
    'text-embedding-3-small',
    'text-embedding-3-large',
    'text-embedding-ada-002'
  ],
  'cohere': [
    'embed-english-v3.0',
    'embed-multilingual-v3.0'
  ],
  'gemini': [
    'embedding-001'
  ],
  'jina': [
    'jina-embeddings-v2-base-en'
  ],
  'voyage': [
    'voyage-2'
  ],
  'auto': [
    'auto'
  ]
};

interface ConfigPanelProps {
  config: ChunkConfig;
  onConfigChange: (updates: Partial<ChunkConfig>) => void;
  onProcess: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ConfigPanel({
  config,
  onConfigChange,
  onProcess,
  loading = false,
  disabled = false,
}: ConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Chunker Type</Label>
        <div className="grid grid-cols-1 gap-2 mt-2">
          {CHUNKER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onConfigChange({ chunkerType: option.value as ChunkConfig['chunkerType'] })}
              className={`p-3 text-left rounded-md border transition-colors ${
                config.chunkerType === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <div className="font-medium">
                {option.label}
                {option.requiresEmbeddings && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Requires Embeddings</span>}
              </div>
              <div className="text-sm text-muted-foreground">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Chunk Size: {config.chunkSize}</Label>
        <Slider
          value={[config.chunkSize]}
          onValueChange={([value]) => onConfigChange({ chunkSize: value })}
          max={500}
          min={10}
          step={10}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Chunk Overlap: {config.chunkOverlap}</Label>
        <Slider
          value={[config.chunkOverlap]}
          onValueChange={([value]) => onConfigChange({ chunkOverlap: value })}
          max={100}
          min={0}
          step={5}
          className="mt-2"
        />
      </div>

      {(config.chunkerType === 'TokenChunker') && (
        <div>
          <Label>Tokenizer Type</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {TOKENIZER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onConfigChange({ tokenizerType: option.value as ChunkConfig['tokenizerType'] })}
                className={`p-2 text-left rounded-md border transition-colors ${
                  config.tokenizerType === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(config.chunkerType === 'SemanticChunker' || config.chunkerType === 'NeuralChunker') && (
        <>
          <div>
            <Label>Embedding Provider</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {EMBEDDING_PROVIDERS.map((provider) => (
                <button
                  key={provider.value}
                  onClick={() => onConfigChange({
                    embeddingProvider: provider.value,
                    embeddingModel: EMBEDDING_MODELS[provider.value]?.[0] || 'all-MiniLM-L6-v2'
                  })}
                  className={`p-3 text-left rounded-md border transition-colors ${
                    config.embeddingProvider === provider.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{provider.label}</div>
                  <div className="text-sm text-muted-foreground">{provider.description}</div>
                </button>
              ))}
            </div>
          </div>

          {config.embeddingProvider && EMBEDDING_MODELS[config.embeddingProvider] && (
            <div>
              <Label>Embedding Model</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {EMBEDDING_MODELS[config.embeddingProvider].map((model) => (
                  <button
                    key={model}
                    onClick={() => onConfigChange({ embeddingModel: model })}
                    className={`p-2 text-left rounded-md border transition-colors ${
                      config.embeddingModel === model
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>
          )}

          {config.chunkerType === 'SemanticChunker' && (
            <div>
              <Label>Semantic Threshold: {config.semanticThreshold}</Label>
              <Slider
                value={[config.semanticThreshold || 0.3]}
                onValueChange={([value]) => onConfigChange({ semanticThreshold: value })}
                max={1}
                min={0}
                step={0.1}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Lower values create more chunks, higher values create fewer chunks
              </div>
            </div>
          )}
        </>
      )}

      <Button
        onClick={onProcess}
        disabled={loading || disabled}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4" />
            Process
          </>
        )}
      </Button>
    </div>
  );
}
