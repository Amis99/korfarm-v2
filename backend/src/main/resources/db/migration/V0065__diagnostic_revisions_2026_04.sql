-- V0065: 진단 테스트 수정 (2026-04-27)
--   1) 지문 8건 UPDATE (출처/내용 교체, 기호 추가, 밑줄)
--   2) 문항 39건 중 명시 항목 UPDATE (stem/choices/correct_choice)
--   3) test_questions 재시드 (V0048 와 동일 패턴)
--
-- 본 마이그레이션은 V0066 (벡터 자동 생성) 과 함께 적용되어야 합니다.

-- ─────────────────────────────────────────────────────────────
-- 1) 지문 UPDATE
-- ─────────────────────────────────────────────────────────────
UPDATE diag_passages SET text_md = '(가)
엄마야 누나야 강변 살자
뜰에는 반짝이는 금모래 빛
뒷문 밖에는 갈잎의 노래
엄마야 누나야 강변 살자

- 김소월, <엄마야 누나야>

(나)
푸른 하늘 은하수 하얀 쪽배에
계수나무 한 나무 토끼 한 마리
돛대도 아니 달고 삿대도 없이
가기도 잘도 간다 서쪽 나라로

은하수를 건너서 구름 나라로
구름 나라 지나선 어디로 가나
멀리서 반짝반짝 비치이는 건
샛별이 등대란다 길을 찾아라

- 윤극영, <반달>' WHERE id = 'S1_LIT_P3';
UPDATE diag_passages SET text_md = '바람이 거세게 불던 날이었다. 수남이가 배달을 갔다가 세워 둔 자전거가 바람에 넘어지는 바람에 그만 고급 승용차에 흠집을 내고 말았다. 차 주인은 수리비로 오천 원을 요구하며 자전거에 덜컥 자물쇠를 채워버렸다. 수남이가 겁에 질려 어쩔 줄 몰라 하고 있을 때, 구경하던 사람들이 소리쳤다.

"도망가라! 그깟 것 들고 토껴라!"

그 말에 용기가 솟은 수남이는 자전거를 옆구리에 끼고 질풍같이 달렸다. 심장이 터질 것만 같았다. 가슴속은 쿵쾅거리는 소리로 가득 찼다. 두려움과 죄책감이 뒤섞였지만, 한편으로는 알 수 없는 묘한 쾌감이 솟구쳤다.

가게로 돌아와 떨리는 목소리로 사실을 말하자 주인 영감님은 의외로 무릎을 치며 통쾌해했다.

"잘했다, 잘했어! 네놈 오늘 운 텄다."

영감님은 낄낄대며 자물쇠를 부수었다. 수남이의 눈에 영감님의 모습이 흡사 도둑놈 두목 같아 보여 소름이 끼쳤다. 서울로 올 때 도둑질만은 하지 말라던 시골에 계신 아버지가 사무치게 그리웠다. 양심이 없는 이 도시에서 자신도 형처럼 망가질까 두려웠다. 결국 수남이는 주섬주섬 짐을 꾸렸다. 아버지가 계신 고향으로 돌아가기로 결심한 수남이의 얼굴엔 비로소 소년다운 맑은 빛이 감돌았다.

- 박완서, <자전거 도둑> 부분' WHERE id = 'F1_LIT_P1';
UPDATE diag_passages SET text_md = '큰외삼촌이 나를 보더니 "옥희야, 이리 온. 와서 아저씨께 인사드려라. 너희 아버지의 옛날 친구신데, 오늘부터 이 사랑에 계실 텐데 인사 여쭙고 친해 두어야지." 하고 말씀하셨습니다. 낯선 아저씨는 "옥희야, 이리 온, 응! 그 눈은 꼭 아버지를 닮았네그려." 하고 말했습니다. 나는 태어나기도 전에 아버지가 하늘나라로 가셔서 아버지 얼굴을 모르지만, 아저씨의 그 말이 왠지 좋았습니다.

아저씨가 사랑에 와 계신 지 한 달이나 되었을 때, 나는 거의 매일 아저씨 방에 놀러 갔습니다. 어머니는 나더러 아저씨를 귀찮게 굴면 못쓴다고 가끔 꾸지람을 하시지만, 도리어 아저씨가 나를 귀찮게 굴었지요. 아저씨는 내가 사랑방으로 놀러 가면 나를 무릎에 앉히고 그림책을 보여 주기도 했습니다.

"옥희 눈이 아버지를 닮았다. 고 고운 코는 아마 어머니를 닮았지, 고 입하고! 응, 그러냐, 안 그러냐? 어머니도 옥희처럼 곱지, 응?"

아저씨는 나를 붙들고 앉아서, 머리도 쓰다듬어 주고 뺨에 입도 맞추고 하면서 "요 저고리 누가 해주지?", "밤에 엄마하고 한 자리에서 자니?" 하는 등 쓸데없는 말을 자꾸만 물었지요.

- 주요섭, <사랑손님과 어머니> 부분' WHERE id = 'F1_LIT_P5';
UPDATE diag_passages SET text_md = '(가)
아무 소리도 없이 말도 없이
등 뒤로 털썩
밧줄이 날아와 나는
뛰어가 밧줄을 잡아다 배를 맨다
아주 천천히 그리고 조용히
배는 멀리서부터 닿는다

사랑은,
호젓한 부둣가에 우연히,
별 그럴 일도 없으면서 넋 놓고 앉았다가
배가 들어와
던져지는 밧줄을 받는 것
그래서 어찌할 수 없이
배를 매게 되는 것

잔잔한 바닷물 위에
구름과 빛과 시간과 함께
떠 있는 배

배를 매면 구름과 빛과 시간이 함께
매어진다는 것도 처음 알았다
사랑이란 그런 것을 처음 아는 것

빛 가운데 배는 울렁이며
온종일을 떠 있다

- 장석남, <배를 매며>

(나)
[작품 줄거리] 화개 장터의 주막에서 사는 ''옥화''는 아들 ''성기''의 역마살을 잠재우기 위해 그를 쌍계사로 보낸다. 어느 날 ''체 장수 영감''이 딸 ''계연''을 맡기고 떠나자, 옥화는 성기와 계연을 맺어주려 한다. 둘은 호감을 느끼지만, 옥화는 계연의 귓바퀴 사마귀를 보고 자신의 이복동생임을 알게 된다. 계연이 성기의 이모라는 천륜이 밝혀지자 둘의 사랑은 좌절되고 계연은 떠난다. 성기는 중병을 앓다가 겨우 회복하고, 역마살의 운명에 순응하며 엿판을 메고 길을 떠난다.

옥화는 앓아누운 성기를 살리기 위해 굿도 하고 용하다는 의원도 불러 보았지만 차도가 없었다. 그해 봄, 사람들이 성기의 회춘을 거의 <u>단념</u>했을 때 옥화는 아들에게 모든 사실을 털어놓았다. 체 장수 영감이 서른여섯 해 전 화개장터에 들렀던 자신의 아버지이며, 왼쪽 귓바퀴의 검정 사마귀로 보아 계연이 자신의 동생임이 분명하다고 말이다.

