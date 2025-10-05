import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * DevTools and Debugging Patterns
 *
 * Simple patterns for inspecting and debugging state changes
 */

// =============================================================================
// Pattern 1: Basic Logger
// =============================================================================

console.log("=== Pattern 1: Basic Logger ===");

function createLogger<T>(state: SimpleState<T>, name: string) {
  state.subscribe((value) => {
    console.log(`[${name}]`, value);
  });
}

const counter = newSimpleState(0);
createLogger(counter, "Counter");

counter.set(1);
counter.set(2);
counter.set(3);

// =============================================================================
// Pattern 2: Detailed Logger with Timestamps
// =============================================================================

console.log("\n=== Pattern 2: Detailed Logger ===");

function createDetailedLogger<T>(state: SimpleState<T>, name: string) {
  let previousValue: T | undefined;

  state.subscribe((value) => {
    const timestamp = new Date().toISOString();
    console.group(`[${name}] @ ${timestamp}`);
    console.log("Previous:", previousValue);
    console.log("Current:", value);
    console.groupEnd();
    previousValue = value;
  });
}

const user = newSimpleState({ name: "Alice", age: 30 });
createDetailedLogger(user, "User");

user.set({ name: "Bob", age: 25 });
user.set({ name: "Charlie", age: 35 });

// =============================================================================
// Pattern 3: Conditional Logger (only log if condition met)
// =============================================================================

console.log("\n=== Pattern 3: Conditional Logger ===");

function createConditionalLogger<T>(
  state: SimpleState<T>,
  name: string,
  shouldLog: (value: T) => boolean
) {
  state.subscribe((value) => {
    if (shouldLog(value)) {
      console.log(`[${name}]`, value);
    }
  });
}

const score = newSimpleState(0);
createConditionalLogger(score, "Score", (value) => value > 10);

score.set(5); // Won't log
score.set(15); // Will log
score.set(20); // Will log

// =============================================================================
// Pattern 4: Change Tracker (only log what changed)
// =============================================================================

console.log("\n=== Pattern 4: Change Tracker ===");

function createChangeTracker<T extends Record<string, any>>(
  state: SimpleState<T>,
  name: string
) {
  let previousValue = state.get();

  state.subscribe((value) => {
    const changes: Record<string, { from: any; to: any }> = {};

    for (const key in value) {
      if (value[key] !== previousValue[key]) {
        changes[key] = { from: previousValue[key], to: value[key] };
      }
    }

    if (Object.keys(changes).length > 0) {
      console.log(`[${name}] Changes:`, changes);
    }

    previousValue = value;
  });
}

const settings = newSimpleState({ theme: "dark", fontSize: 14, notifications: true });
createChangeTracker(settings, "Settings");

settings.set({ ...settings.get(), theme: "light" });
settings.set({ ...settings.get(), fontSize: 16, notifications: false });

// =============================================================================
// Pattern 5: Performance Monitor
// =============================================================================

console.log("\n=== Pattern 5: Performance Monitor ===");

function createPerfMonitor<T>(state: SimpleState<T>, name: string) {
  let updateCount = 0;
  let lastUpdate = Date.now();

  state.subscribe(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate;
    updateCount++;

    console.log(`[${name}] Update #${updateCount}, ${timeSinceLastUpdate}ms since last update`);
    lastUpdate = now;
  });
}

const todos = newSimpleState<string[]>([]);
createPerfMonitor(todos, "Todos");

todos.set(["Learn Simple State"]);
todos.set(["Learn Simple State", "Build an app"]);
todos.set(["Learn Simple State", "Build an app", "Deploy"]);

// =============================================================================
// Pattern 6: Redux DevTools Integration
// =============================================================================

console.log("\n=== Pattern 6: Redux DevTools Integration ===");

function connectReduxDevTools<T>(state: SimpleState<T>, name: string) {
  // Check if Redux DevTools Extension is available
  const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;

  if (!devTools) {
    console.warn("Redux DevTools Extension not found");
    return;
  }

  const devToolsInstance = devTools.connect({ name });

  // Send initial state
  devToolsInstance.init(state.get());

  // Subscribe to state changes
  state.subscribe((value) => {
    devToolsInstance.send("STATE_UPDATE", value);
  });

  // Listen for time-travel from DevTools
  devToolsInstance.subscribe((message: any) => {
    if (message.type === "DISPATCH" && message.state) {
      state.set(JSON.parse(message.state));
    }
  });

  console.log(`[${name}] Connected to Redux DevTools`);
}

// Usage (only works if Redux DevTools Extension is installed):
const appState = newSimpleState({ count: 0, user: "Alice" });
// connectReduxDevTools(appState, "AppState");

// =============================================================================
// Pattern 7: Debugger with Breakpoints
// =============================================================================

console.log("\n=== Pattern 7: Debugger with Breakpoints ===");

function createDebugger<T>(
  state: SimpleState<T>,
  name: string,
  breakOn?: (value: T) => boolean
) {
  state.subscribe((value) => {
    console.log(`[${name}]`, value);

    if (breakOn && breakOn(value)) {
      console.warn(`[${name}] Breakpoint hit!`);
      debugger; // Pauses execution if DevTools are open
    }
  });
}

const debugCounter = newSimpleState(0);
createDebugger(debugCounter, "DebugCounter", (value) => value === 5);

debugCounter.set(1);
debugCounter.set(2);
debugCounter.set(5); // Will trigger debugger

// =============================================================================
// Pattern 8: State History Tracker
// =============================================================================

console.log("\n=== Pattern 8: State History Tracker ===");

function createHistoryTracker<T>(state: SimpleState<T>, name: string, maxHistory = 10) {
  const history: T[] = [state.get()];

  state.subscribe((value) => {
    history.push(value);
    if (history.length > maxHistory) {
      history.shift();
    }
    console.log(`[${name}] History (last ${history.length}):`, history);
  });

  return {
    getHistory: () => [...history],
    clearHistory: () => {
      history.length = 0;
      history.push(state.get());
    }
  };
}

const historyCounter = newSimpleState(0);
const tracker = createHistoryTracker(historyCounter, "HistoryCounter", 5);

historyCounter.set(1);
historyCounter.set(2);
historyCounter.set(3);

console.log("Full history:", tracker.getHistory());

// =============================================================================
// Summary
// =============================================================================

console.log("\n=== DevTools Patterns Summary ===");
console.log(`
Available Patterns:

1. Basic Logger - Simple console.log wrapper
2. Detailed Logger - Timestamps, previous/current values
3. Conditional Logger - Only log when condition is met
4. Change Tracker - Only log changed properties
5. Performance Monitor - Track update frequency
6. Redux DevTools - Integrate with browser extension
7. Debugger - Programmatic breakpoints
8. History Tracker - Keep track of past states

Usage:
- Copy the pattern you need into your project
- Customize the logging output
- Disable in production with environment checks:

  if (process.env.NODE_ENV === 'development') {
    createLogger(state, 'MyState');
  }
`);
