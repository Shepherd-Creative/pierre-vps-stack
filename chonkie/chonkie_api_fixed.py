#!/usr/bin/env python3
import os
import json
import time
from typing import Dict, Any, List, Optional, Union
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import chonkie
except ImportError:
    raise ImportError("Chonkie not installed")

app = FastAPI(title="Chonkie API", description="Chonkie text chunking service with proper parameter mapping")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChunkConfig(BaseModel):
    # Common parameters
    chunkerType: str = 'TokenChunker'
    chunkSize: int = 100
    chunkOverlap: int = 20
    
    # Tokenizer settings
    tokenizerType: Optional[str] = 'CharacterTokenizer'
    
    # Embedding settings (for semantic chunkers)
    embeddingProvider: Optional[str] = 'sentence-transformers'
    embeddingModel: Optional[str] = 'all-MiniLM-L6-v2'
    
    # SemanticChunker specific
    semanticThreshold: Optional[float] = 0.3
    similarityWindow: Optional[int] = 1
    minSentencesPerChunk: Optional[int] = 1
    minCharactersPerSentence: Optional[int] = 10
    skipWindow: Optional[int] = 1
    
    # SentenceChunker specific  
    approximate: Optional[bool] = False
    delim: Optional[str] = '.'
    includeDelim: Optional[bool] = True
    
    # RecursiveChunker specific
    rules: Optional[List[str]] = None
    minCharactersPerChunk: Optional[int] = 50
    
    # CodeChunker specific
    language: Optional[str] = None
    includeNodes: Optional[List[str]] = None
    
    # NeuralChunker specific
    neuralModel: Optional[str] = None
    deviceMap: Optional[str] = 'auto'
    stride: Optional[int] = 50
    
    # SlumberChunker specific
    genie: Optional[str] = None
    candidateSize: Optional[int] = 100
    verbose: Optional[bool] = False

class ChunkRequest(BaseModel):
    text: str
    config: ChunkConfig

class ChunkResult(BaseModel):
    content: str
    index: int
    start_index: int
    end_index: int
    token_count: Optional[int] = None

class ChunkResponse(BaseModel):
    chunks: List[ChunkResult]
    total_chunks: int
    processing_time: float
    config: ChunkConfig

def get_embeddings(embedding_provider: str = 'sentence-transformers', model: str = 'all-MiniLM-L6-v2'):
    """Get embeddings based on provider"""
    try:
        if embedding_provider == 'openai':
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OpenAI API key not found")
            return chonkie.OpenAIEmbeddings(api_key=api_key, model=model)
        
        elif embedding_provider == 'cohere':
            api_key = os.getenv('COHERE_API_KEY')
            if not api_key:
                raise ValueError("Cohere API key not found")
            return chonkie.CohereEmbeddings(api_key=api_key, model=model)
        
        elif embedding_provider == 'gemini':
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("Gemini API key not found")
            return chonkie.GeminiEmbeddings(api_key=api_key, model=model)
        
        elif embedding_provider == 'jina':
            api_key = os.getenv('JINA_API_KEY')
            if not api_key:
                raise ValueError("Jina API key not found")
            return chonkie.JinaEmbeddings(api_key=api_key, model=model)
        
        elif embedding_provider == 'voyage':
            api_key = os.getenv('VOYAGE_API_KEY')
            if not api_key:
                raise ValueError("Voyage API key not found")
            return chonkie.VoyageEmbeddings(api_key=api_key, model=model)
        
        else:  # sentence-transformers (default)
            return chonkie.SentenceTransformerEmbeddings(model=model)
    
    except Exception as e:
        # Fallback to sentence transformers
        try:
            return chonkie.SentenceTransformerEmbeddings(model='all-MiniLM-L6-v2')
        except:
            raise ValueError(f"Failed to initialize embeddings: {str(e)}")

def get_tokenizer(tokenizer_type: str = 'CharacterTokenizer'):
    """Get tokenizer based on type"""
    if tokenizer_type == 'WordTokenizer':
        return chonkie.WordTokenizer()
    else:  # Default to CharacterTokenizer
        return chonkie.CharacterTokenizer()

