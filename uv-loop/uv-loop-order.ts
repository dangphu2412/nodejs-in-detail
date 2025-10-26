// Sync
console.log('A');

// Macro tasks
setTimeout(() => {
  console.log('B');
}, 0);

// Micro tasks
Promise.resolve().then(() => {
  console.log('C');
});

// Highest priority Micro tasks
process.nextTick(() => {
  console.log('D');
});

// Sync
console.log('E');
