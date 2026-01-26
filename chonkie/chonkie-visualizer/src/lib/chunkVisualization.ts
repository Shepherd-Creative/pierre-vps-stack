import type { ChunkResult, ChunkResponse, ChunkConfig } from '@/types/chonkie';

/**
 * Get the color classes for a chunk card (background, dark mode, and border)
 */
export function getChunkColor(index: number): string {
  const colors = [
    'bg-blue-50 dark:bg-blue-900/40 border-blue-500',         // Blue
    'bg-orange-50 dark:bg-orange-900/40 border-orange-500',   // Orange
    'bg-purple-50 dark:bg-purple-900/40 border-purple-500',   // Purple
    'bg-yellow-50 dark:bg-yellow-900/40 border-yellow-500',   // Yellow
    'bg-green-50 dark:bg-green-900/40 border-green-500',      // Green
    'bg-red-50 dark:bg-red-900/40 border-red-500',            // Red
    'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500',   // Indigo
    'bg-pink-50 dark:bg-pink-900/40 border-pink-500',         // Pink
  ];
  return colors[index % colors.length];
}

/**
 * Get just the background highlight color for input text highlighting
 */
export function getChunkHighlightBg(index: number): string {
  const colors = [
    'bg-blue-100 dark:bg-blue-800/40',      // Blue
    'bg-orange-100 dark:bg-orange-800/40',  // Orange
    'bg-purple-100 dark:bg-purple-800/40',  // Purple
    'bg-yellow-100 dark:bg-yellow-800/40',  // Yellow
    'bg-green-100 dark:bg-green-800/40',    // Green
    'bg-red-100 dark:bg-red-800/40',        // Red
    'bg-indigo-100 dark:bg-indigo-800/40',  // Indigo
    'bg-pink-100 dark:bg-pink-800/40',      // Pink
  ];
  return colors[index % colors.length];
}

export interface ChunkOverlap {
  overlapWithPrev?: string;
  overlapWithNext?: string;
}

/**
 * Calculate overlap between chunks for TokenChunker
 */
export function getChunkOverlaps(
  result: ChunkResponse | null,
  config: ChunkConfig,
  text: string
): Record<number, ChunkOverlap> {
  if (!result || config.chunkerType !== 'TokenChunker') return {};

  const overlaps: Record<number, ChunkOverlap> = {};

  for (let i = 0; i < result.chunks.length; i++) {
    const chunk = result.chunks[i];
    overlaps[i] = {};

    // Check overlap with previous chunk
    if (i > 0) {
      const prevChunk = result.chunks[i - 1];
      if (chunk.start_index < prevChunk.end_index) {
        // There's overlap - extract the overlapping text from original text
        const overlapStart = chunk.start_index;
        const overlapEnd = prevChunk.end_index;
        overlaps[i].overlapWithPrev = text.substring(overlapStart, overlapEnd);
      }
    }

    // Check overlap with next chunk
    if (i < result.chunks.length - 1) {
      const nextChunk = result.chunks[i + 1];
      if (nextChunk.start_index < chunk.end_index) {
        // There's overlap - extract the overlapping text
        const overlapStart = nextChunk.start_index;
        const overlapEnd = chunk.end_index;
        overlaps[i].overlapWithNext = text.substring(overlapStart, overlapEnd);
      }
    }
  }

  return overlaps;
}

export interface TextSegment {
  text: string;
  chunkIndex: number; // -1 for unhighlighted, >= 0 for chunk index
  isOverlap: boolean;
}

/**
 * Find chunk content in text with whitespace tolerance
 * SemanticChunker normalizes whitespace, so we need fuzzy matching
 */
function findChunkInText(
  text: string,
  chunkContent: string,
  searchStart: number
): { start: number; end: number } | null {
  // First try exact match
  const exactIndex = text.indexOf(chunkContent, searchStart);
  if (exactIndex !== -1) {
    return { start: exactIndex, end: exactIndex + chunkContent.length };
  }

  // Fuzzy match: iterate through text and chunk content, skipping whitespace
  // Get non-whitespace characters from chunk
  const chunkNonWs = chunkContent.replace(/\s+/g, '');
  if (chunkNonWs.length === 0) return null;

  // Try to find the chunk starting from each position in text
  for (let startPos = searchStart; startPos < text.length; startPos++) {
    // Skip whitespace for potential start position
    if (/\s/.test(text[startPos])) continue;

    // Try to match from this position
    let textIdx = startPos;
    let chunkIdx = 0;
    let matched = true;

    while (chunkIdx < chunkNonWs.length && textIdx < text.length) {
      // Skip whitespace in text
      if (/\s/.test(text[textIdx])) {
        textIdx++;
        continue;
      }

      // Compare characters
      if (text[textIdx] === chunkNonWs[chunkIdx]) {
        textIdx++;
        chunkIdx++;
      } else {
        matched = false;
        break;
      }
    }

    // If we matched all chunk characters, we found it
    if (matched && chunkIdx === chunkNonWs.length) {
      return { start: startPos, end: textIdx };
    }
  }

  return null;
}

/**
 * Calculate text segments with highlighting information for the input text
 */
export function calculateTextSegments(
  text: string,
  result: ChunkResponse | null
): TextSegment[] {
  if (!result) return [];

  const segments: TextSegment[] = [];

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

      const found = findChunkInText(text, chunk.content, searchStart);
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

  return segments;
}
