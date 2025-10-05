import { bench, describe } from "vitest";
import { newSimpleState } from "../src/index";

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
    label: `Item ${i}`
  }));
}

// =============================================================================
// 1. Basic Operations
// =============================================================================

describe("Basic Operations", () => {
  bench("create state", () => {
    newSimpleState(0);
  });

  bench("get primitive", () => {
    const state = newSimpleState(42);
    state.get();
  });

  bench("set primitive", () => {
    const state = newSimpleState(0);
    state.set(1);
  });

  bench("subscribe", () => {
    const state = newSimpleState(0);
    state.subscribe(() => {});
  });

  bench("subscribe + unsubscribe", () => {
    const state = newSimpleState(0);
    const id = state.subscribe(() => {});
    state.unsubscribe(id);
  });
});

// =============================================================================
// 2. Scaling Tests
// =============================================================================

describe("Scaling with Subscribers", () => {
  bench("set with 1 subscriber", () => {
    const state = newSimpleState(0);
    state.subscribe(() => {});
    state.set(1);
  });

  bench("set with 10 subscribers", () => {
    const state = newSimpleState(0);
    for (let i = 0; i < 10; i++) {
      state.subscribe(() => {});
    }
    state.set(1);
  });

  bench("set with 100 subscribers", () => {
    const state = newSimpleState(0);
    for (let i = 0; i < 100; i++) {
      state.subscribe(() => {});
    }
    state.set(1);
  });
});

// =============================================================================
// 3. Clone Performance
// =============================================================================

describe("Clone Impact: Small Object", () => {
  const obj = { a: 1, b: 2, c: 3 };

  bench("get (with clone)", () => {
    const state = newSimpleState(obj);
    state.get();
  });

  bench("get (no clone)", () => {
    const state = newSimpleState(obj, { clone: false, suppressWarnings: true });
    state.get();
  });
});

describe("Clone Impact: 100-item Array", () => {
  const arr = buildData(100);

  bench("get (with clone)", () => {
    const state = newSimpleState(arr);
    state.get();
  });

  bench("get (no clone)", () => {
    const state = newSimpleState(arr, { clone: false, suppressWarnings: true });
    state.get();
  });
});

describe("Clone Impact: 1000-item Array", () => {
  const arr = buildData(1000);

  bench("get (with clone)", () => {
    const state = newSimpleState(arr);
    state.get();
  });

  bench("get (no clone)", () => {
    const state = newSimpleState(arr, { clone: false, suppressWarnings: true });
    state.get();
  });
});

// =============================================================================
// 4. Real-world Scenarios
// =============================================================================

describe("Real-world: Counter", () => {
  bench("increment with subscriber", () => {
    const state = newSimpleState(0);
    state.subscribe(() => {});
    state.set(state.get() + 1);
  });
});

describe("Real-world: Todo List (100 items)", () => {
  const todos = buildData(100);

  bench("add item", () => {
    const state = newSimpleState(todos);
    state.set([...state.get(), { id: 101, label: "New" }]);
  });

  bench("update item", () => {
    const state = newSimpleState(todos);
    const current = state.get();
    state.set(
      current.map((todo, i) =>
        i === 50 ? { ...todo, label: "Updated" } : todo
      )
    );
  });

  bench("remove item", () => {
    const state = newSimpleState(todos);
    state.set(state.get().filter((_, i) => i !== 50));
  });
});

describe("Real-world: Form State", () => {
  bench("update single field", () => {
    const state = newSimpleState({
      username: "",
      email: "",
      password: ""
    });
    state.set({ ...state.get(), username: "alice" });
  });
});

describe("Real-world: Batch Updates", () => {
  bench("10 rapid updates (auto-batched)", () => {
    const state = newSimpleState(0);
    for (let i = 0; i < 10; i++) {
      state.set(i);
    }
  });
});

// =============================================================================
// 5. Framework Comparison (js-framework-benchmark style)
// =============================================================================

describe("Framework Benchmark: Create Rows", () => {
  bench("create 1,000 rows", () => {
    const state = newSimpleState<Row[]>([]);
    state.set(buildData(1000));
  });

  bench("create 10,000 rows", () => {
    const state = newSimpleState<Row[]>([]);
    state.set(buildData(10000));
  });
});

describe("Framework Benchmark: Update Rows", () => {
  bench("update every 10th row (1,000 rows)", () => {
    const state = newSimpleState<Row[]>(buildData(1000));
    const data = state.get();
    state.set(
      data.map((row, index) =>
        index % 10 === 0 ? { ...row, label: row.label + " !!!" } : row
      )
    );
  });

  bench("swap 2 rows (1,000 rows)", () => {
    const state = newSimpleState<Row[]>(buildData(1000));
    const data = state.get();
    if (data.length > 998) {
      const newData = [...data];
      const temp = newData[1];
      newData[1] = newData[998];
      newData[998] = temp;
      state.set(newData);
    }
  });
});

describe("Framework Benchmark: Clear Rows", () => {
  bench("clear 1,000 rows", () => {
    const state = newSimpleState<Row[]>(buildData(1000));
    state.set([]);
  });

  bench("clear 10,000 rows", () => {
    const state = newSimpleState<Row[]>(buildData(10000));
    state.set([]);
  });
});
