import { newSimpleState, type SimpleState } from "../src/index";

// ============================================================================
// Tab Switching
// ============================================================================
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabName = tab.getAttribute("data-tab")!;

    // Update active tab
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // Update active content
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    document.getElementById(tabName)!.classList.add("active");
  });
});

// ============================================================================
// BASIC EXAMPLES
// ============================================================================

// Counter Example
const counter = newSimpleState(0);
const counterOutput = document.getElementById("counter-output")!;

counter.subscribe((value) => {
  counterOutput.textContent = `Count: ${value}`;
});

document.getElementById("increment")!.addEventListener("click", () => {
  counter.set(counter.get() + 1);
});

document.getElementById("decrement")!.addEventListener("click", () => {
  counter.set(counter.get() - 1);
});

document.getElementById("reset")!.addEventListener("click", () => {
  counter.set(0);
});

// Todo List Example
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todos = newSimpleState<Todo[]>([]);
const todoOutput = document.getElementById("todo-output")!;
const todoInput = document.getElementById("todo-input") as HTMLInputElement;

todos.subscribe((todoList) => {
  if (todoList.length === 0) {
    todoOutput.innerHTML = "No todos yet";
    return;
  }

  todoOutput.innerHTML = todoList
    .map(
      (todo) => `
      <div style="margin: 8px 0; display: flex; align-items: center; gap: 8px;">
        <input
          type="checkbox"
          ${todo.completed ? "checked" : ""}
          onchange="toggleTodo(${todo.id})"
        />
        <span style="flex: 1; ${todo.completed ? "text-decoration: line-through; color: #999;" : ""}">${todo.text}</span>
        <button onclick="deleteTodo(${todo.id})" style="background: #dc3545; padding: 4px 8px; font-size: 12px;">Delete</button>
      </div>
    `
    )
    .join("");
});

// Make functions global for inline event handlers
(window as any).toggleTodo = (id: number) => {
  todos.set(
    todos.get().map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
  );
};

(window as any).deleteTodo = (id: number) => {
  todos.set(todos.get().filter((todo) => todo.id !== id));
};

document.getElementById("add-todo")!.addEventListener("click", () => {
  const text = todoInput.value.trim();
  if (!text) return;

  const newTodo: Todo = {
    id: Date.now(),
    text,
    completed: false,
  };

  todos.set([...todos.get(), newTodo]);
  todoInput.value = "";
});

todoInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("add-todo")!.click();
  }
});

// ============================================================================
// COMPUTED VALUES
// ============================================================================

// Helper function to create computed state
function computed<T>(
  states: Array<SimpleState<any>>,
  computeFn: (...values: any[]) => T
): SimpleState<T> {
  const result = newSimpleState(computeFn(...states.map(s => s.get())));
  states.forEach(state => {
    state.subscribe(() => {
      result.set(computeFn(...states.map(s => s.get())));
    });
  });
  return result;
}

// Full Name Example
const firstName = newSimpleState("John");
const lastName = newSimpleState("Doe");
const fullName = computed([firstName, lastName], (first, last) => `${first} ${last}`);

const fullNameOutput = document.getElementById("full-name-output")!;
fullName.subscribe((name) => {
  fullNameOutput.textContent = `Full Name: ${name}`;
});

document.getElementById("first-name")!.addEventListener("input", (e) => {
  firstName.set((e.target as HTMLInputElement).value);
});

document.getElementById("last-name")!.addEventListener("input", (e) => {
  lastName.set((e.target as HTMLInputElement).value);
});

// Shopping Cart Example
interface CartItem {
  name: string;
  price: number;
}

const cart = newSimpleState<CartItem[]>([]);
const taxRate = newSimpleState(0.08);

const subtotal = computed([cart], (items) =>
  items.reduce((sum, item) => sum + item.price, 0)
);

const total = computed([subtotal, taxRate], (sub, rate) =>
  sub * (1 + rate)
);

const cartOutput = document.getElementById("cart-output")!;

