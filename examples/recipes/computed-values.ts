import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * Computed values pattern - automatically derive state from other state
 *
 * This example shows how to create a computed state that automatically
 * updates when its dependencies change.
 */

// Helper function to create computed state
function computed<T>(
  states: Array<SimpleState<any>>,
  computeFn: (...values: any[]) => T
): SimpleState<T> {
  // Create initial computed value
  const result = newSimpleState(computeFn(...states.map(s => s.get())));

  // Subscribe to all dependencies
  states.forEach(state => {
    state.subscribe(() => {
      result.set(computeFn(...states.map(s => s.get())));
    });
  });

  return result;
}

// Type-safe derive helper with better inference
function derive<A, R>(
  deps: [SimpleState<A>],
  computeFn: (a: A) => R
): SimpleState<R>;
function derive<A, B, R>(
  deps: [SimpleState<A>, SimpleState<B>],
  computeFn: (a: A, b: B) => R
): SimpleState<R>;
function derive<A, B, C, R>(
  deps: [SimpleState<A>, SimpleState<B>, SimpleState<C>],
  computeFn: (a: A, b: B, c: C) => R
): SimpleState<R>;
function derive<A, B, C, D, R>(
  deps: [SimpleState<A>, SimpleState<B>, SimpleState<C>, SimpleState<D>],
  computeFn: (a: A, b: B, c: C, d: D) => R
): SimpleState<R>;
function derive<A, B, C, D, E, R>(
  deps: [SimpleState<A>, SimpleState<B>, SimpleState<C>, SimpleState<D>, SimpleState<E>],
  computeFn: (a: A, b: B, c: C, d: D, e: E) => R
): SimpleState<R>;
function derive(
  deps: Array<SimpleState<any>>,
  computeFn: (...values: any[]) => any
): SimpleState<any> {
  const result = newSimpleState(computeFn(...deps.map(d => d.get())));

  deps.forEach(dep => {
    dep.subscribe(() => {
      result.set(computeFn(...deps.map(d => d.get())));
    });
  });

  return result;
}

// Example 1: Full name from first and last name
console.log("=== Example 1: Full Name ===");
const firstName = newSimpleState("John");
const lastName = newSimpleState("Doe");

const fullName = computed(
  [firstName, lastName],
  (first, last) => `${first} ${last}`
);

fullName.subscribe(name => console.log("Full name:", name));

firstName.set("Jane");  // Triggers: "Full name: Jane Doe"
lastName.set("Smith");  // Triggers: "Full name: Jane Smith"

// Example 2: Shopping cart total
console.log("\n=== Example 2: Shopping Cart Total ===");
interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

const cart = newSimpleState<CartItem[]>([
  { name: "Apple", price: 1.5, quantity: 3 },
  { name: "Banana", price: 0.5, quantity: 5 }
]);

const taxRate = newSimpleState(0.08);

const subtotal = computed([cart], (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const total = computed([subtotal, taxRate], (sub, rate) =>
  sub * (1 + rate)
);

subtotal.subscribe(value => console.log(`Subtotal: $${value.toFixed(2)}`));
total.subscribe(value => console.log(`Total: $${value.toFixed(2)}`));

// Add item
cart.set([
  ...cart.get(),
  { name: "Orange", price: 2.0, quantity: 2 }
]);

// Change tax rate
taxRate.set(0.10);

// Example 3: Filtered and sorted list
console.log("\n=== Example 3: Filtered List ===");
const items = newSimpleState([
  { id: 1, name: "Apple", category: "fruit" },
  { id: 2, name: "Carrot", category: "vegetable" },
  { id: 3, name: "Banana", category: "fruit" },
  { id: 4, name: "Broccoli", category: "vegetable" }
]);

const filterCategory = newSimpleState<string | null>("fruit");

const filteredItems = computed(
  [items, filterCategory],
  (allItems, category) => {
    if (!category) return allItems;
    return allItems.filter(item => item.category === category);
  }
);

filteredItems.subscribe(filtered => {
  console.log("Filtered items:", filtered.map(i => i.name).join(", "));
});

filterCategory.set("vegetable");
filterCategory.set(null);  // Show all

// Example 4: Type-safe derive with better inference
console.log("\n=== Example 4: Type-safe Derive ===");

const price = newSimpleState(100);
const quantity = newSimpleState(5);
const discount = newSimpleState(0.1);

// derive() provides full type inference - no need to specify types!
const finalPrice = derive(
  [price, quantity, discount],
  (p, q, d) => p * q * (1 - d) // p, q, d are all correctly inferred!
);

// TypeScript knows finalPrice is SimpleState<number>
finalPrice.subscribe(value => {
  console.log(`Final price: $${value.toFixed(2)}`);
});

price.set(120);

// Complex example with mixed types
const userName = newSimpleState("Alice");
const userAge = newSimpleState(30);
const isAdmin = newSimpleState(true);

// All types automatically inferred
const userSummary = derive(
  [userName, userAge, isAdmin],
  (name, age, admin) => ({
    displayName: `${name} (${age})`,
    role: admin ? "Admin" : "User",
    canEdit: admin && age >= 18
  })
);

userSummary.subscribe(summary => {
  console.log(`User: ${summary.displayName}, Role: ${summary.role}, Can Edit: ${summary.canEdit}`);
});

isAdmin.set(false);
