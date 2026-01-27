'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Eye } from 'lucide-react';
import type { ChunkConfig } from '@/types/chonkie';
import {
  CHUNKER_OPTIONS,
  TOKENIZER_OPTIONS,
  EMBEDDING_PROVIDERS,
  EMBEDDING_MODELS,
  CODE_LANGUAGES,
  PARAMETER_VISIBILITY,
  shouldShowParameter,
} from '@/constants/chunking';

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

  return (
    <div className="space-y-4">
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
                    onConfigChange({ chunkerType: option.value as ChunkConfig['chunkerType'] });
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

      {shouldShowParameter('chunkSize', config.chunkerType) && (
        <div>
          <Label>Max Tokens Per Chunk: {config.chunkSize}</Label>
          <Slider
            value={[config.chunkSize || 512]}
            onValueChange={([value]) => onConfigChange({ chunkSize: value })}
            max={1000}
            min={10}
            step={10}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {config.chunkerType === 'TokenChunker' && 'Hard limit - chunks will be split to respect this exactly'}
            {config.chunkerType === 'SentenceChunker' && 'Soft limit - sentences won\'t be split even if they exceed this'}
            {config.chunkerType === 'RecursiveChunker' && 'Target limit - uses hierarchical splitting to approach this size'}
            {config.chunkerType === 'SemanticChunker' && 'Target limit - semantic boundaries take priority'}
            {config.chunkerType === 'CodeChunker' && 'Target limit - syntax boundaries take priority'}
          </p>
        </div>
      )}

      {shouldShowParameter('chunkOverlap', config.chunkerType) && (
        <div>
          <Label>Chunk Overlap: {config.chunkOverlap}</Label>
          <Slider
            value={[config.chunkOverlap || 0]}
            onValueChange={([value]) => onConfigChange({ chunkOverlap: value })}
            max={100}
            min={0}
            step={5}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Number of tokens to overlap between consecutive chunks
          </p>
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
                      onConfigChange({ tokenizerType: option.value as ChunkConfig['tokenizerType'] });
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

      {config.chunkerType === 'CodeChunker' && (
        <div>
          <Label>Programming Language</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CODE_LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => onConfigChange({ language: lang.value })}
                className={`p-2 text-sm rounded-md border ${
                  (config.language || 'auto') === lang.value
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Specify the programming language for syntax-aware chunking. Auto-detect works for most cases.
          </p>
        </div>
      )}

      {config.chunkerType === 'SemanticChunker' && (
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
                        onConfigChange({
                          embeddingProvider: provider.value as ChunkConfig['embeddingProvider'],
                          embeddingModel: EMBEDDING_MODELS[provider.value]?.[0] || 'all-MiniLM-L6-v2'
                        });
                        setHasSelectedProvider(true);
                        setHasSelectedModel(false);
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
                          onConfigChange({ embeddingModel: model });
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
            <p className="text-xs text-muted-foreground mt-1">
              Similarity threshold for chunk boundaries. Lower values (0.3-0.5) create more, smaller chunks. Higher values (0.7-0.9) create fewer, larger chunks.
            </p>
          </div>
        </>
      )}

      {/* Advanced Settings Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced" className="border rounded-md px-3">
          <AccordionTrigger className="text-sm py-2 hover:no-underline">
            <span className="font-medium">Advanced Settings</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {/* SemanticChunker advanced */}
              {config.chunkerType === 'SemanticChunker' && (
                <>
                  <div>
                    <Label>Similarity Window: {config.similarityWindow || 3}</Label>
                    <Slider
                      value={[config.similarityWindow || 3]}
                      onValueChange={([value]) => onConfigChange({ similarityWindow: value })}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Number of sentences used for similarity calculation
                    </p>
                  </div>

                  <div>
                    <Label>Skip Window: {config.skipWindow || 0}</Label>
                    <Slider
                      value={[config.skipWindow || 0]}
                      onValueChange={([value]) => onConfigChange({ skipWindow: value })}
                      max={10}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Window for merging non-consecutive groups
                    </p>
                  </div>

                  <div>
                    <Label>Min Sentences Per Chunk: {config.minSentencesPerChunk || 1}</Label>
                    <Slider
                      value={[config.minSentencesPerChunk || 1]}
                      onValueChange={([value]) => onConfigChange({ minSentencesPerChunk: value })}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Min Characters Per Sentence: {config.minCharactersPerSentence || 24}</Label>
                    <Slider
                      value={[config.minCharactersPerSentence || 24]}
                      onValueChange={([value]) => onConfigChange({ minCharactersPerSentence: value })}
                      max={100}
                      min={5}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </>
              )}

              {/* SentenceChunker advanced */}
              {config.chunkerType === 'SentenceChunker' && (
                <>
                  <div>
                    <Label>Min Sentences Per Chunk: {config.minSentencesPerChunk || 1}</Label>
                    <Slider
                      value={[config.minSentencesPerChunk || 1]}
                      onValueChange={([value]) => onConfigChange({ minSentencesPerChunk: value })}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Min Characters Per Sentence: {config.minCharactersPerSentence || 12}</Label>
                    <Slider
                      value={[config.minCharactersPerSentence || 12]}
                      onValueChange={([value]) => onConfigChange({ minCharactersPerSentence: value })}
                      max={50}
                      min={5}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </>
              )}

              {/* RecursiveChunker advanced */}
              {config.chunkerType === 'RecursiveChunker' && (
                <div>
                  <Label>Min Characters Per Chunk: {config.minCharactersPerChunk || 24}</Label>
                  <Slider
                    value={[config.minCharactersPerChunk || 24]}
                    onValueChange={([value]) => onConfigChange({ minCharactersPerChunk: value })}
                    max={200}
                    min={10}
                    step={5}
                    className="mt-2"
                  />
                </div>
              )}

              {/* NeuralChunker advanced */}
              {config.chunkerType === 'NeuralChunker' && (
                <>
                  <div>
                    <Label>Neural Model</Label>
                    <div className="p-3 bg-muted rounded-md text-sm font-mono">
                      mirth/chonky_distilbert_base_uncased_1
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pre-trained neural model for chunk boundary detection
                    </p>
                  </div>

                  <div>
                    <Label>Min Characters Per Chunk (1 token ≈ 4 chars): {config.minCharactersPerChunk || 10}</Label>
                    <Slider
                      value={[config.minCharactersPerChunk || 10]}
                      onValueChange={([value]) => onConfigChange({ minCharactersPerChunk: value })}
                      max={800}
                      min={5}
                      step={5}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum floor - neural model decides boundaries above this
                    </p>
                  </div>
                </>
              )}

              {/* CodeChunker advanced */}
              {config.chunkerType === 'CodeChunker' && (
                <div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.includeNodes || false}
                      onChange={(e) => onConfigChange({ includeNodes: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span>Include Tree-Sitter Nodes</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Include syntax tree nodes in chunk output
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        onClick={onProcess}
        disabled={loading || disabled || !isConfigComplete}
        variant="outline"
        className={`w-full transition-colors ${
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
            {isConfigComplete ? 'Process' : 'Select configuration options'}
          </>
        )}
      </Button>
    </div>
  );
}
