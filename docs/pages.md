# ページ構成設計書

## 概要

Kissaアプリケーションのページ構成を、要件定義（`docs/requirements.tsv`）に基づいて設計する。
ユーザーロール（来訪者・編集者・管理者）ごとに最適化されたUXを提供する。

## ユーザーロール分析

### 来訪者（Visitors）
- 地域の発見・閲覧・検索
- 場所の閲覧・チェックイン
- お気に入り・ピン留め管理

### 編集者（Editors）
- 地域・場所のコンテンツ作成・編集
- 他編集者との権限管理
- サブスクリプション管理

### 管理者（Administrators）
- ユーザー・コンテンツ管理
- システム設定・統計分析

## 共通レイアウト

### 1. PublicLayout
- **対象**: 未認証ユーザー向けページ
- **特徴**: 
  - シンプルなヘッダー（ログイン・登録ボタン）
  - フッター（利用規約・プライバシーポリシー）
  - レスポンシブデザイン

### 2. UserLayout
- **対象**: 認証済みユーザー（来訪者・編集者）
- **特徴**:
  - ナビゲーションバー（役割別メニュー）
  - サイドバー（お気に入り・ピン留め地域）
  - 通知表示エリア
  - プロフィールドロップダウン

### 3. AdminLayout
- **対象**: 管理者
- **特徴**:
  - 管理者専用ナビゲーション
  - ダッシュボードサイドバー
  - システム状態表示
  - ユーザー切り替え機能

## ページ構成

### パブリックページ（認証不要）

#### 1. ホームページ
- **パス**: `/`
- **概要**: アプリケーションの紹介とメイン機能へのエントリーポイント
- **レイアウト**: PublicLayout
- **ユースケース**:
  - `getFeaturedRegions`: 注目地域一覧を取得する
  - `searchRegionsByKeyword`: キーワードで地域を検索する
  - `searchRegionsByLocation`: 位置情報で地域を検索する
- **コンポーネント**:
  - `HeroSection`: メインビジュアル・CTA
  - `RegionList`: 人気地域一覧
  - `SearchForm`: 地域検索フォーム
  - `LocationSearch`: 位置情報検索
  - `FeatureShowcase`: 機能紹介

#### 2. 地域一覧ページ
- **パス**: `/regions`
- **概要**: 公開されている全地域の一覧・検索・フィルタリング
- **レイアウト**: PublicLayout
- **ユースケース**:
  - `getPublicRegions`: 公開地域一覧を取得する（ページネーション付き）
  - `searchRegionsByKeyword`: キーワードで地域を検索する
  - `searchRegionsByLocation`: 位置情報で地域を検索する
  - `filterRegions`: 地域をフィルタリングする
- **コンポーネント**:
  - `RegionGrid`: 地域カード一覧
  - `SearchFilters`: 検索・フィルター
  - `LocationFilter`: 位置情報フィルター
  - `PaginationControls`: ページング
  - `SortControls`: ソート機能

#### 3. 地域詳細ページ
- **パス**: `/regions/[id]`
- **概要**: 特定地域の詳細情報と所属場所の表示
- **レイアウト**: PublicLayout
- **ユースケース**:
  - `getRegionById`: 地域詳細情報を取得する
  - `getPlacesByRegion`: 地域内の場所一覧を取得する
  - `getPlaceLocationsForMap`: 地図表示用の場所位置情報を取得する
  - `searchPlacesInRegion`: 地域内の場所を検索する
- **コンポーネント**:
  - `RegionHeader`: 地域基本情報
  - `PlaceMap`: 地図表示
  - `PlaceList`: 場所一覧
  - `PlaceSearch`: 場所検索
  - `AuthPrompt`: ログイン促進

#### 4. 場所詳細ページ
- **パス**: `/places/[id]`
- **概要**: 特定場所の詳細情報・チェックイン・レビュー表示
- **レイアウト**: PublicLayout
- **ユースケース**:
  - `getPlaceById`: 場所詳細情報を取得する
  - `getPlacePhotos`: 場所の写真一覧を取得する
  - `getCheckinsForPlace`: 場所のチェックイン一覧を取得する
  - `getPlaceBusinessHours`: 営業時間情報を取得する
- **コンポーネント**:
  - `PlaceHeader`: 場所基本情報
  - `PlaceDetails`: 詳細情報（営業時間・連絡先等）
  - `PhotoGallery`: 写真ギャラリー
  - `CheckinList`: チェックイン一覧
  - `AuthPrompt`: チェックイン促進

