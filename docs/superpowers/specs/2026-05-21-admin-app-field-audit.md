# Admin ↔ App 欄位 alignment audit

**作成日**：2026-05-21
**範圍**：admin prototype（現行 HEAD）vs. user app HEAD
**作成者**：UX research carpet audit
**目的**：把使用者 App 看得到 / 編得到的欄位，跟 admin 端能否「看 + 編」對齊，找出 admin 端缺漏

---

## サマリー

- Total entities audited: **10**
- 🔴 **高優先度ギャップ: 12 件**
- 🟡 中優先度ギャップ: 8 件
- 🟢 推奨追加: 6 件
- ❌ **admin に存在しないモジュール: 2 件**（Tournament、Coupon 独立管理）

### 共通パターン（cross-cutting findings）

これは個別 entity を見る前に把握しておくべき横断的な事実：

1. 🔴 **画像 / メディア upload UI が admin 全 dialog に一切ない**
   App 側のヒーロー画像（court / coach / campaign）は全部 `src/assets/*.webp` 静的 import。Admin から差し替え不可。
   - `NewCourtDialog.tsx:76` ハードコード `courtPlaceholder`
   - `AddCoachDialog.tsx:81` ハードコード `coachDefaultAvatar`
   - `NewCampaignDialog.tsx` / `CampaignEditDialog.tsx` / `NewLstCampaignDialog.tsx` には image field 自体なし

2. 🔴 **App の rich content 欄位（description / amenities / equipment / lessonMenus / venues / certifications）は admin から編集不可**
   `CourtDetail` / `CoachDetail` は `COURTS_DETAIL` / `COACHES_DETAIL` （hard-coded `courtData.ts` / `coachData.ts`）を直接読む。Admin の overlay store は `CourtSummary` / `CoachSummary` レベルだけ。

3. 🟡 **Admin には Tournament（大会）モジュール自体がない**
   App は `TournamentDetail` / `TournamentEntry` / `MyResults` を実装、`tournamentStore.ts` も heroImageUrl / description / accessInfo / contactInfo を持っているが、admin sidebar に「大会管理」項目なし（navigation.ts 確認済み）。`adminCoursesStore.ts` 的なものも存在せず。

4. 🟡 **Coupon の独立管理画面なし**
   `couponStore.ts` に `AVAILABLE_COUPONS` が hard-coded。admin の Campaign module で `couponCode` を吐き出すが、coupon 自体の一覧 / 在庫管理 / 発行履歴ページなし。

5. 🟡 **Notification Settings / Language Settings は admin 側に「設定可能項目」テンプレ管理がない**
   App は 4 つの push 通知種別 + 3 つの email 通知種別 を toggle 可能。Admin 側で「会員側に見せる通知種別を増減する」UI なし（コードに hard-code）。

6. ✅ **アライメント良好な entity（時間節約：これ以上掘らなくて良い）**
   - Member（rating / skill / premium / points）
   - Announcement（title / body / category / audience / status）
   - Booking（time / price / status）—— ただし `eventId` / `teamId` / `reviewVideos` 周りは未編集

---

## エンティティ別

### 1. コート (Court)

**App 側で見える/編集できる項目**（user は read-only）

| 項目 | 型 | source | 表示場所 |
|------|----|---------|---------|
| name | string | `CourtSummary.name` | `SearchResults.tsx`, `CourtDetail.tsx:209` |
| courtName | string | `CourtSummary.courtName` | both pages |
| courtType | string | `CourtSummary.courtType` | both pages |
| price | number | `CourtSummary.price` | both pages |
| **image** | webp import | `CourtSummary.image` | `CourtDetail.tsx:192-198`（hero）+ search list |
| available | boolean | `CourtSummary.available` | search list filter |
| rating / reviews | number | `CourtDetail` | `CourtDetail.tsx:214-217` |
| address | string | `CourtDetail.address` | `CourtDetail.tsx:224` |
| description | string | `CourtDetail.description` | `CourtDetail.tsx:235` |
| **amenities** | string[] | `CourtDetail.amenities` | `CourtDetail.tsx:240-247`（chip） |
| **availableSlots** | { time, available }[] | `CourtDetail.availableSlots` | drawer 時間枠 |
| **externalLinks** | ExternalLink[] | `CourtDetail.externalLinks` | （実装は `courtData.ts:80-84` にあり） |
| **equipment** | EquipmentItem[] | `CourtDetail.equipment` | `CourtDetail.tsx:396-442`（用具レンタル） |

