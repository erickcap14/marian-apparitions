# Testing Strategy

Purpose: This file documents the testing philosophy, tooling, and key scenarios for the Marian Apparitions app.

---

## 1. Testing Philosophy

**Overall Goal: Ensure the most critical user journeys always work.**

We do not aim for line-coverage metrics. Instead, we test at the boundary of what a user actually does: load the map, click a pin, search for an apparition, and regenerate an AI summary. Implementation details (internal state shape, CSS class names, private helper functions) are not tested directly. If a user journey still works correctly, the test passes — regardless of how the internals were refactored.

Key principles:

- **Test user journeys, not implementation.** Write tests from the user's perspective: what they see and what they can interact with.
- **Prefer rendering components with realistic props** over mocking deeply nested internals.
- **Mock only at the system boundary.** The Anthropic API and MapLibre GL (which requires WebGL) are the only things that must be mocked in the jsdom environment.
- **Avoid snapshot tests.** They couple tests to markup structure and break on innocent style changes.

---

## 2. Testing Frameworks & Tools

| Tool | Version | Purpose |
|------|---------|---------|
| [Vitest](https://vitest.dev/) | ^4.1.8 | Test runner — native Vite integration, fast HMR-aware re-runs |
| [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) | ^16.3.2 | Render React components in jsdom, query by accessible roles/labels |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro/) | ^14.6.1 | Simulate real user interactions (type, click, keyboard) |
| [jsdom](https://github.com/jsdom/jsdom) | ^29.1.1 | DOM environment for headless tests (no real browser required) |
| [@vitest/coverage-v8](https://vitest.dev/guide/coverage) | ^4.1.8 | Optional coverage report via V8 |

Test environment is configured in `vite.config.ts` under the `test` block:
- `environment: 'jsdom'` — browser-like DOM in Node
- `globals: true` — no need to import `describe`/`it`/`expect` in each file
- `setupFiles: ['./src/test/setup.ts']` — global test setup (env stubs)

---

## 3. How to Run Tests

```bash
# Run all tests once (CI mode)
npm test

# Run in watch mode during development (re-runs on file save)
npm run test:watch

# Run with coverage report
npx vitest run --coverage
```

Test files live alongside the code they cover under `src/`, named `*.test.tsx` or `*.test.ts`.

---

## 4. What to Test — Key Scenarios

### 4.1 Map loads (Story 1: `map_globe`)
- `MapView` component renders without crashing.
- MapLibre GL JS must be mocked (requires WebGL canvas unavailable in jsdom).
- Assert that the map container `<div>` is present in the DOM.
- Assert that `onSelect` callback is callable.

### 4.2 Pin click opens detail panel (Story 3: `apparition_panel`)
- Render `App` (or `DetailPanel` with a mock apparition prop).
- Simulate selecting an apparition (call `onSelect` with a fixture).
- Assert that `DetailPanel` appears with the correct apparition name, year, and location.
- Assert the "Close" button dismisses the panel (sets selected back to null).

### 4.3 Search sidebar filters list (Story 7: `search_sidebar`)
- Render `SearchSidebar` with the full apparitions dataset.
- Type a search term (e.g. "Fatima") into the search input.
- Assert that only matching entries appear in the list.
- Assert that clicking an entry fires `onSelect` with the correct apparition.

### 4.4 AI regenerate button (Story 5: `ai_regenerate`)
- Render `DetailPanel` with a mock apparition and `VITE_ANTHROPIC_API_KEY` set.
- Mock `claudeApi.generateSummary` to resolve with a known string.
- Click the "Regenerate with AI" button.
- Assert loading state is shown while the mock resolves.
- Assert the new summary text appears after resolution.
- Assert an error message appears if the mock rejects.

### 4.5 Filter controls narrow visible pins (Story 8: `filters`)
- Render `FilterControls` with a mock list of apparitions and a mock `onFilter` callback.
- Select a century from the dropdown.
- Assert `onFilter` is called with the correctly filtered subset.

### 4.6 Timeline slider restricts visible pins (Story 9: `timeline`)
- Render `TimelineSlider` with default min/max and a mock `onRangeChange`.
- Drag (or set value of) the range input.
- Assert `onRangeChange` is called with the updated year range.

---

## 5. Mocking Conventions

### MapLibre GL
MapLibre requires a real WebGL context. In jsdom tests, mock the entire module:

```ts
vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      setStyle: vi.fn(),
      remove: vi.fn(),
    })),
  },
}))
```

### Anthropic Claude API
Mock at the `src/api/claudeApi` boundary so the real HTTP call is never made:

```ts
vi.mock('../api/claudeApi', () => ({
  generateSummary: vi.fn().mockResolvedValue('Mocked summary text.'),
}))
```

### `import.meta.env`
The global test setup (`src/test/setup.ts`) stubs `import.meta.env` with an empty API key by default. Override per-test with `vi.stubEnv` when the key-presence behaviour matters.
