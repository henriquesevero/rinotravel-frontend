import { useWindowDimensions } from 'react-native';

import { contentMaxWidth, contentMaxWidthExpanded } from './tokens';

/**
 * compact: phones (bottom tab bar). medium: tablets and narrow windows (icon rail).
 * expanded: desktops (full sidebar).
 */
export type Breakpoint = 'compact' | 'medium' | 'expanded';

export const MEDIUM_MIN_WIDTH = 768;
export const EXPANDED_MIN_WIDTH = 1024;

export function breakpointFor(width: number): Breakpoint {
  if (width >= EXPANDED_MIN_WIDTH) return 'expanded';
  if (width >= MEDIUM_MIN_WIDTH) return 'medium';
  return 'compact';
}

export function useBreakpoint(): Breakpoint {
  return breakpointFor(useWindowDimensions().width);
}

/** Wider content column when a sidebar or icon rail frames the screen. */
export function useContentMaxWidth(): number {
  return useBreakpoint() === 'compact' ? contentMaxWidth : contentMaxWidthExpanded;
}

export interface FieldMetrics {
  height: number;
  fontSize: number;
  dense: boolean;
}

/** Text fields are compact on computers and tablets, where a pointer is precise, and roomy on phones. */
export function useFieldMetrics(): FieldMetrics {
  const dense = useBreakpoint() !== 'compact';
  return dense ? { height: 42, fontSize: 15, dense } : { height: 50, fontSize: 17, dense };
}
