import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settings_store';
import { translate, type StringKey, type StringParams } from './strings';

// Returns t(key, params) bound to the language chosen in settings.
// Components re-render automatically when the language changes.
export function useT(): (key: StringKey, params?: StringParams) => string
{
    const language = useSettingsStore((state) => state.language);
    return useCallback((key: StringKey, params?: StringParams) => translate(language, key, params), [language]);
}
