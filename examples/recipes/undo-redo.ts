import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * Undo/Redo Patterns
 *
 * Implementing history, time-travel, and command patterns for state management
 */

// =============================================================================
// Pattern 1: Basic Undo/Redo
// =============================================================================

console.log("=== Pattern 1: Basic Undo/Redo ===");

function createUndoable<T>(initial: T) {
  const state = newSimpleState(initial);
  const history: T[] = [initial];
  let index = 0;

  // Track changes to history
  const originalSet = state.set.bind(state);
  state.set = (value: T) => {
    // Remove any "future" history when making a new change
    history.splice(index + 1);
    history.push(value);
    index = history.length - 1;
    originalSet(value);
  };

  return {
    state,
    undo: () => {
      if (index > 0) {
        index--;
        originalSet(history[index]);
      }
    },
    redo: () => {
      if (index < history.length - 1) {
        index++;
        originalSet(history[index]);
      }
    },
    canUndo: () => index > 0,
    canRedo: () => index < history.length - 1,
    getHistory: () => [...history],
    getCurrentIndex: () => index
  };
}

// Usage
const counter = createUndoable(0);

counter.state.subscribe((value) => {
  console.log("Counter:", value, `(can undo: ${counter.canUndo()}, can redo: ${counter.canRedo()})`);
});

counter.state.set(1);
counter.state.set(2);
counter.state.set(3);

console.log("Undoing...");
counter.undo(); // Back to 2
counter.undo(); // Back to 1

console.log("Redoing...");
counter.redo(); // Forward to 2

console.log("Making new change (erases redo history)...");
counter.state.set(10);
console.log("Can redo?", counter.canRedo()); // false

// =============================================================================
// Pattern 2: Limited History (memory-efficient)
// =============================================================================

console.log("\n=== Pattern 2: Limited History ===");

function createLimitedUndoable<T>(initial: T, maxHistory = 10) {
  const state = newSimpleState(initial);
  const history: T[] = [initial];
  let index = 0;

  const originalSet = state.set.bind(state);
  state.set = (value: T) => {
    history.splice(index + 1);
    history.push(value);

    // Limit history size
    if (history.length > maxHistory) {
      history.shift();
      index = history.length - 1;
    } else {
      index = history.length - 1;
    }

    originalSet(value);
  };

  return {
    state,
    undo: () => {
      if (index > 0) {
        index--;
        originalSet(history[index]);
      }
    },
    redo: () => {
      if (index < history.length - 1) {
        index++;
        originalSet(history[index]);
      }
    },
    canUndo: () => index > 0,
    canRedo: () => index < history.length - 1
  };
}

// Usage - only keeps last 5 states
const limitedCounter = createLimitedUndoable(0, 5);

for (let i = 1; i <= 10; i++) {
  limitedCounter.state.set(i);
}

console.log("Can only undo 4 times (limited to 5 history items)");
let undoCount = 0;
while (limitedCounter.canUndo()) {
  limitedCounter.undo();
  undoCount++;
}
console.log("Undo count:", undoCount);

// =============================================================================
// Pattern 3: Named Actions (Command Pattern)
// =============================================================================

console.log("\n=== Pattern 3: Named Actions ===");

interface HistoryEntry<T> {
  state: T;
  action: string;
  timestamp: number;
}

function createActionHistory<T>(initial: T) {
  const state = newSimpleState(initial);
  const history: HistoryEntry<T>[] = [
    { state: initial, action: "init", timestamp: Date.now() }
  ];
  let index = 0;

  const originalSet = state.set.bind(state);

  return {
    state,
    do: (action: string, newState: T) => {
      history.splice(index + 1);
      history.push({
        state: newState,
        action,
        timestamp: Date.now()
      });
      index = history.length - 1;
      originalSet(newState);
    },
    undo: () => {
      if (index > 0) {
        index--;
        console.log(`Undoing: ${history[index + 1].action}`);
        originalSet(history[index].state);
      }
    },
    redo: () => {
      if (index < history.length - 1) {
        index++;
        console.log(`Redoing: ${history[index].action}`);
        originalSet(history[index].state);
      }
    },
    getHistory: () => [...history],
    canUndo: () => index > 0,
    canRedo: () => index < history.length - 1
  };
}

// Usage
const editor = createActionHistory({ text: "" });

editor.do("type", { text: "Hello" });
editor.do("type", { text: "Hello World" });
editor.do("delete", { text: "Hello" });

editor.undo();
editor.redo();

console.log("History:", editor.getHistory());

// =============================================================================
// Pattern 4: Grouped Actions (Transactions)
// =============================================================================

console.log("\n=== Pattern 4: Grouped Actions ===");

function createTransactionalUndoable<T>(initial: T) {
  const state = newSimpleState(initial);
  const history: T[] = [initial];
  let index = 0;
  let isInTransaction = false;
  let transactionStart: T | null = null;

  const originalSet = state.set.bind(state);
  state.set = (value: T) => {
    if (!isInTransaction) {
      history.splice(index + 1);
      history.push(value);
      index = history.length - 1;
    }
    originalSet(value);
  };

  return {
    state,
    beginTransaction: () => {
      isInTransaction = true;
      transactionStart = state.get();
    },
    commitTransaction: () => {
      if (isInTransaction && transactionStart !== null) {
        history.splice(index + 1);
        history.push(state.get());
        index = history.length - 1;
        isInTransaction = false;
        transactionStart = null;
      }
    },
    rollbackTransaction: () => {
      if (isInTransaction && transactionStart !== null) {
        originalSet(transactionStart);
        isInTransaction = false;
        transactionStart = null;
      }
    },
    undo: () => {
      if (index > 0) {
        index--;
        originalSet(history[index]);
      }
    },
    redo: () => {
      if (index < history.length - 1) {
        index++;
        originalSet(history[index]);
      }
    },
    canUndo: () => index > 0,
    canRedo: () => index < history.length - 1
  };
}