**Admin 側で見える/編集できる項目**

| 項目 | dialog/page | source |
|------|------------|--------|
| name | NewCourtDialog / CourtEditDialog | inline state |
| courtName | both dialogs | inline |
| courtType | both dialogs（4 種から select） | inline |
| price | both dialogs | inline |
| available（公開状態） | both dialogs | inline |
| address | both dialogs（任意 textarea） | inline、**ただし保存されない**（`NewCourtDialog.tsx:79-80` `void address;`、`CourtEditDialog.tsx:77-78` 同） |

**ギャップ**

- 🔴 **image**：user は hero に表示するが admin 編集不可。NewCourtDialog で `courtPlaceholder` を強制 import。
- 🔴 **amenities**：user は CourtDetail で chip 表示するが admin で編集不可。`CourtSummary` overlay schema 自体に無い。
- 🔴 **description / rating / reviews**：user に出るが admin overlay に無い。
- 🔴 **availableSlots**：時間枠管理は予約システムの根幹だが admin 側に編集 UI なし（mock では hard-code）。
- 🔴 **equipment（用具レンタル）**：user は数量加減で課金される（hourly / perUse）が admin 編集不可。
- 🔴 **address**：dialog に input はあるが `void address;` で**保存されない**（dead UI）。
- 🟡 externalLinks：定義あるが user 画面で実装上どこに出ているか確認できず（dead data の可能性）。
- 🟢 **推奨**：dialog に画像 upload（または URL）、amenities multi-select（駐車場/シャワー/ロッカー/ナイター等の選択肢）、description textarea、equipment editor、address 保存。

---

### 2. コーチ (Coach)

**App 側で見える/編集できる項目**

| 項目 | source | 表示場所 |
|------|--------|---------|
| name, **avatar**, level, specialty[], area, rating, reviewCount, pricePerHour | `CoachSummary` | `CoachSearch`, `CoachDetail` |
| onlineAvailable, reviewAvailable | `CoachSummary` | filter / badge |
| availableToday | `CoachSummary` | search filter |
| **bio**, **experience**, location | `CoachDetail` | `CoachDetail.tsx:286,310` |
| **certifications[]** | `CoachDetail` | `CoachDetail.tsx:317`（chip） |
| **lessonMenus[]** | `CoachDetail` | `CoachDetail.tsx:421`（メニュー select、price + duration + type） |
| **venues[]** | `CoachDetail` | venue picker（name + address + courtFeePerHour） |
| **stats**（sessions / repeatRate / satisfaction） | `CoachDetail` | `CoachDetail.tsx:295-303` |
| availableSlots, reviews | `CoachDetail` | 予約 drawer / レビュー一覧 |

**Admin 側で見える/編集できる項目**

- `CoachDetailAdmin.tsx` は read-only で richdata（avatar / bio / certifications / lessonMenus / venues / stats）**全部表示**。
- 編集 dialog（AddCoachDialog / CoachEditDialog）は **CoachSummary 級のみ**：name / level / specialty / area / pricePerHour / onlineAvailable / reviewAvailable。
- avatar：`AddCoachDialog.tsx:81` で `coachDefaultAvatar` を強制 set。

**ギャップ**

- 🔴 **avatar**：admin で差し替え不可。新規追加は全員同じデフォルト画像。
- 🔴 **bio**：admin から編集不可。
- 🔴 **experience / location**：admin から編集不可。
- 🔴 **certifications**：display only。admin から chip 追加削除不可。
- 🔴 **lessonMenus**：admin から meny CRUD 不可（user の予約 flow は menu 選択が必須なのに）。
- 🔴 **venues**：admin から venue CRUD 不可（user の予約 flow は venue 選択が必須なのに）。
- 🟡 **stats**：mock 値だが admin から override / 反映ロジック不明。
- 🟡 **reviews**：user の book + rating で増えるが、admin から moderation する UI なし。
- 🟢 **推奨**：avatar upload、bio textarea、cert tag editor、lesson menu sub-table、venue sub-table（または venue マスタ参照）。最低限 bio / experience は最優先。

---

### 3. 予約 (Booking)

**App 側で見える/編集できる項目**

