import '@testing-library/react'

// Make import.meta.env available in tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_ANTHROPIC_API_KEY: '',
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
  },
  writable: true,
})