### 認証関連ページ

#### 5. ログインページ
- **パス**: `/auth/login`
- **概要**: ユーザーログイン
- **レイアウト**: PublicLayout
- **ユースケース**:
  - `authenticateUser`: ユーザーを認証する
  - `createUserSession`: ユーザーセッションを作成する
  - `validateLoginCredentials`: ログイン認証情報を検証する
- **コンポーネント**:
  - `LoginForm`: ログインフォーム
  - `SocialLogin`: ソーシャルログインボタン
  - `ForgotPasswordLink`: パスワードリセットリンク

#### 6. 登録ページ
- **パス**: `/auth/register`
- **概要**: 新規ユーザー登録
- **レイアウト**: PublicLayout
- **ユースケース**:
  - `registerUser`: ユーザーを登録する
  - `sendVerificationEmail`: 認証メールを送信する
  - `validateUserRegistrationData`: 登録データを検証する
  - `checkEmailAvailability`: メールアドレスの利用可能性を確認する
- **コンポーネント**:
  - `RegisterForm`: 登録フォーム
  - `EmailVerification`: メール認証案内
  - `TermsAgreement`: 利用規約同意

#### 7. パスワードリセットページ
- **パス**: `/auth/reset-password`
- **概要**: パスワードリセット機能
- **レイアウト**: PublicLayout
- **ユースケース**:
  - `requestPasswordReset`: パスワードリセットを要求する
  - `sendPasswordResetEmail`: パスワードリセットメールを送信する
  - `validateResetToken`: リセットトークンを検証する
  - `resetUserPassword`: ユーザーパスワードをリセットする
- **コンポーネント**:
  - `PasswordResetForm`: リセットフォーム
  - `ResetEmailSent`: 送信完了メッセージ

### 来訪者向けページ（認証必要）

#### 8. ダッシュボード
- **パス**: `/dashboard`
- **概要**: 来訪者向けメインダッシュボード
- **レイアウト**: UserLayout
- **ユースケース**:
  - `getUserPinnedRegions`: ユーザーのピン留め地域を取得する
  - `getUserRecentCheckins`: ユーザーの最近のチェックインを取得する
  - `getUserFavoritesSummary`: ユーザーのお気に入りサマリーを取得する
  - `getRecommendedRegions`: おすすめ地域を取得する
- **コンポーネント**:
  - `PinnedRegions`: ピン留め地域
  - `RecentCheckins`: 最近のチェックイン
  - `FavoritesSummary`: お気に入りサマリー
  - `RecommendedRegions`: おすすめ地域

#### 9. お気に入り管理ページ
- **パス**: `/favorites`
- **概要**: お気に入り地域・場所の一覧管理
- **レイアウト**: UserLayout
- **ユースケース**:
  - `getUserFavoriteRegions`: ユーザーのお気に入り地域一覧を取得する
  - `getUserFavoritePlaces`: ユーザーのお気に入り場所一覧を取得する
  - `removeFavoriteRegion`: お気に入り地域を削除する
  - `removeFavoritePlace`: お気に入り場所を削除する
- **コンポーネント**:
  - `FavoriteTabs`: タブ切り替え（地域・場所）
  - `FavoriteRegionList`: お気に入り地域一覧
  - `FavoritePlaceList`: お気に入り場所一覧
  - `RemoveFavoriteButton`: 削除ボタン

#### 10. ピン留め管理ページ
- **パス**: `/pinned`
- **概要**: ピン留め地域の管理・並び替え
- **レイアウト**: UserLayout
- **ユースケース**:
  - `getUserPinnedRegions`: ユーザーのピン留め地域一覧を取得する
  - `reorderPinnedRegions`: ピン留め地域の順序を変更する
  - `unpinRegion`: 地域のピン留めを解除する
  - `updatePinDisplayOrder`: ピン表示順序を更新する
- **コンポーネント**:
  - `PinnedRegionList`: ドラッグ&ドロップ対応一覧
  - `ReorderControls`: 並び替えコントロール
  - `UnpinButton`: ピン留め解除ボタン

#### 11. チェックイン履歴ページ
- **パス**: `/checkins`
- **概要**: 自分のチェックイン履歴の表示・管理
- **レイアウト**: UserLayout
- **ユースケース**:
  - `getUserCheckins`: ユーザーのチェックイン履歴を取得する
  - `updateCheckin`: チェックイン内容を更新する
  - `deleteCheckin`: チェックインを削除する
  - `getCheckinPhotos`: チェックインの写真を取得する
