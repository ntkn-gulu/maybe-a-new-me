# Checklist: tạo một theme phong cách mới (Huyền thoại)

Dùng khi thêm một theme **đổi cả cách vẽ app** như Phác thảo (ví dụ "Winter").
Theme **chỉ đổi màu** (Midnight, Matcha...) thì chỉ cần mục 1, 2 và 8.
Đổi `winter` thành tên theme mới ở mọi chỗ bên dưới.

## 0. Trước khi code
- [ ] Làm **trang demo** (`demo/`, artifact) cho ngọn lửa và 1–2 màn chính, chốt look với bro trước.
- [ ] Nếu cần font mới: **hỏi bro trước** (thư viện mới), thêm gói `@fontsource/...` (có subset tiếng Việt), import ở `src/main.tsx`.

## 1. Đăng ký theme
- [ ] `src/core/reward_catalog.ts`: thêm `{ id: 'theme_winter', slot: 'theme', rarity: 'legendary', source: 'gacha' }`.
- [ ] `src/i18n/strings.ts`: tên món `item_theme_winter` (vi + en), tên hiển thị trong Bộ sưu tập.
- [ ] `src/stores/settings_store.ts`: thêm vào `AppTheme`, `ArtStyle` (nếu có bộ hình riêng), `getArtStyle`, `migrateSettings` (giá trị lạ → mặc định).
- [ ] Ánh xạ món đồ → theme (item `theme_winter` → `AppTheme 'winter'`).

## 2. Token và chữ (`src/styles/winter_theme.css`, import ở `main.tsx`)
- [ ] `:root[data-theme="winter"]`: màu nền, mực, tile, nút, accent, màu độ hiếm nếu đổi.
- [ ] Font cho cả 3 vai trò (`--font-display`, `--font-ui`, `--font-mono`); nếu font chỉ có 1 độ đậm thì chặn fake bold.
- [ ] Đo font mới so với font gốc (x-height, bề ngang). Chữ hẹp hoặc mảnh thì chỉnh `font-size-adjust`, `letter-spacing`, và **nâng riêng chữ ≤ 12px** (lịch, caption, nhãn tab, chip...).
- [ ] Nền (texture) nếu có: chỉ dùng **tile SVG nhỏ**, không gradient lặp.

## 3. Khung UI (mọi thứ đang gắn class `sk-*`)
Hệ class hiện tại tên `sk-*` (sketch); theme mới **tái dùng các hook đó** với selector `:root[data-theme="winter"] .sk-frame ...`, không gắn thêm class mới vào component.
- [ ] `sk-frame`, `sk-flat`, `sk-pill`, `sk-round`, `sk-abs`/`sk-fixed`: tile, thẻ, nhóm cài đặt, lịch, thẻ thống kê, modal, thanh tab.
- [ ] `sk-marker` / `MarkerFill`: nút accent (Bắt đầu, Thử lại, Tuyệt vời).
- [ ] `sk-hatch-block`: phần "độ dày" của nút.
- [ ] `sk-tape`: băng rôn (`Ribbon`).
- [ ] `sk-input`: ô nhập ghi chú.
- [ ] `sk-hide` / `sk-only`: phần chỉ hiện ở theme 3D hoặc ở theme mới.
- [ ] Công tắc (`ToggleSwitch`), nút gạt (`SegmentedSwitch`), thanh trượt âm lượng.
- [ ] Dấu nhỏ: ô mục tiêu đã xong (`ScribbleMark`), ngày giữ lửa trong lịch (`CircleMark`) và chú thích lịch.
- [ ] Icon thanh tab (bản riêng như `sketch_icons.tsx`).

## 4. Hình minh họa (mỗi cái cần 1 bản cho theme)
- [ ] **Ngọn lửa**: 9 cấp + cấp chưa mở ("?") + 5 màu lửa hiếm + màu cầu vồng (cấp 7) + sao (cấp 8), cảnh vẽ ra, tàn lửa, nổ khi Level up (`Flame` chọn theo `useArtStyle()`).
- [ ] Lửa mini trên **hàng 9 cấp** (`tier_strip`).
- [ ] **Đồng hồ** (`TimerDial`): mặt, vạch, phần thời gian, kim quay mượt.
- [ ] **Đồng hồ vỡ** (`ShatteredDial`).
- [ ] Skin đồng hồ có bản cho mọi theme (hiện tại: **Đồng hồ cát**).
- [ ] **Rương** (`ChestArt`) và **màn mở rương** (rung, nứt, bung sáng theo độ hiếm, Huyền thoại nổ vàng).
- [ ] **Icon độ hiếm** + trang trí thẻ tỉ lệ (`SketchRarityGem` / `SketchRarityDoodles`).
- [ ] Màn Level up: tia sáng nền, băng rôn, nút.
- [ ] Ảnh xem trước của theme trong Bộ sưu tập.

## 5. Luật hiệu năng iPhone (bắt buộc)
- [ ] **Không bộ lọc SVG** (feDisplacementMap, feDropShadow, feTurbulence...).
- [ ] **Không "nướng" hình thành ảnh** `<img>` (bị nhòe khi phóng to hoặc chạy animation).
- [ ] **Không gradient lặp** làm texture; không animate gradient.
- [ ] Hình vẽ tay = **hình học tính sẵn bằng code** (`src/ui/sketch_draw.ts`, seed cố định).
- [ ] Chuyển động chỉ dùng **transform / opacity**; phần chuyển động nằm ở **lớp SVG riêng**; `pathLength` chỉ dùng cho cảnh vẽ ra ngắn.
- [ ] Hiệu ứng ẩn của theme khác (gradient xoay, glow) phải **tắt hẳn** ở theme mới, không chạy ngầm.

## 6. Kiểm tra
- [ ] Đi hết các màn: Hành trình (lửa, hàng cấp, thống kê, lịch, check-in thể thao), Tập trung (đồng hồ, chạy phiên, hỏi "còn đó không", xong phiên, vỡ phiên, ghi chú), Rương, Bộ sưu tập, Cài đặt, Level up.
- [ ] Phóng to screenshot kiểm độ sắc nét; xem ở bề ngang iPhone.
- [ ] `prefers-reduced-motion` vẫn dùng được.
- [ ] Theme 3D và các theme khác **không đổi gì**.
- [ ] Test trên **iPhone thật** (xem giờ build trong Cài đặt). Số đo trên Chrome không chứng minh được gì cho iPhone.

## 7. Khóa theme
- [ ] Chưa sở hữu thì không trang bị được (dev mode xem thử được).
- [ ] Ra từ rương / đổi Mảnh Lửa được (Huyền thoại: 400 mảnh).

## 8. Tài liệu
- [ ] `architecture.md`: file mới, luồng theme, luật hiệu năng.
- [ ] Cập nhật checklist này nếu theme mới phát sinh thêm thứ cần làm.
