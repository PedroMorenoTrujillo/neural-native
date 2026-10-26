// Node has no display clock. Keep the framework graph asynchronous, including cancellation.
globalThis.requestAnimationFrame ??= callback => setTimeout(() => callback(performance.now()), 16);
globalThis.cancelAnimationFrame ??= handle => clearTimeout(handle);
