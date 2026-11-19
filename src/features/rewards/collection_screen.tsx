import { useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Screen } from '../../ui/screen';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { useScrollRefresh } from '../../ui/use_scroll_refresh';
import { SPRING_PRESS, SPRING_SLIDE } from '../../ui/motion_presets';
import { BadgeIcon, FlameIcon, PaletteIcon, SoundIcon, TimerIcon } from '../../ui/icons';
import { SketchBadgeIcon, SketchFlameIcon, SketchPaletteIcon, SketchSoundIcon, SketchTimerIcon } from '../../ui/sketch_icons';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { useT } from '../../i18n/use_t';
import { itemNameKey, slotNameKey } from '../../i18n/strings';
import { COLLECTION_SLOTS, countOwned, getItemOffer, getSlotItems } from '../../core/collection';
import { REWARD_CATALOG, type RewardItem } from '../../core/reward_catalog';
import { getTierForStreak } from '../../core/flame_tiers';
import type { ItemSlot } from '../../core/types';
import { useInventoryStore, useOwnedItemIds } from '../../stores/inventory_store';
import { useStreak } from '../../stores/progress_store';
import { useArtStyle } from '../../stores/active_theme';
import { ItemPreview } from './item_preview';
import { ItemSheet } from './item_sheet';
import styles from './collection_screen.module.css';

// Collection: the Rewards tab's sub-page (tap the active Rewards tab again).
// A row of slot tiles filters the items (each with how many are owned);
// a grid shows every item of that slot: owned ones with their picture and
// an "equipped" tick, missing ones as "?" with their rarity, shard price
// or the streak that grants them. A tap opens ItemSheet (equip / trade).
// The cards carry no HapticOverlay on purpose: a swipe that starts on an
// iOS switch moves the switch instead of scrolling the page (and fires a tap).
// useScrollRefresh re-arms scrolling after the cards of a slot have flown in.

const CARD_PREVIEW_SIZE = 52;
const CARD_STAGGER_S = 0.025;

const SLOT_ICONS: Record<ItemSlot, { extruded: ReactNode; sketch: ReactNode }> = {
    flame: { extruded: <FlameIcon size={22} />, sketch: <SketchFlameIcon size={22} /> },
    timer_skin: { extruded: <TimerIcon size={22} />, sketch: <SketchTimerIcon size={22} /> },
    sound_pack: { extruded: <SoundIcon size={22} />, sketch: <SketchSoundIcon size={22} /> },
    theme: { extruded: <PaletteIcon size={22} />, sketch: <SketchPaletteIcon size={22} /> },
    title: { extruded: <BadgeIcon size={22} />, sketch: <SketchBadgeIcon size={22} /> },
};

export function CollectionScreen()
{
    const t = useT();
    const art_style = useArtStyle();
    const owned = useOwnedItemIds();
    const shards = useInventoryStore((state) => state.shards);
    const equipped = useInventoryStore((state) => state.equipped);
    const tier_index = getTierForStreak(useStreak().current_streak).index;
    const [slot, setSlot] = useState<ItemSlot>('flame');
    const [open_item, setOpenItem] = useState<RewardItem | null>(null);
    const grid_ref = useRef<HTMLDivElement>(null);
    // New cards fly in on every slot change: make sure iPhone Safari still scrolls afterwards
    useScrollRefresh(grid_ref, slot);

    const items = getSlotItems(slot);

    function chooseSlot(next: ItemSlot): void
    {
        if (next === slot)
        {
            return;
        }
        playSfx('toggle');
        triggerHaptic();
        setSlot(next);
    }

    function openItem(item: RewardItem): void
    {
        playSfx('press');
        triggerHaptic();
        setOpenItem(item);
    }

    return (
        <Screen kicker={t('rewards_kicker')} title={t('collection_title')}>
            <div className={styles.summary}>
                <span className="mono_label">{t('collection_progress', { owned: countOwned(REWARD_CATALOG, owned), total: REWARD_CATALOG.length })}</span>
                <span className={styles.shards}>
                    <span className={styles.shard_gem} />
                    {shards}
                </span>
            </div>

            <div className={`${styles.filters} sk-frame`} role="tablist" aria-label={t('collection_filter_label')}>
                {COLLECTION_SLOTS.map((filter_slot) =>
                {
                    const is_active = filter_slot === slot;
                    const slot_items = getSlotItems(filter_slot);
                    return (
                        <motion.div
                            key={filter_slot}
                            {...getPressableProps(() => chooseSlot(filter_slot), false, 'tab')}
                            aria-selected={is_active}
                            aria-label={t(slotNameKey(filter_slot))}
                            className={is_active ? `${styles.filter} ${styles.filter_active}` : styles.filter}
                            whileTap={{ scale: 0.88 }}
                            transition={SPRING_PRESS}
                        >
                            {is_active && (
                                <motion.span layoutId="collection-filter" className={`${styles.filter_pill} sk-frame sk-flat sk-abs`} transition={SPRING_SLIDE} />
                            )}
                            <span className={styles.filter_icon}>{SLOT_ICONS[filter_slot][art_style]}</span>
                            <span className={styles.filter_count}>{countOwned(slot_items, owned)}/{slot_items.length}</span>
                            <HapticOverlay />
                        </motion.div>
                    );
                })}
            </div>

            <span className={`mono_label ${styles.section_label}`}>{t(slotNameKey(slot))}</span>
            <div className={styles.grid} key={slot} ref={grid_ref}>
                {items.map((item, index) =>
                {
                    const offer = getItemOffer(item, owned, shards);
                    const is_owned = offer.status === 'owned';
                    const is_equipped = equipped[item.slot] === item.id;
                    let footer: ReactNode = <span className={styles.rarity}>{t(`rarity_${item.rarity}`)}</span>;
                    if (offer.status === 'for_sale')
                    {
                        footer = (
                            <span className={offer.shards_missing === 0 ? `${styles.price} ${styles.price_ready}` : styles.price}>
                                <span className={styles.shard_gem} />
                                {offer.cost}
                            </span>
                        );
                    }
                    else if (offer.status === 'milestone')
                    {
                        footer = <span className={styles.price}>{t('collection_unlock_days', { n: offer.unlock_days })}</span>;
                    }
                    const name = offer.status === 'milestone' ? t('collection_hidden_name') : t(itemNameKey(item.id));
                    return (
                        <motion.div
                            key={item.id}
                            {...getPressableProps(() => openItem(item))}
                            aria-label={name}
                            className={`${styles.card} ${styles[item.rarity]} ${is_owned ? '' : styles.missing} sk-frame sk-flat`}
                            initial={{ y: 14, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 26, delay: index * CARD_STAGGER_S }}
                        >
                            <span className={styles.rarity_dot} />
                            {is_equipped && (
                                <span className={`${styles.equipped} sk-frame sk-flat sk-round sk-abs`} aria-label={t('reveal_equipped')}>
                                    <svg viewBox="0 0 12 12" aria-hidden="true">
                                        <path d="M2.4 6.4 L5 8.8 L9.6 3.4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            )}
                            <ItemPreview item={item} is_owned={is_owned} tier_index={tier_index} size={CARD_PREVIEW_SIZE} />
                            <span className={styles.name}>{name}</span>
                            {footer}
                        </motion.div>
                    );
                })}
            </div>

            <ItemSheet item={open_item} tier_index={tier_index} onClose={() => setOpenItem(null)} />
        </Screen>
    );
}