| 項目 | source | 表示場所 |
|------|--------|---------|
| type (court/coach), courtName, courtSubName, image, address, coachName, coachAvatar, coachLevel, coachSpecialty, date, startTime/endTime, status, people, pricePerHour, totalPrice | `StoredBooking` | `BookingDetail` / `BookingHistory` / `BookingConfirm` |
| lessonType, venueName/venueAddress, duration, slotCount, mode (solo/standard), equipment[], equipmentTotal, courtFee | `StoredBooking` | 主に BookingDetail |
| **rating** (stars / comment / createdAt) | `StoredBooking.rating` | レビュー submission flow |
| rescheduleUsed, pendingChangeDate/Start/End | tracking | reschedule flow |
| **reviewVideos** | `StoredBooking.reviewVideos` | online review menu の動画アップロード |
| eventId / teamId | event linkage（tournament 紐付き） | tournament 內 booking |
| cancelReason, cancelledAt, createdAt | admin op fields | （admin に既存） |

**Admin 側で見える/編集できる項目**

- NewBookingDialog：type / target（court or coach） / date / start/end / price / mode / memberLabel（**保存されない** `NewBookingDialog.tsx:136-137`）。
- BookingEditDialog：date / start/end / totalPrice / status / mode。

**ギャップ**

- 🔴 **memberLabel / userId**：admin 新規予約で会員紐付けが**未保存**。`予約管理` から「誰の予約か」が曖昧なら本来の予約管理の意味を成さない。
- 🟡 **equipment / equipmentTotal**：user が予約時に選んだ equipment は admin から編集不可（amount のみ確認・修正可）。
- 🟡 **rating**：admin に表示なし。booking モデルに rating 持つのに admin が見えないと「ユーザー満足度トラッキング」できない。
- 🟡 **reviewVideos**：admin で確認できない（ストレージ上 url 確認のみ可能なはずだが UI なし）。
- 🟡 **pendingChange** 系：reschedule リクエストを admin が承認 / 拒否する UI なし（コード上見当たらず）。
- 🟢 **推奨**：member-id picker（NewBookingDialog）、rating + reviewVideos の read-only セクション、reschedule 承認フロー。

---

### 4. 会員/プレイヤー (Member / Player)

**App 側で見える/編集できる項目**

| 項目 | source | 表示場所 |
|------|--------|---------|
| name, email, phone, **avatar**, points, xp | `userProfileStore`（user-001 のみ） | MyPage / Profile / ProfileEdit |
| rating, skillLevel | `PlayerRef`（tournamentStore） | MyPage Game Status / Profile |
| premium status, nextRenewAt, history | `subscriptionStore`（user-001 のみ） | MyPage / PremiumManage / PremiumBillingHistory |
| 大会戦績、リーグ戦績、ポイント残高 | aggregations | Profile / MyResults / PointsHistory |

**Admin 側で見える/編集できる項目**

- LST 側 MemberDetail：name / email / phone / displayId / registeredAt / lastLoginAt / 登録店 / skillLevel / rating / tier / シーズン順位 / **Premium状態** / 開始日 / 次回更新日 / 累計支払 / リーグ戦績 / ポイント残高 + 履歴。
- MemberEditDialog：name / email / phone / skillLevel / rating / registeredAffiliateId。

**ギャップ**

- 🔴 **avatar**：app は ProfileEdit で会員自身が upload。admin の MemberDetail / MemberEditDialog で表示 / 差し替え 共に不可（initial 1文字だけ表示）。
- 🟡 **points**：admin で残高は表示するが手動 adjust できる UI なし（ポイント付与 / 減算 op がない）。
- 🟡 **xp**：app の `userProfileStore.xp` は使われていない（mock-only、user-001 のみ track）。admin にもない。気にしなくて OK。
- 🟡 **mock-only 注意**：app の `useUserProfile` は user-001 のみ持つ。他 11 人の points / xp / premium はすべて `adminMembersOverlay.defaultExtraFor()` で deterministic mock 生成（つまり admin で見える「累計支払」「premium 開始日」は user-001 以外は全部 fake）。MemberDetail に「(モックデータ)」注記なし。
- 🟢 **推奨**：avatar 表示 + admin upload、point 手動付与/減算 dialog、mock-only 注記。

---

### 5. キャンペーン・イベント (Campaign / Event)

**App 側で見える/編集できる項目**

| 項目 | source | 表示場所 |
|------|--------|---------|
| **image (hero)** | `CAMPAIGN_DETAILS[id].image` | `CampaignDetail.tsx:101` + `CampaignCarousel.tsx:94` |
| title, dateLabel, location (optional), body (long text), ctaLabel, ctaLink | hard-code `CampaignDetail.tsx:20-74` | CampaignDetail |
| subtitle, discount (短縮 badge) | hard-code `CampaignCarousel.tsx:6-28` | home carousel |

