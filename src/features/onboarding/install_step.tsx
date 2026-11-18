import { useState } from 'react';
import { motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { getPressableProps } from '../../ui/pressable';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { playSfx } from '../../sound/sfx_engine';
import { useT } from '../../i18n/use_t';
import type { StringKey } from '../../i18n/strings';
import { canPromptInstall, getInstallBrowser, getInstallPlatform, promptInstall, type InstallBrowser } from './install_platform';
import styles from './onboarding_flow.module.css';

// Onboarding's first step in a phone browser: how to put the app on the
// home screen. iPhone: the Share → "Add to Home Screen" steps (iOS has no
// install prompt). Android: one "Install app" button when the browser offers
// its prompt, else the menu steps of that browser (Chrome, Edge, Samsung
// Internet, Firefox, or general ones). Less common browsers also get a tip
// to open the link in Safari / Chrome. "Keep using the browser" moves on.

const STEPS_BY_BROWSER: Record<InstallBrowser, StringKey[]> = {
    safari: ['install_step_ios_1', 'install_step_ios_2', 'install_step_open'],
    ios_other: ['install_step_ios_other_1', 'install_step_ios_2', 'install_step_open'],
    chrome: ['install_step_chrome_1', 'install_step_chrome_2', 'install_step_open'],
    edge: ['install_step_edge_1', 'install_step_edge_2', 'install_step_open'],
    samsung: ['install_step_samsung_1', 'install_step_samsung_2', 'install_step_open'],
    firefox: ['install_step_firefox_1', 'install_step_firefox_2', 'install_step_open'],
    android_other: ['install_step_other_1', 'install_step_other_2', 'install_step_open'],
};

const TIP_BY_BROWSER: Partial<Record<InstallBrowser, StringKey>> = {
    ios_other: 'install_tip_safari',
    firefox: 'install_tip_chrome',
    android_other: 'install_tip_chrome',
};

// Steps whose first line points at a Share button get Safari's Share icon
const SHARE_ICON_BROWSERS: ReadonlySet<InstallBrowser> = new Set(['safari', 'ios_other']);

// Safari's Share icon: a box with an arrow going up out of it
function ShareIcon()
{
    return (
        <svg viewBox="0 0 24 24" className={styles.share_icon} aria-hidden="true">
            <path d="M8 9H6.5A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9H16" />
            <path d="M12 14V3M8.5 6.5 12 3l3.5 3.5" />
        </svg>
    );
}

interface InstallStepProps
{
    onSkip: () => void;
}

export function InstallStep(props: InstallStepProps)
{
    const t = useT();
    const [platform] = useState(() => getInstallPlatform() ?? 'android');
    const [browser] = useState(() => getInstallBrowser(platform));
    const [has_prompt] = useState(canPromptInstall);
    const [is_installed, setIsInstalled] = useState(false);
    const is_ios = platform === 'ios';
    const steps = STEPS_BY_BROWSER[browser];
    const tip_key = TIP_BY_BROWSER[browser];

    async function install(): Promise<void>
    {
        if (await promptInstall())
        {
            playSfx('sparkle');
            setIsInstalled(true);
        }
    }

    return (
        <div className={`${styles.slide} ${styles.form}`}>
            <span className="mono_label">{t('install_kicker')}</span>
            <h1 className={styles.title}>{t('install_title')}</h1>
            <p className={styles.body}>{t(is_ios ? 'install_body_ios' : 'install_body_android')}</p>

            <div className={styles.controls}>
                {is_installed
                    ? (
                        <motion.p
                            className={`${styles.installed} sk-frame sk-flat`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ scale: SPRING_POP, opacity: OPACITY_FADE }}
                        >
                            {t('install_done')}
                        </motion.p>
                    )
                    : has_prompt && !is_ios
                        ? <TactileButton size="lg" variant="accent" is_full_width onClick={() => void install()}>{t('install_button')}</TactileButton>
                        : (
                            <ol className={styles.install_steps}>
                                {steps.map((key, index) => (
                                    <motion.li
                                        key={key}
                                        className={`${styles.install_row} sk-frame sk-flat`}
                                        initial={{ y: 14, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ y: { ...SPRING_POP, delay: 0.1 + index * 0.08 }, opacity: { ...OPACITY_FADE, delay: 0.1 + index * 0.08 } }}
                                    >
                                        <span className={`${styles.install_number} sk-frame sk-flat sk-round`}>{index + 1}</span>
                                        <span className={styles.install_text}>{t(key)}</span>
                                        {SHARE_ICON_BROWSERS.has(browser) && index === 0 && <ShareIcon />}
                                    </motion.li>
                                ))}
                            </ol>
                        )}
            </div>

            {tip_key && !is_installed && <p className={styles.install_tip}>{t(tip_key)}</p>}

            <span {...getPressableProps(props.onSkip)} className={`mono_label ${styles.browser_link}`}>
                {t('install_skip')}
            </span>
        </div>
    );
}
