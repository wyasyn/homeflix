import { useEffect, useRef, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  const delayRef = useRef(delay);
  delayRef.current = delay;

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayRef.current);
    return () => clearTimeout(id);
  }, [value]);

  return debounced;
}