**Admin 側で見える/編集できる項目**

- Store 版（`adminCampaignsStore`）：id, title, description, kind (discount/event/coupon), startDate, endDate, status, discountPercent, discountAmount, couponCode, audience, usageCount, conversionRate。
- LST 版（`adminLstCampaignsStore`）：上記 + affiliateIds[]（配信加盟店）+ kind に "premium" 追加。

**ギャップ**

- 🔴 **image / hero**：user は CampaignDetail / Carousel 両方で hero 画像を見るが admin で**全く設定できない**。`NewCampaignDialog` / `CampaignEditDialog` / `NewLstCampaignDialog` / `LstCampaignEditDialog` のいずれにも image field なし。store schema にもなし。
- 🔴 **body (long text)**：user は `CampaignDetail.tsx:128` で `body` を改行込みで表示するが、admin の `description` は短い 1-2 行 textarea。長文編集 UI 不足（rows=3 のみ）。
- 🔴 **ctaLabel / ctaLink**：user 画面の「予約する」「大会ページへ」CTA は hard-coded、admin から指定不可。
- 🟡 **location**：CampaignDetail で表示するが admin で field なし。
- 🟡 **subtitle / discount (短縮 label)**：Carousel の表示用文言は別 hard-code（`CampaignCarousel.tsx:6-28`）。admin の `description` と分離されている。
- 🟢 **推奨**：image upload (or URL)、body markdown editor、cta label/link、subtitle、location。**最低限 image だけでも追加すれば客向け demo の説得力が上がる**。

⚠️ **重要**：App 側 `CampaignDetail.tsx` と admin の Campaign は**現状データソースが完全に分離**している。Carousel の 3 件 / CampaignDetail の 6 件は完全 hard-code で、admin で作った CP-001〜LCP-010 は user app に**反映されない**。デモのときに admin で作成して→user app で出てこない、と齟齬が出る。

---

### 6. お知らせ (Announcement)

**App 側で見える/編集できる項目**

| 項目 | source | 表示場所 |
|------|--------|---------|
| title, summary, date, read | `SYSTEM_NOTIFICATIONS` （`Notifications.tsx:53-78` hard-code） + `NotificationDetail.tsx:12-43` (MOCK_DETAILS) | Notifications / NotificationDetail |
| body (long text) | NotificationDetail MOCK_DETAILS | NotificationDetail |
| **push 通知 type / coachName / bookingId / eventId / entryId / postedMatchId** | `notificationStore.PushNotification` | Notifications で混合表示 |

**Admin 側で見える/編集できる項目**

- `adminAnnouncementsStore`：id, title, body, category (notice/maintenance/event/other), status (draft/scheduled/published/ended), deliveryAt, audience (all/premium), readRate。
- NewAnnouncementDialog / AnnouncementEditDialog ：title / body / category / audience / scheduling。

**ギャップ**

- ✅ **構造は良くアライン**（title / body / category / audience / status / readRate）。
- 🔴 **同上の data-source 分離問題**：admin に AN-001〜012 ある、app は `SYSTEM_NOTIFICATIONS` + `MOCK_DETAILS` で完全別物。admin で作っても user app に反映なし。
- 🟡 **push 通知（PushNotification）**：booking / lesson / tournament / league の system push は `notificationStore` で動的生成。admin から手動送信 / テンプレ管理する UI なし。
- 🟡 **read 状態**：admin で readRate（% メトリック）見えるが「誰が既読」までは出ない（必要なら抽出可能だが UI なし）。
- 🟢 **推奨**：push 通知テンプレ管理画面、announcement → user app へのデータ接続。

---

### 7. リーグ (League)

**App 側で見える/編集できる項目**

`leagueMatchBoardStore.PostedMatch` の field：
- hostUserId, **desiredDate**, **preferredVenue**, description, **desiredSkillLevel**, applications[] (申請 with status), status, **result** (side1/2 UserIds + winnerSide + score + approvals[]), createdAt, cancelledAt, cancelledReason, threadId（group chat）。
- 表示場所：`league/LeagueBoardList`, `LeagueBoardDetail`, `LeagueBoardForm/New/Edit`, `LeagueBoardScore`。

**Admin 側で見える/編集できる項目**

