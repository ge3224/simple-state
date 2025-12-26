# Simple State

[![Version](https://img.shields.io/badge/version-0.1.2-blue.svg)](https://github.com/ge3224/simple-state)
[![No Runtime Dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen.svg)](https://github.com/ge3224/simple-state)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Simple State is type-safe, reactive state management built to be copied into your project. No npm package, no dependency tree, it's just one TypeScript file you can read and own.

If you don't want your state management living in `node_modules`, this might be for you.

## What It Does

Simple State is an observable pattern implementation with a few nice features:
- Type-safe with runtime validation
- Automatic immutability protection via deep cloning
- Custom equality checks for granular control
- Zero runtime dependencies

It's useful for vanilla TypeScript projects where you need reactive state without pulling in a framework.

## Installation

### Download from Releases

Download the TypeScript source from [GitHub Releases](https://github.com/ge3224/simple-state/releases):

```bash
# Download the TypeScript file
curl -LO https://github.com/ge3224/simple-state/releases/latest/download/simple-state.ts

# Download and verify checksum
curl -LO https://github.com/ge3224/simple-state/releases/latest/download/simple-state.ts.sha256

# Verify integrity
sha256sum -c simple-state.ts.sha256
```

Copy it into your project:

```typescript
import { newSimpleState } from './simple-state.ts';
```

**Or use a pre-built JavaScript bundle:**
- `simple-state.esm.js` - ES Module
- `simple-state.iife.js` - IIFE for `<script>` tags
- `simple-state.umd.js` - UMD for legacy compatibility
- All bundles available in minified (`.min.js`) versions

All files include SHA256 checksums for verification.

### Git Submodule

If you want to track updates:

```bash
git submodule add https://github.com/ge3224/simple-state.git
```

```typescript
import { newSimpleState } from './simple-state/src/index.ts';
```

Pin to a specific version:
```bash
cd simple-state && git checkout v0.1.2
```

## Usage

### Basic Example

```typescript
import { newSimpleState } from './simple-state.ts';

// Create state
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

Objects are deep cloned by default, so external mutations don't affect state:

```typescript
const data = { value: 1 };
const state = newSimpleState(data);

data.value = 2; // Doesn't affect state
console.log(state.get().value); // Still 1
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

Type consistency is enforced:

```typescript
const state = newSimpleState(42);

state.set(100);      // ✓ OK
state.set("string"); // ✗ Type error

const objState = newSimpleState({ key: 'value' });
objState.set([1, 2, 3]); // ✗ Type error
```

### Custom Equality

By default, Simple State uses reference equality (`===`) to determine if state changed. You can customize this:

```typescript
// Deep equality - only notify when content changes
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const settings = newSimpleState(
  { theme: 'dark', fontSize: 14 },
  { equalityFn: deepEqual }
);

settings.set({ theme: 'dark', fontSize: 14 }); // No notification (same content)
settings.set({ theme: 'light', fontSize: 14 }); // Notifies subscribers

// Always notify on every set, even with same value
const counter = newSimpleState(0, { alwaysNotify: true });
counter.set(0); // Notifies even though value hasn't changed
```

The `alwaysNotify` option is useful for form validation or forcing UI updates.

## API

### `newSimpleState<T>(initial: T, options?: SimpleStateOptions<T>)`

Creates a new state instance.

**Options:**
- `clone?: boolean` - Deep clone mutable data (default: `true`)
- `equalityFn?: (prev: T, next: T) => boolean` - Custom equality function (default: reference equality)
- `alwaysNotify?: boolean` - Always notify subscribers on every set, even if value unchanged (default: `false`)
- `suppressWarnings?: boolean` - Suppress console warnings (default: `false`)

Returns a `SimpleState<T>` instance.

### `SimpleState<T>`

#### `get(): T`

Returns the current value. For mutable types (objects, arrays, Maps, Sets, Dates, RegExps), returns a deep copy to prevent external mutations.

**Note:** Functions can't be cloned and are returned as-is. Store only serializable data in state (same recommendation as [Redux](https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)).

#### `set(value: T): void`

Updates state and notifies subscribers asynchronously via microtask. Skips notification if the value hasn't changed (based on the equality function).

**Note:** For objects/arrays, create a new reference when updating: `{ ...obj, field: newValue }`. Setting the same reference won't trigger notifications.

#### `subscribe(callback: (value: T) => void): number`

Registers a callback for state changes. Returns a subscription ID.

#### `unsubscribe(id: number): void`

Removes a subscriber by ID.

## Advanced Patterns

The core library is intentionally minimal. The [`examples/recipes`](examples/recipes) directory contains patterns for common use cases:

- **[Memory Management](examples/recipes/memory-management.ts)** - Prevent memory leaks with proper cleanup
- **[DevTools](examples/recipes/devtools.ts)** - Debugging patterns and logger middleware
- **[Computed Values](examples/recipes/computed-values.ts)** - Derive state from other state automatically
- **[Memoization](examples/recipes/memoization.ts)** - Cache expensive calculations
- **[Batching](examples/recipes/batching.ts)** - Debouncing, throttling, and transaction patterns
- **[Maps](examples/recipes/maps.ts)** - Manage collections of related state
- **[Actions](examples/recipes/actions.ts)** - Encapsulate state updates in named functions
- **[Defensive Subscribers](examples/recipes/defensive-subscribers.ts)** - Handle missing data and error boundaries
- **[Persistence](examples/recipes/persistence.ts)** - localStorage, sessionStorage, IndexedDB, and encryption
- **[Undo/Redo](examples/recipes/undo-redo.ts)** - History, time-travel, and command patterns
- **[Optimistic Updates](examples/recipes/optimistic-updates.ts)** - Instant UI feedback with rollback

Run the interactive examples:
```bash
deno task dev
```

## Performance

By default, Simple State clones mutable data to prevent mutations. For large datasets (1000+ items), you can disable cloning:

```typescript
const state = newSimpleState(largeArray, { clone: false });
```

**Warning:** You're responsible for immutable updates when cloning is disabled.

Run benchmarks: `deno task bench`

## Versioning

This project uses [Semantic Versioning](https://semver.org/). Releases are tagged as `v0.1.0`, `v0.2.0`, etc.

### If Using Git Submodules

Pin to a specific version:
```bash
cd simple-state
git checkout v0.1.2
cd ..
git add simple-state
git commit -m "Pin simple-state to v0.1.2"
```

Upgrade to a newer version:
```bash
cd simple-state
git fetch --tags
git checkout v0.2.0
cd ..
git add simple-state
git commit -m "Upgrade simple-state to v0.2.0"
```

### If You Copied the File

Note which commit SHA or version tag you copied from. Check [CHANGELOG.md](CHANGELOG.md) before updating.

## Contributing

If you're working on the library itself:

```bash
# Run tests
deno task test
deno task test:watch
deno task test:coverage

# Build
deno task build

# Type check
deno task typecheck

# Benchmarks
deno task bench

# Interactive examples
deno task dev
```

## License

MIT
