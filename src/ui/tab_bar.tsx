import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { playSfx } from '../sound/sfx_engine';
import { triggerHaptic } from '../sound/haptic_hack';
import { ChestIcon, FlameIcon, GearIcon, TimerIcon } from './icons';
import { SPRING_PRESS, SPRING_SLIDE } from './motion_presets';
import styles from './tab_bar.module.css';

export type TabId = 'streak' | 'focus' | 'rewards' | 'settings';

interface TabDefinition
{
    id: TabId;
    label: string;
    icon: ReactNode;
}

export const TABS: TabDefinition[] = [
    { id: 'streak', label: 'Lửa', icon: <FlameIcon /> },
    { id: 'focus', label: 'Tập trung', icon: <TimerIcon /> },
    { id: 'rewards', label: 'Rương', icon: <ChestIcon /> },
    { id: 'settings', label: 'Cài đặt', icon: <GearIcon /> },
];

interface TabBarProps
{
    active_tab: TabId;
    onChange: (tab: TabId) => void;
}

export function TabBar(props: TabBarProps)
{
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
        <nav className={styles.bar}>
            {TABS.map((tab) =>
            {
                const is_active = tab.id === props.active_tab;
                return (
                    <motion.button
                        key={tab.id}
                        type="button"
                        className={is_active ? `${styles.tab} ${styles.active}` : styles.tab}
                        whileTap={{ scale: 0.86 }}
                        transition={SPRING_PRESS}
                        onClick={() => selectTab(tab.id)}
                        aria-current={is_active ? 'page' : undefined}
                    >
                        {is_active && (
                            // Shared layoutId makes the pill slide between tabs
                            <motion.span layoutId="tab-pill" className={styles.pill} transition={SPRING_SLIDE} />
                        )}
                        <span className={styles.icon}>{tab.icon}</span>
                        <span className={styles.label}>{tab.label}</span>
                    </motion.button>
                );
            })}
        </nav>
    );
}