def create_chunker(config: ChunkConfig):
    """Create chunker with proper parameter mapping"""
    chunker_type = config.chunkerType
    
    try:
        if chunker_type == 'TokenChunker':
            tokenizer = get_tokenizer(config.tokenizerType)
            return chonkie.TokenChunker(
                tokenizer=tokenizer,
                chunk_size=config.chunkSize,
                chunk_overlap=config.chunkOverlap
            )
        
        elif chunker_type == 'SentenceChunker':
            tokenizer = get_tokenizer(config.tokenizerType)
            return chonkie.SentenceChunker(
                tokenizer_or_token_counter=tokenizer,
                chunk_size=config.chunkSize,
                chunk_overlap=config.chunkOverlap,
                min_sentences_per_chunk=config.minSentencesPerChunk or 1,
                min_characters_per_sentence=config.minCharactersPerSentence or 10,
                approximate=config.approximate or False,
                delim=config.delim or '.'
            )
        
        elif chunker_type == 'RecursiveChunker':
            tokenizer = get_tokenizer(config.tokenizerType)
            rules = config.rules or ['\n\n', '\n', '. ', ' ']
            return chonkie.RecursiveChunker(
                tokenizer_or_token_counter=tokenizer,
                chunk_size=config.chunkSize,
                rules=rules,
                min_characters_per_chunk=config.minCharactersPerChunk or 50
            )
        
        elif chunker_type == 'SemanticChunker':
            embeddings = get_embeddings(config.embeddingProvider, config.embeddingModel)
            return chonkie.SemanticChunker(
                embedding_model=embeddings,
                threshold=config.semanticThreshold or 0.3,
                chunk_size=config.chunkSize,
                similarity_window=config.similarityWindow or 1,
                min_sentences_per_chunk=config.minSentencesPerChunk or 1,
                min_characters_per_sentence=config.minCharactersPerSentence or 10,
                delim=config.delim or '.',
                skip_window=config.skipWindow or 1
            )
        
        elif chunker_type == 'CodeChunker':
            tokenizer = get_tokenizer(config.tokenizerType)
            include_nodes = config.includeNodes or ['class', 'function', 'method']
            return chonkie.CodeChunker(
                tokenizer_or_token_counter=tokenizer,
                chunk_size=config.chunkSize,
                language=config.language,
                include_nodes=include_nodes
            )
        
        elif chunker_type == 'NeuralChunker':
            tokenizer = get_tokenizer(config.tokenizerType)
            model = config.neuralModel or 'microsoft/DialoGPT-medium'
            return chonkie.NeuralChunker(
                model=model,
                tokenizer=tokenizer,
                device_map=config.deviceMap or 'auto',
                min_characters_per_chunk=config.minCharactersPerChunk or 50,
                stride=config.stride or 50
            )
        
        elif chunker_type == 'LateChunker':
            embeddings = get_embeddings(config.embeddingProvider, config.embeddingModel)
            rules = config.rules or ['\n\n', '\n', '. ', ' ']
            return chonkie.LateChunker(
                embedding_model=embeddings,
                chunk_size=config.chunkSize,
                rules=rules,
                min_characters_per_chunk=config.minCharactersPerChunk or 50
            )
        
        elif chunker_type == 'SlumberChunker':
            tokenizer = get_tokenizer(config.tokenizerType)
            genie = config.genie or 'openai'  # Default LLM
            rules = config.rules or ['\n\n', '\n', '. ', ' ']
            return chonkie.SlumberChunker(
                genie=genie,
                tokenizer_or_token_counter=tokenizer,
                chunk_size=config.chunkSize,
                rules=rules,
                candidate_size=config.candidateSize or 100,
                min_characters_per_chunk=config.minCharactersPerChunk or 50,
                verbose=config.verbose or False
            )
        
        else:
            # Fallback to TokenChunker
            tokenizer = get_tokenizer()
            return chonkie.TokenChunker(
                tokenizer=tokenizer,
                chunk_size=config.chunkSize,
                chunk_overlap=config.chunkOverlap
            )
    
    except Exception as e:
        print(f"Error creating {chunker_type}: {e}")
        # Fallback to simple TokenChunker
        return chonkie.TokenChunker(
            tokenizer=chonkie.CharacterTokenizer(),
            chunk_size=config.chunkSize,
            chunk_overlap=config.chunkOverlap
        )

@app.get("/")
async def root():
    return {"message": "Chonkie API is running with proper parameter mapping"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chunk", response_model=ChunkResponse)
async def chunk_text(request: ChunkRequest):
    try:
        start_time = time.time()
        
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="No text provided")
        
        # Limit text length to prevent memory issues
        text = request.text[:50000]
        
        # Create chunker with proper parameters
        chunker = create_chunker(request.config)
        
        # Process text
        chunks = chunker.chunk(text)
        
        # Format results
        chunk_list = []
        for i, chunk in enumerate(chunks):
            chunk_data = ChunkResult(
                content=chunk.text if hasattr(chunk, 'text') else str(chunk),
                index=i,
                start_index=getattr(chunk, 'start_index', 0),
                end_index=getattr(chunk, 'end_index', len(str(chunk))),
                token_count=getattr(chunk, 'token_count', len(str(chunk).split()))
            )
            chunk_list.append(chunk_data)
        
        processing_time = time.time() - start_time
        
        result = ChunkResponse(
            chunks=chunk_list,
            total_chunks=len(chunk_list),
            processing_time=processing_time,
            config=request.config
        )
        
        return result
        
    except Exception as e:
        print(f"Chunking error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)