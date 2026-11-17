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
import type { ChestType, DayKey } from '../core/types';

// The player's items, Flame Shards, pity and waiting chests (saved to
// localStorage). Every change goes through the pure functions in
// core/inventory.ts; randomness comes from Math.random here.

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
            equip: (item_id) => set(equipItem(pickInventory(get()), item_id)),
        }),
        { name: INVENTORY_STORAGE_KEY },
    ),
);

export function useOwnedItemIds(): Set<string>
{
    const owned_item_ids = useInventoryStore((state) => state.owned_item_ids);
    return getOwnedSet({ ...createInventory(), owned_item_ids });
}