- **コンポーネント**:
  - `CheckinHistory`: チェックイン履歴一覧
  - `CheckinCard`: 個別チェックイン表示
  - `EditCheckinModal`: チェックイン編集ダイアログ

#### 12. アカウント設定ページ
- **パス**: `/settings`
- **概要**: プロフィール・通知・プライバシー設定
- **レイアウト**: UserLayout
- **ユースケース**:
  - `getUserProfile`: ユーザープロフィールを取得する
  - `updateUserProfile`: ユーザープロフィールを更新する
  - `updateNotificationSettings`: 通知設定を更新する
  - `updatePrivacySettings`: プライバシー設定を更新する
  - `changeUserPassword`: ユーザーパスワードを変更する
- **コンポーネント**:
  - `ProfileForm`: プロフィール編集
  - `NotificationSettings`: 通知設定
  - `PrivacySettings`: プライバシー設定
  - `PasswordChangeForm`: パスワード変更

### 編集者向けページ（認証必要）

#### 13. 編集者ダッシュボード
- **パス**: `/editor`
- **概要**: 編集者向けメインダッシュボード
- **レイアウト**: UserLayout
- **ユースケース**:
  - `getEditorStats`: 編集者の統計情報を取得する
  - `getEditorRecentActivities`: 編集者の最近の活動を取得する
  - `getUserSubscriptionStatus`: ユーザーのサブスクリプション状況を取得する
  - `getEditorOwnedRegions`: 編集者が所有する地域一覧を取得する
- **コンポーネント**:
  - `EditorStats`: 編集統計
  - `RecentEdits`: 最近の編集
  - `SubscriptionStatus`: サブスクリプション状況
  - `QuickActions`: クイックアクション

#### 14. 地域管理ページ
- **パス**: `/editor/regions`
- **概要**: 自分が作成した地域の一覧・管理
- **レイアウト**: UserLayout
- **ユースケース**:
  - `getEditorRegions`: 編集者が作成した地域一覧を取得する
  - `deleteRegion`: 地域を削除する
  - `updateRegionStatus`: 地域の公開状態を更新する
  - `getRegionStatistics`: 地域の統計情報を取得する
- **コンポーネント**:
  - `RegionManagementList`: 地域管理一覧
  - `CreateRegionButton`: 新規作成ボタン
  - `RegionActions`: 編集・削除アクション
  - `RegionStatusBadge`: 公開状態表示

#### 15. 地域作成・編集ページ
- **パス**: `/editor/regions/new`, `/editor/regions/[id]/edit`
- **概要**: 地域の新規作成・編集
- **レイアウト**: UserLayout
- **ユースケース**:
  - `createRegion`: 地域を作成する
  - `updateRegion`: 地域情報を更新する
  - `validateRegionData`: 地域データを検証する
  - `uploadRegionImages`: 地域画像をアップロードする
  - `getRegionById`: 編集対象の地域情報を取得する
- **コンポーネント**:
  - `RegionForm`: 地域情報フォーム
  - `LocationPicker`: 位置情報選択
  - `ImageUploader`: 画像アップロード
  - `PreviewPanel`: プレビュー表示

#### 16. 場所管理ページ
- **パス**: `/editor/places`
- **概要**: 自分が作成・編集権限を持つ場所の一覧・管理
- **レイアウト**: UserLayout
- **ユースケース**:
  - `getEditorPlaces`: 編集者が管理する場所一覧を取得する
  - `deletePlace`: 場所を削除する
  - `getPlacePermissions`: 場所の編集権限を取得する
  - `updatePlaceStatus`: 場所の公開状態を更新する
- **コンポーネント**:
  - `PlaceManagementList`: 場所管理一覧
  - `CreatePlaceButton`: 新規作成ボタン
  - `PlaceActions`: 編集・削除アクション
  - `PermissionBadge`: 権限表示

#### 17. 場所作成・編集ページ
- **パス**: `/editor/places/new`, `/editor/places/[id]/edit`
- **概要**: 場所の新規作成・編集
- **レイアウト**: UserLayout
- **ユースケース**:
  - `createPlace`: 場所を作成する
  - `updatePlace`: 場所情報を更新する
  - `validatePlaceData`: 場所データを検証する
  - `getEditorRegions`: 編集者の地域一覧を取得する
  - `uploadPlaceImages`: 場所画像をアップロードする
