import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { useTranslation } from '@/core/i18n';

import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

interface Pending {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

/** Alert.alert is a no-op on the web, so confirmations are rendered as a sheet on every platform. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<Pending | null>(null);
  const [last, setLast] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback<Confirm>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setLast(options);
        setPending({ options, resolve });
      }),
    [],
  );

  const settle = (confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  };

  const options = pending?.options ?? last;
  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Sheet
        visible={pending !== null}
        onClose={() => settle(false)}
        title={options?.title ?? ''}
        footer={
          <>
            <Button
              title={options?.confirmLabel ?? t('common.confirm')}
              variant={options?.destructive ? 'danger' : 'primary'}
              onPress={() => settle(true)}
              fullWidth
            />
            <Button
              title={t('common.cancel')}
              variant="ghost"
              onPress={() => settle(false)}
              fullWidth
            />
          </>
        }
      >
        {options?.message ? <Text tone="secondary">{options.message}</Text> : null}
      </Sheet>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
}
