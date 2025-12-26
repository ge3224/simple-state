import { newSimpleState } from "../src/index.ts";

/**
 * Consolidated Benchmark Suite for Simple State
 *
 * This file contains the most important benchmarks organized by category:
 * 1. Basic Operations - Core API performance
 * 2. Scaling Tests - Performance with many subscribers
 * 3. Clone Performance - Impact of cloning on different data sizes
 * 4. Real-world Scenarios - Common usage patterns
 */

interface Row {
  id: number;
  label: string;
}

function buildData(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    label: `Item ${i}`,
  }));
}

// =============================================================================
// 1. Basic Operations
// =============================================================================

Deno.bench({
  name: "create state",
  group: "Basic Operations",
  fn: () => {
    newSimpleState(0);
  },
});

Deno.bench({
  name: "get primitive",
  group: "Basic Operations",
  fn: () => {
    const state = newSimpleState(42);
    state.get();
  },
});

Deno.bench({
  name: "set primitive",
  group: "Basic Operations",
  fn: () => {
    const state = newSimpleState(0);
    state.set(1);
  },
});

Deno.bench({
  name: "subscribe",
  group: "Basic Operations",
  fn: () => {
    const state = newSimpleState(0);
    state.subscribe(() => {});
  },
});

Deno.bench({
  name: "subscribe + unsubscribe",
  group: "Basic Operations",
  fn: () => {
    const state = newSimpleState(0);
    const id = state.subscribe(() => {});
    state.unsubscribe(id);
  },
});

// =============================================================================
// 2. Scaling Tests
// =============================================================================

Deno.bench({
  name: "set with 1 subscriber",
  group: "Scaling with Subscribers",
  fn: () => {
    const state = newSimpleState(0);
    state.subscribe(() => {});
    state.set(1);
  },
});

Deno.bench({
  name: "set with 10 subscribers",
  group: "Scaling with Subscribers",
  fn: () => {
    const state = newSimpleState(0);
    for (let i = 0; i < 10; i++) {
      state.subscribe(() => {});
    }
    state.set(1);
  },
});

Deno.bench({
  name: "set with 100 subscribers",
  group: "Scaling with Subscribers",
  fn: () => {
    const state = newSimpleState(0);
    for (let i = 0; i < 100; i++) {
      state.subscribe(() => {});
    }
    state.set(1);
  },
});

// =============================================================================
// 3. Clone Performance
// =============================================================================

Deno.bench({
  name: "get (with clone)",
  group: "Clone Impact: Small Object",
  fn: () => {
    const obj = { a: 1, b: 2, c: 3 };
    const state = newSimpleState(obj);
    state.get();
  },
});

Deno.bench({
  name: "get (no clone)",
  group: "Clone Impact: Small Object",
  fn: () => {
    const obj = { a: 1, b: 2, c: 3 };
    const state = newSimpleState(obj, { clone: false, suppressWarnings: true });
    state.get();
  },
});

Deno.bench({
  name: "get (with clone)",
  group: "Clone Impact: 100-item Array",
  fn: () => {
    const arr = buildData(100);
    const state = newSimpleState(arr);
    state.get();
  },
});

Deno.bench({
  name: "get (no clone)",
  group: "Clone Impact: 100-item Array",
  fn: () => {
    const arr = buildData(100);
    const state = newSimpleState(arr, { clone: false, suppressWarnings: true });
    state.get();
  },
});

Deno.bench({
  name: "get (with clone)",
  group: "Clone Impact: 1000-item Array",
  fn: () => {
    const arr = buildData(1000);
    const state = newSimpleState(arr);
    state.get();
  },
});

Deno.bench({
  name: "get (no clone)",
  group: "Clone Impact: 1000-item Array",
  fn: () => {
    const arr = buildData(1000);
    const state = newSimpleState(arr, { clone: false, suppressWarnings: true });
    state.get();
  },
});

// =============================================================================
// 4. Real-world Scenarios
// =============================================================================

Deno.bench({
  name: "increment with subscriber",
  group: "Real-world: Counter",
  fn: () => {
    const state = newSimpleState(0);
    state.subscribe(() => {});
    state.set(state.get() + 1);
  },
});

Deno.bench({
  name: "add item",
  group: "Real-world: Todo List (100 items)",
  fn: () => {
    const todos = buildData(100);
    const state = newSimpleState(todos);
    state.set([...state.get(), { id: 101, label: "New" }]);
  },
});

Deno.bench({
  name: "update item",
  group: "Real-world: Todo List (100 items)",
  fn: () => {
    const todos = buildData(100);
    const state = newSimpleState(todos);
    const current = state.get();
    state.set(
      current.map((todo, i) =>
        i === 50 ? { ...todo, label: "Updated" } : todo
      ),
    );
  },
});

Deno.bench({
  name: "remove item",
  group: "Real-world: Todo List (100 items)",
  fn: () => {
    const todos = buildData(100);
    const state = newSimpleState(todos);
    state.set(state.get().filter((_, i) => i !== 50));
  },
});

Deno.bench({
  name: "update single field",
  group: "Real-world: Form State",
  fn: () => {
    const state = newSimpleState({
      username: "",
      email: "",
      password: "",
    });
    state.set({ ...state.get(), username: "alice" });
  },
});

Deno.bench({
  name: "10 rapid updates (auto-batched)",
  group: "Real-world: Batch Updates",
  fn: () => {
    const state = newSimpleState(0);
    for (let i = 0; i < 10; i++) {
      state.set(i);
    }
  },
});

// =============================================================================
// 5. Framework Comparison (js-framework-benchmark style)
// =============================================================================

Deno.bench({
  name: "create 1,000 rows",
  group: "Framework Benchmark: Create Rows",
  fn: () => {
    const state = newSimpleState<Row[]>([]);
    state.set(buildData(1000));
  },
});

Deno.bench({
  name: "create 10,000 rows",
  group: "Framework Benchmark: Create Rows",
  fn: () => {
    const state = newSimpleState<Row[]>([]);
    state.set(buildData(10000));
  },
});

Deno.bench({
  name: "update every 10th row (1,000 rows)",
  group: "Framework Benchmark: Update Rows",
  fn: () => {
    const state = newSimpleState<Row[]>(buildData(1000));
    const data = state.get();
    state.set(
      data.map((row, index) =>
        index % 10 === 0 ? { ...row, label: row.label + " !!!" } : row
      ),
    );
  },
});

Deno.bench({
  name: "swap 2 rows (1,000 rows)",
  group: "Framework Benchmark: Update Rows",
  fn: () => {
    const state = newSimpleState<Row[]>(buildData(1000));
    const data = state.get();
    if (data.length > 998) {
      const newData = [...data];
      const temp = newData[1];
      newData[1] = newData[998];
      newData[998] = temp;
      state.set(newData);
    }
  },
});

Deno.bench({
  name: "clear 1,000 rows",
  group: "Framework Benchmark: Clear Rows",
  fn: () => {
    const state = newSimpleState<Row[]>(buildData(1000));
    state.set([]);
  },
});

Deno.bench({
  name: "clear 10,000 rows",
  group: "Framework Benchmark: Clear Rows",
  fn: () => {
    const state = newSimpleState<Row[]>(buildData(10000));
    state.set([]);
  },
});
