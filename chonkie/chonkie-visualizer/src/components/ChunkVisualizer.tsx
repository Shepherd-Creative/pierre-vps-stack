'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, FileText, Settings, Eye } from 'lucide-react';
import type { ChunkConfig, ChunkResponse } from '@/types/chonkie';
import { getChunkColor, getChunkHighlightBg, getChunkOverlaps, calculateTextSegments } from '@/lib/chunkVisualization';

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
  { value: 'sentence-transformers', label: 'Sentence Transformers (Local)', description: 'Free, runs locally', authorised: false },
  { value: 'openai', label: 'OpenAI Embeddings', description: 'API Key Authorised', authorised: true },
  { value: 'cohere', label: 'Cohere Embeddings', description: 'Requires API key', authorised: false },
  { value: 'gemini', label: 'Google Gemini', description: 'Requires API key', authorised: false },
  { value: 'jina', label: 'Jina AI', description: 'Requires API key', authorised: false },
  { value: 'voyage', label: 'Voyage AI', description: 'Requires API key', authorised: false },
  { value: 'auto', label: 'Auto (Best Available)', description: 'Automatically selects', authorised: false },
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

  // Accordion state for auto-collapse on selection
  const [chunkerAccordion, setChunkerAccordion] = useState<string>('');
  const [tokenizerAccordion, setTokenizerAccordion] = useState<string>('');
  const [providerAccordion, setProviderAccordion] = useState<string>('');
  const [modelAccordion, setModelAccordion] = useState<string>('');

  // Track if user has explicitly selected an option
  const [hasSelectedChunker, setHasSelectedChunker] = useState(false);
  const [hasSelectedTokenizer, setHasSelectedTokenizer] = useState(false);
  const [hasSelectedProvider, setHasSelectedProvider] = useState(false);
  const [hasSelectedModel, setHasSelectedModel] = useState(false);

  const selectedChunker = CHUNKER_OPTIONS.find(opt => opt.value === config.chunkerType);
  const selectedTokenizer = TOKENIZER_OPTIONS.find(opt => opt.value === config.tokenizerType);
  const selectedProvider = EMBEDDING_PROVIDERS.find(opt => opt.value === config.embeddingProvider);

  // Check if all required configuration is complete based on chunker type
  const isConfigComplete = (() => {
    if (!hasSelectedChunker) return false;

    if (config.chunkerType === 'TokenChunker') {
      return hasSelectedTokenizer;
    }

    if (config.chunkerType === 'SemanticChunker' || config.chunkerType === 'NeuralChunker') {
      return hasSelectedProvider && hasSelectedModel;
    }

    // Other chunkers (SentenceChunker, RecursiveChunker, CodeChunker) only need chunker selected
    return true;
  })();

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


  // Render input text with chunk highlighting
  // Matches the chunks shown in Chunked Text Visualization
  const renderHighlightedInput = () => {
    if (!result) return null;

    type Segment = {
      text: string;
      chunkIndex: number; // -1 for unhighlighted, >= 0 for chunk index
      isOverlap: boolean;
    };

    const segments: Segment[] = [];

    // Helper: find chunk content in text using first few words as anchor
    const findChunkInText = (chunkContent: string, searchStart: number): { start: number; end: number } | null => {
      // First try exact match
      const exactIndex = text.indexOf(chunkContent, searchStart);
      if (exactIndex !== -1) {
        return { start: exactIndex, end: exactIndex + chunkContent.length };
      }

      // Extract first ~50 chars worth of words from chunk as anchor
      const words = chunkContent.trim().split(/\s+/).slice(0, 8);
      if (words.length === 0) return null;

      // Try to find anchor in text (search for first word, then verify subsequent words)
      const firstWord = words[0];
      let pos = searchStart;

      while (pos < text.length) {
        const foundFirst = text.indexOf(firstWord, pos);
        if (foundFirst === -1) break;

        // Verify this is the right match by checking subsequent words exist nearby
        let isMatch = true;
        let checkPos = foundFirst + firstWord.length;

        for (let w = 1; w < Math.min(words.length, 4); w++) {
          // Skip whitespace
          while (checkPos < text.length && /\s/.test(text[checkPos])) checkPos++;

          // Check if next word matches
          if (!text.substring(checkPos).startsWith(words[w])) {
            isMatch = false;
            break;
          }
          checkPos += words[w].length;
        }

        if (isMatch) {
          // Found the start, now find approximate end based on chunk content length
          // Count non-whitespace chars in chunk
          const chunkNonWsLen = chunkContent.replace(/\s+/g, '').length;

          // Find end position by counting same number of non-whitespace chars in text
          let nonWsCount = 0;
          let endPos = foundFirst;
          while (endPos < text.length && nonWsCount < chunkNonWsLen) {
            if (!/\s/.test(text[endPos])) nonWsCount++;
            endPos++;
          }

          return { start: foundFirst, end: endPos };
        }

        pos = foundFirst + 1;
      }

      return null;
    };

    // Determine actual character positions for each chunk
    const chunkPositions: Array<{ start: number; end: number; chunkIndex: number }> = [];

    for (let i = 0; i < result.chunks.length; i++) {
      const chunk = result.chunks[i];
      const apiStart = chunk.start_index;
      const apiEnd = chunk.end_index;

      // Check if API indices produce the correct content
      const textFromIndices = text.substring(apiStart, apiEnd);

      if (textFromIndices === chunk.content) {
        // API indices are correct
        chunkPositions.push({ start: apiStart, end: apiEnd, chunkIndex: i });
      } else {
        // API indices are wrong, find content in text with whitespace tolerance
        const searchStart = chunkPositions.length > 0
          ? chunkPositions[chunkPositions.length - 1].end
          : 0;

        const found = findChunkInText(chunk.content, searchStart);
        if (found) {
          chunkPositions.push({
            start: found.start,
            end: found.end,
            chunkIndex: i,
          });
        }
      }
    }

    // Build character-level map for overlap detection
    const charToChunks: Map<number, number[]> = new Map();
    for (const pos of chunkPositions) {
      for (let charPos = pos.start; charPos < pos.end && charPos < text.length; charPos++) {
        const existing = charToChunks.get(charPos) || [];
        existing.push(pos.chunkIndex);
        charToChunks.set(charPos, existing);
      }
    }

    // Build segments from character map
    let currentStart = 0;
    let currentChunks: number[] = charToChunks.get(0) || [];

    for (let pos = 1; pos <= text.length; pos++) {
      const chunksAtPos = pos < text.length ? (charToChunks.get(pos) || []) : [];
      const sameChunks = currentChunks.length === chunksAtPos.length &&
        currentChunks.every((c, i) => chunksAtPos[i] === c);

      if (!sameChunks || pos === text.length) {
        if (pos > currentStart) {
          segments.push({
            text: text.substring(currentStart, pos),
            chunkIndex: currentChunks.length > 0 ? currentChunks[0] : -1,
            isOverlap: currentChunks.length > 1,
          });
        }
        currentStart = pos;
        currentChunks = chunksAtPos;
      }
    }

    return (
      <div className="min-h-[400px] p-3 bg-background rounded-md border font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[500px] leading-7">
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

  // Render chunked output results
  const renderChunkedOutput = () => {
    if (!result) return null;

    const overlaps = getChunkOverlaps(result, config, text);
    const hasOverlaps = Object.values(overlaps).some(o => o.overlapWithPrev || o.overlapWithNext);

    return (
      <>
        <div className="min-h-[500px] p-4 bg-muted/30 rounded-md border overflow-auto max-h-[700px] space-y-3">
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
    <div className="w-[95%] max-w-[1400px] mx-auto p-6 space-y-6">
      {/* Top Row: Configuration + Input side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chunking Configuration */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Chunking Configuration
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handleChunk}
                  disabled={loading || !text.trim() || !isConfigComplete}
                  variant="outline"
                  size="sm"
                  className={`transition-colors ${
                    isConfigComplete
                      ? 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      {isConfigComplete ? 'Visualize Chunks' : 'Select configuration options'}
                    </>
                  )}
                </Button>
                {result && (
                  <Button
                    onClick={() => setResult(null)}
                    variant="outline"
                    size="sm"
                    className="border-muted-foreground/50 text-muted-foreground hover:bg-muted"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chunker Type Accordion */}
              <Accordion type="single" collapsible className="w-full" value={chunkerAccordion} onValueChange={setChunkerAccordion}>
                <AccordionItem value="chunker-type" className="border rounded-md px-3">
                  <AccordionTrigger className={`text-sm py-2 hover:no-underline ${hasSelectedChunker ? '[&>svg]:text-green-500' : '[&>svg]:text-amber-500'}`}>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-medium">Chunker Type</span>
                      {hasSelectedChunker ? (
                        <span className="text-xs text-green-500 font-normal">
                          {selectedChunker?.label || 'Token Chunker'}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 font-normal">
                          Select a chunker type
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      {CHUNKER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setConfig(prev => ({ ...prev, chunkerType: option.value as ChunkConfig['chunkerType'] }));
                            setHasSelectedChunker(true);
                            setTimeout(() => setChunkerAccordion(''), 300);
                          }}
                          className={`p-3 text-left rounded-md border transition-colors ${
                            hasSelectedChunker && config.chunkerType === option.value
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <div className="font-medium">
                            {option.label}
                          </div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div>
                <Label>Chunk Size: {config.chunkSize}</Label>
                <Slider
                  value={[config.chunkSize || 512]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, chunkSize: value }))}
                  max={1000}
                  min={10}
                  step={10}
                  className="mt-2"
                />
              </div>

              {config.chunkerType === 'TokenChunker' && (
                <div>
                  <Label>Chunk Overlap: {config.chunkOverlap}</Label>
                  <Slider
                    value={[config.chunkOverlap || 0]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, chunkOverlap: value }))}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>
              )}

              {(config.chunkerType === 'TokenChunker') && (
                <Accordion type="single" collapsible className="w-full" value={tokenizerAccordion} onValueChange={setTokenizerAccordion}>
                  <AccordionItem value="tokenizer-type" className="border rounded-md px-3">
                    <AccordionTrigger className={`text-sm py-2 hover:no-underline ${hasSelectedTokenizer ? '[&>svg]:text-green-500' : '[&>svg]:text-amber-500'}`}>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-medium">Tokenizer Type</span>
                        {hasSelectedTokenizer ? (
                          <span className="text-xs text-green-500 font-normal">
                            {selectedTokenizer?.label || 'Character Tokenizer'}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-500 font-normal">
                            Select a tokenizer type
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-2 pt-2">
                        {TOKENIZER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setConfig(prev => ({ ...prev, tokenizerType: option.value as ChunkConfig['tokenizerType'] }));
                              setHasSelectedTokenizer(true);
                              setTimeout(() => setTokenizerAccordion(''), 300);
                            }}
                            className={`p-2 text-left rounded-md border transition-colors ${
                              hasSelectedTokenizer && config.tokenizerType === option.value
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {(config.chunkerType === 'SemanticChunker' || config.chunkerType === 'NeuralChunker') && (
                <>
                  {/* Embedding Provider Accordion */}
                  <Accordion type="single" collapsible className="w-full" value={providerAccordion} onValueChange={setProviderAccordion}>
                    <AccordionItem value="embedding-provider" className="border rounded-md px-3">
                      <AccordionTrigger className={`text-sm py-2 hover:no-underline ${hasSelectedProvider ? '[&>svg]:text-green-500' : '[&>svg]:text-amber-500'}`}>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-medium">Embedding Provider</span>
                          {hasSelectedProvider ? (
                            <span className="text-xs text-green-500 font-normal">
                              {selectedProvider?.label || 'Sentence Transformers'}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-500 font-normal">
                              Select an embedding provider
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 gap-2 pt-2">
                          {EMBEDDING_PROVIDERS.map((provider) => (
                            <button
                              key={provider.value}
                              onClick={() => {
                                setConfig(prev => ({
                                  ...prev,
                                  embeddingProvider: provider.value as ChunkConfig['embeddingProvider'],
                                  embeddingModel: EMBEDDING_MODELS[provider.value]?.[0] || 'all-MiniLM-L6-v2'
                                }));
                                setHasSelectedProvider(true);
                                setHasSelectedModel(false); // Reset model selection when provider changes
                                setTimeout(() => setProviderAccordion(''), 300);
                              }}
                              className={`p-3 text-left rounded-md border transition-colors ${
                                hasSelectedProvider && config.embeddingProvider === provider.value
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : 'border-border hover:bg-muted'
                              }`}
                            >
                              <div className="font-medium flex items-center gap-2">
                                {provider.label}
                                {provider.authorised && (
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className={`text-sm ${provider.authorised ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {provider.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Embedding Model Accordion */}
                  {config.embeddingProvider && EMBEDDING_MODELS[config.embeddingProvider] && (
                    <Accordion type="single" collapsible className="w-full" value={modelAccordion} onValueChange={setModelAccordion}>
                      <AccordionItem value="embedding-model" className="border rounded-md px-3">
                        <AccordionTrigger className={`text-sm py-2 hover:no-underline ${hasSelectedModel ? '[&>svg]:text-green-500' : '[&>svg]:text-amber-500'}`}>
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">Embedding Model</span>
                            {hasSelectedModel ? (
                              <span className="text-xs text-green-500 font-normal">
                                {config.embeddingModel || 'all-MiniLM-L6-v2'}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-500 font-normal">
                                Select an embedding model
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 gap-2 pt-2">
                            {EMBEDDING_MODELS[config.embeddingProvider].map((model) => (
                              <button
                                key={model}
                                onClick={() => {
                                  setConfig(prev => ({ ...prev, embeddingModel: model }));
                                  setHasSelectedModel(true);
                                  setTimeout(() => setModelAccordion(''), 300);
                                }}
                                className={`p-2 text-left rounded-md border transition-colors ${
                                  hasSelectedModel && config.embeddingModel === model
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : 'border-border hover:bg-muted'
                                }`}
                              >
                                {model}
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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
          </CardContent>
        </Card>

        {/* Right: Input Text */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Input Text
              {result && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  (Highlighted)
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {result
                ? 'Text with chunk highlighting - click Edit to modify'
                : 'Enter your markdown or text content to be chunked'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Show highlighted view when results exist, otherwise show editable textarea */}
            {result ? (
              renderHighlightedInput()
            ) : (
              <Textarea
                placeholder="Enter your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[400px] font-mono"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Output Results (only shown when there are results or errors) */}
      {(result || error) && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Chunked Text Visualization
            </CardTitle>
            {result && (
              <CardDescription>
                {result.total_chunks} chunks created in {result.processing_time.toFixed(2)}ms
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {renderChunkedOutput()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
