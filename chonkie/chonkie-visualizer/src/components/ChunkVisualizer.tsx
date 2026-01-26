'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, FileText, Settings, Eye } from 'lucide-react';
import type { ChunkConfig, ChunkResponse } from '@/types/chonkie';

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

const DEFAULT_TEXT = `The Critical Role of Chunking in RAG Applications

How Strategic Text Segmentation Determines Retrieval Quality and System Performance

Chunking represents one of the most consequential yet often underestimated design decisions in Retrieval-Augmented Generation systems. The process of dividing source documents into smaller, semantically coherent segments directly impacts retrieval accuracy, context relevance, and ultimately the quality of generated responses. Poor chunking strategies lead to fragmented context, where critical information spans multiple chunks, or bloated retrievals that overwhelm the model's context window with irrelevant details. The art and science of chunking requires balancing granularity with coherence—segments must be small enough for precise retrieval yet large enough to preserve meaningful context.

The relationship between chunk size and retrieval performance follows a nuanced curve rather than a linear progression. Smaller chunks (100-200 tokens) enable pinpoint accuracy for specific facts but risk losing surrounding context that provides necessary interpretation. Larger chunks (500-1000 tokens) preserve narrative flow and relationships but may dilute relevance scores when only a portion of the content matches the query. Advanced chunking strategies now employ semantic segmentation—analyzing document structure, topic boundaries, and discourse patterns rather than arbitrary token counts. This approach, combined with overlapping windows that allow chunks to share boundary content, helps maintain contextual threads across segments.

Modern RAG architectures increasingly treat chunking as a multi-dimensional problem requiring adaptive strategies based on content type and use case. Technical documentation benefits from structure-aware chunking that respects hierarchies like headers, code blocks, and procedure steps. Conversational data requires different treatment, where turn boundaries and topic shifts guide segmentation. Knowledge graph-enhanced systems like LightRAG can leverage entity relationships to inform chunk boundaries, creating segments that preserve meaningful connections between concepts rather than arbitrary splits that sever semantic links.

The downstream effects of chunking decisions cascade through every component of a RAG system. Vector embeddings generated from well-formed chunks produce more discriminative representations in semantic space, improving retrieval precision. Chunk metadata—including position, parent document, and structural role—enables sophisticated reranking and context assembly strategies. As RAG systems evolve toward agentic architectures with multi-hop reasoning, the ability to efficiently traverse and recombine chunks becomes paramount. Investing time in chunking strategy optimization often yields greater performance gains than switching embedding models or adjusting retrieval parameters, making it a leverage point that deserves careful consideration in any production RAG implementation.`;

export default function ChunkVisualizer() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [config, setConfig] = useState<ChunkConfig>({
    chunkerType: 'TokenChunker',
    chunkSize: 100,
    chunkOverlap: 20,
    tokenizerType: 'CharacterTokenizer',
    embeddingProvider: 'sentence-transformers',
    embeddingModel: 'all-MiniLM-L6-v2',
    semanticThreshold: 0.3,
  });
  const [result, setResult] = useState<ChunkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChunk = useCallback(async () => {
    if (!text.trim()) {
      setError('Please enter some text to chunk');
      return;
    }

    if (text.length > 50000) {
      setError('Text is too long (max 50,000 characters). Please shorten your text.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch('/api/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.substring(0, 50000),
          config,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ChunkResponse = await response.json();
      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try with shorter text or simpler chunking options.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [text, config]);

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

  return (
    <div className="w-[95%] max-w-[1400px] mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Input Text
              </CardTitle>
              <CardDescription>
                Enter your markdown or text content to be chunked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Chunking Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Chunker Type</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {CHUNKER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setConfig(prev => ({ ...prev, chunkerType: option.value as ChunkConfig['chunkerType'] }))}
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
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, chunkSize: value }))}
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
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, chunkOverlap: value }))}
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
                        onClick={() => setConfig(prev => ({ ...prev, tokenizerType: option.value as ChunkConfig['tokenizerType'] }))}
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
                          onClick={() => setConfig(prev => ({ 
                            ...prev, 
                            embeddingProvider: provider.value,
                            embeddingModel: EMBEDDING_MODELS[provider.value]?.[0] || 'all-MiniLM-L6-v2'
                          }))}
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
                            onClick={() => setConfig(prev => ({ ...prev, embeddingModel: model }))}
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
                        onValueChange={([value]) => setConfig(prev => ({ ...prev, semanticThreshold: value }))}
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
                onClick={handleChunk} 
                disabled={loading || !text.trim()}
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
                    Visualize Chunks
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="glass-card">
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
                  <p>Configure your settings and click "Visualize Chunks" to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}