'use client';

import { useCallback, useRef } from 'react';
import type { Swipe } from '@/types';

interface UndoState {
  swipe: Swipe;
  onUndo: () => void;
  timer: ReturnType<typeof setTimeout>;
}

interface UseSwipeUndoReturn {
  scheduleUndo: (swipe: Swipe, onUndo: () => void, onCommit: () => void) => void;
  cancelUndo: () => void;
}

export function useSwipeUndo(): UseSwipeUndoReturn {
  const undoRef = useRef<UndoState | null>(null);

  const cancelUndo = useCallback(() => {
    if (undoRef.current) {
      clearTimeout(undoRef.current.timer);
      undoRef.current = null;
    }
  }, []);

  const scheduleUndo = useCallback(
    (swipe: Swipe, onUndo: () => void, onCommit: () => void) => {
      if (undoRef.current) {
        clearTimeout(undoRef.current.timer);
        undoRef.current.onUndo = () => {};
      }

      const timer = setTimeout(() => {
        undoRef.current = null;
        onCommit();
      }, 5000);

      undoRef.current = { swipe, onUndo, timer };
    },
    []
  );

  return { scheduleUndo, cancelUndo };
}
