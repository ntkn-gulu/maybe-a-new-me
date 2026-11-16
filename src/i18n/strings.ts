// Every piece of in-app text, in Vietnamese and English.
// Placeholders like {n} are filled by t(key, { n: 3 }).
// The Vietnamese table defines the keys; English must provide the same keys.

export type Language = 'vi' | 'en';

const VI = {
    // Tabs
    tab_journey: 'Hành trình',
    tab_focus: 'Tập trung',
    tab_rewards: 'Rương',
    tab_settings: 'Cài đặt',

    // Focus
    focus_kicker: 'Phiên {n} / {goal} hôm nay',
    focus_title: 'Tập trung',
    focus_minutes: '{n} phút',
    focus_start: 'Bắt đầu',
    focus_preview_note: 'Đồng hồ thật + chế độ strict có ở GĐ2',
    focus_pips_label: '{done} trên {goal} pomodoro hôm nay',

    // Journey
    journey_kicker: 'Hành trình · Cấp {level} / {max}',
    journey_streak: '{n} ngày liên tiếp',
    journey_passed: 'Đã đi qua',
    journey_unlock_at: 'Mở khóa ở {n} ngày',
    journey_next: 'Tới {name}',
    journey_tier_label: '{name}, {n} ngày',

    // Rewards
    rewards_kicker: 'Kho báu',
    rewards_title: 'Rương',
    rewards_waiting: '{n} rương đang chờ',
    rewards_intro: 'Đạt mục tiêu hôm nay\nđể nhận rương đầu tiên.',
    rewards_nudge: 'Lắc hoài cũng không mở đâu.\nĐi học đi rồi tính 😏',
    rewards_can_drop: 'Có thể rơi ra',
    rewards_chest_label: 'Rương (đang khóa)',
    rarity_common: 'Thường',
    rarity_rare: 'Hiếm',
    rarity_epic: 'Sử thi',
    rarity_legendary: 'Huyền thoại',
    example_common: 'Danh hiệu',
    example_rare: 'Theme',
    example_epic: 'Skin đồng hồ',
    example_legendary: 'Lửa hiếm',

    // Settings
    settings_kicker: 'Tùy chỉnh',
    settings_title: 'Cài đặt',
    settings_group_general: 'Chung',
    settings_language: 'Ngôn ngữ',
    settings_group_sound: 'Âm thanh & rung',
    settings_sound: 'Âm thanh',
    settings_volume: 'Âm lượng',
    settings_haptic: 'Rung khi bấm',
    settings_haptic_caption: 'Thử nghiệm · iPhone iOS 18+',
    settings_native_switch: 'Công tắc gốc của iOS',
    settings_native_switch_caption: 'Gạt thử: rung = iPhone hỗ trợ rung trên web',
    settings_group_preview: 'Nghe thử',
    sfx_tab: 'Tab',
    sfx_toggle: 'Gạt',
    sfx_sparkle: 'Lấp lánh',
    sfx_whoosh: 'Vút',
    sfx_chime: 'Chuông',
    haptic_test: 'Rung',

    // Flame tiers (index matches FLAME_TIERS in core)
    tier_0_name: 'Tinh Hỏa',
    tier_0_words: 'Một đốm lửa nhỏ.\nĐủ để bắt đầu.',
    tier_1_name: 'Xích Hỏa',
    tier_1_words: 'Ba ngày liền.\nLửa đã bén củi.',
    tier_2_name: 'Kim Hỏa',
    tier_2_words: 'Trọn một tuần.\nTia lửa bắt đầu bắn ra.',
    tier_3_name: 'Lam Hỏa',
    tier_3_words: 'Hai tuần.\nLửa nóng tới mức đổi màu.',
    tier_4_name: 'Tử Hỏa',
    tier_4_words: 'Một tháng.\nThói quen đang thành con người bạn.',
    tier_5_name: 'Huyễn Hỏa',
    tier_5_words: 'Hai tháng.\nAi đi ngang cũng thấy bạn sáng.',
    tier_6_name: 'Bạch Hỏa',
    tier_6_words: 'Một trăm ngày.\nChẳng còn gì dập được nữa.',
    tier_7_name: 'Thất Sắc Hỏa',
    tier_7_words: 'Nửa năm.\nMỗi ngày một màu, vẫn là bạn.',
    tier_8_name: 'Thiên Hà Hỏa',
    tier_8_words: 'Một năm.\nCả dải ngân hà cháy trong tay bạn.',
};

