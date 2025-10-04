import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * Batching updates pattern - group multiple state changes
 *
 * Simple State already batches notifications using microtasks,
 * but these examples show advanced batching patterns.
 */

// Example 1: Understanding built-in batching
console.log("=== Example 1: Built-in Microtask Batching ===");

const counter = newSimpleState(0);

let callCount = 0;
counter.subscribe((value) => {
  callCount++;
  console.log(`Subscriber called (${callCount}):`, value);
});

console.log("Making 3 rapid updates:");
counter.set(1);
counter.set(2);
counter.set(3);

console.log("Synchronous value:", counter.get());
console.log("Waiting for microtask...\n");

await new Promise(resolve => setTimeout(resolve, 0));

// Example 2: Batch wrapper for multiple states
console.log("=== Example 2: Batch Multiple State Updates ===");

interface BatchUpdate {
  (): void;
}

function batch(...updates: BatchUpdate[]): void {
  // Execute all updates synchronously
  updates.forEach(update => update());
  // Microtask will batch all notifications
}

const x = newSimpleState(0);
const y = newSimpleState(0);
const z = newSimpleState(0);

let updateCount = 0;
const logUpdate = (name: string, value: number) => {
  updateCount++;
  console.log(`${name} updated to ${value} (update #${updateCount})`);
};

x.subscribe((v) => logUpdate("x", v));
y.subscribe((v) => logUpdate("y", v));
z.subscribe((v) => logUpdate("z", v));

console.log("Batch updating x, y, z:");
batch(
  () => x.set(10),
  () => y.set(20),
  () => z.set(30)
);

await new Promise(resolve => setTimeout(resolve, 0));

// Example 3: Transaction pattern
console.log("\n=== Example 3: Transaction Pattern ===");

interface Transaction<T> {
  commit(): void;
  rollback(): void;
  update(newValue: T): void;
}

function createTransaction<T>(state: SimpleState<T>): Transaction<T> {
  const original = state.get();
  let pending = original;

  return {
    update(newValue: T) {
      pending = newValue;
    },
    commit() {
      state.set(pending);
    },
    rollback() {
      pending = original;
    }
  };
}

interface Account {
  balance: number;
  transactions: number;
}

const account = newSimpleState<Account>({
  balance: 1000,
  transactions: 0
});

account.subscribe((acc) => {
  console.log(`Account: $${acc.balance}, ${acc.transactions} transactions`);
});

console.log("Starting transaction...");
const txn = createTransaction(account);

txn.update({ balance: 900, transactions: 1 });
txn.update({ balance: 800, transactions: 2 });
txn.update({ balance: 700, transactions: 3 });

console.log("Current balance (before commit):", account.get().balance);

console.log("\nCommitting transaction...");
txn.commit();

await new Promise(resolve => setTimeout(resolve, 0));

// Example 4: Debounced updates
console.log("\n=== Example 4: Debounced Updates ===");

function createDebouncedState<T>(
  initialValue: T,
  delayMs: number
): SimpleState<T> & { setImmediate(value: T): void } {
  const state = newSimpleState(initialValue);
  let timeout: NodeJS.Timeout | null = null;

  const debouncedSet = (value: T) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      state.set(value);
      timeout = null;
    }, delayMs);
  };

  return {
    get: state.get.bind(state),
    set: debouncedSet,
    setImmediate: state.set.bind(state),
    subscribe: state.subscribe.bind(state),
    unsubscribe: state.unsubscribe.bind(state)
  };
}

const searchTerm = createDebouncedState("", 300);

searchTerm.subscribe((term) => {
  console.log(`Search API called with: "${term}"`);
});

console.log("Typing rapidly:");
searchTerm.set("h");
searchTerm.set("he");
searchTerm.set("hel");
searchTerm.set("hell");
searchTerm.set("hello");

console.log("Waiting for debounce...");
await new Promise(resolve => setTimeout(resolve, 400));

// Example 5: Throttled updates
console.log("\n=== Example 5: Throttled Updates ===");

function createThrottledState<T>(
  initialValue: T,
  delayMs: number
): SimpleState<T> {
  const state = newSimpleState(initialValue);
  let lastUpdate = 0;
  let pending: T | null = null;
  let timeout: NodeJS.Timeout | null = null;

  const throttledSet = (value: T) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate;

    if (timeSinceLastUpdate >= delayMs) {
      state.set(value);
      lastUpdate = now;
      pending = null;
    } else {
      pending = value;
      if (!timeout) {
        timeout = setTimeout(() => {
          if (pending !== null) {
            state.set(pending);
            lastUpdate = Date.now();
            pending = null;
          }
          timeout = null;
        }, delayMs - timeSinceLastUpdate);
      }
    }
  };

  return {
    get: state.get.bind(state),
    set: throttledSet,
    subscribe: state.subscribe.bind(state),
    unsubscribe: state.unsubscribe.bind(state)
  };
}

const scrollPosition = createThrottledState(0, 100);

scrollPosition.subscribe((pos) => {
  console.log(`Scroll position: ${pos}px`);
});

console.log("Simulating rapid scroll events:");
for (let i = 0; i <= 500; i += 50) {
  scrollPosition.set(i);
  await new Promise(resolve => setTimeout(resolve, 10));
}

await new Promise(resolve => setTimeout(resolve, 150));
