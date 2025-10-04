import { newSimpleState } from "../src/index";

// Create a simple counter state
const counter = newSimpleState(0);

// Subscribe to changes
const subscriptionId = counter.subscribe((value) => {
  console.log(`Counter updated: ${value}`);
});

console.log("Initial value:", counter.get());

// Note: Updates are batched asynchronously using microtasks
// Multiple rapid updates will result in a single notification with the latest value
counter.set(counter.get() + 1);
counter.set(counter.get() + 1);
counter.set(counter.get() + 1);

console.log("Final value (synchronous):", counter.get());

// Wait for microtask to see the batched update
setTimeout(() => {
  console.log("\nAfter microtask - subscriber was called with latest value (3)");

  // Unsubscribe
  counter.unsubscribe(subscriptionId);
  console.log("\nUnsubscribed - this won't trigger notification:");
  counter.set(counter.get() + 1);

  setTimeout(() => {
    console.log("Final value after unsubscribe:", counter.get());
  }, 0);
}, 0);
