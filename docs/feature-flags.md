# 기능 플래그 매트릭스

기능은 모두 배포하되 노출은 플래그로 제어한다. 기본값은 안정화 우선 기준이다.

## 기본 ON
| flag_key | 설명 |
| --- | --- |
| feature.free.daily_quiz | 일일 퀴즈 |
| feature.free.daily_reading | 일일 독해 |
| feature.economy.harvest | 수확 제작 |
| feature.paid.harvest_ledger | ?? ?? (??) |
| feature.season.ranking | 시즌 랭킹 |
| feature.season.awards | 시즌 수상 |
| feature.community.learning_request | 학습 신청 게시판 |
| feature.community.community_board | 커뮤니티 게시판 |
| feature.community.qna | 학습 질문 게시판 |
| feature.community.materials | 학습 자료 게시판 |
| feature.admin.console | 관리자 모드 |

## 기본 OFF
| flag_key | 설명 |
| --- | --- |
| feature.duel.mode | 대결 모드 전체 |
| feature.duel.ratings | 레이팅 매칭 |
| feature.duel.cheat_detection | 부정행위 탐지 |
| feature.paid.pro_mode | 프로 모드 |
| feature.paid.farm_mode | 농장별 모드 |
| feature.paid.writing | 지식과 지혜 글쓰기 |
| feature.paid.test_bank | 테스트 창고 |
| feature.paid.assignment_basket | 과제 바구니 |
| feature.shop.mall | 쇼핑몰 |
| feature.payments.subscription | 유료 회원 전환 결제 |
| feature.payments.shop | 쇼핑몰 결제 |
| feature.uploads | 파일 업로드 |

## 긴급 중지 (Kill Switch)
| flag_key | 설명 |
| --- | --- |
| ops.kill_switch.duel | 대결 모드 즉시 차단 |
| ops.kill_switch.payments | 모든 결제 즉시 차단 |
| ops.kill_switch.uploads | 파일 업로드 즉시 차단 |

## 의존성 메모
- 결제 플래그는 쇼핑몰/유료 학습 노출보다 먼저 활성화한다.
- 대결 모드는 `feature.duel.mode`가 켜져야 하며, 필요 시 `ops.kill_switch.duel`로 우선 차단한다.
