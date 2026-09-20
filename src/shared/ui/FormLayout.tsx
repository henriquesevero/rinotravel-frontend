import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { space } from '../theme';
import { DIALOG_BREAKPOINT } from './Sheet';
import { Text } from './Text';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** A titled group of fields; long forms read as a few short steps instead of one endless column. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="caption" tone="secondary" heading style={styles.sectionTitle}>
          {title.toUpperCase()}
        </Text>
        {description ? (
          <Text variant="footnote" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      <View style={styles.fields}>{children}</View>
    </View>
  );
}

/** Puts short fields (a date and a time, two codes) side by side on computers, stacked on phones. */
export function FieldRow({ children }: { children: ReactNode[] | ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= DIALOG_BREAKPOINT;
  const items = Array.isArray(children) ? children : [children];
  return (
    <View style={[styles.row, wide ? styles.rowWide : styles.rowNarrow]}>
      {items.map((child, index) => (
        <View key={index} style={wide ? styles.cell : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  sectionHead: { gap: 2 },
  sectionTitle: { letterSpacing: 0.8 },
  fields: { gap: space.lg },
  row: { gap: space.lg },
  rowWide: { flexDirection: 'row', alignItems: 'flex-start' },
  rowNarrow: { flexDirection: 'column' },
  cell: { flex: 1, minWidth: 0 },
});