"차라리 몰랐으면 또 모르지만 한번 알고 나서야 인륜이 있는데 어찌겠냐."

옥화는 부디 어미를 야속타 생각지 말라며 눈물을 흘렸다. 옥화의 마지막 하직 같은 통정 이야기에 성기는 의외로 도로 힘을 얻은 듯했다. 형형한 눈으로 천장을 바라보던 성기는 입술을 지그시 깨물며 새로운 결심을 하는 듯했다.

아버지를 찾아가거나 장가들어 살림을 할 생각도 없다는 아들에게 옥화는 더 이상 미련을 두지 않았다.

"그럼 어쩔랴냐? 네가 하고 싶은 대로 다 해줄 테니 너 졸 대로 해라."

성기는 말없이 자리에 누웠다. 그로부터 한 달포가 지난 어느 장날 아침, 성기는 막걸리 한 사발을 들이키고는 불쑥 말했다.

"어머니 나 엿판 하나만 마춰 주."

옥화는 멍하니 성기의 얼굴을 바라보았다. 아들이 역마살이라는 운명을 받아들이기로 했음을 깨달은 것이다.

보름 뒤, 유달리 맑게 갠 화개장터 삼거리에서 성기는 떠날 채비를 마쳤다. 옥양목 고의적삼에 명주 수건을 동여매고, 새하얀 엿판을 걸머졌다. 그의 발 앞에는 세 갈래 길이 나 있었다. 화갯골은 등졌고, 서남쪽은 구례, 동남쪽은 하동이었다. 구례 쪽은 작년 이맘때 계연이 울음 섞인 하직을 남기고 넘어간 길이었다.

성기는 한참 뒤 몸을 돌렸다. 그리하여 그의 발은 구례 쪽을 등지고 하동 쪽을 향해 천천히 옮겨졌다. 한 걸음 발을 옮길수록 그의 마음은 한결 가벼워졌다. 어머니의 주막이 시야에서 사라질 무렵, 그는 육자배기 가락으로 제법 콧노래까지 흥얼거리며 가고 있었다.

- 김동리, <역마>' WHERE id = 'W1_LIT_P1';
UPDATE diag_passages SET text_md = '시장 경제에서 자원은 가격 기구를 통해 효율적으로 <u>㉠배분</u>된다. 이때 시장 참여자들이 얻는 이득은 ''잉여''라는 개념으로 설명할 수 있다.

''소비자 잉여''란 소비자가 어떤 재화를 구매하기 위해 지불할 <u>㉡용의</u>가 있는 최대 금액에서 실제로 지불한 가격을 뺀 차액을 말한다. 예를 들어, 어떤 소비자가 사과 한 개에 2,000원까지 낼 의향이 있었는데 실제 가격이 1,000원이라면, 그는 1,000원만큼의 소비자 잉여를 얻게 된다. 이는 그래프상에서 수요 곡선 아래이면서 시장 가격선 위의 면적으로 표시된다.

반대로 ''생산자 잉여''는 생산자가 재화를 판매하여 얻은 실제 수입에서 그 재화를 공급하기 위해 받아야만 했던 최소한의 금액을 뺀 차액이다. 이는 그래프상에서 시장 가격선 아래이면서 공급 곡선 위의 면적에 해당한다. 소비자 잉여와 생산자 잉여의 합을 ''사회적 총잉여''라 하며, 완전 경쟁 시장의 균형 상태에서 이 사회적 총잉여는 극대화된다.

그러나 정부는 형평성이나 사회적 안정을 위해 시장 가격에 개입하기도 하는데, 대표적인 것이 ''가격 <u>㉢규제</u>''이다. 그중 ''최고 가격제''는 물가 안정이나 소비자 보호를 위해 가격이 일정 수준 이상 오르지 못하도록 <u>㉣상한선</u>을 두는 제도이다. 아파트 분양가 상한제나 이자율 제한 등이 이에 해당한다. 최고 가격이 시장 균형 가격보다 낮게 설정되면, 수요량은 늘어나고 공급량은 줄어들어 ''초과 수요''가 발생한다. 이 경우 소비자 잉여는 증가할 수도 있지만, 생산자 잉여는 감소하고 거래량이 줄어들어 결과적으로 사회적 총잉여의 감소, 즉 ''자중 손실''이 발생한다. 또한 상품을 구하지 못한 소비자들이 웃돈을 주고 거래하는 암시장이 형성되거나 상품의 품질이 저하되는 부작용이 나타나기도 한다.

이와 반대인 ''최저 가격제''는 공급자를 보호하기 위해 가격의 하한선을 설정하는 제도로, 최저 임금제가 대표적이다. 이 역시 시장 균형 가격보다 높게 설정될 때 효과가 있으며, 초과 공급을 유발하고 자중 손실을 <u>㉤초래</u>할 수 있다. 경제학에서는 이를 통해 정부의 개입이 의도와 달리 비효율성을 낳을 수 있음을 지적한다.' WHERE id = 'W1_NON_P1';
UPDATE diag_passages SET text_md = '(가)
나뭇잎은 햇빛에 싱싱하게 ⓐ<u>윤이 나고</u>
그와 비슷한 촌수로 물결은 더욱 빛나는 무늬를 끊임없이 빚고
또한 바람은 연방 그리운 것 위에 볼 줄밖에 모르는 이것들.
천날 만날 한결같은 오, 이것들을 보아라,
물방울처럼 스러졌다가 이어져 마음은 움직이는 것을 통하여
사랑의 연습만을 부지런히 하고
그것을 영원토록 지치지 않고 하겠다는 그것 말고 나는 볼 수가 없구나.
참으로 환장할 일은 이것이로다.

- 박재삼, <그리움>

(나)
"아비는 어쩔 셈으로 송화 누이의 눈을 멀게 했는가."

사내의 말은 이제 그것을 묻고 있었다.

"아직도 나를 원망하고 있느냐?"

노인은 그러나 사내의 말은 들이지 않고 자신의 말만을 ⓑ<u>뇌까리고</u> 있었다.

"원망이라니요? 다 지난 일을. 제가 묻고 싶은 것은……."

"그렇다, 용서해라. 너는 내 자식이 아니었으니 나를 버리고 나간 것은 나무랄 일이 아니었다. 하나 송화는 그럴 수가 없었다. 제 어미가 없으니 내가 곁을 지켜 줘야 했다. 하지만 나도 이제는 너무 늙고 지쳤어. 내가 죽고 나면 송화는 누구를 ⓒ<u>의지해</u> 살아가겠느냐. 눈을 잃어버리면…… 그러면 송화는 좋든 싫든 내 곁에 남을 수밖에 없지 않겠느냐. 몸이 성한 너까지 나를 버리고 떠나갔는데, 눈먼 누이가 내 곁을 떠나 어디로 가겠느냐. 내 욕심이었다. 너희와 끝까지 함께 있고 싶었던 내 욕심이……."

