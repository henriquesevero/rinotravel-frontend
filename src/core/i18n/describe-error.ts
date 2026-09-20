import { useTranslation } from 'react-i18next';

import { isApiError, isNetworkError } from '../api';

/** Turns any thrown value into a message in the user's language, keyed by the API's stable `code`. */
export function useDescribeError(): (error: unknown) => string {
  const { t } = useTranslation();
  return (error) => {
    if (isNetworkError(error)) return t('errors.network');
    if (isApiError(error) && error.code !== 'unknown') {
      // Codes added by a newer backend have no translation yet: fall back to its English detail.
      return t(`errors.${error.code}`, { defaultValue: error.detail });
    }
    return t('errors.unknown');
  };
}
