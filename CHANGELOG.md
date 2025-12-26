# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **BREAKING**: Migrated from Node.js/npm to Deno runtime and build system
- **BREAKING**: Replaced `equals` option with two separate options for clarity:
  - `equalityFn?: (prev: T, next: T) => boolean` - Custom equality function
  - `alwaysNotify?: boolean` - Always notify subscribers on every set
- Updated all development tasks to use Deno (`deno task test`, `deno task build`, etc.)
- Converted test suite from Vitest to Deno's native test runner
- Converted benchmarks from Vitest to Deno's native bench runner

### Added
- Multiple bundle formats in releases:
  - ES Module (`simple-state.esm.js`)
  - IIFE (`simple-state.iife.js`) for `<script>` tags
  - UMD (`simple-state.umd.js`) for legacy compatibility
  - Minified versions of all bundles (`.min.js`)
- TypeScript source file (`simple-state.ts`) in releases for direct copying
- SHA256 checksums for all release assets for integrity verification
- GitHub Actions CI/CD workflows for automated testing and releases
- Download instructions in README with checksum verification examples

### Documentation
- Updated README installation section to prioritize GitHub Releases
- Added instructions for verifying file integrity with SHA256 checksums
- Clarified Deno-first approach while maintaining TypeScript compatibility

## [0.1.2] - 2025-10-05

### Added
- `equals` option for custom equality comparison (inspired by SolidJS signals)
  - Set to `false` to always notify subscribers
  - Provide a function for custom comparison (e.g., deep equality)
  - Enables fine-grained control over when subscribers are notified
- Optimistic Updates recipe with 6 patterns (instant UI feedback, rollback on error, debouncing, retry logic)
- Error boundary pattern in defensive-subscribers recipe (catch and handle subscriber errors gracefully)

## [0.1.1] - 2025-10-05

### Added
- DevTools recipe with 8 debugging patterns (logger, performance monitor, Redux DevTools integration, etc.)
- Persistence recipe with 8 storage patterns (localStorage, sessionStorage, IndexedDB, encryption, cross-tab sync, etc.)
- Undo/Redo recipe with 6 history patterns (basic undo/redo, transactions, selective undo, time travel)
- Selector-based subscription pattern in defensive-subscribers recipe (subscribe to specific values with memoization)
- Type-safe `derive()` helper in computed-values recipe (full TypeScript inference for 1-5 dependencies)

### Fixed
- Added circular reference handling tests to verify `structuredClone` behavior

## [0.1.0] - 2025-10-05

### Added
- Initial release of @simple-state/core
- Lightweight, type-safe state management library (~150 lines)
- Zero dependencies implementation
- Reactive data storage with subscriber pattern
- Deep cloning of mutable data for immutability protection
- Optional `clone: false` option for performance-critical scenarios
- Comprehensive recipe examples (computed values, memoization, batching, actions, maps, defensive subscribers, memory management)
- Benchmark suite for performance testing
- Full TypeScript support with type safety
- Asynchronous notification system (microtask-based batching)
