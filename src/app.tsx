import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabBar, type TabId } from './ui/tab_bar';
import { FocusScreen } from './features/focus/focus_screen';
import { StreakScreen } from './features/streak/streak_screen';
import { ChestScreen } from './features/rewards/chest_screen';
import { SettingsScreen } from './features/settings/settings_screen';
import { FocusSessionLayer } from './features/focus/focus_session_layer';
import { LevelUpGate } from './features/streak/level_up_gate';
import { InkFilters } from './ui/ink_filters';
import styles from './app.module.css';

// App shell: one active screen + the bottom tab bar.
// No router on purpose: 4 fixed tabs only need a piece of state.

const DEFAULT_TAB: TabId = 'focus';

function renderScreen(tab: TabId)
{
    switch (tab)
    {
        case 'streak':
            return <StreakScreen />;
        case 'focus':
            return <FocusScreen />;
        case 'rewards':
            return <ChestScreen />;
        case 'settings':
            return <SettingsScreen />;
    }
}

export function App()
{
    const [active_tab, setActiveTab] = useState<TabId>(DEFAULT_TAB);

    return (
        <div className={styles.app}>
            <InkFilters />
            <AnimatePresence mode="wait" initial={false}>
                <motion.main
                    key={active_tab}
                    className={styles.main}
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                    {renderScreen(active_tab)}
                </motion.main>
            </AnimatePresence>
            <TabBar active_tab={active_tab} onChange={setActiveTab} />
            <FocusSessionLayer />
            <LevelUpGate />
        </div>
    );
}