- `LeagueDetail.tsx`：基本情報全部 read-only 表示（host / desiredDate / preferredVenue / desiredSkillLevel / description / status / createdAt / cancelledAt / cancelledReason / 応募者一覧 / 試合結果 + 4/4 approvals breakdown）。
- 操作：`LeagueCancelDialog` で admin が試合キャンセル可。

**ギャップ**

- ✅ **read 側は良くアライン**。LST 主催者編集 flow（最新 commit）も対応済。
- 🟡 **app の thread chat（messageStore.threadId）**：admin から内容確認 / モデレーション不可。
- 🟡 **app の主催者編集 flow**：app では `LeagueBoardEdit.tsx` で host が編集可。admin から「強制編集 / 別 host 移譲」できる UI なし。
- 🟡 **applications の moderation**：申請拒否は host が app から行うが admin から強制承認 / 拒否する UI なし。
- 🟢 **推奨**：thread 内容の read-only ビュー、強制申請拒否 / 強制完了。

---

### 8. 支払い (Payment)

**App 側で見える/編集できる項目**

- 通常予約決済（`BookingConfirm.tsx` → `/booking/payment`）：金額 / 支払い方法選択（実装は別 page、現状 mock）。
- Premium 支払い（`subscriptionStore.BillingRecord` + `PaymentMethod`）：paidAt, amount, status, paymentMethod (cc/paypay/apple + last4 + brand)。
- 表示場所：`PremiumBillingHistory.tsx`, `PremiumPaymentConfirm.tsx`, `PremiumPaymentMethod.tsx`, `CreditCardPayment.tsx`, `PremiumManage.tsx`。

**Admin 側で見える/編集できる項目**

- `adminPaymentsStore.PaymentRecord`：id, date, memberName, amount, method (credit/paypay/apple_pay), status (completed/failed/pending/refunded), relatedTxId, refundReason。
- `LstPaymentDetailAdmin`：加盟店 + 基本情報 + 関連取引、refund / retry の actions。
- `Member.extra.premiumStatus / premiumStartedAt / premiumNextRenewAt / premiumTotalPaid` も別経路で取れる。

**ギャップ**

- 🟡 **paymentMethod 詳細**：user は `last4` / `brand` 見えるが、admin は「credit」までしか出ない（card 末尾 4 桁不表示）。
- 🟡 **Premium 月額 vs 単発予約 の payment 区別**：admin の PaymentRecord にこの区別 field なし。`relatedTxId` で間接的に追えるが UI 上不明瞭。
- 🟡 **refund 後の通知**：user 側に通知される flow が `notificationStore` にない（refund 通知 type 不在）。
- 🟢 **推奨**：card brand / last4 表示、payment kind (premium-monthly / booking-court / booking-coach) を schema へ。

---

### 9. クーポン (Coupon)

**App 側で見える/編集できる項目**

- `couponStore.AVAILABLE_COUPONS`（hard-code、2 件）：code, label, description, discount (%/円), type, minAmount?, expiresAt。
- 表示：`Coupons.tsx`（マイページ → クーポン）。コピー機能あり。
- 利用フロー：BookingConfirm でコード入力？（要確認、現状実装は不明確）。

**Admin 側で見える/編集できる項目**

❌ **クーポン専用モジュール存在せず**。`navigation.ts` 確認、`pages/lst/coupons` / `pages/store/coupons` 共に無し。

唯一の interface：
- Campaign module の `kind: "coupon"` で `couponCode` + `discountAmount` を発行できる（`NewCampaignDialog.tsx:189-196`）。
- 例：`CP-003` （WELCOME500）、`CP-006`（BIRTHDAY1000）、`LCP-003`、`LCP-007`。

**ギャップ**

- 🔴 **モジュール自体がない**：coupon 一覧、発行履歴、使用状況、無効化 UI が完全に欠落。
- 🔴 **app の `AVAILABLE_COUPONS` と admin Campaign の `couponCode` が完全に分離**。admin で作った WELCOME500 / BIRTHDAY1000 は user の Coupons ページに**現れない**（user 側は WELCOME10 / PADEL500 だけ）。
- 🟢 **推奨**：admin に「クーポン管理」モジュール新設。最低限：code, label, description, type (%/fixed), value, validFrom/Until, usageLimit, currentUsage, isActive。Campaign の coupon 発行→Coupon マスタへ自動登録、を考慮する。

---

### 10. 通知設定 / 言語設定 / プロフィール編集

**App 側で見える/編集できる項目**

