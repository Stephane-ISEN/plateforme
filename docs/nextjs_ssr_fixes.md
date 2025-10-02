# Next.js Server-Side Rendering Fixes

## Overview

This document describes the changes made to fix the "window is not defined" error that was occurring during the Next.js build process. The error was happening because the application was trying to access browser-specific APIs during server-side rendering or static site generation.

## Error Details

The specific error was:

```
ReferenceError: window is not defined
at u (/app/.next/server/app/(dashboard)/(routes)/speech/page.js:6:701)
```

This error occurred during the static page generation process for the `/speech` page.

## Solution

The solution involved several changes to ensure that browser-specific APIs are only accessed on the client side, not during server-side rendering:

### 1. Dynamic Imports for Browser-Specific Components

Components that use browser-specific APIs were dynamically imported with SSR disabled:

```typescript
// Dynamically import components that use browser-specific APIs with SSR disabled
const Visualizer = dynamic(() => import("@/components/voice/Visualizer"), { ssr: false });
const RealtimeVoiceAgent = dynamic(() => import("@/components/voice/RealtimeVoiceAgent"), { ssr: false });
```

This ensures that these components are only loaded and rendered on the client side, not during server-side rendering.

### 2. Browser Environment Checks

Added checks for the browser environment before accessing browser-specific APIs:

#### In the speech page's toggleFullscreen function:

```typescript
const toggleFullscreen = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !containerRef.current) return;
  
  if (!isFullscreen) {
    containerRef.current.requestFullscreen?.();
    setIsFullscreen(true);
  } else {
    document.exitFullscreen?.();
    setIsFullscreen(false);
  }
};
```

#### In the Visualizer component's isDarkMode state initialization:

```typescript
const [isDarkMode, setIsDarkMode] = useState<boolean>(
  theme ? theme === "dark" : (typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches) || false
);
```

#### In the Visualizer component's useEffect hook for theme changes:

```typescript
useEffect(() => {
  // Skip if theme is provided or if we're not in a browser environment
  if (theme || typeof window === 'undefined') return;
  
  const matcher = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => setIsDarkMode(matcher.matches);
  matcher.addEventListener("change", handleChange);
  return () => matcher.removeEventListener("change", handleChange);
}, [theme]);
```

#### In the RealtimeVoiceAgent component's localStorage access:

```typescript
"Authorization": `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("token") : ''}`,
```

### 3. Use Client Directive

All components that use browser-specific APIs already had the "use client" directive at the top of the file:

```typescript
"use client";
```

This directive tells Next.js that the component should only be rendered on the client side. However, this alone doesn't prevent the component from being imported and evaluated during server-side rendering, which is why the additional changes were necessary.

## Benefits

These changes ensure that:

1. Browser-specific APIs are only accessed on the client side
2. Components that use browser-specific APIs are only loaded and rendered on the client side
3. The Next.js build process can complete successfully without errors

## Testing

After implementing these changes, the Next.js build process should complete successfully without the "window is not defined" error. The `/speech` page should be properly pre-rendered during the build process and then hydrated on the client side.

## Future Considerations

When adding new browser-specific functionality to the application, remember to:

1. Use the "use client" directive for components that use browser-specific APIs
2. Consider using dynamic imports with `{ ssr: false }` for components that heavily rely on browser-specific APIs
3. Add checks for the browser environment (`typeof window !== 'undefined'`) before accessing browser-specific APIs
4. Use useEffect hooks for initializing browser-specific functionality