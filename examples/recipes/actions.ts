import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * Actions pattern - encapsulate state updates in named functions
 *
 * This example shows how to create predictable, testable state updates
 * by wrapping them in action functions.
 */

// Example 1: Basic actions
console.log("=== Example 1: Basic Counter Actions ===");

interface Counter {
  value: number;
  history: number[];
}

function createCounter(initialValue = 0) {
  const state = newSimpleState<Counter>({
    value: initialValue,
    history: [initialValue]
  });

  // Actions
  const actions = {
    increment() {
      const current = state.get();
      state.set({
        value: current.value + 1,
        history: [...current.history, current.value + 1]
      });
    },

    decrement() {
      const current = state.get();
      state.set({
        value: current.value - 1,
        history: [...current.history, current.value - 1]
      });
    },

    incrementBy(amount: number) {
      const current = state.get();
      state.set({
        value: current.value + amount,
        history: [...current.history, current.value + amount]
      });
    },

    reset() {
      state.set({
        value: 0,
        history: [0]
      });
    },

    undo() {
      const current = state.get();
      if (current.history.length > 1) {
        const newHistory = current.history.slice(0, -1);
        state.set({
          value: newHistory[newHistory.length - 1],
          history: newHistory
        });
      }
    }
  };

  return {
    state,
    actions,
    subscribe: state.subscribe.bind(state),
    get: state.get.bind(state)
  };
}

const counter = createCounter();

counter.subscribe((state) => {
  console.log(`Counter: ${state.value} (history: ${state.history.join(", ")})`);
});

counter.actions.increment();
counter.actions.increment();
counter.actions.incrementBy(5);
counter.actions.decrement();
counter.actions.undo();
counter.actions.reset();

// Example 2: Todo list with actions
console.log("\n=== Example 2: Todo List Actions ===");

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TodoState {
  todos: Todo[];
  filter: "all" | "active" | "completed";
}

function createTodoStore() {
  const state = newSimpleState<TodoState>({
    todos: [],
    filter: "all"
  });

  const actions = {
    addTodo(text: string) {
      const current = state.get();
      const todo: Todo = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now()
      };
      state.set({
        ...current,
        todos: [...current.todos, todo]
      });
    },

    toggleTodo(id: string) {
      const current = state.get();
      state.set({
        ...current,
        todos: current.todos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
      });
    },

    deleteTodo(id: string) {
      const current = state.get();
      state.set({
        ...current,
        todos: current.todos.filter(todo => todo.id !== id)
      });
    },

    editTodo(id: string, text: string) {
      const current = state.get();
      state.set({
        ...current,
        todos: current.todos.map(todo =>
          todo.id === id ? { ...todo, text } : todo
        )
      });
    },

    setFilter(filter: "all" | "active" | "completed") {
      const current = state.get();
      state.set({ ...current, filter });
    },

    clearCompleted() {
      const current = state.get();
      state.set({
        ...current,
        todos: current.todos.filter(todo => !todo.completed)
      });
    }
  };

  // Selectors
  const selectors = {
    getVisibleTodos(): Todo[] {
      const current = state.get();
      switch (current.filter) {
        case "active":
          return current.todos.filter(t => !t.completed);
        case "completed":
          return current.todos.filter(t => t.completed);
        default:
          return current.todos;
      }
    },

    getStats() {
      const todos = state.get().todos;
      return {
        total: todos.length,
        active: todos.filter(t => !t.completed).length,
        completed: todos.filter(t => t.completed).length
      };
    }
  };

  return {
    state,
    actions,
    selectors,
    subscribe: state.subscribe.bind(state),
    get: state.get.bind(state)
  };
}

const todoStore = createTodoStore();

todoStore.subscribe((state) => {
  const stats = todoStore.selectors.getStats();
  console.log(`\nTodos (${state.filter}): ${stats.active} active, ${stats.completed} completed`);
  todoStore.selectors.getVisibleTodos().forEach(todo => {
    console.log(`  [${todo.completed ? "✓" : " "}] ${todo.text}`);
  });
});

todoStore.actions.addTodo("Learn Simple State");
todoStore.actions.addTodo("Build an app");
todoStore.actions.addTodo("Deploy to production");

const todos = todoStore.get().todos;
todoStore.actions.toggleTodo(todos[0].id);

todoStore.actions.setFilter("active");
todoStore.actions.setFilter("completed");
todoStore.actions.setFilter("all");

// Example 3: Async actions
console.log("\n=== Example 3: Async Actions ===");

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function createAsyncStore<T>() {
  const state = newSimpleState<DataState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const actions = {
    async fetchData(fetchFn: () => Promise<T>) {
      state.set({ data: null, loading: true, error: null });

      try {
        const data = await fetchFn();
        state.set({ data, loading: false, error: null });
      } catch (error) {
        state.set({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    },

    reset() {
      state.set({ data: null, loading: false, error: null });
    }
  };

  return {
    state,
    actions,
    subscribe: state.subscribe.bind(state),
    get: state.get.bind(state)
  };
}

interface User {
  id: number;
  name: string;
}

const userStore = createAsyncStore<User>();

userStore.subscribe((state) => {
  if (state.loading) {
    console.log("Loading user...");
  } else if (state.error) {
    console.log("Error:", state.error);
  } else if (state.data) {
    console.log("User loaded:", state.data.name);
  }
});

// Simulate API call
const fetchUser = () => new Promise<User>((resolve) => {
  setTimeout(() => {
    resolve({ id: 1, name: "Alice" });
  }, 100);
});

await userStore.actions.fetchData(fetchUser);

// Example 4: Middleware pattern
console.log("\n=== Example 4: Action Middleware ===");

type ActionFn<T> = (state: T) => T;
type Middleware<T> = (action: ActionFn<T>, actionName: string) => ActionFn<T>;

function createStoreWithMiddleware<T>(
  initialValue: T,
  middleware: Middleware<T>[]
) {
  const state = newSimpleState(initialValue);

  function dispatch(actionFn: ActionFn<T>, actionName: string) {
    const wrappedAction = middleware.reduce(
      (fn, mw) => mw(fn, actionName),
      actionFn
    );
    state.set(wrappedAction(state.get()));
  }

  return {
    state,
    dispatch,
    subscribe: state.subscribe.bind(state),
    get: state.get.bind(state)
  };
}

// Logging middleware
const logger: Middleware<any> = (action, actionName) => (state) => {
  console.log(`[${actionName}] Before:`, state);
  const newState = action(state);
  console.log(`[${actionName}] After:`, newState);
  return newState;
};

// Validation middleware
const validator: Middleware<number> = (action, actionName) => (state) => {
  const newState = action(state);
  if (newState < 0) {
    console.log(`[${actionName}] Validation failed: value cannot be negative`);
    return state; // Don't apply action
  }
  return newState;
};

const counterWithMiddleware = createStoreWithMiddleware(10, [logger, validator]);

counterWithMiddleware.dispatch((n) => n + 5, "increment");
counterWithMiddleware.dispatch((n) => n - 20, "decrement"); // Will fail validation
