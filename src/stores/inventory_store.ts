import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    addChests,
    buyWithShards,
    createInventory,
    equipItem,
    getOwnedSet,
    openNextChest,
    rewardKeptDay,
    type ChestOpening,
    type Inventory,
} from '../core/inventory';
import type { ExchangeResult } from '../core/gacha_engine';
import { REWARD_CATALOG } from '../core/reward_catalog';
import type { ChestType, DayKey } from '../core/types';
import { useSettingsStore } from './settings_store';
import { setSoundPack } from '../sound/sfx_engine';
import { getSoundPackForItem } from '../sound/sound_packs';

// The player's items, Flame Shards, pity and waiting chests (saved to
// localStorage). Every change goes through the pure functions in
// core/inventory.ts; randomness comes from Math.random here.
// Dev mode's "try every item" lets any item be equipped and shown as owned
// without adding it to the saved inventory.

interface InventoryState extends Inventory
{
    rewardKeptDay: (day_key: DayKey, prev_streak: number, new_streak: number) => void;
    addChests: (chests: ChestType[]) => void;
    openNextChest: () => ChestOpening | null;
    buyWithShards: (item_id: string) => ExchangeResult;
    equip: (item_id: string) => void;
}

const INVENTORY_STORAGE_KEY = 'mnm-inventory';

// Only the data part of the state (no actions)
function pickInventory(state: InventoryState): Inventory
{
    return {
        owned_item_ids: state.owned_item_ids,
        shards: state.shards,
        pity: state.pity,
        pending_chests: state.pending_chests,
        rewarded_day_key: state.rewarded_day_key,
        equipped: state.equipped,
    };
}

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set, get) => ({
            ...createInventory(),

            rewardKeptDay: (day_key, prev_streak, new_streak) =>
                set(rewardKeptDay(pickInventory(get()), day_key, prev_streak, new_streak)),
            addChests: (chests) => set(addChests(pickInventory(get()), chests)),
            openNextChest: () =>
            {
                const opening = openNextChest(pickInventory(get()), Math.random);
                if (opening)
                {
                    set(opening.inventory);
                }
                return opening;
            },
            buyWithShards: (item_id) =>
            {
                const { inventory, result } = buyWithShards(pickInventory(get()), item_id);
                set(inventory);
                return result;
            },
            equip: (item_id) => set(equipItem(pickInventory(get()), item_id, !isDevUnlockAll())),
        }),
        { name: INVENTORY_STORAGE_KEY },
    ),
);

function isDevUnlockAll(): boolean
{
    const settings = useSettingsStore.getState();
    return settings.is_dev_mode && settings.is_dev_unlock_all;
}

const ALL_ITEM_IDS = REWARD_CATALOG.map((item) => item.id);

// Items to treat as owned in the UI (every item while "try every item" is on in dev mode)
export function useOwnedItemIds(): Set<string>
{
    const owned_item_ids = useInventoryStore((state) => state.owned_item_ids);
    const is_unlock_all = useSettingsStore((state) => state.is_dev_mode && state.is_dev_unlock_all);
    return is_unlock_all ? new Set(ALL_ITEM_IDS) : getOwnedSet({ ...createInventory(), owned_item_ids });
}

// The sound engine plays the equipped sound pack (at startup and on every change)
function applySoundPack(state: Inventory): void
{
    setSoundPack(getSoundPackForItem(state.equipped.sound_pack));
}

applySoundPack(useInventoryStore.getState());
useInventoryStore.subscribe(applySoundPack);
