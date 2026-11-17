import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { playSfx } from '../sound/sfx_engine';
import { triggerHaptic } from '../sound/haptic_hack';
import { ChestIcon, FlameIcon, GearIcon, TimerIcon } from './icons';
import { SPRING_PRESS, SPRING_SLIDE } from './motion_presets';
import { getPressableProps } from './pressable';
import { HapticOverlay } from './haptic_overlay';
import { useT } from '../i18n/use_t';
import type { StringKey } from '../i18n/strings';
import styles from './tab_bar.module.css';

export type TabId = 'streak' | 'focus' | 'rewards' | 'settings';

interface TabDefinition
{
    id: TabId;
    label_key: StringKey;
    icon: ReactNode;
}

export const TABS: TabDefinition[] = [
    { id: 'streak', label_key: 'tab_journey', icon: <FlameIcon /> },
    { id: 'focus', label_key: 'tab_focus', icon: <TimerIcon /> },
    { id: 'rewards', label_key: 'tab_rewards', icon: <ChestIcon /> },
    { id: 'settings', label_key: 'tab_settings', icon: <GearIcon /> },
];

interface TabBarProps
{
    active_tab: TabId;
    onChange: (tab: TabId) => void;
}

export function TabBar(props: TabBarProps)
{
    const t = useT();

    function selectTab(tab: TabId): void
    {
        if (tab === props.active_tab)
        {
            return;
        }
        playSfx('tab');
        triggerHaptic();
        props.onChange(tab);
    }

    return (
        <nav className={`${styles.bar} sk-frame sk-fixed`}>
            {TABS.map((tab) =>
            {
                const is_active = tab.id === props.active_tab;
                return (
                    <motion.div
                        key={tab.id}
                        {...getPressableProps(() => selectTab(tab.id))}
                        className={is_active ? `${styles.tab} ${styles.active}` : styles.tab}
                        whileTap={{ scale: 0.86 }}
                        transition={SPRING_PRESS}
                        aria-current={is_active ? 'page' : undefined}
                    >
                        {is_active && (
                            // Shared layoutId makes the pill slide between tabs
                            <motion.span layoutId="tab-pill" className={`${styles.pill} sk-frame sk-flat sk-abs`} transition={SPRING_SLIDE} />
                        )}
                        <span className={styles.icon}>{tab.icon}</span>
                        <span className={styles.label}>{t(tab.label_key)}</span>
                        <HapticOverlay />
                    </motion.div>
                );
            })}
        </nav>
    );
}