function updateCartDisplay() {
  const items = cart.get();
  const sub = subtotal.get();
  const tot = total.get();
  const rate = taxRate.get();

  if (items.length === 0) {
    cartOutput.innerHTML = "Cart is empty";
    return;
  }

  cartOutput.innerHTML = `
    <div><strong>Items (${items.length}):</strong></div>
    ${items.map(item => `<div>• ${item.name}: $${item.price.toFixed(2)}</div>`).join("")}
    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
      <div>Subtotal: $${sub.toFixed(2)}</div>
      <div>Tax (${(rate * 100).toFixed(0)}%): $${(tot - sub).toFixed(2)}</div>
      <div><strong>Total: $${tot.toFixed(2)}</strong></div>
    </div>
  `;
}

cart.subscribe(updateCartDisplay);
total.subscribe(updateCartDisplay);

let itemCounter = 1;
document.getElementById("add-item")!.addEventListener("click", () => {
  cart.set([...cart.get(), { name: `Item ${itemCounter++}`, price: 10 }]);
});

document.getElementById("remove-item")!.addEventListener("click", () => {
  const items = cart.get();
  if (items.length > 0) {
    cart.set(items.slice(0, -1));
  }
});

document.getElementById("tax-rate")!.addEventListener("input", (e) => {
  const value = parseFloat((e.target as HTMLInputElement).value);
  taxRate.set(value / 100);
});

// ============================================================================
// ACTIONS
// ============================================================================

// Counter with History
interface CounterState {
  value: number;
  history: number[];
}

function createCounter(initialValue = 0) {
  const state = newSimpleState<CounterState>({
    value: initialValue,
    history: [initialValue]
  });

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
      state.set({ value: 0, history: [0] });
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

  return { state, actions };
}

const actionCounter = createCounter();
const actionCounterOutput = document.getElementById("action-counter-output")!;

actionCounter.state.subscribe((state) => {
  actionCounterOutput.innerHTML = `
    <div><strong>Value: ${state.value}</strong></div>
    <div>History: [${state.history.join(", ")}]</div>
    <div style="margin-top: 8px; color: #666; font-size: 12px;">
      ${state.history.length} states in history
    </div>
  `;
});

document.getElementById("action-increment")!.addEventListener("click", () => {
  actionCounter.actions.increment();
});

document.getElementById("action-decrement")!.addEventListener("click", () => {
  actionCounter.actions.decrement();
});

document.getElementById("action-increment-by-5")!.addEventListener("click", () => {
  actionCounter.actions.incrementBy(5);
});

document.getElementById("action-undo")!.addEventListener("click", () => {
  actionCounter.actions.undo();
});

document.getElementById("action-reset")!.addEventListener("click", () => {
  actionCounter.actions.reset();
});

// Async Data Fetching
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

  return { state, actions };
}

interface User {
  id: number;
  name: string;
  email: string;
}

const userStore = createAsyncStore<User>();
const asyncOutput = document.getElementById("async-output")!;

userStore.state.subscribe((state) => {
  if (state.loading) {
    asyncOutput.innerHTML = '<div style="color: #007bff;">⏳ Loading user...</div>';
  } else if (state.error) {
    asyncOutput.innerHTML = `<div style="color: #dc3545;">❌ Error: ${state.error}</div>`;
  } else if (state.data) {
    asyncOutput.innerHTML = `
      <div style="color: #28a745;">✓ User loaded:</div>
      <div style="margin-left: 16px;">
        <div><strong>${state.data.name}</strong></div>
        <div>${state.data.email}</div>
        <div style="color: #666; font-size: 12px;">ID: ${state.data.id}</div>
      </div>
    `;
  } else {
    asyncOutput.innerHTML = '<div style="color: #666;">No data loaded</div>';
  }
});

document.getElementById("fetch-user")!.addEventListener("click", async () => {
  await userStore.actions.fetchData(() =>
    new Promise<User>((resolve) => {
      setTimeout(() => {
        resolve({
          id: Math.floor(Math.random() * 1000),
          name: "Alice Johnson",
          email: "alice@example.com"
        });
      }, 1000);
    })
  );
});

document.getElementById("fetch-error")!.addEventListener("click", async () => {
  await userStore.actions.fetchData(() =>
    new Promise<User>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Failed to fetch user data"));
      }, 1000);
    })
  );
});

document.getElementById("reset-data")!.addEventListener("click", () => {
  userStore.actions.reset();
});

