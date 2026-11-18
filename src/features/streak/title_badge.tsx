import { motion } from 'motion/react';
import { getItem } from '../../core/reward_catalog';
import { useInventoryStore } from '../../stores/inventory_store';
import { useT } from '../../i18n/use_t';
import { itemNameKey } from '../../i18n/strings';
import { SPRING_POP } from '../../ui/motion_presets';
import { ItemPreview } from '../rewards/item_preview';
import styles from './title_badge.module.css';

// The equipped title (a Collection item) as a small name tag on the Journey
// screen: the title's coin and its name. It pops in again when the title changes.

const COIN_SIZE = 24;

export function TitleBadge()
{
    const t = useT();
    const title_id = useInventoryStore((state) => state.equipped.title);
    const item = getItem(title_id);
    if (!item)
    {
        return null;
    }
    return (
        <motion.div
            key={title_id}
            className={`${styles.badge} sk-frame sk-flat sk-pill`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ scale: SPRING_POP, opacity: { duration: 0.15 } }}
        >
            <ItemPreview item={item} is_owned tier_index={0} size={COIN_SIZE} />
            <span className={styles.name}>{t(itemNameKey(title_id))}</span>
        </motion.div>
    );
}
