# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