- `NotificationSettings.tsx`：4 種類 push (booking/event/campaign/message) + 3 種類 email (booking/event/campaign) の toggle。Hard-code、保存先なし。
- `LanguageSettings.tsx`：ja / en / zh の 3 言語。Hard-code、実際の i18n 未実装。
- `PasswordChange.tsx`：現パス + 新パス（hash 更新）。
- `ProfileEdit.tsx`：name, phone, avatar, email change dialog。

**Admin 側で見える/編集できる項目**

- 個別会員の name/email/phone/skillLevel/rating/affiliateId だけ。
- ❌ **会員側の「設定可能項目」テンプレ / マスタ管理なし**：通知種別追加、対応言語追加 etc. は code 改修必要。

**ギャップ**

- 🟡 **言語マスタ管理**：admin で「対応言語を ja のみにする / en を有効化」する切り替え UI なし。現状はどうせ全部 mock。本番でも i18n 文言テーブル必要。
- 🟡 **通知種別マスタ**：admin で push の種別を追加・削除する UI なし。`notificationStore.PushNotification.type` は 27 種類列挙、code 改修必須。
- 🟡 **avatar upload**：user 側 ProfileEdit で実装、admin から差し替えできない（前述 §4 と重複）。
- 🟢 **推奨**：admin「設定マスタ」セクション（言語、通知種別、利用規約バージョン管理）。ただし優先度低、本番リリース時点で実装すれば OK。

---

## 優先度付き対応一覧（Tina 用 summary）

### 🔴 まずやるべき（client demo で「あれ admin 効かない…」となる項目）

| # | エンティティ | 欠落 field | 対応案 |
|---|------------|----------|--------|
| 1 | **Campaign** | image (hero) | dialog に image URL field、store schema に `imageUrl` 追加。LST 版も同じく |
| 2 | **Court** | image | dialog に image URL field、`courtPlaceholder` 強制 import を排除 |
| 3 | **Coach** | avatar | dialog に avatar URL、`coachDefaultAvatar` 強制 import を排除 |
| 4 | **Court** | amenities | dialog に multi-select chip editor |
| 5 | **Court** | description | dialog に textarea（既存 address と同様に） |
| 6 | **Court** | address が dead UI | `void address;` を消し、`upsertCourtOverride` の schema 拡張 |
| 7 | **Coach** | bio / experience / certifications | dialog に長文 + chip editor |
| 8 | **Coach** | lessonMenus / venues | sub-table CRUD（admin 必須、user 予約 flow がこれに依存） |
| 9 | **Booking** | member 紐付け | NewBookingDialog の memberLabel を「会員 picker」に |
| 10 | **Coupon** | モジュール自体 | クーポン管理ページ新設 |
| 11 | **Tournament** | モジュール自体（admin 側になし） | 大会管理ページ新設、heroImageUrl / description / accessInfo / contactInfo 編集 |
| 12 | **Campaign** | body 長文 + ctaLabel/ctaLink | dialog 拡張 |

### 🟡 次にやるべき

- Member の avatar、point 手動付与/減算 UI
- Booking の rating / reviewVideos の閲覧
- Payment の card last4 表示、payment kind 区別
- Announcement → user app のデータ接続（mock 分離問題を本番化時に解消）
- Reschedule リクエストの admin 承認 flow

### 🟢 余裕があれば

- 設定マスタ（言語 / 通知種別 / 利用規約バージョン）
- League thread の admin moderation
- Coach review の admin moderation
- mock-only data の「(モック)」明示注記

---

## 参考：data-source 分離問題のサマリー

下記 3 entity は「admin で作っても user app に反映されない」状態：
- Campaign（admin: `adminCampaignsStore` / app: `CampaignDetail.tsx` hard-code）
- Announcement（admin: `adminAnnouncementsStore` / app: `Notifications.tsx` の `SYSTEM_NOTIFICATIONS` hard-code + `NotificationDetail.MOCK_DETAILS`）
- Coupon（admin: Campaign 内 couponCode / app: `couponStore.AVAILABLE_COUPONS` hard-code）

prototype 段階なら許容できるが、demo で「admin → 即 app 反映」を見せたいなら **schema 共通化 + image upload の最低限対応**だけは先にやる価値あり。

最低限の暫定対応：**user app 側を admin store からも読めるようにする hook を一段挟む**（例：`useUserCampaigns()` が hard-code seed + adminCampaignsStore を merge）。本番化時に backend へ差し替え可能なよう設計しておく。
