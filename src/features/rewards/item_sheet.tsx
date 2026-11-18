import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ModalCard } from '../../ui/modal_card';
import { TactileButton } from '../../ui/tactile_button';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { playSfx, type SfxName } from '../../sound/sfx_engine';
import { getSoundPackForItem } from '../../sound/sound_packs';
import { triggerHaptic } from '../../sound/haptic_hack';
import { useT } from '../../i18n/use_t';
import { itemNameKey, slotNameKey } from '../../i18n/strings';
import { getItemOffer } from '../../core/collection';
import type { RewardItem } from '../../core/reward_catalog';
import { useInventoryStore, useOwnedItemIds } from '../../stores/inventory_store';
import { canEquipNow } from './item_usable';
import { getTimerSkinForItem, isSkinDrawnIn } from '../focus/timer_skins';
import { useArtStyle } from '../../stores/active_theme';
import { ItemPreview } from './item_preview';
import styles from './item_sheet.module.css';

// Detail card for one Collection item: a bigger picture, rarity, name, slot,
// how to get it, and the action that fits:
// - owned:          Equip (or "Equipped"), or a note that it works in a later update
// - for sale:       trade shards for it. The first tap arms the button, a second
//                   tap within BUY_ARM_MS trades (no pop-up dialog); short on
//                   shards = a disabled button and how many are missing
// - chest / streak: a note on where it comes from
// Sound packs also get a "listen" button that plays a few of the pack's sounds.

const SHEET_PREVIEW_SIZE = 96;
const BUY_ARM_MS = 2600;

// The pack preview: a few taps, then the "something good" sound [sound, ms from start]
const SOUND_PREVIEW: [SfxName, number][] = [['press', 0], ['release', 110], ['tab', 380], ['toggle', 700], ['sparkle', 1050]];

interface ItemSheetProps
{
    item: RewardItem | null;      // null = closed
    tier_index: number;
    onClose: () => void;
}

export function ItemSheet(props: ItemSheetProps)
{
    const t = useT();
    // Keep showing the last item while the card fades out after closing
    const [last_item, setLastItem] = useState<RewardItem | null>(props.item);
    if (props.item && props.item !== last_item)
    {
        setLastItem(props.item);
    }
    const item = props.item ?? last_item;
    return (
        <ModalCard is_open={props.item !== null} onClose={props.onClose} aria_label={item ? t(itemNameKey(item.id)) : ''}>
            {item && <SheetBody key={item.id} item={item} tier_index={props.tier_index} onClose={props.onClose} />}
        </ModalCard>
    );
}

interface SheetBodyProps
{
    item: RewardItem;
    tier_index: number;
    onClose: () => void;
}

function SheetBody(props: SheetBodyProps)
{
    const t = useT();
    const { item } = props;
    const owned = useOwnedItemIds();
    const shards = useInventoryStore((state) => state.shards);
    const equipped_id = useInventoryStore((state) => state.equipped[item.slot]);
    const equip = useInventoryStore((state) => state.equip);
    const buyWithShards = useInventoryStore((state) => state.buyWithShards);
    const [is_buy_armed, setIsBuyArmed] = useState(false);
    const [is_just_bought, setIsJustBought] = useState(false);
    const art_style = useArtStyle();
    // A 3D-only timer skin in the sketch theme: it is kept, but the classic dial is drawn
    const is_hidden_here = item.slot === 'timer_skin' && !isSkinDrawnIn(getTimerSkinForItem(item.id), art_style);

    // An armed trade button calms down again if the second tap never comes
    useEffect(() =>
    {
        if (!is_buy_armed)
        {
            return;
        }
        const timer = window.setTimeout(() => setIsBuyArmed(false), BUY_ARM_MS);
        return () => window.clearTimeout(timer);
    }, [is_buy_armed]);

    const offer = getItemOffer(item, owned, shards);
    const is_owned = offer.status === 'owned';
    const is_equipped = equipped_id === item.id;
    const is_hidden = offer.status === 'milestone';

    function listen(): void
    {
        const pack = getSoundPackForItem(item.id);
        for (const [name, delay_ms] of SOUND_PREVIEW)
        {
            window.setTimeout(() => playSfx(name, 1, pack), delay_ms);
        }
    }

    function tapBuy(): void
    {
        if (!is_buy_armed)
        {
            setIsBuyArmed(true);
            return;
        }
        const result = buyWithShards(item.id);
        setIsBuyArmed(false);
        if (result.ok)
        {
            playSfx('chime');
            triggerHaptic();
            setIsJustBought(true);
        }
    }

    let note: string;
    switch (offer.status)
    {
        case 'owned':
            if (is_just_bought)
            {
                note = t('collection_bought');
            }
            else if (!canEquipNow(item))
            {
                note = t('collection_coming_soon');
            }
            else if (is_hidden_here)
            {
                note = t('collection_3d_only');
            }
            else
            {
                note = is_equipped ? t('collection_in_use') : t('collection_owned');
            }
            break;
        case 'for_sale':
            note = offer.shards_missing > 0 ? t('collection_need_shards', { n: offer.shards_missing }) : t('collection_can_buy');
            break;
        case 'milestone':
            note = t('collection_milestone', { n: offer.unlock_days });
            break;
        case 'chest_only':
            note = t('collection_chest_only');
            break;
    }

    return (
        <div className={`${styles.body} ${styles[item.rarity]}`}>
            <motion.div
                key={is_owned ? 'owned' : 'missing'}
                className={styles.preview}
                initial={{ scale: is_just_bought ? 0.3 : 0.8, rotate: is_just_bought ? -25 : 0 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={SPRING_POP}
            >
                <ItemPreview item={item} is_owned={is_owned} tier_index={props.tier_index} size={SHEET_PREVIEW_SIZE} />
            </motion.div>
            <span className={styles.rarity}>{t(`rarity_${item.rarity}`)}</span>
            <h2 className={styles.name}>{is_hidden ? t('collection_hidden_name') : t(itemNameKey(item.id))}</h2>
            <span className={styles.slot}>{t(slotNameKey(item.slot))}</span>
            <AnimatePresence mode="wait" initial={false}>
                <motion.p
                    key={note}
                    className={styles.note}
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ y: SPRING_POP, opacity: OPACITY_FADE }}
                >
                    {note}
                </motion.p>
            </AnimatePresence>

            <div className={styles.actions}>
                {item.slot === 'sound_pack' && (
                    <TactileButton size="md" is_full_width onClick={listen}>{t('collection_listen')}</TactileButton>
                )}
                {is_owned && canEquipNow(item) && (
                    is_equipped
                        ? <TactileButton size="md" is_full_width is_disabled>{t('reveal_equipped')}</TactileButton>
                        : <TactileButton size="md" variant="ink" is_full_width onClick={() => equip(item.id)}>{t('reveal_equip')}</TactileButton>
                )}
                {offer.status === 'for_sale' && (
                    <TactileButton
                        size="md"
                        variant="accent"
                        is_full_width
                        is_disabled={offer.shards_missing > 0}
                        onClick={tapBuy}
                    >
                        {is_buy_armed ? t('collection_buy_confirm') : t('collection_buy', { n: offer.cost })}
                    </TactileButton>
                )}
                <TactileButton size="md" is_full_width onClick={props.onClose}>{t('collection_close')}</TactileButton>
            </div>
        </div>
    );
}
