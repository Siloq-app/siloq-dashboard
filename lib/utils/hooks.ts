import { useState, useEffect, useCallback, useRef } from 'react';
import { ApplicationError, ErrorType, ErrorSeverity } from '@/lib/utils/error-handling';

// Generic utility types
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: ApplicationError | null;
  lastUpdated: number | null;
}

export interface AsyncActions<T> {
  execute: (...args: unknown[]) => Promise<T>;
  reset: () => void;
  refetch: () => Promise<T>;
}

export type AsyncReturn<T> = AsyncState<T> & AsyncActions<T>;

// Custom hook for async operations with proper error handling
export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  dependencies: unknown[] = []
): AsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    status: 'idle',
    error: null,
    lastUpdated: null,
  });

  const executeRef = useRef(asyncFunction);
  executeRef.current = asyncFunction;

  const execute = useCallback(async (...args: unknown[]): Promise<T> => {
    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const result = await executeRef.current(...args);
      setState({
        data: result,
        status: 'success',
        error: null,
        lastUpdated: Date.now(),
      });
      return result;
    } catch (error) {
      const appError = error instanceof ApplicationError ? error : new ApplicationError(
        'An unexpected error occurred',
        ErrorType.UNKNOWN,
        ErrorSeverity.MEDIUM,
        { originalError: error }
      );
      
      setState(prev => ({
        ...prev,
        status: 'error',
        error: appError,
      }));
      
      throw appError;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      status: 'idle',
      error: null,
      lastUpdated: null,
    });
  }, []);

  const refetch = useCallback(async (): Promise<T> => {
    if (state.data !== null) {
      return execute();
    }
    throw new ApplicationError('No data to refetch', ErrorType.UNKNOWN, ErrorSeverity.MEDIUM);
  }, [execute, state.data]);

  useEffect(() => {
    if (dependencies.length > 0) {
      execute();
    }
  }, dependencies);

  return {
    ...state,
    execute,
    reset,
    refetch,
  };
}

// Custom hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom hook for local storage with proper error handling
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serialize(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Custom hook for previous value
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Custom hook for mounted state
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

// Custom hook for window size with proper error handling
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call initially

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Custom hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Custom hook for toggle state
export function useToggle(initialValue: boolean = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setToggle = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return [value, toggle, setToggle];
}

// Custom hook for array state
export function useArray<T>(initialValue: T[] = []) {
  const [array, setArray] = useState<T[]>(initialValue);

  const push = useCallback((...items: T[]) => {
    setArray(prev => [...prev, ...items]);
  }, []);

  const unshift = useCallback((...items: T[]) => {
    setArray(prev => [...items, ...prev]);
  }, []);

  const pop = useCallback(() => {
    setArray(prev => prev.slice(0, -1));
  }, []);

  const shift = useCallback(() => {
    setArray(prev => prev.slice(1));
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  const removeByIndex = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, []);

  const remove = useCallback((item: T) => {
    setArray(prev => prev.filter(i => i !== item));
  }, []);

  const update = useCallback((index: number, item: T) => {
    setArray(prev => prev.map((i, idx) => idx === index ? item : i));
  }, []);

  return {
    array,
    setArray,
    push,
    unshift,
    pop,
    shift,
    clear,
    removeByIndex,
    remove,
    update,
  };
}

// Utility functions
export const utils = {
  // Format date with proper error handling
  formatDate: (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  },

  // Format number with proper error handling
  formatNumber: (num: number | null | undefined, options?: Intl.NumberFormatOptions): string => {
    if (num === null || num === undefined) return 'N/A';
    
    try {
      return new Intl.NumberFormat('en-US', options).format(num);
    } catch (error) {
      console.error('Error formatting number:', error);
      return num.toString();
    }
  },

  // Debounce function
  debounce: <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function
  throttle: <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Deep clone with proper error handling
  deepClone: <T>(obj: T): T => {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.error('Error deep cloning object:', error);
      return obj;
    }
  },

  // Generate unique ID
  generateId: (prefix: string = ''): string => {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Check if object is empty
  isEmpty: (obj: unknown): boolean => {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  },

  // Safe JSON parse
  safeJsonParse: <T = unknown>(str: string, defaultValue: T): T => {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  },

  // Safe JSON stringify
  safeJsonStringify: (obj: unknown, defaultValue: string = '{}'): string => {
    try {
      return JSON.stringify(obj);
    } catch {
      return defaultValue;
    }
  },
};
