import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { formatCivilDate, fromJsDate, toJsDate } from '@/core/datetime/civil-date';
import { currentLocale, useTranslation } from '@/core/i18n';

import { radius, space, useStyles, type Theme } from '../theme';
import type { DateFieldProps } from './DateField.types';
import { FieldMessage } from './FieldMessage';
import { Button } from './Button';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { Text } from './Text';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    container: { gap: space.xs + 2 },
    box: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: space.lg,
    },
    boxError: { borderColor: colors.danger },
  });

export function DateField({ label, value, onChange, error, testID }: DateFieldProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => (value ? toJsDate(value) : new Date()));

  const open = () => {
    const current = value ? toJsDate(value) : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        onValueChange: (_event, date) => onChange(fromJsDate(date)),
      });
      return;
    }
    setDraft(current);
    setIosOpen(true);
  };

  return (
    <View style={styles.container}>
      <Text variant="subhead" tone="secondary">
        {label}
      </Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatCivilDate(value, currentLocale()) : t('trips.form.pickDate')}`}
        onPress={open}
        style={[styles.box, !!error && styles.boxError]}
      >
        <Text tone={value ? 'primary' : 'secondary'}>
          {value ? formatCivilDate(value, currentLocale()) : t('trips.form.pickDate')}
        </Text>
        <Icon name="calendar-outline" tone="secondary" />
      </Pressable>
      <FieldMessage error={error} />

      <Sheet
        visible={iosOpen}
        onClose={() => setIosOpen(false)}
        title={label}
        footer={
          <Button
            title={t('common.confirm')}
            onPress={() => {
              onChange(fromJsDate(draft));
              setIosOpen(false);
            }}
            fullWidth
          />
        }
      >
        <DateTimePicker
          value={draft}
          mode="date"
          display="inline"
          onValueChange={(_event, date) => setDraft(date)}
        />
      </Sheet>
    </View>
  );
}
