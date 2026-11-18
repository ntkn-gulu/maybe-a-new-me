import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabBar, type TabId } from './ui/tab_bar';
import { FocusScreen } from './features/focus/focus_screen';
import { StreakScreen } from './features/streak/streak_screen';
import { ChestScreen } from './features/rewards/chest_screen';
import { CollectionScreen } from './features/rewards/collection_screen';
import { SettingsScreen } from './features/settings/settings_screen';
import { FocusSessionLayer } from './features/focus/focus_session_layer';
import { LevelUpGate } from './features/streak/level_up_gate';
import { RewardGate } from './features/rewards/reward_gate';
import { SPRING_SLIDE } from './ui/motion_presets';
import styles from './app.module.css';

// App shell: one active screen + the bottom tab bar.
// No router on purpose: 4 fixed tabs only need a piece of state.
// A tab can have a sub-page (Rewards -> Collection): tapping the active tab
// again slides it up over the tab's screen, tapping again slides it away;
// switching tabs closes it.

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

// The sub-page of a tab (tabs listed with a sub_page_key in TABS)
function renderSubPage(tab: TabId)
{
    switch (tab)
    {
        case 'rewards':
            return <CollectionScreen />;
        default:
            return null;
    }
}

export function App()
{
    const [active_tab, setActiveTab] = useState<TabId>(DEFAULT_TAB);
    const [sub_page_tab, setSubPageTab] = useState<TabId | null>(null);

    function changeTab(tab: TabId): void
    {
        setActiveTab(tab);
        setSubPageTab(null);
    }

    function toggleSubPage(): void
    {
        setSubPageTab((open_tab) => (open_tab === active_tab ? null : active_tab));
    }

    return (
        <div className={styles.app}>
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
            <AnimatePresence>
                {sub_page_tab && (
                    <motion.section
                        key={sub_page_tab}
                        className={styles.sub_page}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={SPRING_SLIDE}
                    >
                        {renderSubPage(sub_page_tab)}
                    </motion.section>
                )}
            </AnimatePresence>
            <TabBar
                active_tab={active_tab}
                is_sub_page_open={sub_page_tab === active_tab}
                onChange={changeTab}
                onToggleSubPage={toggleSubPage}
            />
            <FocusSessionLayer />
            <LevelUpGate />
            <RewardGate />
        </div>
    );
}
