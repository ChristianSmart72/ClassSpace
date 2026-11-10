import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface OverflowMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  ariaLabel?: string;
  /** Which trigger edge the menu lines up with. */
  align?: 'start' | 'end';
  triggerClassName?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  maxHeight: number;
}

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 4;
const MIN_MENU_HEIGHT = 96;

/**
 * Three-dot action menu rendered in a document.body portal.
 *
 * Portal rendering is deliberate: cards use `transform` (hover/active states) and
 * `overflow-hidden`, both of which make a plain `position: fixed` child resolve
 * against the card instead of the viewport — that is what used to clip the menu
 * and paint it underneath sibling cards.
 */
export function OverflowMenu({ items, ariaLabel = 'More options', align = 'end', triggerClassName }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Once the trigger scrolls out of view, keep the menu attached to it by
    // dismissing instead of leaving an invisible open menu over the page.
    if (rect.bottom < VIEWPORT_MARGIN || rect.top > vh - VIEWPORT_MARGIN) {
      setOpen(false);
      return;
    }

    let left = align === 'end' ? rect.right - menuWidth : rect.left;
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vw - menuWidth - VIEWPORT_MARGIN));

    const spaceBelow = vh - rect.bottom - TRIGGER_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - TRIGGER_GAP - VIEWPORT_MARGIN;
    const openUpward = menuHeight > spaceBelow && spaceAbove > spaceBelow;
    const available = Math.max(openUpward ? spaceAbove : spaceBelow, MIN_MENU_HEIGHT);

    const rawTop = openUpward
      ? rect.top - TRIGGER_GAP - Math.min(menuHeight, available)
      : rect.bottom + TRIGGER_GAP;
    const top = Math.min(
      Math.max(rawTop, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, vh - Math.min(menuHeight, available) - VIEWPORT_MARGIN)
    );

    setPos({ top, left, maxHeight: available });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    reposition();
    const raf = requestAnimationFrame(reposition);
    const onViewportChange = () => reposition();
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const select = (item: OverflowMenuItem) => {
    if (item.disabled) return;
    setOpen(false);
    item.onSelect();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        onPointerDown={e => e.stopPropagation()}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={triggerClassName ?? 'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold leading-none tracking-wider text-app-text-faint transition-colors hover:bg-app-surface-2 hover:text-app-text active:scale-95 touch-manipulation'}
      >
        ···
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[94]" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={menuRef}
            role="menu"
            aria-label={ariaLabel}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            className="fixed z-[95] min-w-[184px] overflow-y-auto overscroll-contain rounded-xl border border-app-border bg-app-modal p-1 shadow-2xl animate-fadeInFast"
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              maxHeight: pos?.maxHeight,
              visibility: pos ? 'visible' : 'hidden',
            }}
          >
            {items.map(item => (
              <Fragment key={item.key}>
                {item.separatorBefore && <div className="my-1 h-px bg-app-border" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => select(item)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-jakarta font-medium transition-colors disabled:opacity-40 ${
                    item.danger
                      ? 'text-app-red hover:bg-app-red/10'
                      : 'text-app-text hover:bg-app-surface-2'
                  }`}
                >
                  <span className="w-4 flex-shrink-0 text-center text-sm leading-none">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              </Fragment>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