노인의 목소리는 흐느낌에 섞여 끊어질 듯 이어지고 있었다.

"하지만 그 때문만은 아니었다. 너도 알다시피 송화의 소리에는 결정적인 한(恨)이 부족했다. 소리는 맑고 고왔지만 마음 깊은 곳에서 우러나오는 그 무엇이 없었어. 그것을 채워 주고 싶었다. 사람의 한이라는 것은 일생을 살아가면서 이 가슴 저 가슴에 첩첩이 쌓여 맺히는 것인데, 송화는 아직 어려서 그런 한을 알 지 못했어. 어미를 일찍 ⓓ<u>여의었지만</u> 내 그늘이 하도 컸던 탓인지도 모를 일이지. 그래서 내가 나섰던 게다. 내 자식의 눈을 멀게 해서라도 그 가슴에 한을 심어 주고 싶었단 말이다. 소리의 완성을 위해서……."

동호는 숨이 막힐 것 같았다. 소리의 완성, 그것이 무엇이기에 자식의 눈까지 멀게 했단 말인가.

(중략)

다음 날 아침, 사내는 다시 길을 떠났다. 잠에서 깨어난 여인은 사내가 떠난 길을 멍하니 바라보며 소리 한 대목을 흥얼거리고 있었다. 그것은 지난밤 사내와 함께 맞추었던 바로 그 춘향가의 이별 대목이었다. 여인의 소리는 맑고 ⓔ<u>애절했다</u>. 그리고 그 소리에는 이제껏 보지 못했던 깊은 한이 서려 있었다.

- 이청준, <서편제>' WHERE id = 'W1_LIT_P5';
UPDATE diag_passages SET text_md = '일반적으로 우리 몸의 면역 체계에서 ''킬러 T세포''는 바이러스에 감염된 세포나 암세포 표면의 특정 항원을 T세포 수용체로 정확히 인식하여 제거한다고 알려져 있다. 그러나 최근 연구들은 특정 항원을 ⓐ<u>인지</u>하지 않고도 주변 환경의 신호만으로 활성화되는 이른바 ''방관자 킬러 T세포''의 존재와 역할에 주목하고 있다.

방관자 킬러 T세포는 직접적으로 항원을 만나지 않아도, 감염 부위 주변에서 분비되는 인터루킨과 같은 염증성 사이토카인에 의해 활성화된다. 이렇게 깨어난 세포들은 항원 특이성과 ⓑ<u>무관</u>하게 퍼포린이나 그랜자임 같은 독성 물질을 분비하거나, 면역 조절 물질인 인터페론 감마를 방출하여 주변 세포들에게 영향을 미친다.

이러한 방관자 활성화 기제는 양날의 검과 같다. 긍정적인 측면에서는 초기 감염 시 특정 항원 특이 T세포가 충분히 ⓒ<u>증식</u>하기 전에 신속하게 바이러스 증식을 억제하거나, 항원을 숨기고 도망가는 바이러스나 암세포까지 공격하여 방어막을 형성할 수 있다. 이는 인체의 면역 방어 효율을 높이는 중요한 전략이 된다.

하지만 부정적인 측면도 무시할 수 없다. 방관자 킬러 T세포는 적과 아군을 구별하는 항원 인식 과정이 생략되어 있기 때문에, 때로는 감염되지 않은 정상 조직까지 무차별적으로 공격하여 과도한 염증 반응이나 조직 손상을 유발할 수 있다. A형 간염 바이러스 감염 시 발생하는 심각한 간 손상이나, 류마티스 관절염, 다발성 경화증과 같은 자가면역 질환의 발병 및 악화 과정에 이들 방관자 T세포가 깊이 ⓓ<u>관여</u>한다는 사실이 속속 밝혀지고 있다. 따라서 이들의 활성, 특히 ''NKG2D''와 같은 수용체를 통한 작용 기제를 ⓔ<u>정밀</u>하게 제어하는 기술은 자가면역 질환의 새로운 치료법 개발에 핵심적인 열쇠가 될 것이다.' WHERE id = 'W1_NON_P5';

