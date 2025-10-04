import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * Memoization pattern - cache expensive computations
 *
 * This example shows how to avoid recalculating expensive operations
 * when the input hasn't changed.
 */

// Helper: Memoized selector
function createSelector<T, R>(
  state: SimpleState<T>,
  selector: (value: T) => R
): () => R {
  let cached: R;
  let lastValue: T;
  let hasCache = false;

  state.subscribe((value) => {
    lastValue = value;
    hasCache = false;
  });

  return () => {
    const current = state.get();
    if (hasCache && current === lastValue) {
      return cached;
    }
    cached = selector(current);
    lastValue = current;
    hasCache = true;
    return cached;
  };
}

// Example 1: Expensive filtering
console.log("=== Example 1: Memoized Filter ===");

interface Product {
  id: number;
  name: string;
  price: number;
  tags: string[];
}

const products = newSimpleState<Product[]>([
  { id: 1, name: "Laptop", price: 999, tags: ["electronics", "computers"] },
  { id: 2, name: "Mouse", price: 29, tags: ["electronics", "accessories"] },
  { id: 3, name: "Desk", price: 299, tags: ["furniture", "office"] },
  { id: 4, name: "Chair", price: 199, tags: ["furniture", "office"] },
]);

// Expensive operation: filter by tag
const getElectronics = createSelector(products, (items) => {
  console.log("Computing electronics filter...");
  return items.filter(p => p.tags.includes("electronics"));
});

console.log("First call:");
console.log(getElectronics()); // Computes

console.log("\nSecond call (cached):");
console.log(getElectronics()); // Returns cached result

console.log("\nAfter state change:");
products.set([
  ...products.get(),
  { id: 5, name: "Keyboard", price: 79, tags: ["electronics", "accessories"] }
]);
console.log(getElectronics()); // Re-computes

// Example 2: Memoized computation with multiple selectors
console.log("\n=== Example 2: Multiple Memoized Selectors ===");

const data = newSimpleState({
  items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  multiplier: 2
});

const getEvenNumbers = createSelector(data, (d) => {
  console.log("Computing even numbers...");
  return d.items.filter(n => n % 2 === 0);
});

const getSum = createSelector(data, (d) => {
  console.log("Computing sum...");
  return d.items.reduce((sum, n) => sum + n, 0);
});

const getMultiplied = createSelector(data, (d) => {
  console.log("Computing multiplied values...");
  return d.items.map(n => n * d.multiplier);
});

console.log("Even numbers:", getEvenNumbers());
console.log("Sum:", getSum());
console.log("Multiplied:", getMultiplied());

console.log("\nCalling again (all cached):");
console.log("Even numbers:", getEvenNumbers());
console.log("Sum:", getSum());
console.log("Multiplied:", getMultiplied());

// Example 3: Parameterized memoization
console.log("\n=== Example 3: Parameterized Memoization ===");

interface User {
  id: number;
  name: string;
  role: string;
}

const users = newSimpleState<User[]>([
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" },
  { id: 3, name: "Charlie", role: "admin" },
  { id: 4, name: "Dave", role: "user" },
]);

// Cache by role
const memoCache = new Map<string, User[]>();

function getUsersByRole(role: string): User[] {
  if (memoCache.has(role)) {
    console.log(`Returning cached results for role: ${role}`);
    return memoCache.get(role)!;
  }

  console.log(`Computing results for role: ${role}`);
  const result = users.get().filter(u => u.role === role);
  memoCache.set(role, result);
  return result;
}

// Clear cache when users change
users.subscribe(() => {
  console.log("Users changed, clearing cache");
  memoCache.clear();
});

console.log("First call for admins:");
console.log(getUsersByRole("admin"));

console.log("\nSecond call for admins (cached):");
console.log(getUsersByRole("admin"));

console.log("\nFirst call for users:");
console.log(getUsersByRole("user"));

console.log("\nUpdate users:");
users.set([
  ...users.get(),
  { id: 5, name: "Eve", role: "admin" }
]);

console.log("\nCall for admins after update (recomputed):");
console.log(getUsersByRole("admin"));
