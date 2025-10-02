# WebSocketClient Circular Dependency Fix

## Issue

The WebSocketClient component had a TypeScript error related to a circular dependency:

```
TS2448: Block-scoped variable attemptReconnect used before its declaration.
WebSocketClient.tsx(197, 9): attemptReconnect is declared here.
TS2454: Variable attemptReconnect is used before being assigned.
```

This error occurred because:

1. The `connect` function (defined as a useCallback) referenced `attemptReconnect` in its dependency array
2. The `connect` function also used `attemptReconnect` in its onclose handler
3. But `attemptReconnect` was declared after `connect`, creating a circular dependency

## Solution

The solution involved using a React ref to break the circular dependency:

1. Added a ref to store the `attemptReconnect` function:
   ```typescript
   const attemptReconnectRef = useRef<(() => void) | null>(null);
   ```

2. Updated the onclose handler to use the ref instead of directly calling the function:
   ```typescript
   // Before
   if (event.code !== 1000 && event.code !== 1001) {
     attemptReconnect();
   }

   // After
   if (event.code !== 1000 && event.code !== 1001 && attemptReconnectRef.current) {
     attemptReconnectRef.current();
   }
   ```

3. Removed `attemptReconnect` from the dependency array of the `connect` useCallback:
   ```typescript
   // Before
   }, [isConnecting, url, token, history, onOpen, onClose, attemptReconnect, onError, onMessage, onAudioChunk, onTranscription, onStatus, onReply]);

   // After
   }, [isConnecting, url, token, history, onOpen, onClose, onError, onMessage, onAudioChunk, onTranscription, onStatus, onReply]);
   ```

4. Added a useEffect to assign the `attemptReconnect` function to the ref:
   ```typescript
   useEffect(() => {
     attemptReconnectRef.current = attemptReconnect;
   }, [attemptReconnect]);
   ```

## Why This Works

This solution breaks the circular dependency by:

1. Removing the direct dependency of `connect` on `attemptReconnect`
2. Using a ref as an intermediary to store and access the function
3. Ensuring the ref is updated whenever `attemptReconnect` changes

The ref acts as a mutable container that persists across renders and allows functions to reference each other without creating circular dependencies in the dependency arrays.

## Best Practices for Avoiding Circular Dependencies

To avoid similar issues in the future:

1. Be careful with function dependencies in useCallback hooks
2. Consider using refs to break circular dependencies
3. Structure your code to avoid functions that depend on each other
4. Use the ESLint React Hooks plugin to catch potential issues early

## Related Resources

- [React Hooks FAQ: How to avoid functions in the dependency array](https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies)
- [React useRef Hook documentation](https://reactjs.org/docs/hooks-reference.html#useref)