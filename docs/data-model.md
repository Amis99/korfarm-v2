# 데이터 모델 초안

기획서와 `docs/decisions.md` 기준의 초기 데이터 모델이다. 구현 전 상세 컬럼과 인덱스는 확정한다.

## 공통 규칙
- 기본 키는 문자열 ID를 사용한다 (예: `u_1001`, `season_2026_spring_01`).
- 모든 테이블은 `created_at`, `updated_at`을 가진다.
- 필요 시 `deleted_at`을 사용한다.
- JSON 컬럼은 업로드 스키마를 준수한다.

## 1) 사용자/기관
- `users`
  - id, email, password_hash, name, status, last_login_at
- `orgs`
  - id, name, status, plan, seat_limit
- `org_memberships`
  - id, org_id, user_id, role(HQ_ADMIN/ORG_ADMIN/STUDENT/PARENT), status
- `parent_student_links`
  - id, parent_user_id, student_user_id, status, request_code, requested_at, approved_at, approved_by
- `classes`
  - id, org_id, name, level_id, grade, status, start_at
- `class_memberships`
  - id, class_id, user_id, status
- `refresh_tokens`
  - id, user_id, token_hash, expires_at, revoked_at

## 2) 콘텐츠/학습
- `contents`
  - id, content_type(daily_quiz/daily_reading/pro_mode/farm_mode/test/writing), level_id, chapter_id, title, status
- `content_versions`
  - id, content_id, schema_version, content_json, uploaded_by, approved_by, approved_at
- `learning_attempts`
  - id, user_id, content_id, activity_type, status, score, started_at, submitted_at
- `learning_answers`
  - id, attempt_id, question_id, answer_json, is_correct, answered_at
- `writing_submissions`
  - id, user_id, prompt_id, content, status, submitted_at
- `writing_feedback`
  - id, submission_id, reviewer_id, rubric_json, comment
- `test_papers`
  - id, org_id, title, pdf_file_id, status
- `test_answer_keys`
  - id, test_id, answers_json, created_by
- `test_results`
  - id, test_id, user_id, score, stats_json, graded_at

## 3) 경제
- `seed_catalog`
  - seed_type, name, crop_type, rarity, season_point
- `area_seed_mapping`
  - id, activity_type, genre, subarea, seed_type
- `harvest_recipes`
  - id, seed_required, fertilizer_spent, multiplier, max_crafts_per_day
- `user_seeds`
  - id, user_id, seed_type, count
- `user_crops`
  - id, user_id, crop_type, count
- `user_fertilizer`
  - id, user_id, count
- `economy_ledger`
  - id, user_id, currency_type(seed/crop/fertilizer), item_type, delta, reason, ref_type, ref_id

## 4) 시즌/랭킹
- `seasons`
  - id, name, level_id, start_at, end_at, status
- `season_harvest_rankings`
  - id, season_id, level_id, ranking_json, generated_at
- `season_duel_rankings`
  - id, season_id, level_id, ranking_json, generated_at
- `season_award_snapshots`
  - id, season_id, snapshot_json, captured_at

## 5) 대결 모드
- `duel_rooms`
  - id, mode_id, level_id, room_size, stake_amount, status, created_by
- `duel_room_players`
  - id, room_id, user_id, stake_crop_type, status, joined_at
- `duel_matches`
  - id, season_id, level_id, status, started_at, ended_at
- `duel_match_players`
  - id, match_id, user_id, result(win/lose), rank, stake_crop_type, stake_amount
- `duel_questions`
  - id, match_id, question_id, order_index
- `duel_answers`
  - id, match_id, question_id, user_id, answer_json, is_correct, submitted_at
- `duel_stats`
  - id, season_id, level_id, user_id, wins, losses, win_rate, current_streak, best_streak, forfeit_losses
- `duel_escrow`
  - id, match_id, user_id, crop_type, amount, status

## 6) 과제
- `assignments`
  - id, org_id, assignment_type, title, payload_json, due_at, status, created_by
- `assignment_targets`
  - id, assignment_id, target_type(class/user/org), target_id
- `assignment_submissions`
  - id, assignment_id, user_id, status, submitted_at, content_json
- `assignment_feedback`
  - id, submission_id, reviewer_id, score, comment

## 7) 게시판/커뮤니티
- `boards`
  - id, board_type(learning_request/community/qna/materials), org_scope, status
- `posts`
  - id, board_id, user_id, title, content, status, created_at
- `post_attachments`
  - id, post_id, file_id, name, mime, size
- `post_reviews`
  - id, post_id, approved, reviewed_by, reviewed_at, comment
- `comments`
  - id, post_id, user_id, content, status
- `reports`
  - id, target_type(post/comment), target_id, reason, status, processed_by

## 8) 결제/쇼핑몰
- `products`
  - id, name, price, stock, status
- `orders`
  - id, user_id, total_amount, status, created_at
- `order_items`
  - id, order_id, product_id, quantity, unit_price
- `shipments`
  - id, order_id, status, address_json, tracking_number
- `payments`
  - id, user_id, payment_type(subscription/shop), amount, status, provider, provider_ref
- `subscriptions`
  - id, user_id, status, start_at, end_at, next_billing_at, canceled_at

## 9) 파일/운영
- `files`
  - id, owner_id, purpose, url, mime, size, status
- `feature_flags`
  - flag_key, enabled, rollout_percent, description
- `system_settings`
  - setting_key, setting_value