- **コンポーネント**:
  - `PlaceForm`: 場所情報フォーム
  - `RegionSelector`: 所属地域選択
  - `LocationPicker`: 位置情報選択
  - `BusinessHoursForm`: 営業時間設定

#### 18. 権限管理ページ
- **パス**: `/editor/permissions`
- **概要**: 編集者招待・権限管理
- **レイアウト**: UserLayout
- **ユースケース**:
  - `inviteEditor`: 編集者を招待する
  - `sendEditorInvitation`: 編集者招待メールを送信する
  - `getPlacePermissions`: 場所の権限一覧を取得する
  - `updateEditorPermissions`: 編集者権限を更新する
  - `removeEditorPermission`: 編集者権限を削除する
  - `getSharedPlaces`: 共有中の場所一覧を取得する
- **コンポーネント**:
  - `InviteEditorForm`: 編集者招待フォーム
  - `PermissionList`: 権限一覧
  - `PermissionActions`: 権限変更アクション
  - `SharedPlaceList`: 共有場所一覧

#### 19. サブスクリプション管理ページ
- **パス**: `/editor/subscription`
- **概要**: 料金プラン・支払い情報管理
- **レイアウト**: UserLayout
- **ユースケース**:
  - `getUserSubscription`: ユーザーのサブスクリプション情報を取得する
  - `updateSubscriptionPlan`: サブスクリプションプランを変更する
  - `updatePaymentMethod`: 支払い方法を更新する
  - `getBillingHistory`: 請求履歴を取得する
  - `getUserUsageMetrics`: 使用量統計を取得する
  - `cancelSubscription`: サブスクリプションをキャンセルする
- **コンポーネント**:
  - `PlanComparison`: プラン比較表
  - `PaymentMethod`: 支払い方法管理
  - `BillingHistory`: 請求履歴
  - `UsageMetrics`: 使用量表示

### 管理者向けページ（認証必要）

#### 20. 管理者ダッシュボード
- **パス**: `/admin`
- **概要**: システム統計・概要表示
- **レイアウト**: AdminLayout
- **ユースケース**:
  - `getSystemStatistics`: システム統計情報を取得する
  - `getUserGrowthData`: ユーザー増加データを取得する
  - `getContentStatistics`: コンテンツ統計を取得する
  - `getRecentSystemActivity`: 最近のシステム活動を取得する
  - `getActiveUserCount`: アクティブユーザー数を取得する
- **コンポーネント**:
  - `SystemStats`: システム統計
  - `UserGrowthChart`: ユーザー増加グラフ
  - `ContentStats`: コンテンツ統計
  - `RecentActivity`: 最近の活動

#### 21. ユーザー管理ページ
- **パス**: `/admin/users`
- **概要**: 全ユーザーの管理・検索・フィルタリング
- **レイアウト**: AdminLayout
- **ユースケース**:
  - `getAllUsers`: 全ユーザー一覧を取得する
  - `searchUsers`: ユーザーを検索する
  - `banUser`: ユーザーを停止する
  - `deleteUser`: ユーザーを削除する
  - `getUserDetails`: ユーザー詳細情報を取得する
  - `filterUsers`: ユーザーをフィルタリングする
- **コンポーネント**:
  - `UserSearchForm`: ユーザー検索
  - `UserList`: ユーザー一覧
  - `UserActions`: ユーザーアクション
  - `BanUserModal`: ユーザー停止ダイアログ

#### 22. コンテンツ管理ページ
- **パス**: `/admin/content`
- **概要**: 不適切コンテンツの管理・通報対応
- **レイアウト**: AdminLayout
- **ユースケース**:
  - `getReportedContent`: 通報されたコンテンツ一覧を取得する
  - `moderateContent`: コンテンツを審査する
  - `deleteContent`: コンテンツを削除する
  - `bulkDeleteContent`: コンテンツを一括削除する
  - `updateContentStatus`: コンテンツの状態を更新する
  - `getContentReports`: コンテンツの通報詳細を取得する
- **コンポーネント**:
  - `ReportQueue`: 通報キュー
  - `ContentModerationList`: コンテンツ審査一覧
  - `BulkActions`: 一括操作
  - `ModerationModal`: 審査ダイアログ

#### 23. システム設定ページ
- **パス**: `/admin/settings`
- **概要**: システム全体の設定管理
- **レイアウト**: AdminLayout
- **ユースケース**:
  - `getSystemSettings`: システム設定を取得する
  - `updateSystemSettings`: システム設定を更新する
  - `updateTermsAndPolicies`: 利用規約・ポリシーを更新する
  - `setMaintenanceMode`: メンテナンスモードを設定する
  - `updateFeatureFlags`: 機能フラグを更新する
  - `backupSystemData`: システムデータをバックアップする
