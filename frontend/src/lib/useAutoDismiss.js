import { useEffect } from 'react';

export default function useAutoDismiss(message, setMessage, delay = 3000) {
  useEffect(() => {
    if (message?.ok !== true) return;

    const timeout = setTimeout(() => setMessage(null), delay);
    return () => clearTimeout(timeout);
  }, [message, setMessage, delay]);
}
