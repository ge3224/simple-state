import { newSimpleState } from "../../src/index";

/**
 * Memory Management Patterns
 *
 * Preventing memory leaks and managing subscriptions lifecycle
 */

// =============================================================================
// Problem: Memory Leaks from Forgotten Unsubscribes
// =============================================================================

console.log("=== Problem: Memory Leak ===");

// BAD: Subscription never cleaned up
function createLeakyComponent() {
  const state = newSimpleState(0);

  // This subscription will never be removed!
  state.subscribe((value) => {
    console.log("Leaky subscription:", value);
  });

  // Even if this function is called many times,
  // old subscriptions remain in memory
}

// Calling this 1000 times would create 1000 subscriptions
for (let i = 0; i < 3; i++) {
  createLeakyComponent();
}

// =============================================================================
// Solution 1: Manual Cleanup Pattern
// =============================================================================

console.log("\n=== Solution 1: Manual Cleanup ===");

function createCleanComponent() {
  const state = newSimpleState(0);

  const subscriptionId = state.subscribe((value) => {
    console.log("Clean subscription:", value);
  });

  // Return cleanup function
  return () => {
    state.unsubscribe(subscriptionId);
    console.log("Cleaned up subscription:", subscriptionId);
  };
}

const cleanup = createCleanComponent();
// Later, when component unmounts:
cleanup();

// =============================================================================
// Solution 2: Subscription Manager
// =============================================================================

console.log("\n=== Solution 2: Subscription Manager ===");

class SubscriptionManager {
  private subscriptions: Array<{ state: any; id: number }> = [];

  subscribe<T>(state: ReturnType<typeof newSimpleState<T>>, callback: (value: T) => void) {
    const id = state.subscribe(callback);
    this.subscriptions.push({ state, id });
    return id;
  }

  unsubscribeAll() {
    this.subscriptions.forEach(({ state, id }) => {
      state.unsubscribe(id);
    });
    this.subscriptions = [];
    console.log("Cleaned up all subscriptions");
  }
}

const manager = new SubscriptionManager();
const count = newSimpleState(0);
const name = newSimpleState("Alice");

manager.subscribe(count, (value) => console.log("Count:", value));
manager.subscribe(name, (value) => console.log("Name:", value));

count.set(1);
name.set("Bob");

// Clean up all at once when component unmounts
manager.unsubscribeAll();

// =============================================================================
// Solution 3: React-style useEffect Pattern
// =============================================================================

console.log("\n=== Solution 3: React Hook Pattern ===");

// Simulated React hook pattern
function useSimpleState<T>(state: ReturnType<typeof newSimpleState<T>>) {
  // In real React, this would be useEffect
  function effect(callback: (value: T) => void) {
    const id = state.subscribe(callback);

    // Return cleanup function
    return () => {
      state.unsubscribe(id);
    };
  }

  return { effect, get: () => state.get() };
}

// Usage (simulated):
const userState = newSimpleState({ name: "Charlie", age: 30 });
const { effect } = useSimpleState(userState);

const cleanup2 = effect((user) => {
  console.log("User updated:", user.name);
});

userState.set({ name: "David", age: 31 });

// Cleanup when component unmounts
cleanup2();

// =============================================================================
// Solution 4: Disposable Pattern
// =============================================================================

console.log("\n=== Solution 4: Disposable Pattern ===");

interface Disposable {
  dispose(): void;
}

function createDisposableSubscription<T>(
  state: ReturnType<typeof newSimpleState<T>>,
  callback: (value: T) => void
): Disposable {
  const id = state.subscribe(callback);

  return {
    dispose() {
      state.unsubscribe(id);
      console.log("Disposed subscription:", id);
    }
  };
}

const todoState = newSimpleState<string[]>([]);
const subscription = createDisposableSubscription(todoState, (todos) => {
  console.log("Todos:", todos.length);
});

todoState.set(["Learn Simple State"]);

// Clean up
subscription.dispose();

// =============================================================================
// Solution 5: AbortSignal Pattern (Modern)
// =============================================================================

console.log("\n=== Solution 5: AbortSignal Pattern ===");

function subscribeWithSignal<T>(
  state: ReturnType<typeof newSimpleState<T>>,
  callback: (value: T) => void,
  signal: AbortSignal
): void {
  const id = state.subscribe(callback);

  signal.addEventListener("abort", () => {
    state.unsubscribe(id);
    console.log("Aborted subscription:", id);
  });
}

const controller = new AbortController();
const settingsState = newSimpleState({ theme: "dark" });

subscribeWithSignal(
  settingsState,
  (settings) => console.log("Theme:", settings.theme),
  controller.signal
);

settingsState.set({ theme: "light" });

// Clean up all subscriptions tied to this controller
controller.abort();

// =============================================================================
// Best Practices Summary
// =============================================================================

console.log("\n=== Best Practices ===");
console.log(`
1. ALWAYS store subscription IDs when you subscribe
2. ALWAYS call unsubscribe when done (component unmount, cleanup, etc.)
3. Use a manager/helper for multiple subscriptions
4. In React: Return cleanup function from useEffect
5. In classes: Unsubscribe in destructor/dispose method
6. Consider AbortController for complex lifecycle management

Common Patterns:

// React Component
useEffect(() => {
  const id = state.subscribe(callback);
  return () => state.unsubscribe(id);
}, []);

// Class Component
class MyComponent {
  private subscriptionIds: number[] = [];

  mount() {
    this.subscriptionIds.push(state.subscribe(callback));
  }

  unmount() {
    this.subscriptionIds.forEach(id => state.unsubscribe(id));
  }
}

// Vanilla JS
const cleanup = state.subscribe(callback);
// Later:
state.unsubscribe(cleanup);
`);