// ============================================================================
// MAPS
// ============================================================================

interface StateMap<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
  getAll(): Map<string, T>;
  subscribe(callback: (map: Map<string, T>) => void): number;
}

function createStateMap<T>(initial?: Map<string, T>): StateMap<T> {
  const state = newSimpleState(new Map(initial));

  return {
    get(key: string) {
      return state.get().get(key);
    },
    set(key: string, value: T) {
      const newMap = new Map(state.get());
      newMap.set(key, value);
      state.set(newMap);
    },
    delete(key: string) {
      const newMap = new Map(state.get());
      newMap.delete(key);
      state.set(newMap);
    },
    getAll() {
      return state.get();
    },
    subscribe(callback: (map: Map<string, T>) => void) {
      return state.subscribe(callback);
    }
  };
}

// User Status Map
interface User2 {
  id: string;
  name: string;
  online: boolean;
}

const userMap = createStateMap<User2>();
const userMapOutput = document.getElementById("user-map-output")!;

userMap.subscribe((users) => {
  if (users.size === 0) {
    userMapOutput.innerHTML = "No users";
    return;
  }

  userMapOutput.innerHTML = `
    <div><strong>Users (${users.size}):</strong></div>
    ${Array.from(users.values())
      .map(user => `
        <div style="margin: 4px 0;">
          ${user.online ? "🟢" : "⚫"} ${user.name}
          <span style="color: #666; font-size: 12px;">(${user.id})</span>
        </div>
      `)
      .join("")}
  `;
});

const names = ["Alice", "Bob", "Charlie", "Dave", "Eve", "Frank"];
let userIdCounter = 1;

document.getElementById("add-user")!.addEventListener("click", () => {
  const id = `user-${userIdCounter++}`;
  const name = names[Math.floor(Math.random() * names.length)];
  const online = Math.random() > 0.5;
  userMap.set(id, { id, name, online });
});

document.getElementById("toggle-user")!.addEventListener("click", () => {
  const users = Array.from(userMap.getAll().entries());
  if (users.length > 0) {
    const [id, user] = users[0];
    userMap.set(id, { ...user, online: !user.online });
  }
});

document.getElementById("remove-user")!.addEventListener("click", () => {
  const users = Array.from(userMap.getAll().keys());
  if (users.length > 0) {
    userMap.delete(users[users.length - 1]);
  }
});

// Normalized Store
interface Post {
  id: string;
  title: string;
  authorId: string;
}

interface Author {
  id: string;
  name: string;
}

const posts = createStateMap<Post>();
const authors = createStateMap<Author>();
const normalizedOutput = document.getElementById("normalized-output")!;

function updateNormalizedDisplay() {
  const postList = Array.from(posts.getAll().values());
  const authorMap = authors.getAll();

  if (postList.length === 0) {
    normalizedOutput.innerHTML = "No posts";
    return;
  }

  normalizedOutput.innerHTML = `
    <div><strong>Posts (${postList.length}):</strong></div>
    ${postList
      .map(post => {
        const author = authorMap.get(post.authorId);
        return `
          <div style="margin: 8px 0; padding: 8px; background: #f0f0f0; border-radius: 4px;">
            <div><strong>${post.title}</strong></div>
            <div style="color: #666; font-size: 12px;">
              by ${author?.name || "Unknown"} (${post.authorId})
            </div>
          </div>
        `;
      })
      .join("")}
  `;
}

posts.subscribe(updateNormalizedDisplay);
authors.subscribe(updateNormalizedDisplay);

// Initialize with some authors
authors.set("a1", { id: "a1", name: "Alice" });
authors.set("a2", { id: "a2", name: "Bob" });

const postTitles = [
  "Getting Started with Simple State",
  "Advanced Patterns",
  "Performance Tips",
  "Best Practices",
  "Common Pitfalls"
];
let postCounter = 1;

document.getElementById("add-post")!.addEventListener("click", () => {
  const id = `p${postCounter++}`;
  const title = postTitles[Math.floor(Math.random() * postTitles.length)];
  const authorId = Math.random() > 0.5 ? "a1" : "a2";
  posts.set(id, { id, title, authorId });
});
