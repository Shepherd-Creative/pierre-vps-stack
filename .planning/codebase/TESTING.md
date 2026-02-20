# Testing Patterns

**Analysis Date:** 2026-02-20

## Test Framework

**Status:** No testing framework configured

**Observation:** Neither project (`personal-website` nor `chonkie-visualizer`) has Jest, Vitest, or any test runner configured. No test files exist in the source directories (only transitive dependencies have tests).

**Package.json Scripts:**
- `npm run lint` - ESLint only
- No `npm run test` or `npm run test:watch` command
- No test coverage tools

**Assertion Library:** Not applicable - no tests present

**Run Commands:** Not established

## Test File Organization

**Current State:** No tests

**If Testing Were Added - Recommended Pattern:**
- Co-located: Test files next to source files is not currently practiced
- Suggested structure for future adoption:
  ```
  src/
  ├── hooks/
  │   ├── useChatbot.ts
  │   ├── useChatbot.test.ts
  │   ├── useScrollPosition.ts
  │   └── useScrollPosition.test.ts
  ├── components/
  │   ├── ChatWidget.tsx
  │   ├── ChatWidget.test.tsx
  │   └── ...
  ```

## Test Structure

**Current Practice:** Not established

**Recommended Approach Based on Codebase:**

For a React component with hooks, following the observed patterns:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useChatbot } from '@/hooks/useChatbot';

describe('useChatbot', () => {
  it('initializes with greeting message', () => {
    const { result } = renderHook(() => useChatbot());

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
  });

  it('sends message and updates input state', async () => {
    const { result } = renderHook(() => useChatbot());

    await act(async () => {
      result.current.sendMessage('test message');
    });

    // Message should be added to messages array
    expect(result.current.messages.length).toBeGreaterThan(1);
  });
});
```

**Setup Patterns:** Not observed - would need to be established

**Teardown Patterns:** Not observed

**Assertion Patterns:** Not established

## Mocking

**Framework:** Not applicable - no tests

**What Would Need Mocking:**
- `fetch()` calls for chat API (in `useChatbot.ts`)
- `sessionStorage` for chat session ID persistence
- `document` methods for scrolling (in `useScrollPosition.ts`)
- Component props for UI component testing

**Example Mock Strategy (Recommended):**
```typescript
// Mock fetch for API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ output: 'test response' })
  })
);

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock document scroll behavior
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;
```

**What to Mock:**
- External API calls (chat endpoint)
- Browser APIs (sessionStorage, localStorage)
- DOM methods (scrollIntoView, getElementById)
- Framer Motion animation callbacks

**What NOT to Mock:**
- React hooks themselves (useState, useCallback, etc.)
- Custom hook logic (the actual business logic should run)
- Component render logic (test real rendering)
- Utility functions like `cn()` (use real implementations)

## Fixtures and Factories

**Test Data:** Not established

**Recommended Factories for Future Tests:**

```typescript
// Shared test fixtures
export const createMockMessage = (overrides = {}) => ({
  id: 'test-1',
  role: 'assistant' as const,
  content: 'Test message',
  ...overrides,
});

export const createMockChunkConfig = (overrides = {}) => ({
  chunkerType: 'TokenChunker' as const,
  chunkSize: 100,
  chunkOverlap: 20,
  tokenizerType: 'CharacterTokenizer' as const,
  ...overrides,
});

export const createMockChunkResponse = (overrides = {}) => ({
  chunks: [
    {
      content: 'Test chunk',
      index: 0,
      start_index: 0,
      end_index: 10,
      token_count: 2,
    }
  ],
  total_chunks: 1,
  total_tokens: 2,
  processing_time: 100,
  config: createMockChunkConfig(),
  ...overrides,
});
```

**Location:** Would be in `src/__tests__/fixtures/` or `src/__tests__/factories/` if implemented

## Coverage

**Requirements:** None enforced

**Current Status:** 0% - no tests exist

**If Tool Added:** Recommend targeting:
- Hooks: 80%+ (business logic lives here)
- Utilities: 90%+ (pure functions, easy to test)
- Components: 50%+ (integration testing more valuable than unit tests)
- Integrations: 100% (fetch, API calls critical to test)

**View Coverage (If Vitest Implemented):**
```bash
vitest --coverage              # Generate coverage report
vitest --coverage.reporter=html  # Generate HTML report
```

## Test Types

**Unit Tests:** (Not present, recommended)
- Test individual hooks in isolation: `useChatbot`, `useScrollPosition`, `useSuggestedQuestions`
- Test pure utility functions: `getChunkColor()`, `getChunkOverlaps()`, `shuffleArray()`
- Test single-responsibility functions

**Integration Tests:** (Not present, recommended)
- Test components with hooks together: `ChatWidget` + `useChatbot` hook
- Test form submissions and async state updates
- Test localStorage/sessionStorage persistence

**E2E Tests:** (Not present)
- Framework: Not used
- Could use Playwright for full user flows (chat interaction end-to-end)
- Would test: Hero → scroll → Chat widget → send message → response → scroll to section

## Common Patterns

**Async Testing:**
```typescript
// Recommended for testing async hooks like useChatbot
it('sends message and fetches response', async () => {
  global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ output: 'AI response' })
  }));

  const { result } = renderHook(() => useChatbot());

  await act(async () => {
    await result.current.sendMessage('Hello');
  });

  // Message sent, response added
  expect(result.current.messages.length).toBe(2); // Greeting + response
  expect(result.current.messages[1].content).toBe('AI response');
});
```

**Error Testing:**
```typescript
// Test error scenarios
it('handles fetch errors gracefully', async () => {
  global.fetch = vi.fn(() => Promise.reject(new Error('Network failed')));

  const { result } = renderHook(() => useChatbot());

  await act(async () => {
    await result.current.sendMessage('Test');
  });

  // Error message should be added to conversation
  const lastMessage = result.current.messages[result.current.messages.length - 1];
  expect(lastMessage.content).toContain('trouble connecting');
});
```

**State Update Testing:**
```typescript
// Test state transitions
it('updates loading state during message send', async () => {
  const { result } = renderHook(() => useChatbot());

  expect(result.current.isLoading).toBe(false);

  await act(async () => {
    result.current.sendMessage('Test');
  });

  // Since fetch is mocked, loading finishes immediately
  expect(result.current.isLoading).toBe(false);
});
```

## Recommended Test Stack (If Adopted)

**Runner:** Vitest (faster than Jest, modern, ESM-first)
- Config file: `vitest.config.ts`
- Lighter dependencies than Jest

**React Testing:** `@testing-library/react`
- Recommended over Enzyme (dead project)
- Tests component behavior, not implementation
- Includes `renderHook` for custom hook testing

**Utilities:**
- `@testing-library/user-event` - simulate user interactions
- `vi` (Vitest built-in) - mocking and stubbing
- `@vitest/ui` - visual test runner (optional)

**Configuration Template:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

*Testing analysis: 2026-02-20*
