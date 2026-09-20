import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';

import { FONT_FAMILY, radius, space, typography, useStyles, type Theme } from '../theme';
import { FieldMessage } from './FieldMessage';
import { Icon } from './Icon';
import { ListRow } from './ListRow';
import { Sheet } from './Sheet';
import { Text } from './Text';
import { TextField } from './TextField';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectFieldProps {
  label: string;
  /** Title of the picker sheet. */
  title: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: string;
  searchable?: boolean;
  testID?: string;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    container: { gap: space.xs + 2 },
    box: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: space.lg,
    },
    boxError: { borderColor: colors.danger },
    value: {
      flex: 1,
      color: colors.text,
      ...typography.body,
      fontFamily: FONT_FAMILY.regular,
      fontWeight: 'normal',
    },
    list: { marginHorizontal: -space.xl },
  });

export function SelectField({
  label,
  title,
  options,
  value,
  onChange,
  error,
  hint,
  searchable = false,
  testID,
}: SelectFieldProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.value === value);
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) =>
        `${option.label} ${option.description ?? ''} ${option.value}`
          .toLowerCase()
          .includes(needle),
      )
    : options;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.container}>
      <Text variant="subhead" tone="secondary">
        {label}
      </Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? ''}`}
        onPress={() => setOpen(true)}
        style={[styles.box, !!error && styles.boxError]}
      >
        <Text style={styles.value} numberOfLines={1}>
          {selected?.label ?? ''}
        </Text>
        <Icon name="chevron-down" size={18} tone="secondary" />
      </Pressable>
      <FieldMessage error={error} hint={hint} />

      <Sheet visible={open} onClose={close} title={title}>
        {searchable ? (
          <TextField
            label={t('common.search')}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : null}
        <View style={styles.list}>
          {visible.length === 0 ? (
            <ListRow title={t('common.noResults')} tone="secondary" />
          ) : (
            visible.map((option, index) => (
              <ListRow
                key={option.value}
                testID={testID ? `${testID}-option-${option.value}` : undefined}
                divider={index > 0}
                title={option.label}
                {...(option.description ? { subtitle: option.description } : {})}
                right={option.value === value ? <Icon name="checkmark" tone="accent" /> : undefined}
                onPress={() => {
                  onChange(option.value);
                  close();
                }}
              />
            ))
          )}
        </View>
      </Sheet>
    </View>
  );
}
