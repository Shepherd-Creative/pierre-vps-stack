'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { ChunkConfig, ChunkResponse } from '@/types/chonkie';

interface PanelState {
  config: ChunkConfig;
  result: ChunkResponse | null;
  loading: boolean;
  error: string | null;
}

interface ComparisonState {
  sharedText: string;
  leftPanel: PanelState;
  rightPanel: PanelState;
}

type ComparisonAction =
  | { type: 'SET_TEXT'; text: string }
  | { type: 'UPDATE_LEFT_CONFIG'; config: Partial<ChunkConfig> }
  | { type: 'UPDATE_RIGHT_CONFIG'; config: Partial<ChunkConfig> }
  | { type: 'SET_LEFT_LOADING'; loading: boolean }
  | { type: 'SET_RIGHT_LOADING'; loading: boolean }
  | { type: 'SET_LEFT_RESULT'; result: ChunkResponse | null }
  | { type: 'SET_RIGHT_RESULT'; result: ChunkResponse | null }
  | { type: 'SET_LEFT_ERROR'; error: string | null }
  | { type: 'SET_RIGHT_ERROR'; error: string | null };

const DEFAULT_TEXT = `The Critical Role of Chunking in RAG Applications

How Strategic Text Segmentation Determines Retrieval Quality and System Performance

Chunking represents one of the most consequential yet often underestimated design decisions in Retrieval-Augmented Generation systems. The process of dividing source documents into smaller, semantically coherent segments directly impacts retrieval accuracy, context relevance, and ultimately the quality of generated responses. Poor chunking strategies lead to fragmented context, where critical information spans multiple chunks, or bloated retrievals that overwhelm the model's context window with irrelevant details. The art and science of chunking requires balancing granularity with coherence—segments must be small enough for precise retrieval yet large enough to preserve meaningful context.

The relationship between chunk size and retrieval performance follows a nuanced curve rather than a linear progression. Smaller chunks (100-200 tokens) enable pinpoint accuracy for specific facts but risk losing surrounding context that provides necessary interpretation. Larger chunks (500-1000 tokens) preserve narrative flow and relationships but may dilute relevance scores when only a portion of the content matches the query. Advanced chunking strategies now employ semantic segmentation—analyzing document structure, topic boundaries, and discourse patterns rather than arbitrary token counts. This approach, combined with overlapping windows that allow chunks to share boundary content, helps maintain contextual threads across segments.

Modern RAG architectures increasingly treat chunking as a multi-dimensional problem requiring adaptive strategies based on content type and use case. Technical documentation benefits from structure-aware chunking that respects hierarchies like headers, code blocks, and procedure steps. Conversational data requires different treatment, where turn boundaries and topic shifts guide segmentation. Knowledge graph-enhanced systems like LightRAG can leverage entity relationships to inform chunk boundaries, creating segments that preserve meaningful connections between concepts rather than arbitrary splits that sever semantic links.

The downstream effects of chunking decisions cascade through every component of a RAG system. Vector embeddings generated from well-formed chunks produce more discriminative representations in semantic space, improving retrieval precision. Chunk metadata—including position, parent document, and structural role—enables sophisticated reranking and context assembly strategies. As RAG systems evolve toward agentic architectures with multi-hop reasoning, the ability to efficiently traverse and recombine chunks becomes paramount. Investing time in chunking strategy optimization often yields greater performance gains than switching embedding models or adjusting retrieval parameters, making it a leverage point that deserves careful consideration in any production RAG implementation.`;

const initialConfig: ChunkConfig = {
  chunkerType: 'TokenChunker',
  chunkSize: 100,
  chunkOverlap: 20,
  tokenizerType: 'CharacterTokenizer',
  embeddingProvider: 'sentence-transformers',
  embeddingModel: 'all-MiniLM-L6-v2',
  semanticThreshold: 0.3,
};

const initialState: ComparisonState = {
  sharedText: DEFAULT_TEXT,
  leftPanel: {
    config: { ...initialConfig },
    result: null,
    loading: false,
    error: null,
  },
  rightPanel: {
    config: { ...initialConfig, chunkerType: 'SentenceChunker' },
    result: null,
    loading: false,
    error: null,
  },
};

function comparisonReducer(state: ComparisonState, action: ComparisonAction): ComparisonState {
  switch (action.type) {
    case 'SET_TEXT':
      return { ...state, sharedText: action.text };
    case 'UPDATE_LEFT_CONFIG':
      return {
        ...state,
        leftPanel: {
          ...state.leftPanel,
          config: { ...state.leftPanel.config, ...action.config },
        },
      };
    case 'UPDATE_RIGHT_CONFIG':
      return {
        ...state,
        rightPanel: {
          ...state.rightPanel,
          config: { ...state.rightPanel.config, ...action.config },
        },
      };
    case 'SET_LEFT_LOADING':
      return { ...state, leftPanel: { ...state.leftPanel, loading: action.loading } };
    case 'SET_RIGHT_LOADING':
      return { ...state, rightPanel: { ...state.rightPanel, loading: action.loading } };
    case 'SET_LEFT_RESULT':
      return { ...state, leftPanel: { ...state.leftPanel, result: action.result } };
    case 'SET_RIGHT_RESULT':
      return { ...state, rightPanel: { ...state.rightPanel, result: action.result } };
    case 'SET_LEFT_ERROR':
      return { ...state, leftPanel: { ...state.leftPanel, error: action.error } };
    case 'SET_RIGHT_ERROR':
      return { ...state, rightPanel: { ...state.rightPanel, error: action.error } };
    default:
      return state;
  }
}

const ComparisonContext = createContext<{
  state: ComparisonState;
  dispatch: React.Dispatch<ComparisonAction>;
} | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(comparisonReducer, initialState);

  return (
    <ComparisonContext.Provider value={{ state, dispatch }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useComparison must be used within ComparisonProvider');
  return context;
}
