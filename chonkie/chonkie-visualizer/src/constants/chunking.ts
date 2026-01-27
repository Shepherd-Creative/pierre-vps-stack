// Shared constants for chunking configuration
// Used by ConfigPanel.tsx and ChunkVisualizer.tsx

export const CHUNKER_OPTIONS = [
  { value: 'TokenChunker', label: 'Token Chunker', description: 'Fixed-size chunks with optional overlap', requiresEmbeddings: false },
  { value: 'SentenceChunker', label: 'Sentence Chunker', description: 'Sentence-boundary aware chunking', requiresEmbeddings: false },
  { value: 'RecursiveChunker', label: 'Recursive Chunker', description: 'Hierarchical splitting (paragraphs → sentences → words)', requiresEmbeddings: false },
  { value: 'SemanticChunker', label: 'Semantic Chunker', description: 'AI-powered semantic boundary detection', requiresEmbeddings: true },
  { value: 'CodeChunker', label: 'Code Chunker', description: 'Syntax-aware code chunking with tree-sitter', requiresEmbeddings: false },
  { value: 'NeuralChunker', label: 'Neural Chunker', description: 'Neural model predicts optimal split points', requiresEmbeddings: true },
];

export const TOKENIZER_OPTIONS = [
  { value: 'CharacterTokenizer', label: 'Character Tokenizer' },
  { value: 'WordTokenizer', label: 'Word Tokenizer' },
];

export const EMBEDDING_PROVIDERS = [
  { value: 'sentence-transformers', label: 'Sentence Transformers (Local)', description: 'Free, runs locally', authorised: false },
  { value: 'model2vec', label: 'Model2Vec (Local)', description: 'Free, runs locally', authorised: false },
  { value: 'openai', label: 'OpenAI Embeddings', description: 'API Key Authorised', authorised: true },
  // Uncomment these when API keys are configured:
  // { value: 'cohere', label: 'Cohere Embeddings', description: 'Requires API key', authorised: false },
  // { value: 'gemini', label: 'Google Gemini', description: 'Requires API key', authorised: false },
  // { value: 'jina', label: 'Jina AI', description: 'Requires API key', authorised: false },
  // { value: 'voyage', label: 'Voyage AI', description: 'Requires API key', authorised: false },
  { value: 'auto', label: 'Auto (Best Available)', description: 'Automatically selects', authorised: false },
];

export const EMBEDDING_MODELS: { [key: string]: string[] } = {
  'sentence-transformers': [
    'all-MiniLM-L6-v2',
    'all-mpnet-base-v2',
    'multi-qa-MiniLM-L6-cos-v1',
    'paraphrase-multilingual-MiniLM-L12-v2'
  ],
  'model2vec': [
    'minishlab/potion-base-32M'
  ],
  'openai': [
    'text-embedding-3-small',
    'text-embedding-3-large',
    'text-embedding-ada-002'
  ],
  // Uncomment these when API keys are configured:
  // 'cohere': [
  //   'embed-english-v3.0',
  //   'embed-multilingual-v3.0'
  // ],
  // 'gemini': [
  //   'embedding-001'
  // ],
  // 'jina': [
  //   'jina-embeddings-v2-base-en'
  // ],
  // 'voyage': [
  //   'voyage-2'
  // ],
  'auto': [
    'auto'
  ]
};

export const CODE_LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

export const PARAMETER_VISIBILITY: Record<string, string[]> = {
  chunkSize: ['TokenChunker', 'SentenceChunker', 'RecursiveChunker', 'SemanticChunker', 'CodeChunker'],
  chunkOverlap: ['TokenChunker', 'SentenceChunker'],
  tokenizerType: ['TokenChunker'],
  embeddingProvider: ['SemanticChunker'],
  semanticThreshold: ['SemanticChunker'],
  language: ['CodeChunker'],
  neuralModel: ['NeuralChunker'],
  minCharactersPerChunk: ['RecursiveChunker', 'NeuralChunker'],
};

export const shouldShowParameter = (param: string, chunkerType: string): boolean => {
  return PARAMETER_VISIBILITY[param]?.includes(chunkerType) ?? false;
};
