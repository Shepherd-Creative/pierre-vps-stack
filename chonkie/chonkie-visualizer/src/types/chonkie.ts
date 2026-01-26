export interface ChunkConfig {
  chunkerType: 'TokenChunker' | 'SentenceChunker' | 'RecursiveChunker' | 'SemanticChunker' | 'CodeChunker' | 'NeuralChunker';

  // Conditionally applicable
  chunkSize?: number;
  chunkOverlap?: number;

  // TokenChunker
  tokenizerType?: 'CharacterTokenizer' | 'WordTokenizer';

  // SentenceChunker & SemanticChunker
  minSentencesPerChunk?: number;
  minCharactersPerSentence?: number;

  // SemanticChunker
  embeddingProvider?: 'sentence-transformers' | 'model2vec' | 'openai' | 'cohere' | 'gemini' | 'jina' | 'voyage' | 'auto';
  embeddingModel?: string;
  semanticThreshold?: number;
  similarityWindow?: number;
  skipWindow?: number;

  // CodeChunker
  language?: string;
  includeNodes?: boolean;

  // RecursiveChunker & NeuralChunker
  minCharactersPerChunk?: number;

  // NeuralChunker
  neuralModel?: string;
  deviceMap?: string;
  stride?: number;
}

export interface ChunkResult {
  content: string;
  index: number;
  start_index: number;
  end_index: number;
  token_count?: number;
  embedding?: number[];
  has_embedding?: boolean;
  embedding_dimension?: number;
}

export interface ChunkResponse {
  chunks: ChunkResult[];
  total_chunks: number;
  total_tokens?: number;
  processing_time: number;
  config: ChunkConfig;
}

export interface EmbeddingVisualization {
  x: number;
  y: number;
  chunkIndex: number;
  similarity?: number;
}