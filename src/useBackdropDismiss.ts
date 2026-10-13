import { useRef, type MouseEvent, type PointerEvent } from 'react';

// A deliberate click/tap must start and end on the backdrop. In particular,
// text selection, image swipes, scrolling and dialog padding must not dismiss.
export function useBackdropDismiss<T extends HTMLElement>(onDismiss: () => void) {
  const gesture = useRef<{ id: number; x: number; y: number; released: boolean } | null>(null);
  const outside = (event: PointerEvent<T> | MouseEvent<T>) => {
    if (event.target !== event.currentTarget) return false;
    if (event.currentTarget.tagName !== 'DIALOG') return true;
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX >= rect.right || event.clientY < rect.top || event.clientY >= rect.bottom;
  };
  return {
    onPointerDown: (event: PointerEvent<T>) => {
      gesture.current = event.isPrimary && event.button === 0 && outside(event)
        ? { id: event.pointerId, x: event.clientX, y: event.clientY, released: false } : null;
    },
    onPointerMove: (event: PointerEvent<T>) => {
      const start = gesture.current;
      if (start && (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8 || !outside(event))) gesture.current = null;
    },
    onPointerUp: (event: PointerEvent<T>) => {
      const start = gesture.current;
      if (start && start.id === event.pointerId && outside(event) && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 8) start.released = true;
      else gesture.current = null;
    },
    onPointerCancel: () => { gesture.current = null; },
    onClick: (event: MouseEvent<T>) => {
      const dismiss = gesture.current?.released && outside(event);
      gesture.current = null;
      if (!dismiss) return;
      // Consume the click before removing the overlay so the game below does
      // not receive the same action. Closing never confirms or saves an action.
      event.preventDefault();
      event.stopPropagation();
      onDismiss();
    },
  };
}