// Usage
const canvas = createTransactionalUndoable({ shapes: [] as string[] });

canvas.state.subscribe((value) => {
  console.log("Canvas:", value);
});

// Group multiple changes into one undo step
canvas.beginTransaction();
canvas.state.set({ shapes: ["circle"] });
canvas.state.set({ shapes: ["circle", "square"] });
canvas.state.set({ shapes: ["circle", "square", "triangle"] });
canvas.commitTransaction();

console.log("One undo removes all three shapes:");
canvas.undo();

// =============================================================================
// Pattern 5: Selective Undo (undo specific changes)
// =============================================================================

console.log("\n=== Pattern 5: Selective Undo ===");

interface Change<T> {
  id: string;
  before: T;
  after: T;
  timestamp: number;
}

function createSelectiveUndoable<T>(initial: T) {
  const state = newSimpleState(initial);
  const changes: Change<T>[] = [];

  return {
    state,
    record: (id: string, newState: T) => {
      changes.push({
        id,
        before: state.get(),
        after: newState,
        timestamp: Date.now()
      });
      state.set(newState);
    },
    undoChange: (id: string) => {
      const change = changes.find((c) => c.id === id);
      if (change) {
        state.set(change.before);
        console.log(`Undid change: ${id}`);
      }
    },
    redoChange: (id: string) => {
      const change = changes.find((c) => c.id === id);
      if (change) {
        state.set(change.after);
        console.log(`Redid change: ${id}`);
      }
    },
    getChanges: () => [...changes]
  };
}

// Usage
const doc = createSelectiveUndoable({ title: "", author: "", content: "" });

doc.record("set-title", { title: "My Doc", author: "", content: "" });
doc.record("set-author", { title: "My Doc", author: "Alice", content: "" });
doc.record("set-content", { title: "My Doc", author: "Alice", content: "Hello" });

console.log("Undo just the author change:");
doc.undoChange("set-author");
console.log("Current state:", doc.state.get());

// =============================================================================
// Pattern 6: Time Travel (jump to any point in history)
// =============================================================================

console.log("\n=== Pattern 6: Time Travel ===");

function createTimeTravel<T>(initial: T) {
  const state = newSimpleState(initial);
  const timeline: Array<{ state: T; timestamp: number }> = [
    { state: initial, timestamp: Date.now() }
  ];
  let currentIndex = 0;

  const originalSet = state.set.bind(state);
  state.set = (value: T) => {
    timeline.splice(currentIndex + 1);
    timeline.push({ state: value, timestamp: Date.now() });
    currentIndex = timeline.length - 1;
    originalSet(value);
  };

  return {
    state,
    jumpTo: (index: number) => {
      if (index >= 0 && index < timeline.length) {
        currentIndex = index;
        originalSet(timeline[index].state);
        console.log(`Jumped to index ${index} (${new Date(timeline[index].timestamp).toISOString()})`);
      }
    },
    jumpToTimestamp: (timestamp: number) => {
      // Find closest timestamp
      const closest = timeline.reduce((prev, curr, idx) => {
        return Math.abs(curr.timestamp - timestamp) < Math.abs(prev.entry.timestamp - timestamp)
          ? { entry: curr, index: idx }
          : prev;
      }, { entry: timeline[0], index: 0 });

      currentIndex = closest.index;
      originalSet(closest.entry.state);
    },
    getTimeline: () => [...timeline],
    getCurrentIndex: () => currentIndex
  };
}

// Usage
const timeTravel = createTimeTravel(0);

timeTravel.state.set(1);
setTimeout(() => timeTravel.state.set(2), 100);
setTimeout(() => timeTravel.state.set(3), 200);

setTimeout(() => {
  console.log("Time traveling to index 1:");
  timeTravel.jumpTo(1);
  console.log("Current value:", timeTravel.state.get());
}, 300);

// =============================================================================
// Summary
// =============================================================================

console.log("\n=== Undo/Redo Patterns Summary ===");
console.log(`
Available Patterns:

1. Basic Undo/Redo - Simple linear history
2. Limited History - Memory-efficient with max history size
3. Named Actions - Track what each change was (Command pattern)
4. Grouped Actions - Group multiple changes into one undo step
5. Selective Undo - Undo specific changes by ID
6. Time Travel - Jump to any point in history

Use Cases:
- Text editors: Basic undo/redo with named actions
- Drawing apps: Transactions for multi-step operations
- Forms: Limited history to save memory
- Collaborative editing: Selective undo for specific users
- Debugging: Time travel to inspect any state

Best Practices:
- Limit history size for long-running apps
- Use transactions for multi-step operations
- Name actions for better UX (show "Undo Delete")
- Consider memory usage with large state objects
- Debounce rapid changes to reduce history bloat
`);