export type StringKey = keyof typeof VI;

const EN: Record<StringKey, string> = {
    tab_journey: 'Journey',
    tab_focus: 'Focus',
    tab_rewards: 'Chests',
    tab_settings: 'Settings',

    focus_kicker: 'Session {n} of {goal} today',
    focus_title: 'Focus',
    focus_minutes: '{n} min',
    focus_start: 'Start',
    focus_preview_note: 'Real timer + strict mode come in phase 2',
    focus_pips_label: '{done} of {goal} pomodoros today',

    journey_kicker: 'Journey · Level {level} / {max}',
    journey_streak: '{n} day streak',
    journey_passed: 'Passed',
    journey_unlock_at: 'Unlocks at {n} days',
    journey_next: 'Next: {name}',
    journey_tier_label: '{name}, {n} days',

    rewards_kicker: 'Treasure',
    rewards_title: 'Chests',
    rewards_waiting: '{n} chests waiting',
    rewards_intro: 'Hit today’s goal\nto earn your first chest.',
    rewards_nudge: 'Shaking it won’t open it.\nGo study first 😏',
    rewards_can_drop: 'Possible drops',
    rewards_chest_label: 'Chest (locked)',
    rarity_common: 'Common',
    rarity_rare: 'Rare',
    rarity_epic: 'Epic',
    rarity_legendary: 'Legendary',
    example_common: 'Titles',
    example_rare: 'Themes',
    example_epic: 'Timer skins',
    example_legendary: 'Rare flames',

    settings_kicker: 'Preferences',
    settings_title: 'Settings',
    settings_group_general: 'General',
    settings_language: 'Language',
    settings_group_sound: 'Sound & haptics',
    settings_sound: 'Sound',
    settings_volume: 'Volume',
    settings_haptic: 'Haptics on tap',
    settings_haptic_caption: 'Experimental · iPhone iOS 18+',
    settings_native_switch: 'Native iOS switch',
    settings_native_switch_caption: 'Flip it: a buzz means web haptics work here',
    settings_group_preview: 'Sound test',
    sfx_tab: 'Tab',
    sfx_toggle: 'Switch',
    sfx_sparkle: 'Sparkle',
    sfx_whoosh: 'Whoosh',
    sfx_chime: 'Chime',
    haptic_test: 'Haptic',

    tier_0_name: 'Spark',
    tier_0_words: 'A tiny spark.\nEnough to begin.',
    tier_1_name: 'Blaze',
    tier_1_words: 'Three days straight.\nThe fire caught.',
    tier_2_name: 'Gold Flame',
    tier_2_words: 'A full week.\nSparks start to fly.',
    tier_3_name: 'Blue Flame',
    tier_3_words: 'Two weeks.\nHot enough to change color.',
    tier_4_name: 'Violet Flame',
    tier_4_words: 'One month.\nThe habit is becoming you.',
    tier_5_name: 'Neon Flame',
    tier_5_words: 'Two months.\nEveryone can see you glow.',
    tier_6_name: 'White Flame',
    tier_6_words: 'One hundred days.\nNothing can put you out.',
    tier_7_name: 'Prism Flame',
    tier_7_words: 'Half a year.\nA new color each day, still you.',
    tier_8_name: 'Galaxy Flame',
    tier_8_words: 'One year.\nA whole galaxy burns in your hands.',
};

export const STRINGS: Record<Language, Record<StringKey, string>> = { vi: VI, en: EN };

export type StringParams = Record<string, string | number>;

export function translate(language: Language, key: StringKey, params?: StringParams): string
{
    let text = STRINGS[language][key];
    if (params)
    {
        for (const [name, value] of Object.entries(params))
        {
            text = text.replaceAll(`{${name}}`, String(value));
        }
    }
    return text;
}

// Keys for tier text are built from the tier index
export function tierNameKey(tier_index: number): StringKey
{
    return `tier_${tier_index}_name` as StringKey;
}

export function tierWordsKey(tier_index: number): StringKey
{
    return `tier_${tier_index}_words` as StringKey;
}
