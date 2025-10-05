# Simple State

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/ge3224/simple-state)
[![No Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://github.com/ge3224/simple-state)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Branch Protection](https://img.shields.io/badge/branch%20protection-enabled-green.svg)](https://github.com/ge3224/simple-state/settings/branches)

State management doesn't have to live in node_modules. Simple State is ~150 lines of type-safe, reactive storage with immutability protection, built to be vendored in your project—zero dependencies, framework-agnostic, and audit-friendly.

Built for projects where vanilla TypeScript makes sense and stability beats ecosystem churn.

## Features

- **Type-safe**: Compile-time type checking with runtime validation guards
- **Zero dependencies**: No supply chain risk, no transitive dependencies
- **Reactive**: Subscribe to state changes with callbacks
- **Immutable**: Deep cloning of mutable data types to prevent external mutations
- **Audit-friendly**: Small enough to actually read and understand

## Installation

### Git Submodule

```bash
git submodule add https://github.com/ge3224/simple-state.git
```

```typescript
import { newSimpleState } from './simple-state/src/index';
```

Pin to a version:
```bash
cd simple-state && git checkout v0.1.0
```

### Direct Copy

Copy `src/index.ts` into your project.

```typescript
import { newSimpleState } from './simple-state';
```

### npm

Not planned. Vendoring is the point.

## Usage

### Basic Example

```typescript
import { newSimpleState } from './simple-state';

// Create state with initial value
const count = newSimpleState(0);

// Subscribe to changes
const unsubId = count.subscribe((newValue) => {
  console.log('Count changed:', newValue);
});

// Update state
count.set(1); // logs: Count changed: 1

// Get current value
console.log(count.get()); // 1

// Unsubscribe
count.unsubscribe(unsubId);
```

### Working with Objects

```typescript
const user = newSimpleState({ name: 'Alice', age: 30 });

user.subscribe((newUser) => {
  console.log('User updated:', newUser);
});

user.set({ name: 'Bob', age: 25 });
```

### Working with Arrays

```typescript
const items = newSimpleState([1, 2, 3]);

items.subscribe((newItems) => {
  console.log('Items:', newItems);
});

items.set([...items.get(), 4]); // Add item
```

### Type Safety

The library enforces type consistency:

```typescript
const state = newSimpleState(42);

state.set(100); // ✓ OK
state.set("string"); // ✗ Error: Incompatible data type

const objState = newSimpleState({ key: 'value' });
objState.set([1, 2, 3]); // ✗ Error: Incompatible mutable data type
```

## API

### `newSimpleState<T>(initial: T): SimpleState<T>`

Creates a new state instance with an initial value.

### `SimpleState<T>`

#### `get(): T`

Returns the current state value. For mutable types (objects, arrays, Maps, Sets, Dates, RegExps), returns a deep copy to prevent external mutations.

**Note:** Functions cannot be cloned and are returned as-is. Avoid storing functions in state. Like [Redux](https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state), the recommendation here is to store only serializable data to maintain predictable behavior.

#### `set(value: T): void`

Updates the state with a new value and notifies all subscribers asynchronously (via microtask). Uses reference equality (`===`) to skip notifications when the same value is set again.

**Note:** For objects/arrays, always create a new reference when updating (e.g., `{ ...obj, field: newValue }`). Setting the same reference twice will not trigger notifications.

#### `subscribe(callback: (value: T) => void): number`

Registers a callback to be called when the state changes. Returns a subscription ID.

#### `unsubscribe(id: number): void`

Removes a subscriber using the subscription ID.

## Advanced Patterns

The library is intentionally minimal, but you can build advanced patterns on top of it. Check out the [examples/recipes](examples/recipes) directory for:

- **[Memory Management](examples/recipes/memory-management.ts)** - Prevent memory leaks with proper cleanup
- **[DevTools](examples/recipes/devtools.ts)** - Debugging patterns and logger middleware
- **[Computed Values](examples/recipes/computed-values.ts)** - Automatically derive state from other state
- **[Memoization](examples/recipes/memoization.ts)** - Cache expensive calculations
- **[Batching](examples/recipes/batching.ts)** - Debouncing, throttling, and transaction patterns
- **[Maps](examples/recipes/maps.ts)** - Managing collections of related state
- **[Actions](examples/recipes/actions.ts)** - Encapsulate state updates in named functions
- **[Defensive Subscribers](examples/recipes/defensive-subscribers.ts)** - Handle missing data safely
- **[Persistence](examples/recipes/persistence.ts)** - localStorage, sessionStorage, IndexedDB, and encryption patterns
- **[Undo/Redo](examples/recipes/undo-redo.ts)** - History, time-travel, and command patterns

These patterns demonstrate how to extend the core library for more complex use cases while maintaining the zero-dependency philosophy.

### Performance Considerations

By default, Simple State clones mutable data to prevent mutations. For large datasets (1000+ items), you can disable cloning:

```typescript
const state = newSimpleState(largeArray, { clone: false });
```

**⚠️ Warning:** You must follow immutable update patterns when cloning is disabled. See benchmarks with `pnpm bench` for performance comparisons.

Run the interactive examples in your browser:
```bash
pnpm install
pnpm dev
```

## Versioning

This project uses [Semantic Versioning](https://semver.org/). All releases are tagged with git tags (e.g., `v0.1.0`, `v0.2.0`).

### Pinning to a Specific Version

When using as a git submodule, you can pin to a specific version:

```bash
# Add submodule
git submodule add https://github.com/ge3224/simple-state.git

# Pin to specific version
cd simple-state
git checkout v0.1.0
cd ..
git add simple-state
git commit -m "Pin simple-state to v0.1.0"
```

### Upgrading Versions

To upgrade to a newer version:

```bash
cd simple-state
git fetch --tags
git checkout v0.2.0  # or whatever version you want
cd ..
git add simple-state
git commit -m "Upgrade simple-state to v0.2.0"
```

See [CHANGELOG.md](CHANGELOG.md) for version history and breaking changes.

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Build
pnpm build

# Type check
pnpm type-check

# Run interactive examples
pnpm dev

# Run benchmarks
pnpm bench
```

## License

MIT
