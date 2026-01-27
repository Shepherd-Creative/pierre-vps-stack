#!/usr/bin/env python3
import os
import json
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import chonkie
except ImportError:
    raise ImportError("Chonkie not installed")

app = FastAPI(title="Chonkie API", description="Chonkie text chunking service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChunkConfig(BaseModel):
    chunkerType: str = 'TokenChunker'
    chunkSize: Optional[int] = 512
    chunkOverlap: Optional[int] = 0
    tokenizerType: Optional[str] = 'CharacterTokenizer'
    embeddingProvider: Optional[str] = 'sentence-transformers'
    embeddingModel: Optional[str] = 'all-MiniLM-L6-v2'
    semanticThreshold: Optional[float] = 0.5
    language: Optional[str] = 'auto'

    # Advanced parameters
    similarityWindow: Optional[int] = 3
    skipWindow: Optional[int] = 0
    minSentencesPerChunk: Optional[int] = 1
    minCharactersPerSentence: Optional[int] = None  # Differs by chunker
    minCharactersPerChunk: Optional[int] = None
    includeNodes: Optional[bool] = False
    neuralModel: Optional[str] = None
    deviceMap: Optional[str] = 'auto'
    stride: Optional[int] = None

class ChunkRequest(BaseModel):
    text: str
    config: ChunkConfig
    override_limit: Optional[bool] = False

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
    config: dict

def get_embeddings(embedding_provider: str = 'sentence-transformers', **kwargs):
    """Get embeddings based on provider"""
    model = kwargs.get('model', 'all-MiniLM-L6-v2')

    print(f"[Embeddings] Initializing {embedding_provider} with model: {model}")

    if embedding_provider == 'openai':
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OpenAI API key not found. Please set OPENAI_API_KEY environment variable.")
        return chonkie.OpenAIEmbeddings(api_key=api_key, model=model)

    elif embedding_provider == 'cohere':
        api_key = os.getenv('COHERE_API_KEY')
        if not api_key:
            raise ValueError("Cohere API key not found. Please set COHERE_API_KEY environment variable.")
        return chonkie.CohereEmbeddings(api_key=api_key, model=model)

    elif embedding_provider == 'gemini':
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("Gemini API key not found. Please set GEMINI_API_KEY environment variable.")
        return chonkie.GeminiEmbeddings(api_key=api_key, model=model)

    elif embedding_provider == 'jina':
        api_key = os.getenv('JINA_API_KEY')
        if not api_key:
            raise ValueError("Jina API key not found. Please set JINA_API_KEY environment variable.")
        return chonkie.JinaEmbeddings(api_key=api_key, model=model)

    elif embedding_provider == 'voyage':
        api_key = os.getenv('VOYAGE_API_KEY')
        if not api_key:
            raise ValueError("Voyage API key not found. Please set VOYAGE_API_KEY environment variable.")
        return chonkie.VoyageEmbeddings(api_key=api_key, model=model)

    elif embedding_provider == 'model2vec':
        return chonkie.Model2VecEmbeddings(model=model)

    else:  # sentence-transformers (default)
        return chonkie.SentenceTransformerEmbeddings(model=model)

def get_tokenizer(tokenizer_type: str = 'CharacterTokenizer'):
    """Get tokenizer based on type"""
    if tokenizer_type == 'WordTokenizer':
        return chonkie.WordTokenizer()
    else:  # Default to CharacterTokenizer
        return chonkie.CharacterTokenizer()

def create_chunker(config: ChunkConfig):
    """Create chunker based on configuration"""
    chunk_size = config.chunkSize
    chunk_overlap = config.chunkOverlap

    print(f"[Chunker] Creating {config.chunkerType} with chunk_size={chunk_size}")

    if config.chunkerType == 'TokenChunker':
        tokenizer = get_tokenizer(config.tokenizerType)
        return chonkie.TokenChunker(tokenizer=tokenizer, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    elif config.chunkerType == 'SentenceChunker':
        params = {
            'chunk_size': chunk_size
        }
        if config.minSentencesPerChunk is not None:
            params['min_sentences_per_chunk'] = config.minSentencesPerChunk
        if config.minCharactersPerSentence is not None:
            params['min_characters_per_sentence'] = config.minCharactersPerSentence
        return chonkie.SentenceChunker(**params)

    elif config.chunkerType == 'RecursiveChunker':
        params = {'chunk_size': chunk_size}
        if config.minCharactersPerChunk is not None:
            params['min_characters_per_chunk'] = config.minCharactersPerChunk
        return chonkie.RecursiveChunker(**params)

    elif config.chunkerType == 'SemanticChunker':
        embeddings = get_embeddings(
            config.embeddingProvider,
            model=config.embeddingModel
        )
        threshold = config.semanticThreshold

        # Get advanced semantic parameters (use defaults if None)
        similarity_window = config.similarityWindow if config.similarityWindow is not None else 3
        min_sentences_per_chunk = config.minSentencesPerChunk if config.minSentencesPerChunk is not None else 1
        min_characters_per_sentence = config.minCharactersPerSentence if config.minCharactersPerSentence is not None else 24
        include_delim = getattr(config, 'includeDelim', None)

        # Handle delimiter settings properly
        # Default to "prev" (library default) to preserve punctuation at end of sentences
        if include_delim == "" or include_delim == "none":
            include_delim = None
        elif include_delim is None or include_delim not in ['prev', 'next', None]:
            include_delim = "prev"  # Default to "prev" to preserve sentence-ending punctuation

        return chonkie.SemanticChunker(
            embedding_model=embeddings,
            threshold=threshold,
            chunk_size=chunk_size,
            similarity_window=similarity_window,
            min_sentences_per_chunk=min_sentences_per_chunk,
            min_characters_per_sentence=min_characters_per_sentence,
            include_delim=include_delim,
            skip_window=0  # Explicitly disable skip window to prevent overlap-like behavior
        )

    elif config.chunkerType == 'NeuralChunker':
        params = {
            'model': 'mirth/chonky_distilbert_base_uncased_1',
            'device_map': 'auto'
        }
        if config.minCharactersPerChunk is not None:
            params['min_characters_per_chunk'] = config.minCharactersPerChunk
        return chonkie.NeuralChunker(**params)

    elif config.chunkerType == 'CodeChunker':
        language = getattr(config, 'language', 'auto') or 'auto'
        params = {
            'chunk_size': chunk_size,
            'language': language
        }
        if config.includeNodes is not None:
            params['include_nodes'] = config.includeNodes
        return chonkie.CodeChunker(**params)

    else:
        # Default to TokenChunker
        tokenizer = get_tokenizer()
        return chonkie.TokenChunker(tokenizer=tokenizer, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

@app.get("/")
async def root():
    return {"message": "Chonkie API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chunk", response_model=ChunkResponse)
async def chunk_text(request: ChunkRequest):
    try:
        start_time = time.time()
        
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="No text provided")
        
        # Define chunker-specific limits
        chunker_limits = {
            'TokenChunker': 25000,
            'SentenceChunker': 25000,
            'RecursiveChunker': 15000,
            'SemanticChunker': 8000,
            'CodeChunker': 20000,
            'NeuralChunker': 5000,
            'LateChunker': 5000,
            'SlumberChunker': 3000
        }
        
        # Apply character limits unless overridden
        text = request.text
        if not request.override_limit:
            limit = chunker_limits.get(request.config.chunkerType, 25000)
            if len(text) > limit:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Text too long ({len(text):,} chars). Limit for {request.config.chunkerType}: {limit:,}. Enable override to proceed."
                )
        else:
            # Even with override, apply absolute maximum for system stability
            if len(text) > 500000:  # 500K absolute maximum
                text = text[:500000]
        
        # Create chunker
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
        
        # Create cleaned config that only shows relevant parameters for each chunker
        cleaned_config = request.config.dict()

        # Remove chunkSize for NeuralChunker
        if request.config.chunkerType == 'NeuralChunker':
            cleaned_config.pop('chunkSize', None)

        # Remove chunkOverlap for chunkers that don't support it
        chunkers_without_overlap = ['SentenceChunker', 'RecursiveChunker', 'SemanticChunker', 'CodeChunker', 'NeuralChunker']
        if request.config.chunkerType in chunkers_without_overlap:
            cleaned_config.pop('chunkOverlap', None)

        # Remove None values from advanced parameters
        for key in list(cleaned_config.keys()):
            if cleaned_config[key] is None:
                cleaned_config.pop(key)
        
        result = ChunkResponse(
            chunks=chunk_list,
            total_chunks=len(chunk_list),
            processing_time=processing_time,
            config=cleaned_config
        )
        
        return result
        
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"ERROR: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)