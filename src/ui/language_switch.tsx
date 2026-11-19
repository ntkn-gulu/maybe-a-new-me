import { SegmentedSwitch, type SegmentOption } from './segmented_switch';
import { useSettingsStore } from '../stores/settings_store';
import { useT } from '../i18n/use_t';
import type { Language } from '../i18n/strings';

// VI / EN switch bound to the language setting (Settings and the first
// onboarding screen, so Vietnamese friends can switch before reading on).

// Language names are written in their own language, never translated
const LANGUAGE_OPTIONS: SegmentOption<Language>[] = [
    { value: 'vi', label: 'VI' },
    { value: 'en', label: 'EN' },
];

export function LanguageSwitch()
{
    const t = useT();
    const language = useSettingsStore((state) => state.language);
    const setLanguage = useSettingsStore((state) => state.setLanguage);
    return (
        <SegmentedSwitch
            options={LANGUAGE_OPTIONS}
            value={language}
            onChange={setLanguage}
            aria_label={t('settings_language')}
        />
    );
}
