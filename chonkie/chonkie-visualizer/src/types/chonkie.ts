export interface ChunkConfig {
  chunkerType: 'TokenChunker' | 'SentenceChunker' | 'RecursiveChunker' | 'SemanticChunker' | 'CodeChunker' | 'NeuralChunker';
  chunkSize: number;
  chunkOverlap: number;
  tokenizerType?: 'CharacterTokenizer' | 'WordTokenizer';
  embeddingProvider?: 'sentence-transformers' | 'openai' | 'cohere' | 'gemini' | 'jina' | 'voyage' | 'auto';
  embeddingModel?: string;
  semanticThreshold?: number;
  language?: string;
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