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
    settings_haptic_caption: 'iPhone iOS 18+ · Android',
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

    // Focus session
    focus_kicker_done: 'Đủ mục tiêu hôm nay · {done} phiên',
    focus_running_label: 'Đang tập trung · {n} phút',
    focus_away_left: 'Được rời app thêm {time}',
    focus_desktop_mode: 'Chế độ PC · {n} lần kiểm tra',
    focus_leave_hint: 'Rời app tối đa 1 phút mỗi lần\nđể trả lời tin nhắn quan trọng.',
    focus_hold_give_up: 'Giữ để bỏ cuộc',
    focus_dev_chip: 'Dev ×{n}',
    focus_tap_for_sound: 'Chạm để bật lại âm thanh',
    presence_title: 'Còn đó không?',
    presence_button: 'Vẫn đang học ✋',
    presence_countdown: 'Còn {n} giây',
    note_kicker: 'Hết giờ',
    note_title: 'Vừa làm gì?',
    note_placeholder: 'Vd: Ôn chương 3 Giải tích',
    note_min_hint: 'Ít nhất {n} ký tự',
    note_save: 'Lưu phiên',
    done_kicker: '+1 pomodoro',
    done_title: 'Xong một phiên!',
    done_goal_met: 'Đủ mục tiêu hôm nay.\nLửa được giữ thêm một ngày.',
    done_goal_left: 'Còn {n} phiên nữa\nlà giữ được lửa hôm nay.',
    done_ribbon: 'Giữ lửa hôm nay',
    done_continue: 'Tiếp tục',
    broken_kicker: 'Phiên này không được tính',
    broken_title: 'Phiên đã vỡ',
    broken_left_app: 'Bạn rời app quá 1 phút.',
    broken_away_too_long: 'Tổng thời gian rời app vượt giới hạn.',
    broken_missed_check: 'Không trả lời "Còn đó không?" kịp.',
    broken_clock_jump: 'Giờ của máy bị chỉnh lùi.',
    broken_gave_up: 'Bạn đã bỏ cuộc phiên này.',
    broken_encourage: 'Không sao cả.\nPhiên sau sẽ trọn vẹn.',
    broken_retry: 'Thử lại',
    broken_back: 'Về',
    settings_group_goal: 'Mục tiêu',
    settings_goal: 'Pomodoro mỗi ngày',
    settings_goal_caption: 'Đổi mục tiêu sẽ áp dụng từ mai',
    settings_goal_pending: 'Hôm nay {today} · từ mai {tomorrow}',
    dev_mode_on: 'Đã bật chế độ thử (×{n})',
    dev_mode_off: 'Đã tắt chế độ thử',

    // Reward items (ids match REWARD_CATALOG in core)
    item_flame_follow_tier: 'Lửa theo cấp',
    item_timer_classic: 'Đồng hồ cổ điển',
    item_sound_classic: 'Âm thanh gốc',
    item_theme_paper: 'Giấy kem',
    item_title_beginner: 'Người mới bắt đầu',
    item_title_night_owl: 'Cú Đêm',
    item_title_early_bird: 'Chim Dậy Sớm',
    item_title_cafe_warrior: 'Chiến Thần Cà Phê',
    item_title_deadline_slayer: 'Kẻ Hủy Diệt Deadline',
    item_title_focus_monk: 'Thiền Sư Tập Trung',
    item_title_exam_survivor: 'Chiến Binh Mùa Thi',
    item_theme_midnight: 'Nửa đêm',
    item_theme_matcha: 'Trà xanh',
    item_theme_sunset: 'Hoàng hôn',
    item_theme_ocean: 'Đại dương',
    item_sound_mechanical: 'Bàn phím cơ',
    item_sound_wood: 'Gõ gỗ',
    item_sound_retro: 'Máy chơi game 8-bit',
    item_sound_wind_chime: 'Chuông gió',
    item_timer_retro_lcd: 'Màn LCD cổ',
    item_timer_nixie: 'Đèn Nixie',
    item_timer_neon: 'Ống neon',
    item_timer_paper: 'Giấy gấp',
    item_flame_ice: 'Lửa Băng',
    item_flame_toxic: 'Lửa Độc',
    item_flame_shadow: 'Lửa Bóng Tối',
    item_flame_gold_24k: 'Lửa Vàng 24K',
    item_flame_aurora: 'Lửa Cực Quang',
    item_flame_tier_1: 'Màu Xích Hỏa',
    item_flame_tier_2: 'Màu Kim Hỏa',
    item_flame_tier_3: 'Màu Lam Hỏa',
    item_flame_tier_4: 'Màu Tử Hỏa',
    item_flame_tier_5: 'Màu Huyễn Hỏa',
    item_flame_tier_6: 'Màu Bạch Hỏa',
    item_flame_tier_7: 'Màu Thất Sắc Hỏa',
    item_flame_tier_8: 'Màu Thiên Hà Hỏa',
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
    settings_haptic_caption: 'iPhone iOS 18+ · Android',
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

    focus_kicker_done: 'Goal done today · {done} sessions',
    focus_running_label: 'Focusing · {n} min',
    focus_away_left: 'Time away left {time}',
    focus_desktop_mode: 'Desktop mode · {n} checks',
    focus_leave_hint: 'Leave for up to 1 minute at a time\nto answer something important.',
    focus_hold_give_up: 'Hold to give up',
    focus_dev_chip: 'Dev ×{n}',
    focus_tap_for_sound: 'Tap to turn sound back on',
    presence_title: 'Still there?',
    presence_button: 'Still here ✋',
    presence_countdown: '{n} seconds left',
    note_kicker: 'Time\'s up',
    note_title: 'What did you do?',
    note_placeholder: 'e.g. Reviewed calculus chapter 3',
    note_min_hint: 'At least {n} characters',
    note_save: 'Save session',
    done_kicker: '+1 pomodoro',
    done_title: 'Session done!',
    done_goal_met: 'Today\'s goal is done.\nYour flame lives another day.',
    done_goal_left: '{n} more to go\nto keep your flame today.',
    done_ribbon: 'Flame kept today',
    done_continue: 'Continue',
    broken_kicker: 'This one doesn\'t count',
    broken_title: 'Session broken',
    broken_left_app: 'You were away for more than 1 minute.',
    broken_away_too_long: 'Too much total time away from the app.',
    broken_missed_check: 'A "Still there?" check went unanswered.',
    broken_clock_jump: 'The device clock moved backwards.',
    broken_gave_up: 'You gave up this session.',
    broken_encourage: "That's okay.\nThe next one will hold.",
    broken_retry: 'Try again',
    broken_back: 'Back',
    settings_group_goal: 'Goal',
    settings_goal: 'Pomodoros a day',
    settings_goal_caption: 'Changes apply from tomorrow',
    settings_goal_pending: 'Today {today} · tomorrow {tomorrow}',
    dev_mode_on: 'Dev mode on (×{n})',
    dev_mode_off: 'Dev mode off',

    item_flame_follow_tier: 'Tier flame',
    item_timer_classic: 'Classic dial',
    item_sound_classic: 'Classic sounds',
    item_theme_paper: 'Paper',
    item_title_beginner: 'Beginner',
    item_title_night_owl: 'Night Owl',
    item_title_early_bird: 'Early Bird',
    item_title_cafe_warrior: 'Café Warrior',
    item_title_deadline_slayer: 'Deadline Slayer',
    item_title_focus_monk: 'Focus Monk',
    item_title_exam_survivor: 'Exam Survivor',
    item_theme_midnight: 'Midnight',
    item_theme_matcha: 'Matcha',
    item_theme_sunset: 'Sunset',
    item_theme_ocean: 'Ocean',
    item_sound_mechanical: 'Mechanical keys',
    item_sound_wood: 'Woodblock',
    item_sound_retro: '8-bit console',
    item_sound_wind_chime: 'Wind chime',
    item_timer_retro_lcd: 'Retro LCD',
    item_timer_nixie: 'Nixie tubes',
    item_timer_neon: 'Neon tube',
    item_timer_paper: 'Folded paper',
    item_flame_ice: 'Ice Flame',
    item_flame_toxic: 'Toxic Flame',
    item_flame_shadow: 'Shadow Flame',
    item_flame_gold_24k: '24K Gold Flame',
    item_flame_aurora: 'Aurora Flame',
    item_flame_tier_1: 'Blaze color',
    item_flame_tier_2: 'Gold Flame color',
    item_flame_tier_3: 'Blue Flame color',
    item_flame_tier_4: 'Violet Flame color',
    item_flame_tier_5: 'Neon Flame color',
    item_flame_tier_6: 'White Flame color',
    item_flame_tier_7: 'Prism Flame color',
    item_flame_tier_8: 'Galaxy Flame color',
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

export function itemNameKey(item_id: string): StringKey
{
    return `item_${item_id}` as StringKey;
}