- **コンポーネント**:
  - `SystemSettingsForm`: システム設定フォーム
  - `TermsPolicyEditor`: 利用規約・ポリシー編集
  - `MaintenanceMode`: メンテナンスモード設定
  - `FeatureFlags`: 機能フラグ管理

#### 24. レポート・分析ページ
- **パス**: `/admin/reports`
- **概要**: 詳細レポート生成・ダウンロード
- **レイアウト**: AdminLayout
- **ユースケース**:
  - `generateUsageReport`: 利用状況レポートを生成する
  - `exportReportData`: レポートデータをエクスポートする
  - `getAnalyticsData`: 分析データを取得する
  - `getReportHistory`: レポート履歴を取得する
  - `scheduleReport`: 定期レポートをスケジュールする
  - `downloadReport`: レポートをダウンロードする
- **コンポーネント**:
  - `ReportGenerator`: レポート生成フォーム
  - `ReportHistory`: レポート履歴
  - `AnalyticsCharts`: 分析グラフ
  - `ExportOptions`: エクスポートオプション

## 特殊機能ページ

#### 25. チェックインページ（モーダル/専用ページ）
- **パス**: `/places/[id]/checkin`
- **概要**: 特定場所へのチェックイン機能
- **レイアウト**: UserLayout or Modal
- **ユースケース**:
  - `checkinToPlace`: 場所にチェックインする
  - `uploadCheckinPhotos`: チェックイン写真をアップロードする
  - `validateUserLocation`: ユーザーの位置情報を検証する
  - `createCheckinComment`: チェックインコメントを作成する
  - `getPlaceForCheckin`: チェックイン対象の場所情報を取得する
- **コンポーネント**:
  - `CheckinForm`: チェックインフォーム
  - `PhotoUploader`: 写真アップロード
  - `LocationVerification`: 位置情報確認
  - `CommentInput`: コメント入力

#### 26. 通報ページ（モーダル）
- **パス**: モーダルとして実装
- **概要**: 不適切コンテンツの通報
- **ユースケース**:
  - `reportContent`: コンテンツを通報する
  - `validateReportData`: 通報データを検証する
  - `sendReportNotification`: 通報通知を送信する
  - `getReportReasons`: 通報理由一覧を取得する
- **コンポーネント**:
  - `ReportForm`: 通報フォーム
  - `ReportReasonSelector`: 通報理由選択
  - `ReportSubmission`: 送信処理

## UX設計判断

### 新規作成: 専用ページ vs ダイアログ

- **専用ページを採用**: `/regions/new`, `/places/new`
  - **理由**: 
    - 複雑なフォーム（位置情報、画像アップロード等）
    - プレビュー機能が必要
    - 段階的な入力プロセス
    - SEO・直接リンク対応

- **ダイアログを採用**: チェックイン、通報、お気に入り追加
  - **理由**:
    - シンプルな操作
    - コンテキストを維持
    - 素早いアクション

### ナビゲーション構造

- **メインナビゲーション**:
  - 来訪者: ホーム / 地域 / お気に入り / ダッシュボード
  - 編集者: 上記 + 編集者メニュー（地域・場所管理）
  - 管理者: 管理者専用メニュー

- **サイドバーナビゲーション**:
  - ピン留め地域（来訪者・編集者）
  - 管理機能（管理者）

### レスポンシブ対応

- **モバイルファースト**:
  - 地図・チェックイン機能の最適化
  - タッチフレンドリーなUI
  - オフライン対応検討

- **デスクトップ拡張**:
  - 複数カラムレイアウト
  - 詳細情報表示
  - 効率的な管理機能

## 実装優先度

### Phase 1（高優先度）
- 認証システム（REQ-034, 035, 036）
- 地域・場所の基本CRUD（REQ-001, 002, 005, 006）
- 公開ページ（REQ-014, 019, 021）

### Phase 2（中優先度）
- チェックイン機能（REQ-022, 023, 024）
- お気に入り・ピン留め（REQ-017, 018, 025）
- 検索機能（REQ-015, 016, 041）

### Phase 3（低優先度）
- 権限管理（REQ-009, 010, 011）
- 管理者機能（REQ-027-033）
- サブスクリプション（REQ-012）


この設計により、ユーザーロールごとに最適化されたUXを提供しながら、段階的な実装が可能となる。