-- ─────────────────────────────────────────────────────────────
-- 2) 문항 UPDATE (사용자 수정안에 명시된 항목만)
-- ─────────────────────────────────────────────────────────────
UPDATE diag_questions SET stem = '(가)에서 닭이 물을 먹고 하늘을 쳐다보는 이유로 가장 적절한 것은 무엇일까요? [3점]' WHERE id = 'S1_LIT_P2_Q04';
UPDATE diag_questions SET stem = '(가)를 읽고 떠오르는 장면의 분위기로 가장 알맞은 것은? [2점]', correct_choice = 'B', choices_json = '[{"choice_id":"A","text":"무섭고 어두운 느낌이야.","vector":{},"error_path":""},{"choice_id":"B","text":"평화롭고 여유로운 느낌이야.","vector":{},"error_path":""},{"choice_id":"C","text":"슬프고 우울한 느낌이야.","vector":{},"error_path":""},{"choice_id":"D","text":"시끄럽고 복잡한 느낌이야.","vector":{},"error_path":""},{"choice_id":"E","text":"바쁘고 서두르는 느낌이야.","vector":{},"error_path":""}]' WHERE id = 'S1_LIT_P2_Q08';
UPDATE diag_questions SET stem = '엄마 나비는 어디에 알을 낳는가요? [2점]', correct_choice = 'C', choices_json = '[{"choice_id":"A","text":"햇볕이 잘 드는 바위 위","vector":{},"error_path":""},{"choice_id":"B","text":"나무 줄기에 있는 구멍 안","vector":{},"error_path":""},{"choice_id":"C","text":"나뭇잎 뒷면에 있는 작은 공간","vector":{},"error_path":""},{"choice_id":"D","text":"물이 흐르는 연못의 잎사귀 위","vector":{},"error_path":""},{"choice_id":"E","text":"알록달록 예쁘게 핀 꽃잎 사이","vector":{},"error_path":""}]' WHERE id = 'S1_NON_Q01';
UPDATE diag_questions SET stem = '번데기 안에서는 어떤 일이 일어나고 있나요? [3점]', correct_choice = 'E', choices_json = '[{"choice_id":"A","text":"알을 낳을 준비를 하고 있다","vector":{},"error_path":""},{"choice_id":"B","text":"나뭇잎을 먹으며 쑥쑥 자라고 있다","vector":{},"error_path":""},{"choice_id":"C","text":"입에서 실을 뽑아 몸을 감싸고 있다","vector":{},"error_path":""},{"choice_id":"D","text":"꼼짝 않고 가만히 잠을 자고 있다","vector":{},"error_path":""},{"choice_id":"E","text":"나비가 되기 위해 모습이 바뀌고 있다","vector":{},"error_path":""}]' WHERE id = 'S1_NON_Q08';
-- [SKIP] S1_NON_P3_Q02 — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요
UPDATE diag_questions SET stem = '물방울이 이동하는 순서로 알맞은 것은? [3점]', correct_choice = 'C', choices_json = '[{"choice_id":"A","text":"바다 -> 땅 -> 하늘 -> 구름","vector":{},"error_path":""},{"choice_id":"B","text":"하늘 -> 땅 -> 바다 -> 하늘","vector":{},"error_path":""},{"choice_id":"C","text":"바다 -> 하늘 -> 땅 -> 바다","vector":{},"error_path":""},{"choice_id":"D","text":"구름 -> 바다 -> 하늘 -> 땅","vector":{},"error_path":""},{"choice_id":"E","text":"땅 -> 하늘 -> 구름 -> 바다","vector":{},"error_path":""}]' WHERE id = 'S1_NON_P3_Q08';
UPDATE diag_questions SET stem = '수남이가 사실을 말했을 때, 주인 영감님은 어떤 반응을 보였나요? [2점]', correct_choice = 'E', choices_json = '[{"choice_id":"A","text":"몹시 화를 냈다.","vector":{},"error_path":""},{"choice_id":"B","text":"수남이를 때렸다.","vector":{},"error_path":""},{"choice_id":"C","text":"경찰에 신고했다.","vector":{},"error_path":""},{"choice_id":"D","text":"수리비를 주러 갔다.","vector":{},"error_path":""},{"choice_id":"E","text":"잘했다며 무릎을 쳤다.","vector":{},"error_path":""}]' WHERE id = 'F1_LIT_Q08';
UPDATE diag_questions SET stem = '소년이 소녀를 기다리는 동안의 심정 변화를 잘 나타낸 문장은? [2점]', choices_json = '[{"choice_id":"A","text":"''유난히 맑은 가을 햇살''에서 드러난 기쁨 -> ''소녀 아닌 갈꽃''에서 드러난 실망","vector":{},"error_path":""},{"choice_id":"B","text":"''이제 저쯤 갈밭머리로 소녀가 나타나리라.''에서 드러난 기대 -> ''그런데도 소녀는 나타나지 않는다.''에서 드러난 초조","vector":{},"error_path":""},{"choice_id":"C","text":"''학교에서는 쉬는 시간에 운동장을 살폈다.''에서 드러난 무관심 -> ''남몰래 5학년 여자 반을 엿보기도 했다.''에서 드러난 호기심","vector":{},"error_path":""},{"choice_id":"D","text":"''물기가 걷혀 있었다.''에서 드러난 허무 -> ''조약돌을 집어 주머니에 넣었다.''에서 드러난 후회","vector":{},"error_path":""},{"choice_id":"E","text":"''이 바보.''에서 드러난 분노 -> ''소년은 저도 모르게 벌떡 일어섰다.''에서 드러난 놀람","vector":{},"error_path":""}]' WHERE id = 'F1_LIT_P3_Q02';
UPDATE diag_questions SET stem = '''소녀 아닌 갈꽃이 들길을 걸어오는 것만 같았다''라는 표현의 효과로 가장 적절한 것은? [2점]', choices_json = '[{"choice_id":"A","text":"소녀가 걷는 속도가 매우 빠르다는 것을 강조한다.","vector":{},"error_path":""},{"choice_id":"B","text":"소녀와 자연이 하나가 된 듯한 아름다운 분위기를 자아낸다.","vector":{},"error_path":""},{"choice_id":"C","text":"소년의 시력이 좋지 않다는 것을 암시한다.","vector":{},"error_path":""},{"choice_id":"D","text":"가을 날씨가 매우 춥다는 것을 보여준다.","vector":{},"error_path":""},{"choice_id":"E","text":"소녀의 옷차림이 화려하다는 것을 나타낸다.","vector":{},"error_path":""}]' WHERE id = 'F1_LIT_P3_Q04';
UPDATE diag_questions SET stem = '윗글에서 어머니가 옥희에게 꾸지람을 한 이유는 무엇인가? [2점]', correct_choice = 'B', choices_json = '[{"choice_id":"A","text":"옥희가 공부를 하지 않고 매일 놀기만 해서","vector":{},"error_path":""},{"choice_id":"B","text":"옥희가 사랑방에 가서 아저씨를 귀찮게 한다고 생각해서","vector":{},"error_path":""},{"choice_id":"C","text":"옥희가 어머니의 말을 듣지 않고 밖으로만 돌아다녀서","vector":{},"error_path":""},{"choice_id":"D","text":"옥희가 아저씨에게 버릇없이 굴며 예의를 지키지 않아서","vector":{},"error_path":""},{"choice_id":"E","text":"옥희가 그림책을 찢고 장난을 너무 심하게 쳐서","vector":{},"error_path":""}]' WHERE id = 'F1_LIT_P5_Q07';
UPDATE diag_questions SET stem = '아저씨가 ''그 눈은 꼭 아버지를 닮았네그려.'' 하고 말했을 때 옥희의 심정으로 가장 적절한 것은? [2점]', correct_choice = 'D', choices_json = '[{"choice_id":"A","text":"아버지를 모르는 자신의 처지가 부끄러웠다.","vector":{},"error_path":""},{"choice_id":"B","text":"낯선 아저씨가 자신을 아는 척하는 것이 싫었다.","vector":{},"error_path":""},{"choice_id":"C","text":"어머니를 닮지 않았다는 말에 속상하고 슬펐다.","vector":{},"error_path":""},{"choice_id":"D","text":"아버지 얼굴을 모름에도 불구하고 왠지 기분이 좋았다.","vector":{},"error_path":""},{"choice_id":"E","text":"아저씨가 거짓말을 하고 있다고 생각하여 화가 났다.","vector":{},"error_path":""}]' WHERE id = 'F1_LIT_P5_Q08';
-- [SKIP] F1_NON_P5_Q03 — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요
UPDATE diag_questions SET stem = '훈민정음 모음의 제자 원리를 고려할 때, 글자를 만들 때 본뜬 대상들로만 바르게 묶인 것은? [2점]', correct_choice = 'D', choices_json = '[{"choice_id":"A","text":"하늘, 바다, 땅","vector":{},"error_path":""},{"choice_id":"B","text":"하늘, 사람, 바다","vector":{},"error_path":""},{"choice_id":"C","text":"바다, 땅, 사람","vector":{},"error_path":""},{"choice_id":"D","text":"하늘, 땅, 사람","vector":{},"error_path":""},{"choice_id":"E","text":"사람, 산, 하늘","vector":{},"error_path":""}]' WHERE id = 'F1_NON_P5_Q05';
UPDATE diag_questions SET stem = '유네스코에서 주는 ''세종대왕 문해상''은 어떤 사람들에게 주는 상일까요? [2점]', correct_choice = 'C', choices_json = '[{"choice_id":"A","text":"한국 역사를 세계에 널리 알린 사람","vector":{},"error_path":""},{"choice_id":"B","text":"새로운 글자를 많이 발명한 사람","vector":{},"error_path":""},{"choice_id":"C","text":"세계의 문맹 퇴치에 힘쓴 사람","vector":{},"error_path":""},{"choice_id":"D","text":"과학 기술 발전에 기여한 사람","vector":{},"error_path":""},{"choice_id":"E","text":"세종 대왕의 업적을 연구한 사람","vector":{},"error_path":""}]' WHERE id = 'F1_NON_P5_Q07';
UPDATE diag_questions SET stem = '<보기>는 시적 화자가 슬픔을 억누르는 ''반어적 표현''을 사용하고 있음을 설명하고 있습니다. 원문의 ''흘리우리다''와 의미상 통하거나 시적 허용으로 쓰일 수 있는 다른 선택지들과 달리 문맥상 적절하지 않은 것은? [2점]', correct_choice = 'C', choices_json = '[{"choice_id":"A","text":"드리우리다","vector":{},"error_path":""},{"choice_id":"B","text":"흘리우리다","vector":{},"error_path":""},{"choice_id":"C","text":"삼키리다","vector":{},"error_path":""},{"choice_id":"D","text":"쏟으리다","vector":{},"error_path":""},{"choice_id":"E","text":"보이리다","vector":{},"error_path":""}]' WHERE id = 'R1_LIT_Q03';
-- [SKIP] R1_LIT_Q04 — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요
UPDATE diag_questions SET stem = '다음 단어를 형태소 분석할 때, 실질 형태소가 포함된 개수가 다른 하나는? [2점]' WHERE id = 'R1_LIT_Q05';
UPDATE diag_questions SET stem = '다음 <보기>의 밑줄 친 단어와 품사가 같은 것은? [3점]

<보기>
가격이 <u>오르면</u> 수요는 감소한다.', correct_choice = 'B', choices_json = '[{"choice_id":"A","text":"바다 풍경이 참 <u>아름답다.</u>","vector":{},"error_path":""},{"choice_id":"B","text":"동생이 매일 일기를 <u>쓴다.</u>","vector":{},"error_path":""},{"choice_id":"C","text":"한여름이라 날씨가 아주 <u>덥다.</u>","vector":{},"error_path":""},{"choice_id":"D","text":"저기 보이는 산이 매우 <u>높다.</u>","vector":{},"error_path":""},{"choice_id":"E","text":"우리 집 강아지는 정말 <u>귀엽다.</u>","vector":{},"error_path":""}]' WHERE id = 'R1_NON_Q04';
UPDATE diag_questions SET stem = '다음 단어들 중 단어의 형성 방식이(파생어/합성어)이 다른 하나는? [2점]' WHERE id = 'R1_NON_Q05';
-- [SKIP] R1_LIT_P3_Q04 — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요
UPDATE diag_questions SET stem = '(가)의 화자가 느끼는 주된 정서와 가장 연관 깊은 한자 성어로 알맞은 것은? [3점]', correct_choice = 'B', choices_json = '[{"choice_id":"A","text":"결초보은(結草報恩)","vector":{},"error_path":""},{"choice_id":"B","text":"수구초심(首丘初心)","vector":{},"error_path":""},{"choice_id":"C","text":"새옹지마(塞翁之馬)","vector":{},"error_path":""},{"choice_id":"D","text":"역지사지(易地思之)","vector":{},"error_path":""},{"choice_id":"E","text":"일취월장(日就月將)","vector":{},"error_path":""}]' WHERE id = 'R1_LIT_P3_Q08';
UPDATE diag_questions SET stem = '다음 글자의 초성의 조음 위치가 나머지 넷과 다른 하나는?', correct_choice = 'E', choices_json = '[{"choice_id":"A","text":"바","vector":{},"error_path":""},{"choice_id":"B","text":"파","vector":{},"error_path":""},{"choice_id":"C","text":"마","vector":{},"error_path":""},{"choice_id":"D","text":"빠","vector":{},"error_path":""},{"choice_id":"E","text":"하","vector":{},"error_path":""}]' WHERE id = 'R1_NON_P3_Q04';
-- [SKIP] R1_NON_P3_Q05 — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요
-- [SKIP] R1_LIT_P5_Q03 — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요
-- [SKIP] R1_LIT_P5_Q05 — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요
-- [SKIP] R1_NON_P5_Q04 — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요
UPDATE diag_questions SET stem = '다음 <보기>를 참고할 때, (나)의 밑줄 친 ''단념''과 문맥적 의미가 가장 유사한 것은? [2점]

<보기>
단념: 품었던 생각을 아주 끊어 버림.', correct_choice = 'B', choices_json = '[{"choice_id":"A","text":"그는 <u>방심</u>하다가 컵을 떨어뜨렸다.","vector":{},"error_path":""},{"choice_id":"B","text":"그는 가난 때문에 진학을 <u>포기</u>했다.","vector":{},"error_path":""},{"choice_id":"C","text":"그는 친구의 제안을 단박에 <u>거절</u>했다.","vector":{},"error_path":""},{"choice_id":"D","text":"그는 잠시 <u>주저</u>하다가 대답했다.","vector":{},"error_path":""},{"choice_id":"E","text":"그는 <u>낙담</u>하여 어깨가 축 처졌다.","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_Q03';
UPDATE diag_questions SET stem = '다음 <보기>의 단어들을 형태소 분석했을 때, 적절하지 않은 것은? [2점]
<보기>
ㄱ. 밧줄
ㄴ. 부둣가
ㄷ. 콧노래
ㄹ. 낯선
ㅁ. 뒷모습', correct_choice = 'E', choices_json = '[{"choice_id":"A","text":"ㄱ: 실질 형태소 ''밧''과 실질 형태소 ''줄''이 결합된 합성어이다.","vector":{},"error_path":""},{"choice_id":"B","text":"ㄴ: ''부두''와 ''가'' 사이에 사이시옷이 들어간 합성 명사이다.","vector":{},"error_path":""},{"choice_id":"C","text":"ㄷ: ''코''와 ''노래'' 사이에 사이시옷이 들어간 합성어이다.","vector":{},"error_path":""},{"choice_id":"D","text":"ㄹ: 형용사 어간 ''낯설-''에 관형사형 어미 ''-ㄴ''이 결합하면서 ''ㄹ''이 탈락한 활용형이다.","vector":{},"error_path":""},{"choice_id":"E","text":"ㅁ: ''뒤''를 뜻하는 접두사 ''뒷-''과 명사 ''모습''이 결합하여 만들어진 파생어이다.","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_Q04';
UPDATE diag_questions SET stem = '다음 <보기>의 밑줄 친 부분에 대한 설명으로 적절하지 않은 것은? [2점]

<보기>
ㄱ. 배가 들어와 <u>던져지는</u> 밧줄을 받는 것
ㄴ. <u>네가</u> 하고 싶은 대로 다 해줄 테니
ㄷ. 굿도 하고 용하다는 의원도 불러 <u>보았지만</u> 차도가 없었다.
ㄹ. 작년 이맘때 계연이 울음 섞인 하직을 남기고 <u>넘어간</u> 길
ㅁ. 콧노래까지 <u>흥얼거리며</u> 가고 있었다.', correct_choice = 'D', choices_json = '[{"choice_id":"A","text":"ㄱ: ''던져지는''은 동사 ''던지다''의 어간에 피동 접미사 ''-어지-''가 결합된 피동 표현이다.","vector":{},"error_path":""},{"choice_id":"B","text":"ㄴ: ''네가''는 2인칭 대명사 ''너''에 주격 조사 ''가''가 결합하여 형태가 바뀐 것이다.","vector":{},"error_path":""},{"choice_id":"C","text":"ㄷ: ''보았지만''의 ''보다''는 본용언 ''부르다(불러)'' 뒤에 붙어 어떤 행동을 시험 삼아 함을 나타내는 보조 용언이다.","vector":{},"error_path":""},{"choice_id":"D","text":"ㄹ: ''넘어간''은 동사 ''넘어가다''에 관형사형 어미 ''-ㄴ''이 결합하여 현재 시제를 나타낸다.","vector":{},"error_path":""},{"choice_id":"E","text":"ㅁ: ''흥얼거리며''는 연결 어미 ''-며''가 쓰여 두 동작이 동시에 일어남을 나타낸다.","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_Q05';
UPDATE diag_questions SET stem = '(가)의 ''밧줄''과 (나)의 ''사마귀''의 공통적인 속성을 한자 성어로 표현할 때 가장 적절한 것은? [2점]', choices_json = '[{"choice_id":"A","text":"거자필반(去者必返)","vector":{},"error_path":""},{"choice_id":"B","text":"자업자득(自業自得)","vector":{},"error_path":""},{"choice_id":"C","text":"불가항력(不可抗力)","vector":{},"error_path":""},{"choice_id":"D","text":"새옹지마(塞翁之馬)","vector":{},"error_path":""},{"choice_id":"E","text":"결자해지(結者解之)","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_Q08';
UPDATE diag_questions SET stem = '문맥상 ㉠~㉤과 바꿔 쓰기에 가장 적절한 것은? [2점]', correct_choice = 'A', choices_json = '[{"choice_id":"A","text":"㉠: 분배","vector":{},"error_path":""},{"choice_id":"B","text":"㉡: 고의","vector":{},"error_path":""},{"choice_id":"C","text":"㉢: 권장","vector":{},"error_path":""},{"choice_id":"D","text":"㉣: 하한선","vector":{},"error_path":""},{"choice_id":"E","text":"㉤: 유래","vector":{},"error_path":""}]' WHERE id = 'W1_NON_Q03';
UPDATE diag_questions SET stem = '다음 <보기>의 단어 구조 분석으로 적절하지 않은 것은? [3점]
<보기>
㉠ 웃돈
㉡ 비효율성
㉢ 안팎
㉣ 드높다
㉤ 되찾다', choices_json = '[{"choice_id":"A","text":"㉠: 접두사 ''웃-''과 명사 ''돈''이 결합한 파생어이다.","vector":{},"error_path":""},{"choice_id":"B","text":"㉡: ''효율''에 접두사 ''비-''가 붙은 후, 다시 접미사 ''-성''이 결합한 말이다.","vector":{},"error_path":""},{"choice_id":"C","text":"㉢: ''안''과 ''밖''이 결합하면서 ''ㅎ'' 소리가 덧나는 합성어이다.","vector":{},"error_path":""},{"choice_id":"D","text":"㉣: ''높다''의 어근에 ''심하게''의 뜻을 더하는 접두사 ''드-''가 결합한 파생어이다.","vector":{},"error_path":""},{"choice_id":"E","text":"㉤: ''되다''의 어근 ''되''와 ''찾다''의 어근 ''찾''이 결합한 합성 용언이다.","vector":{},"error_path":""}]' WHERE id = 'W1_NON_Q04';
-- [SKIP] W1_NON_Q07 — 사용자 수정안에 stem/선지 명시 안 됨, 별도 처리 필요
UPDATE diag_questions SET stem = '윗글에 사용된 어휘의 문맥적 뜻풀이로 적절하지 않은 것은? [2점]', correct_choice = 'B', choices_json = '[{"choice_id":"A","text":"박명한: 복이 없고 팔자가 사나운","vector":{},"error_path":""},{"choice_id":"B","text":"인편: 사람을 편안하고 이롭게 함","vector":{},"error_path":""},{"choice_id":"C","text":"질곡: 몹시 얽매여 자유롭지 못한 상태","vector":{},"error_path":""},{"choice_id":"D","text":"누설: 비밀 따위가 밖으로 새어 나감","vector":{},"error_path":""},{"choice_id":"E","text":"정진: 어떤 일에 정신을 집중하여 힘써 나아감","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_P3_Q03';
UPDATE diag_questions SET stem = '다음 <보기>의 밑줄 친 부분 중 ''한글 맞춤법''에 어긋난 것은? [2점]
<보기>
㉠ 그는 나를 보자마자 <u>멋쩍게</u> 웃었다.
㉡ 시험에 합격할 수 있을지 <u>자신이 없다</u>.
㉢ 며칠 밤을 새워 공부했더니 <u>눈곱</u>이 끼었다.
㉣ 김치찌개를 끓일 때는 돼지고기를 <u>널찍하게</u> 썰어 넣어야 맛있다.
㉤ 친구와 싸운 뒤 화해하려고 먼저 <u>아는 체</u>를 했다.', correct_choice = 'E', choices_json = '[{"choice_id":"A","text":"㉠","vector":{},"error_path":""},{"choice_id":"B","text":"㉡","vector":{},"error_path":""},{"choice_id":"C","text":"㉢","vector":{},"error_path":""},{"choice_id":"D","text":"㉣","vector":{},"error_path":""},{"choice_id":"E","text":"㉤","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_P3_Q04';
UPDATE diag_questions SET stem = '(가)의 화자가 현실을 대하는 태도의 변화 과정을 바르게 나열한 것은? [2점]', choices_json = '[{"choice_id":"A","text":"현실 도피 → 비애의 심화 → 현실 도피 → 일시적 해소","vector":{},"error_path":""},{"choice_id":"B","text":"현실 비판 → 이상향 동경 → 현실 타협 → 운명 수용","vector":{},"error_path":""},{"choice_id":"C","text":"개인적 고뇌 → 사회적 모순 인식 → 집단적 저항 → 이상적 세계 실현","vector":{},"error_path":""},{"choice_id":"D","text":"자연 친화 → 속세에 대한 미련 → 고독감 토로 → 현실 극복 의지","vector":{},"error_path":""},{"choice_id":"E","text":"현실 부정 → 이상향 모색 → 좌절과 체념 → 미래에 대한 희망","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_P3_Q06';
UPDATE diag_questions SET stem = '다음 단어의 뜻풀이가 적절하지 않은 것은? [2점]', correct_choice = 'E', choices_json = '[{"choice_id":"A","text":"해명(解明): 까닭이나 내용을 풀어서 밝힘.","vector":{},"error_path":""},{"choice_id":"B","text":"결여(缺如): 마땅히 있어야 할 것이 빠져서 없거나 모자람.","vector":{},"error_path":""},{"choice_id":"C","text":"환원(還元): 본디의 상태나 형상으로 다시 돌아가게 함.","vector":{},"error_path":""},{"choice_id":"D","text":"야기(惹起): 일이나 사건 따위를 끌어 일으킴.","vector":{},"error_path":""},{"choice_id":"E","text":"해소(解消): 어떤 일의 결과를 미리 짐작하여 앎.","vector":{},"error_path":""}]' WHERE id = 'W1_NON_P3_Q03';
UPDATE diag_questions SET stem = '다음 단어의 표준 발음으로 적절하지 않은 것은? [2점]', correct_choice = 'D', choices_json = '[{"choice_id":"A","text":"맑다 - [막따]","vector":{},"error_path":""},{"choice_id":"B","text":"흙 위 - [흐귀]","vector":{},"error_path":""},{"choice_id":"C","text":"넓다 - [널따]","vector":{},"error_path":""},{"choice_id":"D","text":"밟다 - [발따]","vector":{},"error_path":""},{"choice_id":"E","text":"핥다 - [할따]","vector":{},"error_path":""}]' WHERE id = 'W1_NON_P3_Q04';
UPDATE diag_questions SET stem = '윗글을 바탕으로 <보기>의 주장에 대해 비판할 내용으로 가장 적절한 것은? [2점]

<보기>
철수: "''황금산은 높다''라는 문장을 봐. 실제로 황금산은 없지만, 우리는 이 문장의 의미를 이해할 수 있어. 그렇다면 ''황금산''이라는 단어는 어딘가에 존재하는 대상을 가리키고 있는 것이 분명해. 현실 세계가 아니라면, 일종의 관념 세계에라도 그 대상이 존재해야만 해."', choices_json = '[{"choice_id":"A","text":"관념 세계에 존재한다는 설명은 과학적으로 증명되었으므로 타당한 주장이야.","vector":{},"error_path":""},{"choice_id":"B","text":"프레게라면 ''황금산''의 뜻은 있지만 지시체는 없다고 말할 거야. 의미를 이해한다고 해서 반드시 대상이 존재해야 하는 건 아니야.","vector":{},"error_path":""},{"choice_id":"C","text":"러셀의 입장에서 보면 ''황금산''은 고유명사이므로 반드시 지시체가 있어야 해.","vector":{},"error_path":""},{"choice_id":"D","text":"맞아. 우리가 상상할 수 있는 모든 것은 현실에 존재한다고 봐야 해.","vector":{},"error_path":""},{"choice_id":"E","text":"''황금산''은 동음이의어일 가능성이 높으니 문맥을 더 살펴봐야 해.","vector":{},"error_path":""}]' WHERE id = 'W1_NON_P3_Q08';
UPDATE diag_questions SET stem = '문맥상 ⓐ~ⓔ의 단어와 바꿔 쓰기에 적절하지 않은 것은? [2점]
<보기>
ⓐ 윤이 나고
ⓑ 뇌까리고
ⓒ 의지해
ⓓ 여의었지만
ⓔ 애절했다', correct_choice = 'C', choices_json = '[{"choice_id":"A","text":"ⓐ: 반짝이고","vector":{},"error_path":""},{"choice_id":"B","text":"ⓑ: 되뇌고","vector":{},"error_path":""},{"choice_id":"C","text":"ⓒ: 외면해","vector":{},"error_path":""},{"choice_id":"D","text":"ⓓ: 사별하고","vector":{},"error_path":""},{"choice_id":"E","text":"ⓔ: 비통했다","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_P5_Q03';
UPDATE diag_questions SET stem = '다음 <보기>의 밑줄 친 부분에 대한 문법적 설명으로 적절하지 않은 것은? [3점]

<보기>
ㄱ. 나를 버리고 나간 것
ㄴ. 송화는 누구를 의지해 살아가겠느냐
ㄷ. 내 자식의 눈을 멀게 해서라도
ㄹ. 깊은 곳에서 우러나오는 그 무엇
ㅁ. 잠에서 깨어난 여인', choices_json = '[{"choice_id":"A","text":"ㄱ: ''버리고''는 연결 어미 ''-고''가 쓰여 앞뒤 문장을 대등하게 이어주고 있다.","vector":{},"error_path":""},{"choice_id":"B","text":"ㄴ: ''의지해''는 ''의지하-''에 어미 ''-여''가 결합하여 ''의지하여''가 된 후 줄어든 형태이다.","vector":{},"error_path":""},{"choice_id":"C","text":"ㄷ: ''해서라도''는 ''하-'' + ''-아서'' + ''-라도''의 결합으로 분석할 수 있다.","vector":{},"error_path":""},{"choice_id":"D","text":"ㄹ: ''우러나오는''은 동사 ''우러나오다''의 관형사형으로 뒤에 오는 명사를 수식한다.","vector":{},"error_path":""},{"choice_id":"E","text":"ㅁ: ''잠에서''의 ''에서''는 부사격 조사로, 출발점이나 유래의 의미를 지닌다.","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_P5_Q04';
UPDATE diag_questions SET stem = '다음 <보기>는 (나)의 문장들을 문법적으로 분석한 것이다. 적절하지 않은 것은?
<보기>
ㄱ. 아비는 송화 누이의 눈을 멀게 했다.
ㄴ. 소리의 완성을 위해서 가슴에 한을 심어 주고 싶었다.
ㄷ. 너는 내 자식이 아니었으니 나를 버리고 나간 것은 나무랄 일이 아니었다.', correct_choice = 'D', choices_json = '[{"choice_id":"A","text":"ㄱ: ''눈을 멀게 했다''는 주동문을 사동문으로 바꾼 형태이다.","vector":{},"error_path":""},{"choice_id":"B","text":"ㄴ: ''심어 주고 싶었다''에는 본용언 ''심다''와 보조 용언 ''주다'', ''싶다''가 사용되었다.","vector":{},"error_path":""},{"choice_id":"C","text":"ㄷ: ''아니었으니''는 연결 어미 ''-으니''를 사용하여 인과 관계를 나타내고 있다.","vector":{},"error_path":""},{"choice_id":"D","text":"ㄷ: ''나무랄 일이 아니었다''에서 ''나무랄''은 관형사형 어미 ''-ㄹ''이 붙어 미래 시제를 나타낸다.","vector":{},"error_path":""},{"choice_id":"E","text":"ㄱ, ㄴ, ㄷ: 모두 서술어의 자릿수를 채우기 위해 목적어가 필요한 문장이 포함되어 있다.","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_P5_Q05';
UPDATE diag_questions SET stem = '(가)의 화자가 지향하는 삶의 태도를 한자 성어로 표현할 때 가장 적절한 것은? [2점]', choices_json = '[{"choice_id":"A","text":"맥수지탄(麥秀之嘆)","vector":{},"error_path":""},{"choice_id":"B","text":"고진감래(苦盡甘來)","vector":{},"error_path":""},{"choice_id":"C","text":"일편단심(一片丹心)","vector":{},"error_path":""},{"choice_id":"D","text":"무아지경(無我之境)","vector":{},"error_path":""},{"choice_id":"E","text":"안빈낙도(安貧樂道)","vector":{},"error_path":""}]' WHERE id = 'W1_LIT_P5_Q08';
UPDATE diag_questions SET stem = 'ⓐ~ⓔ의 단어 뜻풀이가 적절하지 않은 것은? [2점]', correct_choice = 'D', choices_json = '[{"choice_id":"A","text":"ⓐ 인지: 어떤 사실을 확실히 인정하여 앎.","vector":{},"error_path":""},{"choice_id":"B","text":"ⓑ 무관: 서로 관계가 없음.","vector":{},"error_path":""},{"choice_id":"C","text":"ⓒ 증식: 양이나 수가 늘어서 불어남.","vector":{},"error_path":""},{"choice_id":"D","text":"ⓓ 관여: 어떤 일에 직접 나서지 않고 곁에서 보기만 함.","vector":{},"error_path":""},{"choice_id":"E","text":"ⓔ 정밀: 아주 정교하고 치밀함.","vector":{},"error_path":""}]' WHERE id = 'W1_NON_P5_Q03';
UPDATE diag_questions SET stem = '다음 <보기>의 문장을 분석한 내용으로 적절하지 않은 것은? [2점]
<보기>
㉠ 면역 체계에서 킬러 T세포는 바이러스를 제거한다.
㉡ 최근 연구들은 방관자 킬러 T세포의 역할을 주목하고 있다.
㉢ 이 세포들은 독성 물질을 분비하거나 인터페론 감마를 방출한다.', choices_json = '[{"choice_id":"A","text":"㉠: ''면역 체계에서''는 주격 조사 ''에서''가 사용된 주어이다.","vector":{},"error_path":""},{"choice_id":"B","text":"㉠: ''제거한다''는 동작의 대상인 목적어 ''바이러스를''을 필요로 하는 타동사이다.","vector":{},"error_path":""},{"choice_id":"C","text":"㉡: 이 문장의 주어는 ''최근 연구들은''이며, ''역할을''은 서술어의 대상이 되는 목적어이다.","vector":{},"error_path":""},{"choice_id":"D","text":"㉡: ''주목하고 있다''는 본용언 ''주목하고''와 보조 용언 ''있다''가 결합하여 하나의 서술어 역할을 한다.","vector":{},"error_path":""},{"choice_id":"E","text":"㉢: ''이 세포들은 독성 물질을 분비한다''와 ''(이 세포들은) 인터페론 감마를 방출한다''가 대등하게 이어진 문장이다.","vector":{},"error_path":""}]' WHERE id = 'W1_NON_P5_Q04';
UPDATE diag_questions SET stem = '<보기>의 단어에 적용된 음운 변동에 대한 설명으로 옳은 것은? [2점]
<보기>
ㄱ. 침략 [침냑]
ㄴ. 협력 [혐녁]
ㄷ. 색연필 [생년필]
ㄹ. 독립 [동닙]', correct_choice = 'C', choices_json = '[{"choice_id":"A","text":"ㄱ: 앞 음절의 종성 ''ㅁ''이 뒤 음절의 초성 ''ㄹ''의 영향을 받아 비음으로 변하는 역행동화가 일어난다.","vector":{},"error_path":""},{"choice_id":"B","text":"ㄴ: 유음화가 적용되어 [혐녁]으로 발음된다.","vector":{},"error_path":""},{"choice_id":"C","text":"ㄷ: ''ㄴ'' 첨가 현상이 일어난 후, 첨가된 ''ㄴ''에 의해 앞의 ''ㄱ''이 [ㅇ]으로 변하는 비음화가 일어난다.","vector":{},"error_path":""},{"choice_id":"D","text":"ㄹ: 자음군 단순화가 일어난 후, 인접한 자음의 영향을 받아 소리의 성질이 비슷해지는 동화 현상이 발생한다.","vector":{},"error_path":""},{"choice_id":"E","text":"ㄱ, ㄴ, ㄹ은 모두 앞의 자음이 뒤의 자음을 닮아가는 순행 동화에 해당한다.","vector":{},"error_path":""}]' WHERE id = 'W1_NON_P5_Q05';

-- ─────────────────────────────────────────────────────────────
-- 3) test_questions 재시드 (V0048 와 동일 패턴)
--    diag_questions 변경분이 시험지 PDF/OMR 채점에도 반영되도록
-- ─────────────────────────────────────────────────────────────
DELETE FROM test_questions WHERE test_id LIKE 'diag_paper_%';

INSERT INTO test_questions
    (id, test_id, number, type, domain, sub_domain, passage, stem, points,
     correct_answer, choices_json, choice_explanations_json, intent,
     essay_keywords_json, essay_rubric_json, model_answer, created_at)
SELECT
    CONCAT('diag_tq_', q.id)                                                      AS id,
    CONCAT('diag_paper_', q.tier)                                                 AS test_id,
    ROW_NUMBER() OVER (PARTITION BY q.tier ORDER BY p.level, p.id, q.order_in_passage) AS number,
    '객관식'                                                                       AS type,
    q.question_type                                                               AS domain,
    p.genre                                                                       AS sub_domain,
    p.text_md                                                                     AS passage,
    CASE
        WHEN q.box_content IS NULL OR q.box_content = '' THEN q.stem
        ELSE CONCAT(q.stem, '\n<보기>\n', q.box_content)
    END                                                                           AS stem,
    10                                                                            AS points,
    q.correct_choice                                                              AS correct_answer,
    CAST(q.choices_json AS CHAR)                                                  AS choices_json,
    NULL                                                                          AS choice_explanations_json,
    NULL                                                                          AS intent,
    NULL                                                                          AS essay_keywords_json,
    NULL                                                                          AS essay_rubric_json,
    NULL                                                                          AS model_answer,
    NOW(6)                                                                        AS created_at
FROM diag_questions q
JOIN diag_passages  p ON p.id = q.passage_id
WHERE q.question_type <> '서술형';
