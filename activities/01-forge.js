(function () {

  "use strict";



  var FIELD_META = [

    { id: "f1", key: "spec", title: "기본 스펙 & 키워드" },

    { id: "f2", key: "skill", title: "주요 기능" },

    { id: "f3", key: "charge", title: "전원 충전법" },

    { id: "f4", key: "warn", title: "주의 사항" },

    { id: "f5", key: "ping", title: "알림 설정" },

    { id: "f6", key: "sync", title: "연결 & 호환성" },

    { id: "f7", key: "egg", title: "숨겨진 이스터에그" },

    { id: "f8", key: "value", title: "기본 탑재 가치관" },

    { id: "f9", key: "net", title: "네트워크 확장" },

    { id: "f10", key: "role", title: "모듈 조합" },

    { id: "f11", key: "vax", title: "백신 프로그램" },

    { id: "f12", key: "data", title: "최근 데이터 저장" },

    { id: "f13", key: "fix", title: "오작동 해결법" },

    { id: "f14", key: "update", title: "미래 버전 업데이트" }

  ];



  var STATS = [

    { key: "atk", label: "공격력", sub: "추진·표현", cls: "is-atk", ico: "ATK", fields: ["skill", "update", "role"] },

    { key: "def", label: "방어력", sub: "경계·자기보호", cls: "is-def", ico: "DEF", fields: ["warn", "vax", "fix"] },

    { key: "men", label: "맨탈력", sub: "회복·가치", cls: "is-men", ico: "MEN", fields: ["charge", "value", "vax"] },

    { key: "cha", label: "매력력", sub: "반전·리액션", cls: "is-cha", ico: "CHA", fields: ["egg", "ping", "spec"] },

    { key: "syn", label: "시너지", sub: "연결·협업", cls: "is-syn", ico: "SYN", fields: ["sync", "role", "ping"] },

    { key: "buz", label: "화제력", sub: "관심·트렌드", cls: "is-buz", ico: "BUZ", fields: ["data", "net", "update"] }

  ];



  /* 작성 내용 기반 100종 캐릭터 분류 (수업용 오리지널) */

  var CHAR_CLASSES = [

    { name: "텐션 부스터", rank: "HOT DROP", keys: ["텐션", "분위기", "리액션", "웃", "밝"], tags: ["텐션폭발", "분위기메이커"] },

    { name: "인간 비타민", rank: "SUNBEAM", keys: ["비타민", "긍정", "해피", "기분좋", "응원"], tags: ["긍정에너지", "비타민"] },

    { name: "쿼카형 힐러", rank: "SMILE UP", keys: ["쿼카", "귀여", "힐링", "포근", "따뜻"], tags: ["힐링요정", "포근함"] },

    { name: "드립 마스터", rank: "PUNCHLINE", keys: ["드립", "개그", "웃기", "유머", "장난"], tags: ["드립천재", "웃김주의"] },

    { name: "리액션 요정", rank: "REACT MAX", keys: ["리액션", "호응", "반응", "맞장구"], tags: ["리액션킹", "호응최고"] },

    { name: "공감 레이더", rank: "EMPATHY", keys: ["공감", "고민", "들어주", "이해", "상담"], tags: ["고민상담소", "공감능력"] },

    { name: "솔직 직진러", rank: "STRAIGHT", keys: ["솔직", "직진", "숨기지", "진심", "단도직입"], tags: ["솔직함", "직진"] },

    { name: "배려 엔진", rank: "CARE MODE", keys: ["배려", "피해", "먼저", "조심", "예의"], tags: ["배려왕", "매너"] },

    { name: "신뢰 금고", rank: "TRUSTED", keys: ["신뢰", "약속", "비밀", "믿음", "칼같"], tags: ["신뢰보장", "약속지킴"] },

    { name: "시간 칼각러", rank: "ON TIME", keys: ["시간", "지각", "약속 시간", "칼같이", "정시"], tags: ["시간엄수", "칼각"] },

    { name: "디저트 헌터", rank: "SWEET RUN", keys: ["디저트", "케이크", "빵", "달달", "마카롱"], tags: ["디저트러버", "달달"] },

    { name: "버블티 소환사", rank: "BOBA CALL", keys: ["버블티", "밀크티", "음료", "초코우유", "카페"], tags: ["음료필수", "카페투어"] },

    { name: "산책 배터리", rank: "WALK CHARGE", keys: ["산책", "걷기", "바람", "혼자 산책"], tags: ["산책러", "충전중"] },

    { name: "음악 플레이어", rank: "PLAYLIST", keys: ["노래", "음악", "플리", "이어폰", "멜로디"], tags: ["음악필수", "플리공유"] },

    { name: "게임 숨은고수", rank: "CLUTCH", keys: ["게임", "고수", "랭크", "롤", "배그", "스쿼드"], tags: ["게임고수", "한판더"] },

    { name: "운동 스타터", rank: "SWEAT ON", keys: ["운동", "헬스", "체육", "달리기", "근력"], tags: ["운동시작", "땀흘림"] },

    { name: "책장 탐험가", rank: "PAGE TURN", keys: ["책", "독서", "소설", "웹툰", "글"], tags: ["독서러", "책벌레"] },

    { name: "영화 감식안", rank: "CINEMA", keys: ["영화", "드라마", "넷플", "시리즈", "예능"], tags: ["영화덕후", "정주행"] },

    { name: "패션 센서", rank: "FIT CHECK", keys: ["패션", "옷", "코디", "스타일", "미용"], tags: ["코디감각", "핏체크"] },

    { name: "뷰티 크리에이터", rank: "GLOW UP", keys: ["메이크", "화장", "스킨", "뷰티", "헤어"], tags: ["뷰티팁", "글로우업"] },

    { name: "발표 스포트라이트", rank: "ON STAGE", keys: ["발표", "스피치", "말하기", "앞에"], tags: ["발표자신감", "무대"] },

    { name: "PPT 디자이너", rank: "SLIDE PRO", keys: ["PPT", "피피티", "디자인", "슬라이드", "카드뉴스"], tags: ["PPT장인", "디자인"] },

    { name: "자료조사 드론", rank: "SEARCH BOT", keys: ["조사", "검색", "자료", "리서치", "찾아"], tags: ["조사왕", "정보력"] },

    { name: "서기 스피드", rank: "NOTE FAST", keys: ["서기", "필기", "기록", "메모"], tags: ["필기신", "기록러"] },

    { name: "일정 매니저", rank: "SCHEDULE", keys: ["일정", "관리", "계획", "스케줄", "정리"], tags: ["일정관리", "계획형"] },

    { name: "모둠 분위기장", rank: "TEAM VIBE", keys: ["모둠", "팀", "분위기", "조별"], tags: ["팀바이브", "모둠장"] },

    { name: "리더십 파일럿", rank: "LEAD ON", keys: ["리더", "반장", "이끌", "조장", "중심"], tags: ["리더십", "중심인물"] },

    { name: "서포터 엔진", rank: "ASSIST", keys: ["서포트", "도와", "지원", "보조", "뒤에서"], tags: ["서포터", "도움요정"] },

    { name: "아이디어 스파크", rank: "BRAIN POP", keys: ["아이디어", "창의", "발상", "기발", "새롭"], tags: ["아이디어뱅크", "창의력"] },

    { name: "문제해결 열쇠", rank: "FIX IT", keys: ["해결", "고치", "오작동", "문제", "방법"], tags: ["해결사", "픽스잇"] },

    { name: "멘탈 방패", rank: "SHIELD", keys: ["멘탈", "스트레스", "방어", "백신", "견디"], tags: ["멘탈갑", "방패"] },

    { name: "힐링 루틴러", rank: "RESET", keys: ["힐링", "루틴", "회복", "쉬", "충전"], tags: ["힐링루틴", "리셋"] },

    { name: "감정 온도계", rank: "FEEL SCAN", keys: ["감정", "기분", "예민", "우울", "화났"], tags: ["감정케어", "온도체크"] },

    { name: "쿨다운 타이머", rank: "10 MIN", keys: ["혼자", "시간 주", "쿨다운", "진정", "10분"], tags: ["쿨다운", "혼자시간"] },

    { name: "응원 확성기", rank: "CHEER UP", keys: ["응원", "수고", "잘하고", "파이팅", "화이팅"], tags: ["응원봉", "잘하고있어"] },

    { name: "칭찬 자판기", rank: "PRAISE", keys: ["칭찬", "인정", "멋", "잘함", "대단"], tags: ["칭찬봇", "인정욕구"] },

    { name: "반전 매력러", rank: "TWIST", keys: ["반전", "이스터", "겉으론", "친해지면", "알고보면"], tags: ["반전매력", "알고보면"] },

    { name: "장난기 폭주기관차", rank: "PRANK ON", keys: ["장난", "폭주", "말썽", "짓궂"], tags: ["장난꾸러기", "폭주주의"] },

    { name: "덤덤 감동러", rank: "SOFT CORE", keys: ["덤덤", "감동", "눈물", "속으론"], tags: ["겉덤덤속감동", "여림"] },

    { name: "가치관 나침반", rank: "TRUE NORTH", keys: ["가치", "모토", "신념", "소중", "기준"], tags: ["가치관명확", "나침반"] },

    { name: "진로 레이더", rank: "PATH FIND", keys: ["진로", "직업", "장래", "꿈", "목표"], tags: ["진로탐색", "꿈찾기"] },

    { name: "AI 탐험가", rank: "AI LAB", keys: ["AI", "인공지능", "챗봇", "프롬프트", "코딩"], tags: ["AI탐험", "테크"] },

    { name: "마케팅 감식가", rank: "TREND AD", keys: ["마케팅", "광고", "브랜딩", "홍보"], tags: ["마케팅감", "브랜딩"] },

    { name: "심리 관찰자", rank: "MIND EYE", keys: ["심리", "사람 마음", "관찰", "성격", "MBTI"], tags: ["심리덕후", "MBTI"] },

    { name: "프로그래밍 시동러", rank: "CODE BOOT", keys: ["프로그래밍", "코딩", "개발", "파이썬", "자바"], tags: ["코딩입문", "개발꿈"] },

    { name: "사회이슈 안테나", rank: "ISSUE ON", keys: ["이슈", "뉴스", "사회", "핫이슈", "토론"], tags: ["이슈추적", "토론러"] },

    { name: "관심사 풀스택", rank: "80% BRAIN", keys: ["관심사", "취미", "요즘", "뇌 용량", "핫"], tags: ["관심사폭주", "요즘이거"] },

    { name: "검색 중독형", rank: "CTRL F", keys: ["검색", "찾아보", "유튜브", "구글", "정보"], tags: ["검색요정", "정보수집"] },

    { name: "수다 와이파이", rank: "CHAT 5G", keys: ["수다", "이야기", "대화", "수다떨", "말하기"], tags: ["수다왕", "대화필수"] },

    { name: "조용한 관찰자", rank: "SILENT CAM", keys: ["조용", "관망", "말수", "내향", "I형"], tags: ["조용한힘", "관찰자"] },

    { name: "외향 스포트라이트", rank: "E-TYPE", keys: ["외향", "사람", "모임", "E형", "에너지 넘"], tags: ["외향만렙", "사람좋아"] },

    { name: "배고픔 경보장치", rank: "HUNGRY!", keys: ["배고프", "밥", "예민", "배고플 때", "간식"], tags: ["배고프면예민", "밥먼저"] },

    { name: "뒷담화 차단기", rank: "NO DRAMA", keys: ["뒷담", "거짓말", "험담", "싫어요", "진실"], tags: ["드라마거절", "진실파"] },

    { name: "물건 반환 경찰", rank: "RETURN IT", keys: ["빌려", "제자리", "돌려", "분실"], tags: ["빌려간거반납", "정리벽"] },

    { name: "디저트 응급처치", rank: "SWEET AID", keys: ["디저트 먹", "달달한", "케이크 먹", "당 충전"], tags: ["당충전", "응급디저트"] },

    { name: "음료수 평화유지군", rank: "DRINK DIPLO", keys: ["음료수 건네", "마실 거", "한 잔", "사줄게"], tags: ["음료평화", "한잔의여유"] },

    { name: "맛집 내비게이션", rank: "YUM MAP", keys: ["맛집", "먹으러", "맛있는", "맛있", "식당"], tags: ["맛집탐방", "먹으러가자"] },

    { name: "학기 업그레이더", rank: "v2.0", keys: ["이번 학기", "성적", "등급", "v2", "업데이트"], tags: ["학기목표", "레벨업"] },

    { name: "새친구 소환술사", rank: "NEW LINK", keys: ["새 친구", "사귀", "친해지", "인연"], tags: ["새친구환영", "인연추가"] },

    { name: "주관 확성기", rank: "MY TAKE", keys: ["주관", "의견", "당당", "소신", "말하"], tags: ["주관명확", "소신발언"] },

    { name: "계획형 전략가", rank: "PLAN A", keys: ["계획", "전략", "로드맵", "단계", "준비"], tags: ["계획파", "전략가"] },

    { name: "즉흥형 모험가", rank: "GO NOW", keys: ["즉흥", "갑자기", "일단", "모험", "벼락"], tags: ["즉흥파", "일단고"] },

    { name: "감성 필름카메라", rank: "MOOD SHOT", keys: ["감성", "분위기 있는", "노을", "사진", "필름"], tags: ["감성샷", "무드"] },

    { name: "그림 스케치러", rank: "DRAW ON", keys: ["그림", "그리기", "일러스트", "낙서", "스케치"], tags: ["그림러", "스케치"] },

    { name: "노래방 보스", rank: "MIC CHECK", keys: ["노래방", "부르", "음치", "가창", "마이크"], tags: ["노래방필수", "마이크잡음"] },

    { name: "댄스 에너지", rank: "MOVE IT", keys: ["춤", "댄스", "안무", "커버"], tags: ["댄스에너지", "몸이먼저"] },

    { name: "반려동물 맘/대디", rank: "PET LOVE", keys: ["강아지", "고양이", "반려동물", "펫", "멍", "냥"], tags: ["펫사랑", "집사"] },

    { name: "식물 키우미", rank: "GREEN THUMB", keys: ["식물", "화분", "초록", "키우"], tags: ["식집사", "초록힐링"] },

    { name: "여행 버킷러", rank: "TRIP LIST", keys: ["여행", "어디", "떠나", "관광", "항공"], tags: ["여행욕구", "버킷리스트"] },

    { name: "사진 포착러", rank: "CLICK", keys: ["사진", "찍", "카메라", "셀카", "인생샷"], tags: ["인생샷", "포토"] },

    { name: "유튜브 큐레이터", rank: "SUBSCRIBE", keys: ["유튜브", "쇼츠", "채널", "영상 보"], tags: ["유튜브중", "추천알고리즘"] },

    { name: "숏폼 트렌드러", rank: "FYP", keys: ["틱톡", "릴스", "숏폼", "챌린지", "인기"], tags: ["숏폼중독", "트렌드"] },

    { name: "밈 번역기", rank: "MEME DECK", keys: ["밈", "유행어", "짤", "개그 코드"], tags: ["밈저장소", "유행어"] },

    { name: "스포츠 응원단", rank: "CHEER SQ", keys: ["축구", "야구", "농구", "응원", "경기"], tags: ["스포츠덕", "응원가"] },

    { name: "요리 실험실", rank: "CHEF LAB", keys: ["요리", "만들", "레시피", "집밥", "쿠킹"], tags: ["요리실험", "집밥"] },

    { name: "청소 클리너", rank: "TIDY UP", keys: ["청소", "정리", "정돈", "깨끗"], tags: ["정리정돈", "클린"] },

    { name: "수면 방어막", rank: "SLEEP MODE", keys: ["잠", "수면", "피곤", "늦잠", "졸"], tags: ["수면부족", "잠이보약"] },

    { name: "카페인 로켓", rank: "ESPRESSO", keys: ["커피", "카페인", "아아", "라떼", "각성"], tags: ["커피필수", "카페인"] },

    { name: "야근각 야망러", rank: "HUSTLE", keys: ["열심히", "노력", "야망", "성공", "열심"], tags: ["노력파", "야망"] },

    { name: "슬로우 라이프", rank: "SLOW ON", keys: ["여유", "천천히", "느긋", "슬로우", "한가로"], tags: ["여유형", "슬로우"] },

    { name: "미니멀리스트", rank: "LESS IS", keys: ["미니멀", "심플", "최소한", "간결", "비우"], tags: ["미니멀", "심플라이프"] },

    { name: "컬렉터 본능", rank: "COLLECT", keys: ["모으", "수집", "콜렉트", "굿즈", "소장"], tags: ["수집욕", "굿즈"] },

    { name: "DIY 메이커", rank: "HAND MADE", keys: ["만들", "DIY", "수공", "핸드메이드", "공작"], tags: ["메이커", "손재주"] },

    { name: "과학 호기심", rank: "WHY LAB", keys: ["과학", "실험", "왜", "원리", "호기심"], tags: ["호기심만렙", "왜요"] },

    { name: "역사 스토리텔러", rank: "ONCE UPON", keys: ["역사", "과거", "시대", "이야기꾼"], tags: ["역사덕", "스토리"] },

    { name: "언어 멀티탭", rank: "LANG PACK", keys: ["영어", "일본어", "중국어", "외국어", "언어"], tags: ["언어학습", "멀티랭"] },

    { name: "수학 보스전", rank: "CALC RAID", keys: ["수학", "공식", "계산", "문제풀"], tags: ["수학도전", "공식외움"] },

    { name: "국어 문장가", rank: "WORD CRAFT", keys: ["국어", "글쓰", "문장", "작문", "독서논술"], tags: ["문장력", "글맛"] },

    { name: "예체능 스파크", rank: "ART PE", keys: ["예체능", "예술", "체육", "공연", "무대"], tags: ["예체능감성", "끼"] },

    { name: "봉사 하트", rank: "HELP OUT", keys: ["봉사", "나눔", "도와주", "기부", "선행"], tags: ["나눔", "봉사마음"] },

    { name: "환경 가디언", rank: "ECO MODE", keys: ["환경", "분리수거", "지구", "친환경", "재활용"], tags: ["환경지킴", "에코"] },

    { name: "경제 감각러", rank: "MONEY SENSE", keys: ["돈", "저축", "용돈", "경제", "투자"], tags: ["경제감각", "저축"] },

    { name: "법률 상식러", rank: "RULE BOOK", keys: ["규칙", "법", "상식", "원칙", "지켜야"], tags: ["원칙주의", "룰키퍼"] },

    { name: "안전 지킴이", rank: "SAFE FIRST", keys: ["안전", "주의", "경고", "위험", "조심"], tags: ["안전먼저", "주의보"] },

    { name: "건강 관리자", rank: "HP MAX", keys: ["건강", "병원", "약", "컨디션", "몸관리"], tags: ["건강관리", "HP"] },

    { name: "자기계발 러너", rank: "GROW DAILY", keys: ["자기계발", "성장", "습관", "루틴", "발전"], tags: ["성장형", "습관빚기"] },

    { name: "목표 레이서", rank: "GOAL LOCK", keys: ["목표", "달성", "레이스", "도전", "완수"], tags: ["목표달성", "도전중"] },

    { name: "균형 조율사", rank: "BALANCE", keys: ["균형", "조화", "밸런스", "중용", "조절"], tags: ["밸런스", "조율"] },

    { name: "유니크 원오프", rank: "ONLY ONE", keys: ["유니크", "특별", "하나뿐", "개성", "나만의"], tags: ["개성만점", "유니크"] },

    { name: "올라운더 만능키", rank: "ALL ROUND", keys: ["만능", "다재다능", "뭐든", "다양", "올라운드"], tags: ["만능형", "올라운더"] }

  ];



  var HAIR = [

    { base: "#1c1410", mid: "#3b2a22", light: "#6b4a38" },

    { base: "#2a1810", mid: "#5c331f", light: "#8a5230" },

    { base: "#111827", mid: "#334155", light: "#64748b" },

    { base: "#4a1c0a", mid: "#7c2d12", light: "#b45309" },

    { base: "#1e1b4b", mid: "#3730a3", light: "#818cf8" },

    { base: "#3f1d0a", mid: "#92400e", light: "#d97706" },

    { base: "#0f172a", mid: "#1e293b", light: "#475569" },

    { base: "#4c0519", mid: "#9f1239", light: "#fb7185" },

    { base: "#8a6a28", mid: "#c9a227", light: "#f5e6a3" },

    { base: "#0f3d32", mid: "#0d9488", light: "#5eead4" },

    { base: "#3b2f2f", mid: "#6b5b4f", light: "#c4b5a5" },

    { base: "#2e1065", mid: "#7e22ce", light: "#e9d5ff" }

  ];

  var SKIN = [
    { base: "#fbe8dc", mid: "#f3d5c4", shadow: "#d9b09a", blush: "#e8a090" },
    { base: "#f8e4d6", mid: "#efd0bc", shadow: "#d4a88e", blush: "#e29888" },
    { base: "#f3dccb", mid: "#e8c8b2", shadow: "#c9a08a", blush: "#d99080" },
    { base: "#e8cbb4", mid: "#d9b49a", shadow: "#b89074", blush: "#d08070" },
    { base: "#d9b494", mid: "#c49a78", shadow: "#a07858", blush: "#c87868" },
    { base: "#c9966e", mid: "#b07c54", shadow: "#8a5c3a", blush: "#b86a5a" },
    { base: "#a8744c", mid: "#8f5c38", shadow: "#6a4024", blush: "#a85a4a" },
    { base: "#7a4a2c", mid: "#633a22", shadow: "#442616", blush: "#8f4e42" }
  ];

  var ACCENT = ["#c96442", "#0d7377", "#1d4ed8", "#be185d", "#b45309", "#4338ca", "#059669", "#db2777", "#ea580c", "#0891b2"];

  var SHIRT = ["#1f2937", "#7f1d1d", "#134e4a", "#1e3a8a", "#78350f", "#4c1d95", "#374151", "#9a3412", "#0f766e", "#be123c", "#1d4ed8", "#365314"];





  var els = {

    code: document.getElementById("htmlCodeOut"),

    badge: document.getElementById("htmlForgeBadge"),

    copy: document.getElementById("btnCopyHtml"),

    stage: document.getElementById("infStage"),

    empty: document.getElementById("infStageEmpty"),

    card: document.getElementById("infCard"),

    face: document.getElementById("infFaceWrap"),

    name: document.getElementById("infName"),

    klass: document.getElementById("infClass"),

    rank: document.getElementById("infRank"),

    tags: document.getElementById("infTags"),

    stats: document.getElementById("infStats"),

    kakao: document.getElementById("btnKakaoProfile"),

    bubble: document.getElementById("infBubble"),

    bubbleTitle: document.getElementById("infBubbleTitle"),

    bubbleText: document.getElementById("infBubbleText"),

    nameInput: document.getElementById("sheetDisplayName")

  };



  var lastLive = { data: null, stats: null, traits: null };

  var bubbleTimer = null;

  var typeTimer = null;

  var bubbleKey = "";

  var voiceReady = false;



  function setFaceSpeaking(on) {

    if (els.face) els.face.classList.toggle("is-speaking", !!on);

    var stage = els.face && els.face.parentElement;

    if (stage && stage.classList.contains("inf-face-stage")) {

      stage.classList.toggle("is-speaking", !!on);

    }

  }



  function clearTypewriter() {

    if (typeTimer) {

      clearInterval(typeTimer);

      typeTimer = null;

    }

    if (els.bubble) els.bubble.classList.remove("is-typing");

  }



  function typeBubbleText(full) {

    clearTypewriter();

    if (!els.bubbleText) return;

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {

      els.bubbleText.textContent = full;

      return;

    }

    els.bubble.classList.add("is-typing");

    els.bubbleText.textContent = "";

    var i = 0;

    var step = Math.max(1, Math.floor(full.length / 90));

    typeTimer = setInterval(function () {

      i += step;

      els.bubbleText.textContent = full.slice(0, i);

      if (i >= full.length) {

        els.bubbleText.textContent = full;

        clearTypewriter();

      }

    }, 28);

  }



  function cleanForSpeech(text) {

    return String(text || "")

      .replace(/[「」""\"']/g, "")

      .replace(/·/g, " ")

      .replace(/\s+/g, " ")

      .replace(/…/g, ". ")

      .trim();

  }



  function ensureVoices(cb) {

    if (!window.speechSynthesis) {

      if (cb) cb([]);

      return;

    }

    var voices = speechSynthesis.getVoices();

    if (voices && voices.length) {

      voiceReady = true;

      if (cb) cb(voices);

      return;

    }

    speechSynthesis.addEventListener("voiceschanged", function once() {

      speechSynthesis.removeEventListener("voiceschanged", once);

      voiceReady = true;

      if (cb) cb(speechSynthesis.getVoices() || []);

    });

    try { speechSynthesis.getVoices(); } catch (e) {}

  }



  function pickVoice(voices, gender) {

    var list = (voices || []).filter(function (v) {

      return /ko/i.test(v.lang || "") || /korean|한글|한국/i.test(v.name || "");

    });

    if (!list.length) list = voices || [];

    if (!list.length) return null;

    var prefer;

    if (gender === "f") {

      prefer = list.filter(function (v) {

        return /female|woman|girl|yuna|sunhi|heami|지윤|선희|여/i.test(v.name || "");

      });

    } else if (gender === "m") {

      prefer = list.filter(function (v) {

        return /male|man|boy|injoon|bongjin|남/i.test(v.name || "");

      });

    }

    if (prefer && prefer.length) return prefer[0];

    return list[0];

  }



  function voiceStyle(traits) {

    var look = (traits && traits.look) || "cute";

    var gender = (traits && traits.gender) || "";

    var vibe = (traits && traits.vibe) || "neutral";

    var rate = 1;

    var pitch = 1;

    if (look === "cute") { rate = 1.08; pitch = 1.28; }

    else if (look === "fierce" || look === "gangster") { rate = 1.04; pitch = 0.72; }

    else if (look === "hero" || look === "macho") { rate = 0.9; pitch = 0.86; }

    else if (look === "idol" || look === "soft") { rate = 1.1; pitch = 1.22; }

    else if (look === "scholar") { rate = 0.94; pitch = 0.98; }

    else if (look === "athlete") { rate = 1.06; pitch = 0.95; }

    else if (look === "artist") { rate = 0.98; pitch = 1.12; }

    else if (look === "gamer") { rate = 1.05; pitch = 0.9; }

    else if (look === "cool") { rate = 0.92; pitch = 0.88; }

    if (gender === "f") pitch = Math.min(1.6, pitch + 0.12);

    if (gender === "m") pitch = Math.max(0.55, pitch - 0.12);

    if (look === "macho") { pitch = Math.max(0.5, pitch - 0.08); rate = Math.max(0.82, rate - 0.04); }
    if (look === "gangster") { pitch = Math.max(0.48, pitch - 0.1); }
    if (look === "idol") { pitch = Math.min(1.55, pitch + 0.06); rate = Math.min(1.2, rate + 0.03); }

    if (vibe === "cheer") { rate += 0.04; pitch += 0.05; }

    if (vibe === "calm") { rate -= 0.05; }

    if (vibe === "heat" || vibe === "bold") { rate += 0.03; pitch -= 0.05; }

    return {

      rate: Math.max(0.75, Math.min(1.25, rate)),

      pitch: Math.max(0.5, Math.min(1.7, pitch)),

      volume: 1

    };

  }



  function stopCharacterVoice() {

    try {

      if (window.speechSynthesis) speechSynthesis.cancel();

    } catch (e) {}

  }



  function speakCharacterLine(text, traits, onDone) {

    stopCharacterVoice();

    if (!window.speechSynthesis || !text) {

      if (onDone) onDone();

      return;

    }

    ensureVoices(function (voices) {

      var style = voiceStyle(traits);

      var utter = new SpeechSynthesisUtterance(cleanForSpeech(text));

      utter.lang = "ko-KR";

      utter.rate = style.rate;

      utter.pitch = style.pitch;

      utter.volume = style.volume;

      var voice = pickVoice(voices, traits && traits.gender);

      if (voice) utter.voice = voice;

      var finished = false;

      function done() {

        if (finished) return;

        finished = true;

        if (onDone) onDone();

      }

      utter.onend = done;

      utter.onerror = done;

      try {

        speechSynthesis.speak(utter);

      } catch (e) {

        done();

      }

      /* 일부 브라우저 타임아웃 안전망 */

      setTimeout(done, Math.min(20000, 2500 + cleanForSpeech(text).length * 90));

    });

  }



  ensureVoices();

  if (window.speechSynthesis) {

    try { speechSynthesis.getVoices(); } catch (e) {}

  }



  function val(id) {

    var n = document.getElementById(id);

    return n ? String(n.value || "").trim() : "";

  }



  function collect() {

    var data = {};

    var filled = 0;

    FIELD_META.forEach(function (m) {

      var t = val(m.id);

      data[m.key] = t;

      if (t) filled += 1;

    });

    data._filled = filled;

    data._name = val("sheetDisplayName") || extractNickname(data.spec) || "미등록 크리에이터";

    return data;

  }



  function extractNickname(spec) {

    if (!spec) return "";

    var m = spec.match(/(?:별명|닉네임)\s*[:：]?\s*([^\n,，/|]+)/i);

    if (m) return m[1].trim().slice(0, 16);

    var line = spec.split(/\n|•/)[0].replace(/^[\s•\-\d.]+/, "").trim();

    return line ? line.slice(0, 16) : "";

  }



  function extractMbti(data) {

    var blob = [

      data && data._name,

      data && data.spec,

      data && data.skill,

      data && data.egg,

      data && data.value,

      data && data.ping,

      data && data.role,

      data && data.net,

      data && data.data,

      data && data.update

    ].filter(Boolean).join("\n");

    if (!blob) return "";

    var labeled = blob.match(/MBTI\s*(?:\/\s*성격)?\s*[:：]?\s*([EI][NS][FT][JP])/i);

    if (labeled) return labeled[1].toUpperCase();

    var typed = blob.match(/\b([EI][NS][FT][JP])\b/i);

    if (typed) return typed[1].toUpperCase();

    var loose = String(data && data._name || "").trim().match(/^([EI][NS][FT][JP])$/i);

    return loose ? loose[1].toUpperCase() : "";

  }



  function hashStr(s) {

    var h = 2166136261;

    for (var i = 0; i < s.length; i++) {

      h ^= s.charCodeAt(i);

      h = Math.imul(h, 16777619);

    }

    return h >>> 0;

  }



  function scoreField(text) {

    if (!text) return null;

    var len = Math.min(text.length, 220);

    var lines = text.split(/\n|•/).filter(function (x) { return x.trim().length > 1; }).length;

    var boost = 0;

    if (/잘|최고|강|열정|도전|목표|화이팅|자신|용기|빛|웃음|공감|배려|솔직|신뢰|힐링|에너지|리액션|병기|상남|매력|리더/.test(text)) boost += 16;

    if (/싫|주의|경계|스트레스|화|우울|예민|경고|방어|멘탈/.test(text)) boost += 12;

    return Math.min(100, Math.round(36 + len * 0.32 + lines * 8 + boost));

  }



  function calcStats(data) {

    var out = {};

    var seed = hashStr(data._name + "|" + (data.spec || "") + "|" + data._filled);

    STATS.forEach(function (st, idx) {

      var scores = [];

      st.fields.forEach(function (k) {

        var s = scoreField(data[k] || "");

        if (s !== null) scores.push(s);

      });

      var base;

      if (scores.length) {

        base = scores.reduce(function (a, b) { return a + b; }, 0) / scores.length;

      } else {

        /* 비어 있어도 캐릭터마다 다른 기본 분포 */

        base = 34 + ((seed >>> (idx * 3)) % 28);

      }

      var filledBonus = Math.min(40, data._filled * 2.8);

      var salt = ((seed >>> (idx * 5)) % 21) - 8;

      out[st.key] = Math.max(18, Math.min(99, Math.round(base + filledBonus * 0.7 + salt)));

    });

    return out;

  }



  function gradeOf(v) {

    if (v >= 88) return { mark: "S", cls: "is-s" };

    if (v >= 74) return { mark: "A", cls: "is-a" };

    if (v >= 58) return { mark: "B", cls: "is-b" };

    if (v >= 42) return { mark: "C", cls: "is-c" };

    return { mark: "D", cls: "is-d" };

  }



  function totalRank(total) {

    if (total >= 480) return "S-RANK";

    if (total >= 400) return "A-RANK";

    if (total >= 320) return "B-RANK";

    if (total >= 250) return "C-RANK";

    return "ROOKIE";

  }



  function pickArchetype(data, stats) {

    var blob = [

      data.spec, data.skill, data.charge, data.warn, data.ping, data.sync,

      data.egg, data.value, data.net, data.role, data.vax, data.data,

      data.fix, data.update, data._name

    ].join("\n");

    var text = blob.toLowerCase();

    var seed = hashStr(blob + "|" + data._filled);



    var scored = CHAR_CLASSES.map(function (c, idx) {

      var score = 0;

      (c.keys || []).forEach(function (k) {

        if (k && text.indexOf(String(k).toLowerCase()) !== -1) score += 12;

      });

      if (stats) {

        if (idx < 20 && stats.cha >= stats.def) score += 3;

        if (idx >= 20 && idx < 40 && stats.syn >= 50) score += 3;

        if (idx >= 40 && idx < 60 && stats.buz >= 50) score += 3;

        if (idx >= 60 && idx < 80 && stats.men >= 50) score += 3;

        if (idx >= 80 && stats.atk >= 50) score += 3;

      }

      score += (seed >>> (idx % 16)) % 5;

      return { c: c, idx: idx, score: score };

    });



    scored.sort(function (a, b) {

      if (b.score !== a.score) return b.score - a.score;

      return a.idx - b.idx;

    });



    var top = scored[0];

    if (!top || top.score < 8) {

      top = scored[seed % Math.min(24, scored.length)];

    } else if (scored.length > 1 && scored[1].score >= top.score - 2) {

      var pool = scored.filter(function (s) { return s.score >= top.score - 2; }).slice(0, 8);

      top = pool[seed % pool.length];

    }



    var chosen = top.c;

    return {

      id: top.idx + 1,

      name: chosen.name,

      rank: chosen.rank,

      tags: (chosen.tags || []).slice()

    };

  }



  function pickTags(data, arch, faceTraits) {
    var pool = [];
    var seen = {};

    function pushTag(text, kind) {
      if (!text) return;
      var c = String(text)
        .replace(/^[\s\-#：:]+/, "")
        .replace(/["""'']/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (c.length < 2) return;
      if (c.length > 22) c = c.slice(0, 21) + "…";
      var key = c.replace(/\s+/g, "").toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      pool.push({ text: c, cls: kind === "class", persona: kind === "persona" });
    }

    if (faceTraits && faceTraits.persona) {
      var personaLabel = {
        macho: "상남자",
        gangster: "깡패",
        idol: "아이돌",
        scholar: "모범생",
        athlete: "스포츠맨",
        artist: "아티스트",
        gamer: "게이머"
      }[faceTraits.persona];
      if (personaLabel) pushTag(personaLabel, "persona");
    }
    if (faceTraits && faceTraits.look && ["macho", "gangster", "idol", "fierce", "hero", "scholar", "athlete", "artist", "gamer", "cool", "soft"].indexOf(faceTraits.look) >= 0) {
      var lookLabel = {
        macho: "터프",
        gangster: "다크",
        idol: "비주얼",
        fierce: "강렬",
        hero: "히어로",
        scholar: "지성",
        athlete: "액티브",
        artist: "감성",
        gamer: "플레이어",
        cool: "쿨톤",
        soft: "포근"
      }[faceTraits.look];
      if (lookLabel) pushTag(lookLabel, "persona");
    }
    if (faceTraits && faceTraits.vibe && faceTraits.vibe !== "neutral") {
      var vibeLabel = {
        cheer: "비타민",
        calm: "힐링",
        heat: "핫",
        fashion: "패션",
        music: "뮤직",
        game: "게임",
        food: "맛집",
        tech: "테크",
        sport: "스포츠",
        soft: "다정",
        bold: "카리스마",
        creative: "크리에이티브",
        social: "사교"
      }[faceTraits.vibe];
      if (vibeLabel) pushTag(vibeLabel, "");
    }

    if (arch && arch.tags) {
      arch.tags.forEach(function (t) { pushTag(t, "class"); });
    }
    if (arch && arch.name) pushTag(arch.name, "class");

    [
      data.spec, data.skill, data.charge, data.warn, data.ping, data.sync,
      data.egg, data.value, data.net, data.role, data.vax, data.data,
      data.fix, data.update
    ].forEach(function (t) {
      if (!t) return;
      String(t).split(/[\n•,，/|·;；]+/).forEach(function (chunk) {
        pushTag(chunk, "");
      });
    });

    if (pool.length < 6) {
      ["오리지널", "성장형", "인플루언서", "나사용설명서"].forEach(function (t) {
        pushTag(t, "");
      });
    }

    return pool.slice(0, 14);
  }



  function inferGender(blob) {
    var t = String(blob || "");
    if (!t.trim()) return "";

    /* Hard lock #1 — 성별: / 나는·저는 남자|여자 */
    if (/성별\s*[:：]?\s*(여자|여성|여\b|female|girl|woman|\bf\b)/i.test(t)) return "f";
    if (/성별\s*[:：]?\s*(남자|남성|남\b|male|boy|man|\bm\b)/i.test(t)) return "m";
    if (/(?:나는|저는|난|전)\s*(?:여자|여성|여학생|여중생|여고생)/.test(t)) return "f";
    if (/(?:나는|저는|난|전)\s*(?:남자|남성|남학생|남중생|남고생)/.test(t)) return "m";
    if (/여자입니다|여성입니다|여학생입니다/.test(t)) return "f";
    if (/남자입니다|남성입니다|남학생입니다/.test(t)) return "m";
    if (/\bI\s*am\s*a\s*(girl|woman|female)\b/i.test(t)) return "f";
    if (/\bI\s*am\s*a\s*(boy|man|male)\b/i.test(t)) return "m";

    /* Hard lock #2 — explicit cue words (상남자·근육남 등은 성별 단어로 보지 않음) */
    var genderText = t
      .replace(/상남자|근육남|늑대남|허슬\s*남|남자다운|남자다움|남성적|남성미|터프\s*가이/g, "·")
      .replace(/걸크러시|걸크러쉬|보이시|톰보이|여장|남장/g, "·");
    var hasF = /여자|여성|여학생|여중생|여고생|♀|\bfemale\b|\bgirl\b|\bwoman\b/i.test(genderText);
    var hasM = /남자|남성|남학생|남중생|남고생|♂|\bmale\b|\bboy\b/i.test(genderText);
    if (hasF && !hasM) return "f";
    if (hasM && !hasF) return "m";
    if (hasF && hasM) {
      var fi = genderText.search(/여자|여성|여학생|♀|\bfemale\b|\bgirl\b|\bwoman\b/i);
      var mi = genderText.search(/남자|남성|남학생|♂|\bmale\b|\bboy\b/i);
      if (fi >= 0 && (mi < 0 || fi <= mi)) return "f";
      if (mi >= 0) return "m";
    }

    /* Soft cues — 머리 길이·색은 스타일이지 성별이 아님 (제외) */
    var fem = 0;
    var masc = 0;
    if (/\b언니\b|\b누나\b|\b그녀\b|여동생/.test(t)) fem += 2;
    if (/\b오빠\b|\b형\b|\b남동생\b/.test(t)) masc += 2;
    if (/딸/.test(t) && !/아들/.test(t)) fem += 1;
    if (/아들/.test(t) && !/딸/.test(t)) masc += 1;
    if (/화장|메이크업|메이크|립틴트|원피스|치마|속눈썹|네일|여장/.test(t)) fem += 2;
    if (/수염|턱수염|콧수염|남장/.test(t)) masc += 2;
    if (fem < 2 && masc < 2) {
      if (/리본|하트|애교|설렘/.test(t)) fem += 1;
    }
    if (fem >= 2 && fem > masc) return "f";
    if (masc >= 2 && masc > fem) return "m";
    if (fem > masc && fem >= 1) return "f";
    if (masc > fem && masc >= 1) return "m";
    return "";
  }

  function analyzeFaceTraits(data, stats) {
    var parts = [
      data.spec, data.skill, data.charge, data.warn, data.ping, data.sync,
      data.egg, data.value, data.net, data.role, data.vax, data.data,
      data.fix, data.update, data._name
    ];
    var blob = parts.filter(Boolean).join("\n");
    var text = blob.toLowerCase();
    var gender = inferGender(blob);
    var seed = hashStr(blob + "|" + gender + "|" + (data._filled || 0) + "|" + [
      stats && stats.atk, stats && stats.def, stats && stats.men,
      stats && stats.cha, stats && stats.syn, stats && stats.buz
    ].join(","));

    function score(words, w) {
      var n = 0;
      words.forEach(function (k) { if (text.indexOf(k) !== -1) n += (w || 1); });
      return n;
    }

    var cheer = score(["웃", "밝", "텐션", "행복", "리액션", "비타민", "해피", "즐거", "신나", "긍정", "에너지", "흥"], 2);
    var calm = score(["조용", "힐링", "산책", "여유", "느긋", "차분", "평온", "혼자", "수면", "쉬", "쿨다운", "충전", "리셋"], 2);
    var heat = score(["화", "예민", "스트레스", "경고", "싫", "배고프", "우울", "짜증", "멘붕", "예민"], 2);
    var fashion = score(["패션", "코디", "뷰티", "메이크", "화장", "스타일", "헤어", "옷", "핏", "룩"], 2);
    var music = score(["노래", "음악", "플리", "이어폰", "마이크", "노래방", "멜로디", "비트"], 2);
    var game = score(["게임", "랭크", "고수", "플레이", "롤", "배그", "스쿼드", "한판"], 2);
    var food = score(["디저트", "밥", "맛집", "케이크", "버블", "커피", "먹", "음료", "빵", "달달", "카페"], 2);
    var tech = score(["ai", "코딩", "프로그래밍", "개발", "검색", "유튜브", "디지털", "알고리즘"], 2);
    var sport = score(["운동", "헬스", "달리", "체육", "축구", "농구", "근력", "땀"], 2);
    var soft = score(["공감", "배려", "따뜻", "포근", "감동", "응원", "칭찬", "위로", "다정", "귀여"], 2);
    var bold = score(["도전", "발표", "리더", "최고", "승리", "목표", "드림", "자신감", "열정", "카리스마"], 2);
    var creative = score(["아이디어", "그림", "창작", "디자인", "ppt", "영상", "예술", "상상"], 2);
    var social = score(["친구", "모임", "톡", "대화", "연락", "사람", "사교", "함께", "네트워"], 2);
    var heroish = score(["정의", "영웅", "보호", "책임", "용기", "희생", "믿음", "신뢰", "이상", "원칙", "신념", "규칙"], 2);
    var fierceish = score(["반항", "카카", "독보", "날카", "화염", "질주", "돌파", "카리스마", "강렬", "폭발", "거침"], 2);

    var lenBoost = Math.min(12, Math.floor(blob.length / 40));
    var mood = 42 + cheer * 6 + soft * 3 + food * 2 + social * 2 - heat * 5 - calm
      + ((stats && stats.cha) ? Math.round(stats.cha * 0.15) : 0) + lenBoost;
    mood = Math.max(8, Math.min(98, mood));

    var mouth = mood >= 78 ? 3 : mood >= 55 ? 2 : mood >= 35 ? 1 : 0;
    if (heat >= 4 && cheer < 2) mouth = 0;
    if (cheer >= 4) mouth = 3;
    if (mouth === 1 && soft >= 2) mouth = 2;

    var eyes = 0;
    if (calm >= 3 && cheer < 3) eyes = 1;
    if (tech >= 2 || game >= 2) eyes = 2;
    if (bold >= 3 || sport >= 2) eyes = 3;
    if (heat >= 4) eyes = 1;
    if (creative >= 3 && eyes === 0) eyes = 2;

    var accessory = seed % 8;
    if (tech >= 2 || creative >= 2) accessory = 1;
    else if (music >= 2 || game >= 2) accessory = 2;
    else if (fashion >= 2 || soft >= 3) accessory = 3;
    else if (cheer >= 3 || social >= 3) accessory = 4;
    else if (sport >= 2 || bold >= 3) accessory = 5;
    else if (food >= 3 || soft >= 2) accessory = 7;
    else if (calm >= 3 || fashion >= 1) accessory = 6;

    var style = seed % 8;
    if (fashion >= 2 || creative >= 2) style = 3;
    if (soft >= 3 || calm >= 3) style = 2;
    if (bold >= 3 || sport >= 2) style = 1;
    if (game >= 2 || tech >= 2) style = 0;
    if (music >= 3) style = 5;
    if (food >= 3 && fashion < 2) style = 4;
    if (creative >= 3 && fashion >= 1) style = 6;
    if (social >= 3 && soft >= 2) style = 7;

    var hairIdx = seed % HAIR.length;
    if (fashion >= 2) hairIdx = 4 + (seed % 5);
    if (heat >= 3) hairIdx = 3 + (seed % 2);
    if (calm >= 3) hairIdx = seed % 3;
    if (creative >= 2) hairIdx = 4 + (seed % 4);
    if (sport >= 3) hairIdx = seed % 3;

    var hairColorLock = -1;
    if (/금발|블론드|blonde|yellow\s*hair|노란\s*머리|밝은\s*머리/.test(blob)) hairColorLock = 8;
    else if (/은발|실버|백발|회색\s*머리|silver|gray\s*hair|grey\s*hair|흰\s*머리|애쉬|ash\s*hair/.test(blob)) hairColorLock = /애쉬|ash/.test(blob) ? 10 : 2;
    else if (/분홍|핑크\s*머리|핑크빛\s*머리|pink\s*hair|분홍\s*머리/.test(blob)) hairColorLock = 7;
    else if (/빨간\s*머리|적발|레드\s*헤어|red\s*hair|주황\s*머리/.test(blob)) hairColorLock = 3;
    else if (/민트|초록\s*머리|녹색\s*머리|teal\s*hair|green\s*hair|청록/.test(blob)) hairColorLock = 9;
    else if (/보라\s*머리|퍼플|purple\s*hair|보라색\s*머리/.test(blob)) hairColorLock = 11;
    else if (/파란|블루|파랑|파란\s*머리|blue\s*hair|남색\s*머리/.test(blob)) hairColorLock = 4;
    else if (/흑발|검은\s*머리|검정\s*머리|흑색|black\s*hair|다크\s*헤어/.test(blob)) hairColorLock = 0;
    else if (/갈색|브라운|밤색|chestnut|brown\s*hair|갈색\s*머리/.test(blob)) hairColorLock = 1;
    if (hairColorLock >= 0) hairIdx = hairColorLock % HAIR.length;

    var hairLen = "";
    if (/긴머리|롱헤어|긴\s*머리|허리\s*머리|장발|long\s*hair|포니테일|생머리|하이\s*포니/.test(blob)) hairLen = "long";
    else if (/단발|미디엄|어깨\s*머리|bob|단발머리/.test(blob)) hairLen = "medium";
    else if (/숏컷|숏헤어|짧은\s*머리|스포츠컷|투블럭|크롭|short\s*hair|머리\s*짧게/.test(blob)) hairLen = "short";

    if (hairLen === "long") style = gender === "m" ? 1 : (/포니|하이\s*포니/.test(blob) ? 6 : 4);
    else if (hairLen === "medium") style = gender === "m" ? 5 : 2;
    else if (hairLen === "short") style = gender === "m" ? 0 : 5;

    var skinLock = -1;
    var skinIdx = (seed >>> 3) % SKIN.length;
    if (/흰\s*피부|하얀\s*피부|창백|pale|fair\s*skin|흰\s*얼굴|하얀\s*얼굴|백옥/.test(blob)) { skinIdx = 0; skinLock = 0; }
    else if (/검은\s*피부|어두운\s*피부|탄\s*피부|브라운\s*스킨|dark\s*skin|brown\s*skin|흑인/.test(blob)) { skinIdx = 6 + ((seed >>> 4) % 2); skinLock = skinIdx; }
    else if (/황\s*피부|노란\s*피부|밀색|wheat|olive/.test(blob)) { skinIdx = 3 + ((seed >>> 4) % 2); skinLock = skinIdx; }

    var accLock = -1;
    if (/선글라스|썬글라스|sunglasses|미러\s*선글/.test(blob)) accLock = 1;
    else if (/안경|glasses|스펙스|돋보기/.test(blob)) accLock = 1;
    else if (/헤드폰|이어폰|헤드셋|에어팟|해드폰|헤드\s*셋/.test(blob)) accLock = 2;
    else if (/리본|헤어핀|머리핀|핀\s*꽂|귀걸이|이어링|earrings/.test(blob)) accLock = 3;
    else if (/헤어밴드|머리띠|밴드\s*머리|스포츠\s*밴드/.test(blob)) accLock = 5;
    else if (/베레모|모자|캡모자|야구모자|비니|모자\s*씀/.test(blob)) accLock = 6;
    else if (/꽃\s*핀|꽃핀|플라워|꽃\s*장식/.test(blob)) accLock = 7;
    if (accLock >= 0) accessory = accLock;

    /* 표정·눈 텍스트 락 */
    var mouthLock = -1;
    var eyesLock = -1;
    if (/활짝\s*웃|크게\s*웃|웃음\s*많|방긋|해맑|미소\s*가득|항상\s*웃/.test(blob)) mouthLock = 3;
    else if (/무표정|담담|무덤덤|표정\s*없/.test(blob)) mouthLock = 1;
    else if (/화난|짜증|삐진|성난|분노|인상\s*찌/.test(blob)) mouthLock = 0;
    else if (/미소|웃는|밝은\s*표정|웃긴/.test(blob)) mouthLock = 2;
    if (/감은\s*눈|졸린\s*눈|실눈|반쯤\s*감/.test(blob)) eyesLock = 1;
    else if (/큰\s*눈|초롱|또렷한\s*눈|왕눈/.test(blob)) eyesLock = 0;
    else if (/날카로운\s*눈|매서운\s*눈|카리스마\s*눈/.test(blob)) eyesLock = 3;
    if (mouthLock >= 0) mouth = mouthLock;
    if (eyesLock >= 0) eyes = eyesLock;

    var freckleLock = null;
    if (/주근깨|프리클|freckle/.test(blob)) freckleLock = true;
    var beardHint = /수염|턱수염|콧수염|beard|mustache/.test(blob);
    var makeupHint = /화장|메이크업|메이크|립글로스|립틴트/.test(blob);
    var accentIdx = (seed >>> 6) % ACCENT.length;
    if (cheer >= 3) accentIdx = 0;
    if (tech >= 2) accentIdx = 2;
    if (music >= 2) accentIdx = 3;
    if (sport >= 2) accentIdx = 6 % ACCENT.length;
    if (food >= 2) accentIdx = 4;

    var shirtIdx = (seed >>> 8) % SHIRT.length;
    if (stats) {
      var topStat = "atk";
      var topVal = -1;
      ["atk", "def", "men", "cha", "syn", "buz"].forEach(function (k) {
        if ((stats[k] || 0) > topVal) { topVal = stats[k]; topStat = k; }
      });
      var shirtMap = { atk: 1, def: 2, men: 3, cha: 4, syn: 5, buz: 7 };
      shirtIdx = shirtMap[topStat] % SHIRT.length;
    }

    var blush = Math.min(0.72, 0.28 + cheer * 0.04 + food * 0.05 + soft * 0.03);
    var faceW = 28 + ((seed >>> 20) % 4) + (social >= 2 ? 1 : 0) + (bold >= 3 ? 1 : 0);
    var freckle = food >= 2 || soft >= 2 || (seed >>> 18) % 4 === 0;
    var sparkle = cheer >= 3 || fashion >= 2 || social >= 3;
    var lashes = false;
    var earrings = false;
    var lipGloss = false;
    var softJaw = true;
    var browHeavy = false;
    var makeup = false;
    var faceRound = true;

    if (gender === "f") {
      if (!hairLen) {
        style = [1, 2, 4, 3, 6, 7][(seed >>> 2) % 6];
        if (fashion >= 2 || creative >= 2) style = [2, 3, 6, 7][seed % 4];
        if (calm >= 3) style = (seed % 2) ? 4 : 7;
      } else if (hairLen === "long") style = /포니|하이\s*포니/.test(blob) ? 6 : 4;
      else if (hairLen === "medium") style = 2;
      else if (hairLen === "short") style = 5;
      if (hairColorLock < 0) {
        hairIdx = (4 + (seed % 6)) % HAIR.length;
        if ((seed >>> 5) % 4 === 0) hairIdx = 7;
        if ((seed >>> 6) % 5 === 0) hairIdx = 8;
      }
      if (accLock < 0) {
        accessory = fashion >= 1 || soft >= 2 ? [3, 7, 4][seed % 3] : ((seed % 2 === 0) ? 4 : 6);
        if (music >= 2) accessory = 2;
      }
      blush = Math.min(0.82, blush + 0.16);
      faceW = Math.max(26, faceW - 1);
      freckle = (seed >>> 17) % 3 !== 0;
      sparkle = true;
      lashes = true;
      earrings = true;
      lipGloss = true;
      softJaw = true;
      browHeavy = false;
      makeup = true;
      faceRound = (seed >>> 12) % 3 !== 0;
      accentIdx = [0, 3, 7, 4, 9][(seed >>> 4) % 5];
      if (cheer >= 2) shirtIdx = [4, 7, 5, 8][seed % 4];
    } else if (gender === "m") {
      if (!hairLen) {
        style = [0, 5, 1, 2, 3][(seed >>> 2) % 5];
        if (sport >= 2 || bold >= 2) style = [0, 5][seed % 2];
        if (game >= 2 || tech >= 2) style = [5, 2][seed % 2];
        if (fashion >= 2) style = [1, 3][seed % 2];
      } else if (hairLen === "long") style = 1;
      else if (hairLen === "medium") style = 5;
      else if (hairLen === "short") style = 0;
      if (hairColorLock < 0) {
        hairIdx = (seed % 4);
        if (heat >= 2) hairIdx = 1;
        if (fashion >= 2) hairIdx = [2, 10, 0][seed % 3];
      }
      if (accLock < 0) {
        accessory = (sport >= 2 || bold >= 2) ? 5 : ((tech >= 2 || game >= 2) ? 1 : ((music >= 2) ? 2 : ((seed % 3 === 0) ? 6 : 0)));
      }
      blush = Math.max(0.14, blush - 0.14);
      faceW = Math.min(33, faceW + 2);
      freckle = food >= 3 ? true : ((seed >>> 18) % 5 === 0);
      sparkle = cheer >= 4;
      lashes = false;
      earrings = false;
      lipGloss = false;
      softJaw = false;
      browHeavy = true;
      makeup = false;
      faceRound = false;
      accentIdx = [2, 6, 1, 5, 9][(seed >>> 4) % 5];
      if (sport >= 2) shirtIdx = [2, 6, 0, 11][seed % 4];
    }

    var fieldPulse = 0;
    parts.forEach(function (p, i) {
      if (p) fieldPulse += (hashStr(p) % 7) + i;
    });

    var themeScores = [
      { k: "cheer", n: cheer },
      { k: "calm", n: calm },
      { k: "heat", n: heat },
      { k: "fashion", n: fashion },
      { k: "music", n: music },
      { k: "game", n: game },
      { k: "food", n: food },
      { k: "tech", n: tech },
      { k: "sport", n: sport },
      { k: "soft", n: soft },
      { k: "bold", n: bold },
      { k: "creative", n: creative },
      { k: "social", n: social }
    ].sort(function (a, b) { return b.n - a.n; });

    var vibe = themeScores[0].n >= 2 ? themeScores[0].k : "neutral";
    var vibe2 = themeScores[1].n >= 2 ? themeScores[1].k : "";
    var motifs = [];
    [vibe, vibe2].forEach(function (k) {
      if (!k || k === "neutral") return;
      if (motifs.indexOf(k) === -1) motifs.push(k);
    });
    if (!motifs.length && cheer + soft + social > 0) motifs.push("soft");

    var vibeTint = {
      cheer: ["#fff7e0", "#ffd89a", "#e8a85a"],
      calm: ["#e6f7f5", "#b8e4df", "#6eb8b0"],
      heat: ["#ffe8e4", "#ffb4a8", "#e07868"],
      fashion: ["#fce8f4", "#f4b4d8", "#d478b0"],
      music: ["#ece6ff", "#c8b4f8", "#8a6ad4"],
      game: ["#e0f4ff", "#9ed8f8", "#4aa8d8"],
      food: ["#fff0dc", "#ffc898", "#e89050"],
      tech: ["#e6edf5", "#b8c8d8", "#6a8098"],
      sport: ["#e0f8ea", "#9ee0b8", "#4cb878"],
      soft: ["#fff0f3", "#ffc0cc", "#e8889c"],
      bold: ["#fff0dc", "#ffb878", "#e87830"],
      creative: ["#f2e8ff", "#d4b8f8", "#a078e0"],
      social: ["#fff6d8", "#ffe08a", "#e8c040"],
      neutral: ["#fff8f0", "#eed8c0", "#c8a888"]
    };
    var tint = vibeTint[vibe] || vibeTint.neutral;

    var cuteScore = cheer * 2 + soft * 2 + fashion + food + social + (gender === "f" ? 1 : 0);
    var fierceScore = heat * 2 + bold + sport + game + fierceish * 3 + (vibe === "heat" || vibe === "bold" ? 3 : 0);
    var heroScore = heroish * 3 + calm + tech + creative + bold + (vibe === "calm" || vibe === "bold" ? 2 : 0);
    if (/정의감|영웅|신념|원칙|보호|책임/.test(blob)) heroScore += 4;
    if (/화남|짜증|질주|폭발|독보|반항|카카/.test(blob)) fierceScore += 4;
    if (/귀여|애교|리액션|칭찬|달달|설렘|핑크/.test(blob)) cuteScore += 4;

    /* 키워드 페르소나: 상남자 / 깡패 / 아이돌 / 모범생 / 스포츠 / 아티스트 / 게이머 */
    var personaScores = { macho: 0, gangster: 0, idol: 0, scholar: 0, athlete: 0, artist: 0, gamer: 0 };
    if (/상남자|마초|터프\s*가이|터프가이|남성미|근육남|늑대남|남자다운|허슬\s*남|터프한|상남자미|남자다움/.test(blob)) personaScores.macho += 12;
    if (/깡패|조폭|양아치|불량|일진|문신|타투|삐딱|불량배|갱스터|gangster|야쿠자|조폭\s*스타일|다크\s*카리스마/.test(blob)) personaScores.gangster += 12;
    if (/아이돌|센터|비주얼|연습생|케이팝|k-?pop|팬덤|돌상|메인보컬|메인댄서|아이돌돌|무대\s*체질|팬미팅|응원봉/.test(blob)) personaScores.idol += 12;
    if (/모범생|공부\s*잘|우등생|책벌레|도서관|성적|시험\s*만점|지적|똑똑|학구|독서\s*좋아|안경\s*쓴\s*모범/.test(blob)) personaScores.scholar += 11;
    if (/운동선수|체육|축구\s*부|농구\s*부|헬스\s*중독|스포츠맨|달리기\s*잘|운동\s*광|체대|선수\s*꿈/.test(blob)) personaScores.athlete += 11;
    if (/그림\s*그리|화가|일러스트|디자인\s*좋아|예술\s*혼|감성\s*충만|창작\s*욕구|아티스트|스케치|페인팅/.test(blob)) personaScores.artist += 11;
    if (/게이머|게임\s*고수|랭크\s*올리는|롤\s*중독|배그\s*광|게임\s*폐인|프로게이머|e\s*스포츠|이스포츠/.test(blob)) personaScores.gamer += 11;
    if (/걸크러시|걸크러쉬|걸크/.test(blob)) { personaScores.macho += 4; personaScores.idol += 3; }
    if (/보이시|톰보이/.test(blob)) personaScores.macho += 5;
    personaScores.scholar += Math.min(6, Math.floor(tech / 2) + Math.floor(calm / 2));
    personaScores.athlete += Math.min(6, Math.floor(sport / 1.5));
    personaScores.artist += Math.min(6, Math.floor(creative / 1.5) + Math.floor(fashion / 2));
    personaScores.gamer += Math.min(6, Math.floor(game / 1.5));
    var persona = "";
    var personaBest = 0;
    Object.keys(personaScores).forEach(function (k) {
      if (personaScores[k] > personaBest) { personaBest = personaScores[k]; persona = k; }
    });
    if (personaBest < 8) persona = "";

    var look = "cute";
    if (persona === "macho") look = "macho";
    else if (persona === "gangster") look = "gangster";
    else if (persona === "idol") look = "idol";
    else if (persona === "scholar") look = "scholar";
    else if (persona === "athlete") look = "athlete";
    else if (persona === "artist") look = "artist";
    else if (persona === "gamer") look = "gamer";
    else if (fierceScore >= cuteScore && fierceScore >= heroScore && fierceScore >= 4) look = "fierce";
    else if (heroScore >= cuteScore && heroScore >= fierceScore && heroScore >= 4) look = "hero";
    else if (sport >= 4 && sport >= soft && sport >= tech) look = "athlete";
    else if (creative >= 4 && creative >= bold) look = "artist";
    else if (game >= 4 && game >= fashion) look = "gamer";
    else if (tech >= 3 && calm >= 2 && cheer < 3) look = "scholar";
    else if (calm >= 4 && soft >= 2 && heat < 2) look = "soft";
    else if ((tech >= 3 || game >= 3) && cheer < 2 && soft < 2) look = "cool";
    else if (cuteScore < 3 && bold >= 4 && heat < 2) look = "hero";
    else if (cuteScore < 3 && (heat >= 3 || sport >= 4)) look = "fierce";
    else if (cuteScore < 2 && (seed % 5 === 0)) look = "cool";
    else if (cuteScore < 2 && (seed % 5 === 1)) look = "soft";

    if (look === "macho") {
      if (eyesLock < 0) eyes = 3;
      if (mouthLock < 0) mouth = 1;
      blush = Math.max(0.1, blush - 0.22);
      sparkle = false;
      if (freckleLock == null) freckle = false;
      faceW = Math.min(34, faceW + 2);
      if (!hairLen) style = gender === "f" ? 5 : 0;
      else if (hairLen === "long" && gender === "f") style = 4;
      if (hairColorLock < 0) hairIdx = 0;
      if (accLock < 0) accessory = 5;
      shirtIdx = 0;
      accentIdx = 6;
      tint = ["#f5ebe0", "#e0cbb4", "#b89572"];
      softJaw = false;
      browHeavy = true;
      faceRound = false;
      lipGloss = false;
      makeup = gender === "f";
      lashes = gender === "f";
      earrings = false;
      vibe = "bold";
      if (motifs.indexOf("bold") === -1) motifs.unshift("bold");
      if (motifs.indexOf("sport") === -1) motifs.push("sport");
    } else if (look === "gangster") {
      if (eyesLock < 0) eyes = 3;
      if (mouthLock < 0) mouth = 0;
      blush = Math.max(0.08, blush - 0.28);
      sparkle = false;
      if (freckleLock == null) freckle = false;
      faceW = Math.min(34, faceW + 1);
      if (!hairLen) style = 5;
      if (hairColorLock < 0) hairIdx = 0;
      if (accLock < 0) accessory = 1;
      shirtIdx = 1;
      accentIdx = 1;
      tint = ["#efe8e1", "#d4c4b6", "#9a8574"];
      softJaw = false;
      browHeavy = true;
      faceRound = false;
      lipGloss = gender === "f";
      makeup = gender === "f";
      lashes = gender === "f";
      earrings = gender === "f";
      vibe = "heat";
      if (motifs.indexOf("heat") === -1) motifs.unshift("heat");
      if (motifs.indexOf("bold") === -1) motifs.push("bold");
    } else if (look === "idol") {
      if (eyesLock < 0) eyes = 0;
      if (mouthLock < 0) mouth = 3;
      blush = Math.min(0.88, blush + 0.22);
      sparkle = true;
      if (freckleLock == null) freckle = false;
      faceW = Math.max(26, faceW - (gender === "m" ? 1 : 2));
      if (!hairLen) style = gender === "f" ? ((seed % 2) ? 2 : 4) : 5;
      else if (hairLen === "long") style = gender === "f" ? 4 : 1;
      else if (hairLen === "short") style = gender === "f" ? 5 : 0;
      else if (hairLen === "medium") style = gender === "f" ? 2 : 5;
      if (hairColorLock < 0) hairIdx = gender === "f" ? [7, 4, 5][seed % 3] : [2, 5, 0][seed % 3];
      if (accLock < 0) accessory = gender === "f" ? 3 : 2;
      shirtIdx = gender === "f" ? [4, 7, 5][seed % 3] : [3, 5, 0][seed % 3];
      accentIdx = [3, 7, 0, 4][seed % 4];
      tint = ["#fff0f7", "#fce7f3", "#e9d5ff"];
      softJaw = true;
      browHeavy = false;
      faceRound = true;
      lipGloss = true;
      makeup = true;
      lashes = true;
      earrings = gender !== "m";
      vibe = "fashion";
      if (motifs.indexOf("fashion") === -1) motifs.unshift("fashion");
      if (motifs.indexOf("cheer") === -1) motifs.push("cheer");
      if (motifs.indexOf("music") === -1) motifs.push("music");
    } else if (look === "scholar") {
      if (eyesLock < 0) eyes = 2;
      if (mouthLock < 0) mouth = 1;
      blush = Math.max(0.16, blush - 0.08);
      sparkle = false;
      if (!hairLen) style = gender === "f" ? 2 : 5;
      if (hairColorLock < 0) hairIdx = gender === "f" ? [1, 10, 2][seed % 3] : [0, 1, 10][seed % 3];
      if (accLock < 0) accessory = 1;
      shirtIdx = [3, 0, 6][seed % 3];
      accentIdx = 2;
      tint = ["#eef2ff", "#c7d2fe", "#94a3b8"];
      softJaw = true;
      browHeavy = false;
      faceRound = gender === "f";
      lipGloss = gender === "f";
      makeup = gender === "f";
      lashes = gender === "f";
      earrings = false;
      vibe = "tech";
      if (motifs.indexOf("tech") === -1) motifs.unshift("tech");
      if (motifs.indexOf("calm") === -1) motifs.push("calm");
    } else if (look === "athlete") {
      if (eyesLock < 0) eyes = 3;
      if (mouthLock < 0) mouth = cheer >= 2 ? 3 : 2;
      blush = Math.min(0.7, blush + 0.1);
      sparkle = false;
      if (!hairLen) style = gender === "f" ? 5 : 0;
      if (hairColorLock < 0) hairIdx = seed % 3;
      if (accLock < 0) accessory = 5;
      shirtIdx = [11, 2, 6][seed % 3];
      accentIdx = 6;
      tint = ["#ecfdf5", "#a7f3d0", "#34d399"];
      softJaw = gender === "f";
      browHeavy = gender === "m";
      faceRound = false;
      lipGloss = false;
      makeup = gender === "f";
      lashes = gender === "f";
      earrings = false;
      vibe = "sport";
      if (motifs.indexOf("sport") === -1) motifs.unshift("sport");
      if (motifs.indexOf("bold") === -1) motifs.push("bold");
    } else if (look === "artist") {
      if (eyesLock < 0) eyes = 0;
      if (mouthLock < 0) mouth = 2;
      blush = Math.min(0.78, blush + 0.12);
      sparkle = true;
      if (!hairLen) style = gender === "f" ? [7, 6, 3][seed % 3] : [3, 1][seed % 2];
      if (hairColorLock < 0) hairIdx = [11, 7, 9, 4][seed % 4];
      if (accLock < 0) accessory = gender === "f" ? 7 : 6;
      shirtIdx = [5, 9, 4][seed % 3];
      accentIdx = [5, 7, 3][seed % 3];
      tint = ["#faf5ff", "#e9d5ff", "#c4b5fd"];
      softJaw = true;
      browHeavy = false;
      faceRound = true;
      lipGloss = true;
      makeup = true;
      lashes = gender !== "m";
      earrings = gender === "f";
      vibe = "creative";
      if (motifs.indexOf("creative") === -1) motifs.unshift("creative");
      if (motifs.indexOf("fashion") === -1) motifs.push("fashion");
    } else if (look === "gamer") {
      if (eyesLock < 0) eyes = 2;
      if (mouthLock < 0) mouth = 1;
      blush = Math.max(0.14, blush - 0.1);
      sparkle = false;
      if (!hairLen) style = gender === "f" ? 5 : 2;
      if (hairColorLock < 0) hairIdx = [4, 9, 0, 6][seed % 4];
      if (accLock < 0) accessory = 2;
      shirtIdx = [0, 5, 3][seed % 3];
      accentIdx = 2;
      tint = ["#e0f2fe", "#7dd3fc", "#38bdf8"];
      softJaw = gender !== "m";
      browHeavy = false;
      faceRound = gender === "f";
      lipGloss = gender === "f";
      makeup = gender === "f";
      lashes = gender === "f";
      earrings = false;
      vibe = "game";
      if (motifs.indexOf("game") === -1) motifs.unshift("game");
      if (motifs.indexOf("tech") === -1) motifs.push("tech");
    } else if (look === "cool") {
      if (eyesLock < 0) eyes = 1;
      if (mouthLock < 0) mouth = 1;
      blush = Math.max(0.12, blush - 0.16);
      sparkle = false;
      if (!hairLen) style = gender === "f" ? 5 : 5;
      if (hairColorLock < 0) hairIdx = [2, 6, 10][seed % 3];
      if (accLock < 0) accessory = (seed % 2) ? 1 : 0;
      shirtIdx = [0, 6, 3][seed % 3];
      tint = ["#f1f5f9", "#cbd5e1", "#64748b"];
      softJaw = false;
      browHeavy = true;
      faceRound = false;
      lipGloss = false;
      makeup = gender === "f";
      lashes = gender === "f";
      earrings = false;
      vibe = vibe === "neutral" ? "tech" : vibe;
    } else if (look === "soft") {
      if (eyesLock < 0) eyes = 0;
      if (mouthLock < 0) mouth = 2;
      blush = Math.min(0.88, blush + 0.18);
      sparkle = true;
      if (!hairLen) style = gender === "f" ? 7 : 1;
      if (hairColorLock < 0) hairIdx = gender === "f" ? [7, 8, 1][seed % 3] : [1, 10, 2][seed % 3];
      if (accLock < 0) accessory = gender === "f" ? 4 : 0;
      tint = ["#fff1f2", "#fecdd3", "#fda4af"];
      softJaw = true;
      browHeavy = false;
      faceRound = true;
      lipGloss = gender !== "m";
      makeup = gender !== "m";
      lashes = gender !== "m";
      earrings = gender === "f";
      vibe = "soft";
      if (motifs.indexOf("soft") === -1) motifs.unshift("soft");
    } else if (look === "fierce") {
      if (eyesLock < 0) eyes = heat >= 3 ? 3 : 0;
      if (mouthLock < 0) mouth = heat >= 4 ? 0 : 1;
      blush = Math.max(0.12, blush - 0.2);
      sparkle = false;
      faceW = Math.min(34, faceW + 1);
      if (accLock < 0) accessory = sport >= 2 ? 5 : (game >= 2 ? 1 : accessory);
      tint = ["#fff1f0", "#ffd4ce", "#f0a8a0"];
      softJaw = gender !== "m" ? softJaw : false;
      browHeavy = true;
      faceRound = false;
    } else if (look === "hero") {
      if (eyesLock < 0) eyes = 0;
      if (mouthLock < 0) mouth = calm >= 2 ? 1 : 2;
      blush = Math.max(0.18, blush - 0.15);
      sparkle = false;
      lashes = gender === "f";
      earrings = false;
      faceW = Math.max(27, faceW - 1);
      if (!hairLen) style = gender === "f" ? ((seed % 2) ? 4 : 5) : 0;
      else if (hairLen === "long") style = gender === "f" ? 4 : 1;
      else if (hairLen === "short") style = gender === "f" ? 5 : 0;
      if (accLock < 0) accessory = tech >= 2 || creative >= 2 ? 1 : 0;
      tint = ["#f7f0e4", "#e8d8c0", "#cbb896"];
      shirtIdx = [0, 3, 1][seed % 3];
      browHeavy = gender === "m" || browHeavy;
      softJaw = gender === "f";
      faceRound = gender === "f";
      lipGloss = gender === "f";
      makeup = gender === "f";
    } else {
      blush = Math.min(0.85, blush + 0.08);
      sparkle = true;
      if (mouthLock < 0 && mouth < 2 && cheer >= 1) mouth = 2;
      if (gender === "f") {
        lipGloss = true;
        makeup = true;
        softJaw = true;
        faceRound = true;
      }
    }

    /* Gender hard lock — never opposite after look tweaks */
    if (gender === "m") {
      lashes = look === "idol" || look === "artist";
      earrings = false;
      lipGloss = look === "idol" || look === "artist";
      makeup = look === "idol" || look === "artist";
      browHeavy = look !== "idol" && look !== "artist" && look !== "soft";
      softJaw = look === "idol" || look === "artist" || look === "soft" || look === "scholar";
      faceRound = look === "idol" || look === "soft";
      if (look === "macho" || look === "gangster" || look === "athlete") {
        softJaw = false;
        faceRound = false;
        browHeavy = true;
      }
      if (hairLen === "long") style = 1;
      else if (hairLen === "medium") style = 5;
      else if (hairLen === "short") style = 0;
      else {
        if (style === 4 || style === 6 || style === 7) style = [0, 5, 1, 2, 3][seed % 5];
        if (look === "gangster") style = 5;
        if (look === "macho") style = 0;
        if (look === "idol") style = 5;
        if (look === "athlete") style = 0;
        if (look === "gamer") style = 2;
        if (look === "scholar") style = 5;
        if (look === "artist") style = 3;
      }
    } else if (gender === "f") {
      lashes = true;
      if (look !== "hero" && look !== "macho" && look !== "athlete" && look !== "scholar") earrings = true;
      if (look === "macho" || look === "athlete") earrings = false;
      lipGloss = look !== "macho" && look !== "athlete";
      makeup = true;
      softJaw = look !== "macho" && look !== "gangster" && look !== "athlete";
      faceRound = look === "idol" || look === "cute" || look === "soft" || look === "artist";
      browHeavy = look === "fierce" || look === "macho" || look === "gangster" || look === "cool";
      if (hairLen === "long") style = /포니|하이\s*포니/.test(blob) ? 6 : 4;
      else if (hairLen === "medium") style = 2;
      else if (hairLen === "short") style = 5;
      else {
        if (style === 0 || style === 1) style = [2, 4, 3, 6, 7][seed % 5];
        if (look === "idol") style = [2, 4, 6][seed % 3];
        if (look === "macho") style = 5;
        if (look === "gangster") style = 5;
        if (look === "artist") style = [7, 6, 3][seed % 3];
        if (look === "soft") style = 7;
        if (look === "athlete") style = 5;
        if (look === "scholar") style = 2;
      }
    }

    /* 바이브별 실루엣 — 텍스트 락이 있으면 덮지 않음 */
    if (!persona) {
      if (vibe === "music") {
        if (accLock < 0) accessory = 2;
        if (!hairLen) { if (gender !== "m") style = 3; else style = 5; }
        accentIdx = 3;
      } else if (vibe === "sport") {
        if (accLock < 0) accessory = 5;
        if (!hairLen) style = gender === "f" ? 5 : 0;
        shirtIdx = 2;
      } else if (vibe === "game" || vibe === "tech") {
        if (accLock < 0) accessory = 1;
        if (!hairLen) style = 5;
        tint = vibeTint.tech;
      } else if (vibe === "fashion") {
        if (accLock < 0) accessory = 3;
        if (!hairLen) style = gender === "f" ? 2 : 5;
        if (hairColorLock < 0 && gender === "f") hairIdx = 7;
      } else if (vibe === "food") {
        if (accLock < 0) accessory = 4;
        if (freckleLock == null) freckle = true;
      } else if (vibe === "heat" || vibe === "bold") {
        if (!hairLen) style = gender === "f" ? 5 : 0;
        browHeavy = true;
      } else if (vibe === "soft" || vibe === "cheer") {
        sparkle = true;
        if (!hairLen && gender === "f") style = 4;
      }
    }

    /* 텍스트 특징 최종 하드락 — 성별·문장 키워드가 최우선 */
    if (hairColorLock >= 0) hairIdx = hairColorLock % HAIR.length;
    if (hairLen === "long") style = gender === "m" ? 1 : (/포니|하이\s*포니/.test(blob) ? 6 : 4);
    else if (hairLen === "medium") style = gender === "m" ? 5 : 2;
    else if (hairLen === "short") style = gender === "m" ? 0 : 5;
    if (accLock >= 0) accessory = accLock;
    if (mouthLock >= 0) mouth = mouthLock;
    if (eyesLock >= 0) eyes = eyesLock;
    if (skinLock >= 0) skinIdx = skinLock;
    if (freckleLock != null) freckle = !!freckleLock;
    if (beardHint && gender !== "f") {
      browHeavy = true;
      softJaw = false;
      faceRound = false;
    }
    if (makeupHint) {
      makeup = true;
      lipGloss = true;
      if (gender !== "m") lashes = true;
    }
    if (gender === "m") {
      if (look !== "idol" && look !== "artist") { lashes = false; earrings = false; }
      if (look !== "idol" && look !== "artist" && !makeupHint) { lipGloss = false; makeup = false; }
    } else if (gender === "f") {
      lashes = true;
      makeup = true;
    }

    return {
      seed: (seed + fieldPulse) >>> 0,
      mood: mood,
      gender: gender,
      _blob: blob,
      look: look,
      persona: persona,
      vibe: vibe,
      vibe2: vibe2,
      motifs: motifs,
      tint: tint,
      mouth: mouth,
      eyes: eyes,
      accessory: accessory,
      style: style,
      hairIdx: hairColorLock >= 0 ? (hairColorLock % HAIR.length) : ((hairIdx + (fieldPulse % 5) + ((seed >>> 9) % 3)) % HAIR.length),
      skinIdx: (function () {
        if (skinLock >= 0) return skinLock % SKIN.length;
        if (/검은\s*피부|어두운\s*피부|탄\s*피부|dark\s*skin|brown\s*skin|흑인/.test(blob)) return skinIdx % SKIN.length;
        if (/황\s*피부|노란\s*피부|밀색|wheat|olive/.test(blob)) return Math.min(5, Math.max(2, skinIdx % SKIN.length));
        /* 시드 기반 다양성: 밝은~중간 톤 위주, 가끔 깊은 톤 */
        var roll = (seed >>> 3) % 10;
        if (roll <= 4) return roll % 3;
        if (roll <= 7) return 2 + (roll % 3);
        return 4 + (roll % 3);
      })(),
      accentIdx: (accentIdx + ((seed >>> 11) % 2)) % ACCENT.length,
      shirtIdx: (shirtIdx + ((seed >>> 7) % 2)) % SHIRT.length,
      freckle: freckle,
      blush: blush,
      faceW: faceW,
      sparkle: sparkle || vibe === "cheer" || vibe === "fashion" || look === "idol" || look === "soft" || look === "artist",
      lashes: lashes,
      earrings: earrings,
      lipGloss: lipGloss,
      softJaw: softJaw,
      browHeavy: browHeavy,
      makeup: makeup,
      faceRound: faceRound,
      highlight: 0.12 + Math.min(0.12, lenBoost * 0.008) + (gender === "f" ? 0.03 : 0) + (look === "cute" || look === "idol" || look === "soft" ? 0.04 : 0)
    };
  }

  function statPower(stats) {
    var total = 0;
    var topKey = "cha";
    var topVal = -1;
    var keys = ["atk", "def", "men", "cha", "syn", "buz"];
    for (var i = 0; i < keys.length; i++) {
      var v = (stats && stats[keys[i]]) || 0;
      total += v;
      if (v > topVal) { topVal = v; topKey = keys[i]; }
    }
    var avg = total / 6;
    var pct = Math.max(0, Math.min(100, Math.round(avg)));
    /* 스탯↑ → 티어↑ → 커스터마이징 (문장 채울수록 빨리 올라감) */
    var tier = 1;
    var label = "기본 스타일";
    var color = "#94a3b8";
    if (avg >= 76) { tier = 5; label = "풀 커스텀"; color = "#fbbf24"; }
    else if (avg >= 60) { tier = 4; label = "하이엔드"; color = "#f59e0b"; }
    else if (avg >= 44) { tier = 3; label = "스타일 업"; color = "#c96442"; }
    else if (avg >= 28) { tier = 2; label = "포인트 추가"; color = "#0d9488"; }
    else { tier = 1; label = "기본 스타일"; color = "#94a3b8"; }
    return {
      total: total,
      avg: Math.round(avg),
      pct: pct,
      tier: tier,
      label: label,
      color: color,
      topKey: topKey,
      topVal: topVal
    };
  }

  function buildAvatarSvg(traits, power) {
    traits = traits || {};
    power = power || { tier: 1, color: "#94a3b8" };
    var tier = power.tier || 1;
    var gender = traits.gender || "";
    var look = traits.look || "cute";
    var vibe = traits.vibe || "neutral";
    var style = traits.style | 0;
    var eyesT = traits.eyes | 0;
    var mouthT = traits.mouth | 0;
    var acc = traits.accessory | 0;
    var persona = traits.persona || "";
    if (!persona) {
      if (look === "macho") persona = "macho";
      else if (look === "gangster") persona = "gangster";
      else if (look === "idol") persona = "idol";
      else if (look === "scholar") persona = "scholar";
      else if (look === "athlete") persona = "athlete";
      else if (look === "artist") persona = "artist";
      else if (look === "gamer") persona = "gamer";
    }
    var hair = HAIR[(traits.hairIdx || 0) % HAIR.length];
    var skin = SKIN[(traits.skinIdx || 0) % SKIN.length];
    var accent = ACCENT[(traits.accentIdx || 0) % ACCENT.length];
    var shirt = SHIRT[(traits.shirtIdx || 0) % SHIRT.length];
    var tint = traits.tint || ["#fffaf3", "#f4e6d6", "#dcc9b4"];
    var uid = "av" + String((traits.seed || 1) >>> 0);
    var blushA = Math.max(0.14, Math.min(0.72, (traits.blush || 0.35) * 0.85));
    var faceW = Math.max(26, Math.min(32, (traits.faceW || 30) - 1));
    var softJaw = traits.softJaw !== false;
    var faceRound = traits.faceRound !== false;
    var browHeavy = !!traits.browHeavy;
    var lashes = !!traits.lashes;
    var earrings = !!traits.earrings;
    var lipGloss = !!traits.lipGloss;
    var makeup = !!traits.makeup;
    var freckle = !!traits.freckle;
    var sparkle = !!traits.sparkle;
    var motifs = traits.motifs || [];

    if (gender === "m") { lashes = false; earrings = false; lipGloss = false; softJaw = false; faceRound = false; browHeavy = true; }
    if (gender === "f") { lashes = true; softJaw = true; faceRound = true; }
    /* 성별 미지정: 과장된 마초 눈썹·플라스틱 하이라이트 방지 */
    if (!gender) {
      browHeavy = false;
      softJaw = true;
      faceRound = true;
      blushA = Math.min(0.35, blushA);
    }

    var isF = gender === "f";
    var isM = gender === "m";
    /* 스탯 티어↑ → 커스터마이징 (성별 없어도 티어 반영) */
    var styleLv = Math.max(1, Math.min(5, tier | 0));
    var glam = isF ? styleLv : (!isM ? styleLv : 0);
    var groom = isM ? styleLv : (!isF ? styleLv : 0);
    var DYE = [
      { base: "#4c0519", mid: "#9f1239", light: "#fb7185" },
      { base: "#1e1b4b", mid: "#4338ca", light: "#a5b4fc" },
      { base: "#78350f", mid: "#d97706", light: "#fde68a" },
      { base: "#831843", mid: "#db2777", light: "#f9a8d4" },
      { base: "#312e81", mid: "#7c3aed", light: "#ddd6fe" },
      { base: "#164e63", mid: "#0891b2", light: "#a5f3fc" }
    ];
    var dyePick = DYE[((traits.seed || 1) >>> 3) % DYE.length];
    /* 여자·미지정: 티어별 치장 */
    if (glam >= 3) {
      hair = glam >= 5
        ? { base: dyePick.base, mid: dyePick.mid, light: dyePick.light }
        : glam >= 4
        ? { base: hair.base, mid: dyePick.mid, light: dyePick.light }
        : { base: hair.base, mid: hair.mid, light: dyePick.light };
    }
    if (glam > 0) {
      lashes = true;
      earrings = glam >= 2;
      lipGloss = glam >= 2;
      makeup = glam >= 2;
      blushA = Math.min(0.82, 0.22 + glam * 0.1);
      sparkle = glam >= 3 || sparkle;
    }
    /* 남자·미지정: 티어별 그루밍 */
    if (groom > 0 && isM) {
      if (persona === "macho" || persona === "gangster" || look === "macho" || look === "gangster") {
        softJaw = false;
        faceRound = false;
        browHeavy = true;
        blushA = Math.min(0.22, blushA);
      } else {
        softJaw = groom >= 3 || persona === "idol";
        faceRound = groom >= 4 || persona === "idol";
        browHeavy = groom <= 2 && persona !== "idol";
        blushA = Math.min(0.38, Math.max(0.12, blushA * 0.55 + groom * 0.03));
      }
    } else if (groom > 0 && !isF) {
      softJaw = groom >= 3;
      faceRound = groom >= 4;
      browHeavy = groom <= 2;
    }
    if (persona === "idol" || look === "idol") {
      sparkle = true;
      if (isF || glam > 0) { lashes = true; lipGloss = true; }
    }
    if ((persona === "gangster" || look === "gangster") && acc !== 1) acc = 1;
    /* 인물 초상 비율 — 실제 얼굴에 가깝게 */
    var faceRx = isM
      ? 28 + Math.min(1.2, groom * 0.2) + (persona === "macho" || look === "macho" ? 0.8 : 0)
      : 27.2 + (persona === "idol" || look === "idol" ? 0.4 : 0) + glam * 0.08;
    var faceRy = isM
      ? (softJaw ? 33.5 : 34.8) + groom * 0.15
      : (softJaw ? 33.2 : 34.2) + glam * 0.1;
    var cx = 60;
    var cy = 52;
    var eyeY = cy - 2.8;
    var eyeOpen = eyesT === 1 ? 1.2 : eyesT === 3 ? 3.2 : (isF ? 3.35 : 2.95);
    if (look === "idol" || persona === "idol") eyeOpen += 0.2;
    if (look === "macho" || persona === "macho") eyeOpen = Math.max(2.6, eyeOpen - 0.2);
    if (look === "gangster" || persona === "gangster") eyeOpen = Math.max(2.5, eyeOpen - 0.1);
    var eyeRx = isF ? (look === "idol" ? 4.8 : 4.5) : (look === "macho" ? 4.1 : 4.3);
    var eyeGap = isF ? 11.2 : 11.6;
    var mouthY = cy + 15.5;

    function hairBack() {
      var hb = hair.base, hm = hair.mid, hl = hair.light;
      if (isM) {
        var vol = Math.max(1, groom || 1);
        /* style: 0 buzz · 1 medium · 2 messy · 3 center-long · 5 side/undercut */
        if (style === 0) {
          return (
            '<path d="M32 52 C34 28 44 18 60 17 C76 18 86 28 88 52 C86 38 74 30 60 29 C46 30 34 38 32 52Z" fill="url(#' + uid + 'hg)"/>' +
            '<path d="M38 40 C46 28 74 28 82 40" fill="' + hm + '" opacity=".5"/>'
          );
        }
        if (style === 2) {
          return (
            '<path d="M28 58 C26 32 40 14 60 12 C80 14 94 32 92 58 C90 40 74 26 60 25 C46 26 30 40 28 58Z" fill="url(#' + uid + 'hg)"/>' +
            '<path d="M30 48 C38 28 50 22 58 30" fill="' + hb + '" opacity=".55"/>' +
            '<path d="M90 48 C82 28 70 22 62 30" fill="' + hb + '" opacity=".55"/>' +
            '<path d="M42 30 C52 16 68 16 78 30" fill="none" stroke="' + hl + '" stroke-width="2.4" opacity=".4"/>'
          );
        }
        if (style === 3) {
          return (
            '<path d="M30 56 C28 30 42 12 60 10 C78 12 92 30 90 56 C92 78 86 100 80 108 C70 90 64 82 60 82 C56 82 50 90 40 108 C34 100 28 78 30 56Z" fill="url(#' + uid + 'hg)"/>' +
            '<path d="M36 70 C42 94 78 94 84 70" fill="none" stroke="' + hl + '" stroke-width="2.2" opacity=".22"/>'
          );
        }
        if (style === 5) {
          return (
            '<path d="M34 54 C36 26 48 16 62 15 C78 16 90 28 90 54 C88 36 74 28 62 27 C48 28 36 38 34 54Z" fill="url(#' + uid + 'hg)"/>' +
            '<path d="M70 28 C82 24 92 36 94 58 C92 44 84 34 74 32" fill="' + hb + '" opacity=".65"/>' +
            '<path d="M40 36 C50 26 60 28 66 34" fill="none" stroke="' + hl + '" stroke-width="2" opacity=".45"/>'
          );
        }
        var topY = 15 - vol * 1.15;
        var sideOut = 27 - vol * 1.5;
        var sideHi = 50 + vol * 3.4;
        var dens = 0.38 + vol * 0.1;
        var layers = "";
        layers += '<path d="M' + sideOut + ' ' + sideHi + ' C' + (sideOut - 2) + ' 28 ' + (40 - vol) + ' ' + (topY + 2) + ' 60 ' + topY + ' C' + (80 + vol) + ' ' + (topY + 2) + ' ' + (122 - sideOut) + ' 28 ' + (120 - sideOut) + ' ' + sideHi + ' C' + (118 - sideOut) + ' 38 74 ' + (28 - vol * 0.4) + ' 60 ' + (27 - vol * 0.3) + ' C46 ' + (28 - vol * 0.4) + ' ' + (sideOut + 2) + ' 38 ' + sideOut + ' ' + sideHi + 'Z" fill="url(#' + uid + 'hg)"/>';
        if (vol >= 2) {
          layers += '<path d="M' + (sideOut + 4) + ' 42 C' + (40 - vol) + ' ' + (20 - vol * 0.5) + ' ' + (80 + vol) + ' ' + (20 - vol * 0.5) + ' ' + (116 - sideOut) + ' 42" fill="' + hm + '" opacity="' + dens + '"/>';
        }
        if (vol >= 3) {
          layers += '<path d="M' + (sideOut + 2) + ' 56 C' + (sideOut - 1) + ' 34 44 22 60 21 C76 22 ' + (121 - sideOut) + ' 34 ' + (118 - sideOut) + ' 56" fill="' + hb + '" opacity=".45"/>';
          layers += '<path d="M36 46 C44 30 52 26 60 26 C68 26 76 30 84 46" fill="none" stroke="' + hl + '" stroke-width="' + (1.9 + vol * 0.35) + '" opacity=".48"/>';
        }
        if (vol >= 4) {
          layers += '<path d="M31 60 C29 46 37 36 45 34" fill="' + hm + '" opacity=".52"/>';
          layers += '<path d="M89 60 C91 46 83 36 75 34" fill="' + hm + '" opacity=".52"/>';
        }
        return layers;
      }
      /* 여자: glam에 따라 볼륨·실루엣 강화 */
      var g = Math.max(1, glam || 1);
      var out = 24 - g * 0.8;
      var top = 12 - g * 0.45;
      if (style === 0 || style === 5) {
        return (
          '<path d="M' + (out + 4) + ' 56 C' + (out + 2) + ' 26 42 ' + top + ' 60 ' + (top - 1) + ' C78 ' + top + ' ' + (116 - out) + ' 26 ' + (112 - out) + ' 56 C' + (110 - out) + ' 40 74 32 60 31 C46 32 ' + (out + 6) + ' 40 ' + (out + 4) + ' 56Z" fill="url(#' + uid + 'hg)"/>' +
          '<path d="M34 38 C42 24 52 20 60 20 C68 20 78 24 86 38" fill="' + hm + '" opacity=".58"/>' +
          '<path d="M38 32 C48 22 72 22 82 32" fill="none" stroke="' + hl + '" stroke-width="2.3" opacity=".42"/>' +
          (g >= 3 ? '<path d="M32 50 C36 34 48 28 60 28 C72 28 84 34 88 50" fill="none" stroke="' + hl + '" stroke-width="2" opacity=".28"/>' : "")
        );
      }
      if (style === 3) {
        return (
          '<path d="M' + out + ' 48 C' + (out - 2) + ' 24 42 ' + (top + 1) + ' 60 ' + top + ' C78 ' + (top + 1) + ' ' + (122 - out) + ' 24 ' + (120 - out) + ' 48 C' + (124 - out) + ' 72 ' + (118 - out) + ' 100 ' + (112 - out) + ' 110 C70 84 60 78 60 78 C60 78 50 84 ' + (out + 14) + ' 110 C' + (out + 6) + ' 100 ' + (out - 2) + ' 72 ' + out + ' 48Z" fill="url(#' + uid + 'hg)"/>' +
          '<path d="M36 76 C32 94 34 108 38 112" stroke="' + hb + '" stroke-width="' + (7.5 + g * 0.4) + '" fill="none" stroke-linecap="round"/>' +
          '<path d="M84 76 C88 94 86 108 82 112" stroke="' + hb + '" stroke-width="' + (7.5 + g * 0.4) + '" fill="none" stroke-linecap="round"/>' +
          '<path d="M36 76 C32 94 34 108 38 112" stroke="' + hl + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".42"/>'
        );
      }
      if (style === 2) {
        return (
          '<path d="M' + (out + 2) + ' 46 C' + out + ' 24 44 ' + (top + 1) + ' 60 ' + (top + 1) + ' C76 ' + (top + 1) + ' ' + (120 - out) + ' 24 ' + (118 - out) + ' 46 C' + (120 - out) + ' 66 ' + (114 - out) + ' 76 ' + (108 - out) + ' 80 C74 68 66 64 60 64 C54 64 46 68 ' + (out + 14) + ' 80 C' + (out + 8) + ' 76 ' + out + ' 66 ' + (out + 2) + ' 46Z" fill="url(#' + uid + 'hg)"/>' +
          '<circle cx="34" cy="42" r="' + (8.5 + g * 0.35) + '" fill="' + hm + '"/><circle cx="86" cy="42" r="' + (8.5 + g * 0.35) + '" fill="' + hm + '"/>' +
          '<circle cx="34" cy="40" r="3" fill="' + hl + '" opacity=".48"/><circle cx="86" cy="40" r="3" fill="' + hl + '" opacity=".48"/>'
        );
      }
      if (style === 6) {
        /* 하이 포니테일 */
        return (
          '<path d="M' + (out + 4) + ' 50 C' + (out + 2) + ' 24 44 ' + top + ' 60 ' + (top - 1) + ' C76 ' + top + ' ' + (118 - out) + ' 24 ' + (116 - out) + ' 50 C' + (114 - out) + ' 40 74 30 60 29 C46 30 ' + (out + 6) + ' 40 ' + (out + 4) + ' 50Z" fill="url(#' + uid + 'hg)"/>' +
          '<ellipse cx="78" cy="22" rx="10" ry="8" fill="' + hm + '"/>' +
          '<path d="M78 26 C86 40 90 70 88 108" stroke="' + hb + '" stroke-width="' + (10 + g * 0.5) + '" fill="none" stroke-linecap="round"/>' +
          '<path d="M78 26 C86 40 90 70 88 108" stroke="' + hl + '" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".4"/>' +
          '<circle cx="76" cy="20" r="3.2" fill="' + accent + '" opacity=".85"/>'
        );
      }
      if (style === 7) {
        /* 웨이브 롱 + 사이드뱅 */
        return (
          '<path d="M' + out + ' 48 C' + (out - 2) + ' 22 40 ' + (top - 1) + ' 60 ' + (top - 2) + ' C80 ' + (top - 1) + ' ' + (122 - out) + ' 22 ' + (120 - out) + ' 48 C' + (124 - out) + ' 70 ' + (116 - out) + ' 92 ' + (112 - out) + ' 108 C100 96 92 88 86 84 C78 100 68 108 60 108 C52 108 42 100 34 84 C28 88 20 96 ' + (out + 8) + ' 108 C' + (out + 4) + ' 92 ' + (out - 4) + ' 70 ' + out + ' 48Z" fill="url(#' + uid + 'hg)"/>' +
          '<path d="M28 60 Q34 78 30 96" fill="none" stroke="' + hl + '" stroke-width="3" opacity=".25"/>' +
          '<path d="M92 60 Q86 78 90 96" fill="none" stroke="' + hl + '" stroke-width="3" opacity=".25"/>' +
          '<path d="M32 46 C44 28 58 36 62 44" fill="' + hb + '" opacity=".55"/>'
        );
      }
      /* 기본 롱헤어 (style 1/4 등) */
      return (
        '<path d="M' + out + ' 50 C' + (out - 2) + ' 22 40 ' + (top - 1) + ' 60 ' + (top - 2) + ' C80 ' + (top - 1) + ' ' + (122 - out) + ' 22 ' + (120 - out) + ' 50 C' + (124 - out) + ' 76 ' + (118 - out) + ' 104 ' + (110 - out) + ' 112 C78 86 68 76 60 76 C52 76 42 86 ' + (out + 10) + ' 112 C' + (out + 2) + ' 104 ' + (out - 4) + ' 76 ' + out + ' 50Z" fill="url(#' + uid + 'hg)"/>' +
        '<path d="M' + (out + 4) + ' 54 C' + (out + 6) + ' 94 44 112 60 112 C76 112 ' + (114 - out) + ' 94 ' + (116 - out) + ' 54" fill="' + hb + '" opacity=".52"/>' +
        '<path d="M32 68 C40 96 80 96 88 68" fill="none" stroke="' + hl + '" stroke-width="3" opacity=".2"/>' +
        '<path d="M30 46 C42 26 78 26 90 46" fill="none" stroke="' + hl + '" stroke-width="2.5" opacity=".36"/>' +
        (g >= 4 ? '<path d="M28 62 C34 90 50 108 60 108 C70 108 86 90 92 62" fill="none" stroke="' + hl + '" stroke-width="2.2" opacity=".22"/>' : "")
      );
    }

    function hairFront() {
      var hb = hair.base, hl = hair.light, hm = hair.mid;
      if (isM) {
        var vol = groom;
        var bangDrop = 46 + vol * 1.1;
        var fringe = "";
        /* LV1: 얇은 앞머리 → LV5: 풍성한 레이어 */
        if (vol <= 1) {
          fringe += '<path d="M38 44 C46 34 54 38 60 40 C66 38 74 34 82 44 C74 40 66 42 60 43 C54 42 46 40 38 44Z" fill="' + hb + '" opacity=".85"/>';
          fringe += '<path d="M44 38 C52 34 58 38 60 40" fill="none" stroke="' + hl + '" stroke-width="1.4" opacity=".35"/>';
        } else if (vol === 2) {
          fringe += '<path d="M34 46 C42 32 50 36 56 38 C60 30 64 38 70 36 C78 32 86 46 86 46 C78 40 70 42 60 44 C50 42 42 40 34 46Z" fill="' + hb + '"/>';
          fringe += '<path d="M40 40 C48 34 56 38 60 40" fill="none" stroke="' + hl + '" stroke-width="1.8" opacity=".5"/>';
          fringe += '<path d="M62 40 C68 36 76 40 82 44" fill="none" stroke="' + hl + '" stroke-width="1.5" opacity=".35"/>';
        } else {
          fringe += '<path d="M' + (32 - vol * 0.4) + ' ' + bangDrop + ' C' + (38 - vol) + ' ' + (28 - vol) + ' 48 ' + (26 - vol * 0.6) + ' 54 34 C58 ' + (24 - vol * 0.5) + ' 62 34 66 ' + (26 - vol * 0.5) + ' C72 ' + (24 - vol) + ' ' + (84 + vol) + ' ' + (28 - vol) + ' ' + (88 + vol * 0.4) + ' ' + bangDrop + ' C80 ' + (38 - vol * 0.3) + ' 72 40 60 42 C48 40 40 ' + (38 - vol * 0.3) + ' ' + (32 - vol * 0.4) + ' ' + bangDrop + 'Z" fill="' + hb + '"/>';
          fringe += '<path d="M36 44 C44 30 52 34 58 40" fill="none" stroke="' + hm + '" stroke-width="' + (2.4 + vol * 0.35) + '" opacity=".55"/>';
          fringe += '<path d="M62 40 C68 32 78 30 86 44" fill="none" stroke="' + hm + '" stroke-width="' + (2.2 + vol * 0.3) + '" opacity=".5"/>';
          fringe += '<path d="M42 38 C50 30 58 36 60 40" fill="none" stroke="' + hl + '" stroke-width="1.8" opacity=".55"/>';
          fringe += '<path d="M62 40 C70 32 78 36 84 42" fill="none" stroke="' + hl + '" stroke-width="1.6" opacity=".45"/>';
          if (vol >= 4) {
            fringe += '<path d="M40 42 C46 34 52 38 56 42" fill="none" stroke="' + hl + '" stroke-width="2.2" opacity=".4"/>';
            fringe += '<path d="M64 42 C70 34 78 36 82 44" fill="none" stroke="' + hl + '" stroke-width="2" opacity=".38"/>';
          }
          if (vol >= 5) {
            fringe += '<path d="M48 30 C54 20 66 20 72 30" fill="none" stroke="' + hl + '" stroke-width="2.8" opacity=".5"/>';
            fringe += '<path d="M34 50 C38 40 44 38 50 42" fill="' + hm + '" opacity=".35"/>';
            fringe += '<path d="M86 50 C82 40 76 38 70 42" fill="' + hm + '" opacity=".35"/>';
          }
        }
        return fringe;
      }
      var g = Math.max(1, glam || 1);
      var drop = 48 + g * 0.7;
      if (style === 0) {
        return (
          '<path d="M34 ' + drop + ' C42 30 50 34 56 36 C60 28 64 36 70 34 C78 30 86 ' + drop + ' 86 ' + drop + ' C78 38 70 40 60 42 C50 40 42 38 34 ' + drop + 'Z" fill="' + hb + '"/>' +
          '<path d="M40 38 C48 32 56 36 60 38" fill="none" stroke="' + hl + '" stroke-width="1.9" opacity=".52"/>' +
          '<path d="M62 38 C68 34 76 38 82 42" fill="none" stroke="' + hl + '" stroke-width="1.6" opacity=".38"/>' +
          (g >= 3 ? '<path d="M46 34 C52 28 58 34 60 38" fill="none" stroke="' + hm + '" stroke-width="2.2" opacity=".4"/>' : "")
        );
      }
      /* female bangs — layered strands, glam↑ 앞머리 풍성 */
      return (
        '<path d="M30 ' + (drop + 2) + ' C36 26 48 28 54 34 C58 26 62 34 66 28 C72 26 84 26 90 ' + (drop + 2) + ' C84 38 78 40 72 42 C66 32 60 38 54 42 C48 40 40 36 30 ' + (drop + 2) + 'Z" fill="' + hb + '"/>' +
        '<path d="M34 44 C42 32 50 36 56 40" fill="none" stroke="' + hm + '" stroke-width="' + (3 + g * 0.25) + '" opacity=".58"/>' +
        '<path d="M64 40 C70 34 78 32 86 44" fill="none" stroke="' + hm + '" stroke-width="' + (2.8 + g * 0.22) + '" opacity=".52"/>' +
        '<path d="M42 38 C50 32 58 38 60 40" fill="none" stroke="' + hl + '" stroke-width="1.7" opacity=".58"/>' +
        '<path d="M62 40 C68 34 76 36 82 42" fill="none" stroke="' + hl + '" stroke-width="1.5" opacity=".42"/>' +
        (g >= 4
          ? '<path d="M38 42 C46 34 52 38 56 42" fill="none" stroke="' + hl + '" stroke-width="2" opacity=".36"/><path d="M64 42 C70 34 78 36 84 44" fill="none" stroke="' + hl + '" stroke-width="1.9" opacity=".34"/>'
          : "") +
        (g >= 5
          ? '<path d="M48 28 C54 18 66 18 72 28" fill="none" stroke="' + hl + '" stroke-width="2.4" opacity=".4"/>'
          : "")
      );
    }

    function eyeAt(x, eyeClass) {
      var ey = eyeY;
      var open = eyeOpen;
      var out = '<g class="' + (eyeClass || "eye-l") + '">';
      if (eyesT === 1) {
        out += '<path d="M' + (x - 5.8) + ' ' + ey + ' Q' + x + ' ' + (ey - 1.8) + ' ' + (x + 5.8) + ' ' + ey + '" stroke="#3f2a22" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
        out += "</g>";
        return out;
      }
      /* soft socket */
      out += '<ellipse cx="' + x + '" cy="' + (ey + 0.6) + '" rx="' + (eyeRx + 0.9) + '" ry="' + (open + 1.2) + '" fill="' + skin.shadow + '" opacity=".1"/>';
      if (glam >= 2) {
        var shadowCol = glam >= 4 ? "#c4a0b0" : "#d4b0a8";
        out += '<ellipse cx="' + x + '" cy="' + (ey - open * 0.35) + '" rx="' + (eyeRx + 1.2) + '" ry="' + (open * 0.55 + 0.8) + '" fill="' + shadowCol + '" opacity="' + (0.12 + glam * 0.03) + '"/>';
      }
      /* almond sclera */
      out += '<path d="M' + (x - eyeRx) + ' ' + ey + ' Q' + (x - eyeRx * 0.35) + ' ' + (ey - open) + ' ' + x + ' ' + (ey - open) + ' Q' + (x + eyeRx * 0.35) + ' ' + (ey - open) + ' ' + (x + eyeRx) + ' ' + ey + ' Q' + (x + eyeRx * 0.4) + ' ' + (ey + open) + ' ' + x + ' ' + (ey + open) + ' Q' + (x - eyeRx * 0.4) + ' ' + (ey + open) + ' ' + (x - eyeRx) + ' ' + ey + 'Z" fill="#fffdf9"/>';
      out += '<path d="M' + (x - eyeRx) + ' ' + ey + ' Q' + x + ' ' + (ey - open - 0.15) + ' ' + (x + eyeRx) + ' ' + ey + '" fill="none" stroke="#2a211c" stroke-width="1.05" opacity=".55"/>';
      /* iris */
      var irisA = look === "fierce" || look === "gangster" ? "#2c3a4a" : (eyesT === 2 ? "#2f6f7a" : (isF ? "#4a5d6e" : "#3d4a56"));
      var irx = eyeRx * 0.52;
      var iry = open * 0.72;
      out += '<ellipse cx="' + x + '" cy="' + (ey + 0.15) + '" rx="' + irx + '" ry="' + iry + '" fill="' + irisA + '"/>';
      out += '<ellipse cx="' + x + '" cy="' + (ey + 0.25) + '" rx="' + (irx * 0.72) + '" ry="' + (iry * 0.72) + '" fill="url(#' + uid + 'ir)"/>';
      out += '<ellipse cx="' + x + '" cy="' + (ey + 0.35) + '" rx="' + (irx * 0.38) + '" ry="' + (iry * 0.42) + '" fill="#0a0a0a"/>';
      out += '<circle class="eye-shine" cx="' + (x - 1.1) + '" cy="' + (ey - open * 0.22) + '" r="0.95" fill="#fff" opacity=".9"/>';
      out += '<circle cx="' + (x + 1.15) + '" cy="' + (ey + open * 0.15) + '" r="0.4" fill="#fff" opacity=".45"/>';
      /* lower lid */
      out += '<path d="M' + (x - eyeRx + 0.6) + ' ' + (ey + open * 0.42) + ' Q' + x + ' ' + (ey + open * 0.78) + ' ' + (x + eyeRx - 0.6) + ' ' + (ey + open * 0.42) + '" stroke="#c48a7a" stroke-width="0.7" fill="none" opacity=".35"/>';
      if (lashes) {
        var lLen = glam >= 3 ? 2.2 : 1.5;
        out += '<path d="M' + (x - eyeRx + 0.5) + ' ' + (ey - open * 0.25) + ' L' + (x - eyeRx - 0.9) + ' ' + (ey - open - lLen) + '" stroke="#1a1210" stroke-width="1.05" stroke-linecap="round"/>';
        out += '<path d="M' + (x - 1.4) + ' ' + (ey - open * 0.75) + ' L' + (x - 1.9) + ' ' + (ey - open - lLen - 0.2) + '" stroke="#1a1210" stroke-width="0.95" stroke-linecap="round"/>';
        out += '<path d="M' + (x + 1.4) + ' ' + (ey - open * 0.75) + ' L' + (x + 1.8) + ' ' + (ey - open - lLen - 0.2) + '" stroke="#1a1210" stroke-width="0.95" stroke-linecap="round"/>';
        out += '<path d="M' + (x + eyeRx - 0.5) + ' ' + (ey - open * 0.25) + ' L' + (x + eyeRx + 0.9) + ' ' + (ey - open - lLen) + '" stroke="#1a1210" stroke-width="1.05" stroke-linecap="round"/>';
      }
      out += "</g>";
      return out;
    }

    function brows() {
      var browY = eyeY - eyeOpen - (isM ? 4.2 : 4.6);
      var bw = isM ? (browHeavy ? 1.55 : 1.25) : (browHeavy ? 1.35 : 1.05);
      var col = hair.mid || hair.base;
      if ((look === "fierce" || look === "gangster") && !softJaw) {
        return '<path d="M' + (cx - eyeGap - 6) + ' ' + (browY + 1.2) + ' L' + (cx - eyeGap + 6.2) + ' ' + (browY - 0.4) + '" stroke="' + col + '" stroke-width="' + bw + '" stroke-linecap="round" opacity=".85"/>' +
          '<path d="M' + (cx + eyeGap - 6.2) + ' ' + (browY - 0.4) + ' L' + (cx + eyeGap + 6) + ' ' + (browY + 1.2) + '" stroke="' + col + '" stroke-width="' + bw + '" stroke-linecap="round" opacity=".85"/>';
      }
      var arch = isM ? (1.1 + groom * 0.15) : 1.9;
      return '<path d="M' + (cx - eyeGap - 6) + ' ' + (browY + 0.3) + ' Q' + (cx - eyeGap) + ' ' + (browY - arch) + ' ' + (cx - eyeGap + 6.2) + ' ' + browY + '" stroke="' + col + '" stroke-width="' + bw + '" fill="none" stroke-linecap="round" opacity=".88"/>' +
        '<path d="M' + (cx + eyeGap - 6.2) + ' ' + browY + ' Q' + (cx + eyeGap) + ' ' + (browY - arch) + ' ' + (cx + eyeGap + 6) + ' ' + (browY + 0.3) + '" stroke="' + col + '" stroke-width="' + bw + '" fill="none" stroke-linecap="round" opacity=".88"/>';
    }

    function nose() {
      var ny = cy + 6.5;
      return (
        '<path d="M' + cx + ' ' + (ny - 5) + ' Q' + (cx + 0.2) + ' ' + (ny + 1.5) + ' ' + (cx + 1.5) + ' ' + (ny + 3.2) + '" fill="none" stroke="' + skin.shadow + '" stroke-width="1.15" stroke-linecap="round" opacity=".38"/>' +
        '<path d="M' + (cx - 2.4) + ' ' + (ny + 2.6) + ' Q' + (cx - 1.4) + ' ' + (ny + 4.1) + ' ' + cx + ' ' + (ny + 4.3) + ' Q' + (cx + 1.4) + ' ' + (ny + 4.1) + ' ' + (cx + 2.4) + ' ' + (ny + 2.6) + '" fill="none" stroke="' + skin.shadow + '" stroke-width="1.1" stroke-linecap="round" opacity=".4"/>' +
        '<ellipse cx="' + (cx - 1.9) + '" cy="' + (ny + 3.2) + '" rx="1.1" ry="0.75" fill="' + skin.shadow + '" opacity=".18"/>' +
        '<ellipse cx="' + (cx + 1.9) + '" cy="' + (ny + 3.2) + '" rx="1.1" ry="0.75" fill="' + skin.shadow + '" opacity=".18"/>' +
        '<ellipse cx="' + (cx - 0.9) + '" cy="' + (ny - 0.5) + '" rx="0.85" ry="1.4" fill="#fff" opacity=".18"/>'
      );
    }

    function mouthPath() {
      var my = mouthY;
      var idle = "";
      var lip = isF ? (glam >= 4 ? "#d46a78" : glam >= 2 ? "#c87880" : "#b87878") : "#a86868";
      var lipDeep = isF ? (glam >= 4 ? "#a84858" : "#986060") : "#8a5858";
      if (glam >= 3 && mouthT !== 1) {
        idle =
          '<path d="M' + (cx - 7.2) + ' ' + (my - 0.2) + ' Q' + cx + ' ' + (my - 2.2) + ' ' + (cx + 7.2) + ' ' + (my - 0.2) + ' Q' + cx + ' ' + (my + 1.4) + ' ' + (cx - 7.2) + ' ' + (my - 0.2) + 'Z" fill="' + lip + '" opacity=".9"/>' +
          '<path d="M' + (cx - 7.5) + ' ' + my + ' Q' + cx + ' ' + (my + (glam >= 4 ? 4.8 : 3.8)) + ' ' + (cx + 7.5) + ' ' + my + ' Q' + cx + ' ' + (my + 1.2) + ' ' + (cx - 7.5) + ' ' + my + 'Z" fill="' + lipDeep + '"/>' +
          '<path d="M' + (cx - 5.5) + ' ' + (my + 0.6) + ' Q' + cx + ' ' + (my + 1.8) + ' ' + (cx + 5.5) + ' ' + (my + 0.6) + '" stroke="#fff" stroke-width="0.85" fill="none" opacity=".28"/>';
      } else if (mouthT === 0) {
        idle =
          '<path d="M' + (cx - 6) + ' ' + (my + 0.2) + ' Q' + cx + ' ' + (my - 1.6) + ' ' + (cx + 6) + ' ' + (my + 0.2) + '" stroke="' + lipDeep + '" stroke-width="1.45" fill="none" stroke-linecap="round"/>';
      } else if (mouthT === 1) {
        idle =
          '<path d="M' + (cx - 5.8) + ' ' + my + ' Q' + cx + ' ' + (my + 1.5) + ' ' + (cx + 5.8) + ' ' + my + '" fill="none" stroke="' + lipDeep + '" stroke-width="1.5" stroke-linecap="round"/>' +
          '<ellipse cx="' + cx + '" cy="' + (my + 0.35) + '" rx="2.2" ry="0.7" fill="' + lip + '" opacity=".35"/>';
      } else if (mouthT === 3) {
        idle =
          '<path d="M' + (cx - 8) + ' ' + (my - 0.3) + ' Q' + cx + ' ' + (my + 5.6) + ' ' + (cx + 8) + ' ' + (my - 0.3) + ' Q' + cx + ' ' + (my + 1.6) + ' ' + (cx - 8) + ' ' + (my - 0.3) + 'Z" fill="' + lipDeep + '"/>' +
          '<path d="M' + (cx - 6.5) + ' ' + my + ' Q' + cx + ' ' + (my + 3.4) + ' ' + (cx + 6.5) + ' ' + my + '" fill="' + lip + '" opacity=".7"/>' +
          (lipGloss ? '<path d="M' + (cx - 5) + ' ' + (my + 0.6) + ' Q' + cx + ' ' + (my + 1.9) + ' ' + (cx + 5) + ' ' + (my + 0.6) + '" stroke="#fff" stroke-width="0.9" fill="none" opacity=".32"/>' : "");
      } else {
        idle =
          '<path d="M' + (cx - 6.8) + ' ' + (my - 0.15) + ' Q' + cx + ' ' + (my - 1.8) + ' ' + (cx + 6.8) + ' ' + (my - 0.15) + '" fill="' + lip + '" opacity=".55"/>' +
          '<path d="M' + (cx - 6.8) + ' ' + my + ' Q' + cx + ' ' + (my + 3.2) + ' ' + (cx + 6.8) + ' ' + my + '" fill="none" stroke="' + lipDeep + '" stroke-width="1.55" stroke-linecap="round"/>' +
          '<ellipse cx="' + cx + '" cy="' + (my + 0.45) + '" rx="2.4" ry="0.75" fill="' + lip + '" opacity=".4"/>';
      }
      var talk =
        '<ellipse cx="' + cx + '" cy="' + (my + 0.9) + '" rx="4.4" ry="3.2" fill="#6b2a2a"/>' +
        '<ellipse cx="' + cx + '" cy="' + (my + 0.1) + '" rx="3.5" ry="1.8" fill="' + lip + '" opacity=".9"/>' +
        '<ellipse cx="' + cx + '" cy="' + (my - 0.35) + '" rx="1.7" ry="0.65" fill="#fff" opacity=".28"/>';
      return '<g class="mouth-idle">' + idle + '</g><g class="mouth-talk">' + talk + "</g>";
    }

    function accessoryLayer() {
      var a = "";
      /* 기존 액세서리 — 선글라스(acc=1)는 glam/깡패 선글라스와 중복 방지 */
      if (acc === 1 && glam < 4 && persona !== "gangster" && look !== "gangster") {
        var sy = eyeY + 2.2;
        a += '<g opacity=".92"><path d="M40 ' + sy + ' C40 ' + (sy - 4) + ' 44 ' + (sy - 6) + ' 48 ' + (sy - 6) + ' C52 ' + (sy - 6) + ' 54 ' + (sy - 3) + ' 54 ' + sy + ' C54 ' + (sy + 4) + ' 52 ' + (sy + 6) + ' 48 ' + (sy + 6) + ' C44 ' + (sy + 6) + ' 40 ' + (sy + 4) + ' 40 ' + sy + 'Z" fill="none" stroke="rgba(15,23,42,.5)" stroke-width="2"/><path d="M66 ' + sy + ' C66 ' + (sy - 4) + ' 70 ' + (sy - 6) + ' 74 ' + (sy - 6) + ' C78 ' + (sy - 6) + ' 80 ' + (sy - 3) + ' 80 ' + sy + ' C80 ' + (sy + 4) + ' 78 ' + (sy + 6) + ' 74 ' + (sy + 6) + ' C70 ' + (sy + 6) + ' 66 ' + (sy + 4) + ' 66 ' + sy + 'Z" fill="none" stroke="rgba(15,23,42,.5)" stroke-width="2"/><path d="M54 ' + sy + ' H66" stroke="rgba(15,23,42,.35)" stroke-width="1.6"/><ellipse cx="48" cy="' + (sy - 1.5) + '" rx="5" ry="2" fill="#93c5fd" opacity=".15"/><ellipse cx="74" cy="' + (sy - 1.5) + '" rx="5" ry="2" fill="#93c5fd" opacity=".15"/></g>';
      } else if (acc === 2) {
        a += '<path d="M24 52 C18 52 16 64 24 70" fill="none" stroke="' + accent + '" stroke-width="3" stroke-linecap="round"/>';
        a += '<path d="M96 52 C102 52 104 64 96 70" fill="none" stroke="' + accent + '" stroke-width="3" stroke-linecap="round"/>';
        a += '<rect x="36" y="16" width="48" height="9" rx="4.5" fill="url(#' + uid + 'ac)"/>';
        a += '<rect x="40" y="18" width="18" height="4" rx="2" fill="#fff" opacity=".35"/>';
      } else if (acc === 3 && glam < 3) {
        a += '<circle cx="88" cy="34" r="5.5" fill="url(#' + uid + 'ac)"/><circle cx="96" cy="44" r="3.2" fill="' + accent + '" opacity=".85"/><circle cx="26" cy="38" r="3" fill="' + accent + '" opacity=".75"/><circle cx="86.5" cy="32.5" r="1.6" fill="#fff" opacity=".55"/>';
      } else if (acc === 4) {
        a += '<path d="M34 42 C42 34 50 38 52 46" fill="none" stroke="#fb7185" stroke-width="2.4" stroke-linecap="round"/><path d="M68 46 C70 38 78 34 86 42" fill="none" stroke="#fb7185" stroke-width="2.4" stroke-linecap="round"/>';
      } else if (acc === 5) {
        a += '<path d="M36 28 H84" stroke="' + accent + '" stroke-width="5.5" stroke-linecap="round"/><circle cx="36" cy="28" r="3.8" fill="' + accent + '"/><circle cx="84" cy="28" r="3.8" fill="' + accent + '"/><path d="M40 26.5 H80" stroke="#fff" stroke-width="1.2" opacity=".3"/>';
      } else if (acc === 6) {
        /* 베레모 / 캡 */
        a += '<path d="M28 36 C34 18 86 18 92 36 C78 30 42 30 28 36Z" fill="' + accent + '"/>';
        a += '<ellipse cx="60" cy="34" rx="30" ry="10" fill="' + shirt + '" opacity=".92"/>';
        a += '<path d="M34 34 H86" stroke="#fff" stroke-width="1.2" opacity=".25"/>';
      } else if (acc === 7) {
        /* 꽃 핀 */
        a += '<g transform="translate(86 28)">';
        a += '<circle r="5.2" fill="#fda4af"/><circle cx="5" cy="2" r="4.2" fill="#fb7185"/><circle cx="-4" cy="3" r="4" fill="#f9a8d4"/>';
        a += '<circle r="2.2" fill="#fde68a"/>';
        a += "</g>";
        a += '<circle cx="30" cy="36" r="3.2" fill="' + accent + '" opacity=".75"/>';
      }

      /* 티어별 귀고리 (여자·미지정) */
      if (!isM && glam >= 2) {
        if (glam === 2) {
          a += '<circle cx="27.5" cy="64" r="2.2" fill="#fde68a"/><circle cx="27.5" cy="64" r="0.8" fill="#fff" opacity=".55"/>';
          a += '<circle cx="92.5" cy="64" r="2.2" fill="#fde68a"/><circle cx="92.5" cy="64" r="0.8" fill="#fff" opacity=".55"/>';
        } else if (glam === 3) {
          a += '<circle cx="27.5" cy="65" r="2.6" fill="url(#' + uid + 'ac)"/><circle cx="27.5" cy="71.5" r="1.8" fill="' + accent + '"/><circle cx="26.6" cy="64" r="0.9" fill="#fff" opacity=".55"/>';
          a += '<circle cx="92.5" cy="65" r="2.6" fill="url(#' + uid + 'ac)"/><circle cx="92.5" cy="71.5" r="1.8" fill="' + accent + '"/><circle cx="91.6" cy="64" r="0.9" fill="#fff" opacity=".55"/>';
        } else if (glam === 4) {
          a += '<circle cx="27" cy="64" r="2.4" fill="#fbbf24"/><path d="M27 66.5 V76" stroke="#fbbf24" stroke-width="1.6"/><circle cx="27" cy="78" r="2.8" fill="' + dyePick.mid + '"/><circle cx="26.2" cy="63.2" r="0.8" fill="#fff" opacity=".6"/>';
          a += '<circle cx="93" cy="64" r="2.4" fill="#fbbf24"/><path d="M93 66.5 V76" stroke="#fbbf24" stroke-width="1.6"/><circle cx="93" cy="78" r="2.8" fill="' + dyePick.mid + '"/><circle cx="92.2" cy="63.2" r="0.8" fill="#fff" opacity=".6"/>';
        } else {
          a += '<circle cx="26.5" cy="63" r="2.8" fill="#fde68a"/><path d="M26.5 65.8 V74" stroke="#fbbf24" stroke-width="1.8"/><circle cx="26.5" cy="76.5" r="3.2" fill="' + dyePick.light + '"/><circle cx="26.5" cy="82" r="2" fill="' + dyePick.mid + '"/><circle cx="25.6" cy="62" r="1" fill="#fff" opacity=".65"/>';
          a += '<circle cx="93.5" cy="63" r="2.8" fill="#fde68a"/><path d="M93.5 65.8 V74" stroke="#fbbf24" stroke-width="1.8"/><circle cx="93.5" cy="76.5" r="3.2" fill="' + dyePick.light + '"/><circle cx="93.5" cy="82" r="2" fill="' + dyePick.mid + '"/><circle cx="92.6" cy="62" r="1" fill="#fff" opacity=".65"/>';        }
      }

      /* LV4+ 또는 깡패: 선글라스 */
      if (((!isM && glam >= 4) || (persona === "gangster" || look === "gangster")) && eyesT !== 1) {
        var lens = (persona === "gangster" || look === "gangster") ? "#0a0a0a" : (glam >= 5 ? "#1e1b4b" : "#0f172a");
        var frame = (persona === "gangster" || look === "gangster") ? "#e5e5e5" : (glam >= 5 ? dyePick.light : "#f8fafc");
        var lensY = eyeY - 5.2;
        var bridgeY = eyeY + 0.6;
        a += '<g opacity=".96">';
        a += '<rect x="38" y="' + lensY + '" width="18" height="11" rx="4" fill="' + lens + '" opacity=".82"/>';
        a += '<rect x="64" y="' + lensY + '" width="18" height="11" rx="4" fill="' + lens + '" opacity=".82"/>';
        a += '<path d="M56 ' + bridgeY + ' H64" stroke="' + frame + '" stroke-width="2.2"/>';
        a += '<path d="M38 ' + bridgeY + ' H32" stroke="' + frame + '" stroke-width="2"/>';
        a += '<path d="M82 ' + bridgeY + ' H88" stroke="' + frame + '" stroke-width="2"/>';
        a += '<rect x="38" y="' + lensY + '" width="18" height="11" rx="4" fill="none" stroke="' + frame + '" stroke-width="1.8"/>';
        a += '<rect x="64" y="' + lensY + '" width="18" height="11" rx="4" fill="none" stroke="' + frame + '" stroke-width="1.8"/>';
        a += '<ellipse cx="44" cy="' + (lensY + 3) + '" rx="4.5" ry="2" fill="#fff" opacity=".18"/>';
        a += '<ellipse cx="70" cy="' + (lensY + 3) + '" rx="4.5" ry="2" fill="#fff" opacity=".18"/>';
        if (glam >= 5 && persona !== "gangster") {
          a += '<path d="M40 ' + (lensY + 1) + ' L52 ' + (lensY + 9) + '" stroke="' + dyePick.light + '" stroke-width="1.1" opacity=".45"/>';
          a += '<path d="M66 ' + (lensY + 1) + ' L78 ' + (lensY + 9) + '" stroke="' + dyePick.light + '" stroke-width="1.1" opacity=".45"/>';
        }
        a += "</g>";
      }

      /* 상남자: 헤어밴드 / 깡패: 흉터 / 아이돌: 하트·반짝 — 변화가 잘 보이게 */
      if (persona === "macho" || look === "macho") {
        a += '<path d="M34 28 H86" stroke="' + accent + '" stroke-width="4" stroke-linecap="round" opacity=".88"/>';
        a += '<path d="M38 26.5 H82" stroke="#fff" stroke-width="1.1" opacity=".28"/>';
      }
      if (persona === "gangster" || look === "gangster") {
        a += '<path d="M68 42 L80 54" stroke="' + skin.shadow + '" stroke-width="1.5" opacity=".6"/>';
        a += '<path d="M70 43.5 L78 52" stroke="#fff" stroke-width="0.6" opacity=".28"/>';
        a += '<path d="M22 68 Q16 78 24 86" fill="none" stroke="#334155" stroke-width="2.4" opacity=".45"/>';
      }
      if (persona === "idol" || look === "idol") {
        a += '<path d="M16 30 l2.2 4.4 4.4 1.1 -4.4 1.1 -2.2 4.4 -2.2 -4.4 -4.4 -1.1 4.4 -1.1z" fill="#f9a8d4" opacity=".9"/>';
        a += '<path d="M102 32 l1.8 3.6 3.6 .9 -3.6 .9 -1.8 3.6 -1.8 -3.6 -3.6 -.9 3.6 -.9z" fill="#fde68a" opacity=".95"/>';
        a += '<path d="M90 18 C92 14 98 14 98 20 C98 24 94 28 90 30 C86 28 82 24 82 20 C82 14 88 14 90 18Z" fill="#fb7185" opacity=".8"/>';
        a += '<circle cx="26" cy="20" r="2.4" fill="#fff" opacity=".85"/>';
      }
      if (persona === "scholar" || look === "scholar") {
        a += '<rect x="78" y="88" width="18" height="14" rx="1.5" fill="#f8fafc" stroke="#64748b" stroke-width="1.2" transform="rotate(-12 87 95)"/>';
        a += '<path d="M80 92 H94 M80 96 H92" stroke="#94a3b8" stroke-width="0.8"/>';
      }
      if (persona === "athlete" || look === "athlete") {
        a += '<path d="M18 70 C14 78 18 88 26 90" fill="none" stroke="' + accent + '" stroke-width="2.4" opacity=".55"/>';
        a += '<circle cx="98" cy="26" r="5" fill="none" stroke="#22c55e" stroke-width="1.6"/>';
      }
      if (persona === "artist" || look === "artist") {
        a += '<path d="M14 40 l3 6 6 1.5 -6 1.5 -3 6 -3 -6 -6 -1.5 6 -1.5z" fill="#c084fc" opacity=".85"/>';
        a += '<path d="M104 74 L110 86 L98 84Z" fill="#f472b6" opacity=".7"/>';
      }
      if (persona === "gamer" || look === "gamer") {
        a += '<rect x="14" y="74" width="12" height="8" rx="2" fill="#38bdf8" opacity=".85"/>';
        a += '<circle cx="17" cy="78" r="1.2" fill="#fff"/><circle cx="23" cy="78" r="1.2" fill="#fff"/>';
      }
      if (look === "soft") {
        a += '<path d="M18 28 C20 22 28 22 28 30 C28 36 22 42 18 44 C14 42 8 36 8 30 C8 22 16 22 18 28Z" fill="#fda4af" opacity=".55"/>';
      }
      if (look === "cool") {
        a += '<path d="M22 48 H30" stroke="#64748b" stroke-width="1.4" opacity=".35"/>';
      }

      /* LV3+: 머리핀 / LV4+: 목걸이 */
      if (!isM && glam >= 3) {
        a += '<circle cx="72" cy="28" r="3.2" fill="' + (glam >= 5 ? dyePick.light : accent) + '" opacity=".9"/>';
        a += '<circle cx="72" cy="28" r="1.2" fill="#fff" opacity=".55"/>';
        if (glam >= 4) {
          a += '<circle cx="48" cy="30" r="2.4" fill="#fde68a"/><circle cx="48" cy="30" r="0.9" fill="#fff" opacity=".5"/>';
        }
      }
      if (!isM && glam >= 4) {
        a += '<path d="M48 92 Q60 102 72 92" fill="none" stroke="#fbbf24" stroke-width="1.8"/>';
        a += '<circle cx="60" cy="100" r="3.4" fill="' + (glam >= 5 ? dyePick.mid : accent) + '"/>';
        a += '<circle cx="60" cy="100" r="1.2" fill="#fff" opacity=".45"/>';
      }

      /* 염색 하이라이트 스트릭 (머리 위) */
      if (!isM && glam >= 3) {
        var streak = glam >= 5 ? dyePick.light : glam >= 4 ? dyePick.mid : hair.light;
        a += '<path d="M42 34 C48 24 56 26 58 36" fill="none" stroke="' + streak + '" stroke-width="' + (glam >= 5 ? 3.2 : 2.4) + '" opacity="' + (glam >= 5 ? 0.75 : 0.5) + '" stroke-linecap="round"/>';
        a += '<path d="M64 32 C70 22 80 26 84 38" fill="none" stroke="' + streak + '" stroke-width="' + (glam >= 4 ? 2.8 : 2) + '" opacity="' + (glam >= 4 ? 0.55 : 0.35) + '" stroke-linecap="round"/>';
        if (glam >= 5) {
          a += '<path d="M34 52 C38 70 44 88 48 100" fill="none" stroke="' + dyePick.light + '" stroke-width="4" opacity=".4" stroke-linecap="round"/>';
          a += '<path d="M86 52 C82 70 76 88 72 100" fill="none" stroke="' + dyePick.light + '" stroke-width="4" opacity=".4" stroke-linecap="round"/>';
        }
      }
      return a;
    }

    function motifIcons() {
      var icons = "";
      var spots = [[12, 20], [108, 22], [10, 82], [110, 80]];
      var map = {
        music: '<path d="M0 3.5 L0 0 L5 -.8 L5 4.2" stroke="#7c3aed" stroke-width="1.5" fill="none"/><circle cx="0" cy="4.2" r="1.8" fill="#7c3aed"/>',
        game: '<rect x="-3.5" y="-2.8" width="7" height="5" rx="1.2" fill="#0284c7"/>',
        food: '<circle r="2.8" fill="#fb923c"/><circle cy="-.8" r="1" fill="#fff7ed"/>',
        sport: '<circle r="3" fill="none" stroke="#16a34a" stroke-width="1.4"/>',
        tech: '<rect x="-2.8" y="-2.8" width="5.6" height="5.6" rx=".8" fill="#64748b"/>',
        cheer: '<path d="M0 -3.5 L1 -.8 L3.5 0 L1 .8 L0 3.5 L-1 .8 L-3.5 0 L-1 -.8Z" fill="#fbbf24"/>',
        soft: '<path d="M0 -2 C2 -4.5 4.5 -.8 0 4 C-4.5 -.8 -2 -4.5 0 -2Z" fill="#fda4af"/>',
        fashion: '<path d="M0 -2.8 L2 0 L0 2.8 L-2 0Z" fill="#f472b6"/>',
        creative: '<path d="M-2.8 2 L0 -4 L2.8 2Z" fill="#c084fc"/>',
        calm: '<path d="M-3.5 0 Q0 -2.8 3.5 0 Q0 2 -3.5 0Z" fill="#5eead4"/>',
        heat: '<path d="M0 -4 Q2.8 0 0 4 Q-2.8 0 0 -4Z" fill="#fb7185"/>',
        bold: '<path d="M-2.8 -2 L2.8 -2 L0 3.5Z" fill="#f59e0b"/>',
        social: '<circle r="2.2" fill="#fbbf24"/>'
      };
      var list = (motifs || []).slice(0, Math.min(2, 1 + Math.floor((tier - 1) / 2)));
      if (persona === "idol" && list.indexOf("fashion") < 0) list = ["fashion"].concat(list).slice(0, 2);
      if (persona === "macho" && list.indexOf("bold") < 0) list = ["bold"].concat(list).slice(0, 2);
      if (persona === "gangster" && list.indexOf("heat") < 0) list = ["heat"].concat(list).slice(0, 2);
      if (persona === "scholar" && list.indexOf("tech") < 0) list = ["tech"].concat(list).slice(0, 2);
      if (persona === "athlete" && list.indexOf("sport") < 0) list = ["sport"].concat(list).slice(0, 2);
      if (persona === "artist" && list.indexOf("creative") < 0) list = ["creative"].concat(list).slice(0, 2);
      if (persona === "gamer" && list.indexOf("game") < 0) list = ["game"].concat(list).slice(0, 2);
      list.forEach(function (m, i) {
        var s = spots[i % spots.length];
        icons += '<g transform="translate(' + s[0] + ' ' + s[1] + ') scale(0.85)" opacity="0.38">' + (map[m] || map.cheer) + "</g>";
      });
      return icons;
    }

    function moodLayer() {
      /* 캐릭터 뒤 분위기 — 보케·림라이트 (비네트는 defs) */
      var mood = {
        cheer: { a: "#fbbf24", b: "#fb923c", c: "#fff7ed" },
        calm: { a: "#5eead4", b: "#67e8f9", c: "#ecfeff" },
        heat: { a: "#fb7185", b: "#f97316", c: "#fff1f2" },
        music: { a: "#a78bfa", b: "#818cf8", c: "#f5f3ff" },
        game: { a: "#38bdf8", b: "#22d3ee", c: "#f0f9ff" },
        food: { a: "#fb923c", b: "#fbbf24", c: "#fff7ed" },
        sport: { a: "#4ade80", b: "#34d399", c: "#f0fdf4" },
        soft: { a: "#fda4af", b: "#f9a8d4", c: "#fff1f2" },
        bold: { a: "#f59e0b", b: "#ef4444", c: "#fffbeb" },
        tech: { a: "#94a3b8", b: "#67e8f9", c: "#f8fafc" },
        creative: { a: "#c084fc", b: "#f472b6", c: "#faf5ff" },
        fashion: { a: "#f472b6", b: "#e879f9", c: "#fdf2f8" },
        social: { a: "#fbbf24", b: "#fb7185", c: "#fffbeb" },
        neutral: { a: "#e7c9a8", b: "#d4a574", c: "#fffaf3" }
      };
      var m = mood[vibe] || mood.neutral;
      if (persona === "idol" || look === "idol") m = { a: "#f9a8d4", b: "#fde68a", c: "#fff1f8" };
      if (persona === "macho" || look === "macho") m = { a: "#d97706", b: "#92400e", c: "#fff7ed" };
      if (persona === "gangster" || look === "gangster") m = { a: "#64748b", b: "#e11d48", c: "#1e293b" };
      if (look === "fierce") m = { a: "#fb7185", b: "#991b1b", c: "#fff1f2" };
      if (look === "hero") m = { a: "#fbbf24", b: "#0369a1", c: "#fffbeb" };
      if (look === "scholar") m = { a: "#818cf8", b: "#475569", c: "#eef2ff" };
      if (look === "athlete") m = { a: "#34d399", b: "#059669", c: "#ecfdf5" };
      if (look === "artist") m = { a: "#c084fc", b: "#db2777", c: "#faf5ff" };
      if (look === "gamer") m = { a: "#38bdf8", b: "#6366f1", c: "#e0f2fe" };
      if (look === "soft") m = { a: "#fda4af", b: "#fb7185", c: "#fff1f2" };
      if (look === "cool") m = { a: "#94a3b8", b: "#475569", c: "#f8fafc" };
      var layer = "";
      layer += '<circle class="vibe-aura" cx="60" cy="58" r="54" fill="none" stroke="' + m.a + '" stroke-width="6" opacity=".16"/>';
      layer += '<circle cx="28" cy="30" r="18" fill="' + m.a + '" opacity=".18"/>';
      layer += '<circle cx="96" cy="78" r="20" fill="' + m.b + '" opacity=".15"/>';
      layer += '<circle cx="88" cy="28" r="11" fill="' + m.c + '" opacity=".38"/>';
      layer += '<circle cx="22" cy="72" r="9" fill="' + m.a + '" opacity=".2"/>';
      [[18, 40, 2.2], [102, 48, 1.8], [30, 92, 1.5], [94, 18, 2], [70, 10, 1.3], [12, 58, 1.1]].forEach(function (b, i) {
        layer += '<circle class="sparkle-bit" cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="' + (i % 2 ? m.a : m.c) + '" opacity="' + (0.24 + (i % 3) * 0.06) + '"/>';
      });
      layer += '<circle cx="60" cy="60" r="58" fill="url(#' + uid + 'vig)"/>';
      layer += '<ellipse cx="42" cy="34" rx="26" ry="20" fill="#fff" opacity=".14"/>';
      layer += '<ellipse cx="78" cy="88" rx="22" ry="16" fill="' + m.b + '" opacity=".1"/>';
      return layer;
    }

    function powerExtras() {
      /* 배경만 살짝 — 캐릭터 얼굴이 주인공 */
      var p = "";
      var glow = power.color || accent;
      p += '<circle cx="60" cy="58" r="56" fill="url(#' + uid + 'pg)"/>';
      if (tier >= 2) {
        p += '<circle cx="60" cy="58" r="54" fill="none" stroke="' + glow + '" stroke-width="1.6" opacity="' + (0.1 + tier * 0.035) + '"/>';
      }
      if (tier >= 4) {
        p += '<circle cx="60" cy="58" r="55.5" fill="none" stroke="#fbbf24" stroke-width="1.8" opacity=".18"/>';
        [[18, 14], [102, 16], [14, 88], [106, 86]].forEach(function (pt, i) {
          p += '<path class="sparkle-bit" d="M' + pt[0] + ' ' + pt[1] + ' l0.9 2 2 .8 -2 .8 -.9 2 -.9 -2 -2 -.8 2 -.8z" fill="' + glow + '" opacity="' + (0.32 + i * 0.04) + '"/>';
        });
      }
      if (tier >= 5) {
        p += '<circle cx="60" cy="58" r="56.5" fill="none" stroke="#fde68a" stroke-width="2.2" opacity=".28"/>';
      }
      return p;
    }

    var neckW = isM ? (10 + groom * 0.35 + (persona === "macho" ? 1.2 : 0)) : 8.5;
    var shoulderW = isM ? (30 + groom * 0.8 + (persona === "macho" ? 3 : 0)) : (26 + glam * 0.4);

    return (
      '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="캐릭터 아바타">' +
      "<defs>" +
      '<radialGradient id="' + uid + 'bg" cx="32%" cy="26%" r="75%">' +
      '<stop offset="0%" stop-color="' + tint[0] + '"/>' +
      '<stop offset="50%" stop-color="' + tint[1] + '"/>' +
      '<stop offset="100%" stop-color="' + tint[2] + '"/>' +
      "</radialGradient>" +
      '<radialGradient id="' + uid + 'sk" cx="34%" cy="28%" r="68%">' +
      '<stop offset="0%" stop-color="' + skin.base + '"/>' +
      '<stop offset="42%" stop-color="' + skin.mid + '"/>' +
      '<stop offset="100%" stop-color="' + skin.shadow + '"/>' +
      "</radialGradient>" +
      '<radialGradient id="' + uid + 'ss" cx="78%" cy="72%" r="58%">' +
      '<stop offset="0%" stop-color="' + skin.shadow + '" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="' + skin.shadow + '" stop-opacity="0.32"/>' +
      "</radialGradient>" +
      '<linearGradient id="' + uid + 'hg" x1="16%" y1="0%" x2="84%" y2="100%">' +
      '<stop offset="0%" stop-color="' + hair.light + '"/>' +
      '<stop offset="40%" stop-color="' + hair.mid + '"/>' +
      '<stop offset="100%" stop-color="' + hair.base + '"/>' +
      "</linearGradient>" +
      '<radialGradient id="' + uid + 'ir" cx="34%" cy="30%" r="70%">' +
      '<stop offset="0%" stop-color="#dce8f0"/>' +
      '<stop offset="35%" stop-color="#6b7c8c"/>' +
      '<stop offset="75%" stop-color="#2a3340"/>' +
      '<stop offset="100%" stop-color="#07090c"/>' +
      "</radialGradient>" +
      '<linearGradient id="' + uid + 'sh" x1="0%" y1="0%" x2="0%" y2="100%">' +
      '<stop offset="0%" stop-color="' + shirt + '"/>' +
      '<stop offset="55%" stop-color="' + shirt + '"/>' +
      '<stop offset="100%" stop-color="#0b1220"/>' +
      "</linearGradient>" +
      '<linearGradient id="' + uid + 'shi" x1="20%" y1="0%" x2="80%" y2="100%">' +
      '<stop offset="0%" stop-color="#fff" stop-opacity=".28"/>' +
      '<stop offset="45%" stop-color="#fff" stop-opacity=".06"/>' +
      '<stop offset="100%" stop-color="#000" stop-opacity=".12"/>' +
      "</linearGradient>" +
      '<linearGradient id="' + uid + 'lp" x1="0%" y1="0%" x2="0%" y2="100%">' +
      '<stop offset="0%" stop-color="#fb7185"/>' +
      '<stop offset="55%" stop-color="#e11d48"/>' +
      '<stop offset="100%" stop-color="#9f1239"/>' +
      "</linearGradient>" +
      '<linearGradient id="' + uid + 'ac" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#fff" stop-opacity=".5"/>' +
      '<stop offset="45%" stop-color="' + accent + '"/>' +
      '<stop offset="100%" stop-color="' + accent + '"/>' +
      "</linearGradient>" +
      '<filter id="' + uid + 'ds" x="-25%" y="-25%" width="150%" height="150%">' +
      '<feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#1f1e1d" flood-opacity=".34"/>' +
      "</filter>" +
      '<filter id="' + uid + 'soft" x="-15%" y="-15%" width="130%" height="130%">' +
      '<feGaussianBlur stdDeviation="0.4" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      "</filter>" +
      '<filter id="' + uid + 'lit" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur"/>' +
      '<feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.7" specularExponent="18" lighting-color="#fff" result="spec">' +
      '<fePointLight x="-20" y="-30" z="60"/>' +
      "</feSpecularLighting>" +
      '<feComposite in="spec" in2="SourceAlpha" operator="in" result="spec2"/>' +
      '<feComposite in="SourceGraphic" in2="spec2" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0"/>' +
      "</filter>" +
      '<radialGradient id="' + uid + 'pg" cx="35%" cy="30%" r="70%">' +
      '<stop offset="0%" stop-color="#fff" stop-opacity="' + (0.08 + tier * 0.03) + '"/>' +
      '<stop offset="100%" stop-color="' + (power.color || accent) + '" stop-opacity="0"/>' +
      "</radialGradient>" +
      '<radialGradient id="' + uid + 'vig" cx="50%" cy="42%" r="72%">' +
      '<stop offset="48%" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="#1a120c" stop-opacity="0.26"/>' +
      "</radialGradient>" +
      "</defs>" +
      '<circle cx="60" cy="60" r="58" fill="url(#' + uid + 'bg)"/>' +
      '<circle cx="40" cy="34" r="22" fill="#fff" opacity=".1"/>' +
      moodLayer() +
      powerExtras() +
      motifIcons() +
      '<g class="face-core" filter="url(#' + uid + 'ds)">' +
      '<ellipse cx="60" cy="110" rx="' + shoulderW + '" ry="13" fill="url(#' + uid + 'sh)"/>' +
      '<ellipse cx="60" cy="106" rx="' + (shoulderW - 5) + '" ry="7.5" fill="url(#' + uid + 'shi)" opacity=".72"/>' +
      '<rect x="' + (60 - neckW) + '" y="84" width="' + (neckW * 2) + '" height="20" rx="' + (isM ? 3.2 : 4.2) + '" fill="url(#' + uid + 'sk)"/>' +
      '<ellipse cx="60" cy="86" rx="' + (neckW - 0.8) + '" ry="3.2" fill="' + skin.shadow + '" opacity=".16"/>' +
      '<g class="hair-sway">' + hairBack() + "</g>" +
      '<ellipse cx="' + (cx - faceRx + 1) + '" cy="' + (cy + 4) + '" rx="' + (isF ? 5.4 : 6) + '" ry="' + (isF ? 7.2 : 8) + '" fill="url(#' + uid + 'sk)"/>' +
      '<ellipse cx="' + (cx + faceRx - 1) + '" cy="' + (cy + 4) + '" rx="' + (isF ? 5.4 : 6) + '" ry="' + (isF ? 7.2 : 8) + '" fill="url(#' + uid + 'sk)"/>' +
      '<ellipse cx="' + (cx - faceRx + 1) + '" cy="' + (cy + 5) + '" rx="2.3" ry="3.4" fill="' + skin.shadow + '" opacity=".26"/>' +
      '<ellipse cx="' + (cx + faceRx - 1) + '" cy="' + (cy + 5) + '" rx="2.3" ry="3.4" fill="' + skin.shadow + '" opacity=".26"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + faceRx + '" ry="' + faceRy + '" fill="url(#' + uid + 'sk)"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + faceRx + '" ry="' + faceRy + '" fill="url(#' + uid + 'ss)"/>' +
      (isM
        ? (softJaw
          ? '<path d="M' + (cx - faceRx + 4) + ' ' + (cy + 10) + ' Q' + cx + ' ' + (cy + 34) + ' ' + (cx + faceRx - 4) + ' ' + (cy + 10) + '" fill="' + skin.shadow + '" opacity=".08"/>'
          : '<path d="M' + (cx - faceRx + 3) + ' ' + (cy + 8) + ' L' + (cx - faceRx + 5) + ' ' + (cy + 24) + ' Q' + cx + ' ' + (cy + 36) + ' ' + (cx + faceRx - 5) + ' ' + (cy + 24) + ' L' + (cx + faceRx - 3) + ' ' + (cy + 8) + '" fill="' + skin.shadow + '" opacity=".12"/>')
        : '<path d="M' + (cx - faceRx + 4) + ' ' + (cy + 10) + ' Q' + cx + ' ' + (cy + 34) + ' ' + (cx + faceRx - 4) + ' ' + (cy + 10) + '" fill="' + skin.shadow + '" opacity=".09"/>') +
      '<ellipse cx="' + (cx - 8) + '" cy="' + (cy - 8) + '" rx="10" ry="8" fill="#fff" opacity=".14"/>' +
      '<ellipse cx="' + (cx + 11) + '" cy="' + (cy + 11) + '" rx="11" ry="9" fill="' + skin.shadow + '" opacity=".1"/>' +
      '<ellipse class="cheek" cx="' + (cx - 13) + '" cy="' + (cy + 7) + '" rx="' + (isF ? 6.2 + glam * 0.25 : 4.4 + groom * 0.2) + '" ry="' + (isF ? 3.4 + glam * 0.1 : 2.4 + groom * 0.12) + '" fill="' + skin.blush + '" opacity="' + (isM ? Math.min(0.28, blushA * 0.55) : Math.min(0.45, blushA * 0.7)) + '"/>' +
      '<ellipse class="cheek" cx="' + (cx + 13) + '" cy="' + (cy + 7) + '" rx="' + (isF ? 6.2 + glam * 0.25 : 4.4 + groom * 0.2) + '" ry="' + (isF ? 3.4 + glam * 0.1 : 2.4 + groom * 0.12) + '" fill="' + skin.blush + '" opacity="' + (isM ? Math.min(0.28, blushA * 0.55) : Math.min(0.45, blushA * 0.7)) + '"/>' +
      (glam >= 2 && !isM
        ? '<ellipse cx="' + (cx - 14) + '" cy="' + (cy + 6) + '" rx="7.5" ry="3.2" fill="#f9a8d4" opacity="' + (0.1 + glam * 0.04) + '"/><ellipse cx="' + (cx + 14) + '" cy="' + (cy + 6) + '" rx="7.5" ry="3.2" fill="#f9a8d4" opacity="' + (0.1 + glam * 0.04) + '"/>'
        : "") +
      (glam >= 4 && !isM
        ? '<ellipse cx="' + (cx - 8) + '" cy="' + (cy + 3) + '" rx="3.8" ry="2.2" fill="#fff" opacity=".2"/>'
        : "") +
      (freckle && glam < 4
        ? '<g fill="' + skin.shadow + '" opacity=".3"><circle cx="' + (cx - 15) + '" cy="' + (cy + 11) + '" r=".55"/><circle cx="' + (cx - 12) + '" cy="' + (cy + 13) + '" r=".4"/><circle cx="' + (cx + 15) + '" cy="' + (cy + 11) + '" r=".55"/><circle cx="' + (cx + 12) + '" cy="' + (cy + 13) + '" r=".4"/></g>'
        : "") +
      eyeAt(cx - eyeGap, "eye-l") +
      eyeAt(cx + eyeGap, "eye-r") +
      brows() +
      nose() +
      mouthPath() +
      ((persona === "macho" || look === "macho") && isM
        ? '<g fill="' + hair.base + '" opacity=".28"><ellipse cx="' + (cx - 8) + '" cy="' + (mouthY + 1.5) + '" rx="3.8" ry="1.8"/><ellipse cx="' + (cx + 8) + '" cy="' + (mouthY + 1.5) + '" rx="3.8" ry="1.8"/><ellipse cx="' + cx + '" cy="' + (mouthY + 3) + '" rx="4.8" ry="1.6"/></g>'
        : "") +
      '<g class="hair-sway">' + hairFront() + "</g>" +
      accessoryLayer() +
      (sparkle || persona === "idol" ? '<circle class="sparkle-bit" cx="84" cy="32" r="1.35" fill="#fff" opacity=".5"/><circle class="sparkle-bit" cx="90" cy="40" r=".9" fill="#fff" opacity=".35"/>' : "") +
      "</g>" +
      "</svg>"
    );
  }

  function facePortrait(traits, mbti, data, stats) {
    if (!traits || typeof traits !== "object" || traits.seed == null) {
      traits = analyzeFaceTraits({
        spec: "", skill: "", charge: "", warn: "", ping: "", sync: "", egg: "",
        value: "", net: "", role: "", vax: "", data: "", fix: "", update: "",
        _name: "face", _filled: 1
      }, { cha: 50, atk: 40, def: 40, men: 40, syn: 40, buz: 40 });
    }
    if (!data && typeof lastLive !== "undefined" && lastLive && lastLive.data) {
      data = lastLive.data;
    }
    if (!stats && typeof lastLive !== "undefined" && lastLive && lastLive.stats) {
      stats = lastLive.stats;
    }

    var vibe = traits.vibe || "neutral";
    var look = traits.look || "cute";
    var power = statPower(stats || {});
    var accent = ACCENT[traits.accentIdx % ACCENT.length];

    var ringColor =
      look === "fierce" || look === "gangster" ? "#e11d48" :
      look === "hero" || look === "macho" ? "#b45309" :
      look === "idol" ? "#db2777" :
      look === "scholar" ? "#6366f1" :
      look === "athlete" ? "#16a34a" :
      look === "artist" ? "#9333ea" :
      look === "gamer" ? "#0ea5e9" :
      look === "soft" ? "#fb7185" :
      look === "cool" ? "#64748b" :
      power.tier >= 5 ? "#fbbf24" :
      power.tier >= 4 ? "#f59e0b" :
      vibe === "cheer" ? "#fbbf24" :
      vibe === "calm" ? "#5eead4" :
      vibe === "heat" ? "#fb7185" :
      vibe === "music" ? "#a78bfa" :
      vibe === "game" ? "#38bdf8" :
      vibe === "food" ? "#fb923c" :
      vibe === "sport" ? "#4ade80" :
      vibe === "soft" ? "#fda4af" :
      vibe === "tech" ? "#94a3b8" :
      vibe === "bold" ? "#f59e0b" :
      vibe === "creative" ? "#c084fc" :
      vibe === "social" ? "#fbbf24" :
      vibe === "fashion" ? "#f472b6" :
      accent;

    var moodPair =
      look === "idol" || vibe === "fashion" ? ["#f9a8d4", "#fde68a"] :
      look === "macho" || vibe === "bold" ? ["#f59e0b", "#92400e"] :
      look === "gangster" || look === "fierce" ? ["#fb7185", "#334155"] :
      look === "hero" ? ["#fbbf24", "#0284c7"] :
      look === "scholar" ? ["#818cf8", "#64748b"] :
      look === "athlete" ? ["#4ade80", "#059669"] :
      look === "artist" ? ["#c084fc", "#f472b6"] :
      look === "gamer" ? ["#38bdf8", "#6366f1"] :
      look === "soft" ? ["#fda4af", "#f9a8d4"] :
      look === "cool" ? ["#94a3b8", "#64748b"] :
      vibe === "calm" ? ["#5eead4", "#67e8f9"] :
      vibe === "heat" ? ["#fb7185", "#f97316"] :
      vibe === "music" ? ["#a78bfa", "#818cf8"] :
      vibe === "game" ? ["#38bdf8", "#22d3ee"] :
      vibe === "soft" ? ["#fda4af", "#f9a8d4"] :
      vibe === "creative" ? ["#c084fc", "#f472b6"] :
      vibe === "sport" ? ["#4ade80", "#34d399"] :
      vibe === "tech" ? ["#94a3b8", "#67e8f9"] :
      vibe === "food" ? ["#fb923c", "#fbbf24"] :
      vibe === "cheer" || vibe === "social" ? ["#fbbf24", "#fb923c"] :
      [ringColor, accent];

    var mbtiCode = String(mbti || "").trim().toUpperCase();
    if (!/^[EI][NS][FT][JP]$/.test(mbtiCode)) mbtiCode = "";
    var mbtiPalette =
      look === "fierce"
        ? { a: "#fb7185", b: "#e11d48", c: "#fff1f2", ink: "#9f1239" }
        : look === "hero"
        ? { a: "#fbbf24", b: "#b45309", c: "#fffbeb", ink: "#78350f" }
        : power.tier >= 4
        ? { a: "#fde68a", b: "#d97706", c: "#fffbeb", ink: "#78350f" }
        : vibe === "calm"
        ? { a: "#5eead4", b: "#0d9488", c: "#f0fdfa", ink: "#115e59" }
        : vibe === "music"
        ? { a: "#c4b5fd", b: "#7c3aed", c: "#f5f3ff", ink: "#5b21b6" }
        : vibe === "game"
        ? { a: "#7dd3fc", b: "#0284c7", c: "#f0f9ff", ink: "#075985" }
        : { a: "#93c5fd", b: "#3b82f6", c: "#eff6ff", ink: "#1e3a8a" };
    if (mbtiCode.charAt(0) === "E" && look === "cute" && power.tier < 4) {
      mbtiPalette = { a: "#fdba74", b: "#ea580c", c: "#fff7ed", ink: "#9a3412" };
    }
    if (mbtiCode.charAt(0) === "I" && look === "cute" && power.tier < 4) {
      mbtiPalette = { a: "#a5b4fc", b: "#4f46e5", c: "#eef2ff", ink: "#312e81" };
    }

    var mbtiHtml = mbtiCode
      ? '<div class="inf-photo-mbti" style="--mbti-a:' + mbtiPalette.a + ";--mbti-b:" + mbtiPalette.b + ";--mbti-c:" + mbtiPalette.c + ";--mbti-ink:" + mbtiPalette.ink + '">' + mbtiCode + "</div>"
      : "";

    var avatar = buildAvatarSvg(traits, power);

    return (
      '<div class="inf-photo" data-power="' + power.tier + '" style="--power-color:' + power.color + ";--ring:" + ringColor + ";--mood-a:" + moodPair[0] + ";--mood-b:" + moodPair[1] + '">' +
      '<div class="inf-photo-ring" style="--ring:' + ringColor + '"></div>' +
      '<div class="inf-photo-frame face-core">' +
      avatar +
      "</div>" +
      '<div class="inf-photo-shade" aria-hidden="true"></div>' +
      mbtiHtml +
      "</div>"
    );
  }

  function faceSvg(traits, mbti, data, stats) {
    return facePortrait(traits, mbti, data, stats);
  }

  function esc(s) {

    return String(s)

      .replace(/&/g, "&amp;")

      .replace(/</g, "&lt;")

      .replace(/>/g, "&gt;")

      .replace(/"/g, "&quot;");

  }



  function buildHtmlDoc(data, stats, arch, tags) {

    var items = FIELD_META.map(function (m) {

      var t = data[m.key];

      if (!t) return "";

      return "  <section class=\"slot\">\n    <h2>" + esc(m.title) + "</h2>\n    <p>" + esc(t).replace(/\n/g, "<br>") + "</p>\n  </section>";

    }).filter(Boolean).join("\n");



    var total = STATS.reduce(function (sum, st) { return sum + (stats[st.key] || 0); }, 0);

    var statLines = STATS.map(function (st) {

      var g = gradeOf(stats[st.key]);

      return "    <li><b>" + st.label + "</b> <meter min=\"0\" max=\"100\" value=\"" + stats[st.key] + "\"></meter> <span>" + stats[st.key] + " (" + g.mark + ")</span></li>";

    }).join("\n");



    return [

      "<!DOCTYPE html>",

      "<html lang=\"ko\">",

      "<head>",

      "  <meta charset=\"UTF-8\" />",

      "  <title>" + esc(data._name) + "</title>",

      "  <style>",

      "    body{font-family:system-ui,sans-serif;background:#f7f4ee;color:#1f1e1d;padding:24px}",

      "    .card{max-width:760px;margin:0 auto;border:2px solid #111;border-radius:18px;background:#fff;padding:20px;display:grid;grid-template-columns:1fr 1.25fr;gap:16px}",

      "    .face{text-align:center}.face .inf-photo{width:180px;height:180px;margin:0 auto;position:relative}.face .inf-photo-frame{width:100%;height:100%;border-radius:50%;overflow:hidden;box-shadow:0 12px 16px rgba(0,0,0,.2), inset 0 0 0 3px rgba(255,255,255,.35)}.face .inf-photo-frame svg{width:100%;height:100%;display:block}.face .inf-photo-ring{position:absolute;inset:-4px;border-radius:50%;border:3px solid var(--ring,#c96442);opacity:.55;pointer-events:none}.face .inf-photo-mbti{position:absolute;left:50%;top:-10px;transform:translateX(-50%);padding:6px 14px;border-radius:999px;font:800 14px/1.2 Segoe UI,sans-serif;letter-spacing:.1em;color:#0f172a;background:#fff;border:2px solid var(--mbti-b,#3b82f6);box-shadow:0 6px 14px rgba(30,58,138,.25);z-index:6;white-space:nowrap}.face .inf-photo-mbti::before{content:\"MBTI \";font-size:.72em;letter-spacing:.06em;font-weight:700;color:#475569}.face .inf-photo-lv{position:absolute;left:50%;bottom:-12px;transform:translateX(-50%);display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font:800 12px/1.25 system-ui,sans-serif;color:#fffef9;background:#1f1e1d;border:2px solid rgba(255,255,255,.55);z-index:6;white-space:nowrap}.face .inf-photo-lv .lv-num{padding:2px 7px;border-radius:999px;background:var(--power-color,#c96442);color:#fff}.face .inf-photo-kind{display:none!important}.face .inf-photo-shade{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.28),transparent 42%),linear-gradient(180deg,transparent 55%,rgba(0,0,0,.22));pointer-events:none}",

      "    h1{margin:8px 0 4px;font-size:1.35rem} .klass{color:#8c4022;font-weight:700}",

      "    .board{border:1px solid #e5e0d5;border-radius:14px;padding:12px;background:linear-gradient(180deg,#fff,#f7f1ea)}",

      "    .total{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:10px 12px;border-radius:12px;background:#1f1e1d;color:#fff7ed}",

      "    ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}",

      "    li{display:grid;grid-template-columns:72px 1fr 56px;gap:8px;align-items:center}",

      "    meter{width:100%} .slots{grid-column:1/-1;display:grid;gap:10px;margin-top:8px}",

      "    .slot{border:1px solid #e5e0d5;border-radius:12px;padding:10px 12px;background:#faf9f5}",

      "    .slot h2{margin:0 0 6px;font-size:0.85rem} .slot p{margin:0;white-space:pre-wrap;font-size:0.9rem;line-height:1.45}",

      "    .tags span{display:inline-block;margin:2px;padding:3px 8px;border-radius:999px;background:#fbefe7;font-size:0.75rem;font-weight:700}",

      "  </style>",

      "</head>",

      "<body>",

      "  <article class=\"card\">",

      "    <div class=\"face\">",

      "      <!-- 스타일화 SVG 아바타 -->",

      "      " + faceSvg(analyzeFaceTraits(data, stats), extractMbti(data), data, stats).replace(/\n/g, ""),

      "      <h1>" + esc(data._name) + "</h1>",

      "      <p class=\"klass\">TYPE " + String(arch.id).padStart(3, "0") + " · " + esc(arch.name) + "</p>",

      "      <div class=\"tags\">" + tags.map(function (t) {

        var label = typeof t === "string" ? t : t.text;

        return "<span>#" + esc(label) + "</span>";

      }).join("") + "</div>",

      "    </div>",

      "    <div class=\"board\">",

      "      <div class=\"total\"><span>TOTAL POWER</span><strong>" + total + " · " + totalRank(total) + "</strong></div>",

      "      <ul class=\"stats\">",

      statLines,

      "      </ul>",

      "    </div>",

      "    <div class=\"slots\">",

      items || "  <!-- 1번 항목을 작성하면 슬롯이 채워집니다 -->",

      "    </div>",

      "  </article>",

      "</body>",

      "</html>"

    ].join("\n");

  }



  function fieldTitle(key) {

    for (var i = 0; i < FIELD_META.length; i++) {

      if (FIELD_META[i].key === key) return FIELD_META[i].title;

    }

    return key;

  }



  function clipQuote(text, maxLen) {

    var t = String(text || "").replace(/\s+/g, " ").trim();

    if (!t) return "";

    if (t.length <= maxLen) return t;

    return t.slice(0, maxLen - 1) + "…";

  }



  function explainStat(st, data, stats, traits) {

    var v = stats[st.key] || 0;

    var g = gradeOf(v);

    var quotes = [];

    st.fields.forEach(function (k) {

      var raw = data[k];

      if (!raw) return;

      quotes.push({ title: fieldTitle(k), text: clipQuote(raw, 22) });

    });



    var name = (data && data._name) ? String(data._name) : "나";

    var look = (traits && traits.look) || "cute";

    var vibe = (traits && traits.vibe) || "neutral";

    var title = (look === "hero" ? "독백 · " : look === "fierce" ? "한마디 · " : "혼잣말 · ") + st.label;



    var openers;

    if (look === "fierce") openers = ["흥,", "봐 봐.", "솔직히 말하면,", "당연하지.", "자,"];

    else if (look === "hero") openers = ["자,", "살펴보니,", "이와 같이,", "내 상태를 돌아보면,", "차분히 말하면,"];

    else openers = ["헤헤,", "음…", "잠깐만!", "솔직히 말해 볼까,", "지금 내 상태면…"];

    var opener = openers[v % openers.length];



    var talk;

    var q0 = quotes[0];

    var q1 = quotes[1];



    if (look === "fierce") {

      if (!q0) {

        talk = opener + " 내 " + st.label + "은 " + v + "점, " + g.mark + "등급. 「" + st.sub + "」 칸이 비어 있어서 아직 워밍업이다. 더 써. 그럼 확 올라간다.";

      } else if (v >= 80) {

        talk = opener + " " + st.label + " " + v + "점! 「" + q0.title + "」에 \"" + q0.text + "\"… 그거면 " + st.sub + "은 이미 관통이다. ";

        if (q1) talk += "「" + q1.title + "」도 한몫했고. ";

        talk += name + ", 이 정도면 무시 못 한다.";

      } else if (v >= 55) {

        talk = opener + " " + st.label + " " + v + "점(" + g.mark + "). 「" + q0.title + "」의 \"" + q0.text + "\" 덕분에 " + st.sub + " 쪽은 살아 있다. 더 밀어붙여.";

      } else {

        talk = opener + " " + st.label + " " + v + "점… 「" + q0.title + "」에 \"" + q0.text + "\"는 있는데 아직 약하다. 보강한다. 다음은 내가 이긴다.";

      }

    } else if (look === "hero") {

      if (!q0) {

        talk = opener + " 나의 " + st.label + "은 현재 " + v + "점, " + g.mark + "등급이다. 「" + st.sub + "」에 관한 기록이 부족하니, 기록을 채워 가면 분명 성장할 것이다.";

      } else if (v >= 80) {

        talk = opener + " " + st.label + " " + v + "점. 「" + q0.title + "」에 적은 \"" + q0.text + "\"에서 " + st.sub + "의 기운이 분명히 드러난다. ";

        if (q1) talk += "「" + q1.title + "」의 \"" + q1.text + "\" 또한 그러하다. ";

        talk += "이것이 " + name + "의 모습이다.";

      } else if (v >= 55) {

        talk = opener + " " + st.label + "은 " + v + "점(" + g.mark + "). 「" + q0.title + "」의 \"" + q0.text + "\"가 " + st.sub + "을 지탱하고 있다. 조금 더 구체화하면 한 걸음 더 나아갈 것이다.";

      } else {

        talk = opener + " " + st.label + " " + v + "점. 「" + q0.title + "」에 \"" + q0.text + "\"가 있으나 " + st.sub + "의 신호는 아직 약하다. 두려워할 필요는 없다. 보완하면 된다.";

      }

    } else {

      if (!q0) {

        talk = opener + " 내 " + st.label + "은 지금 " + v + "점(" + g.mark + ")야. 「" + st.sub + "」 칸이 비어 있어서… 기본 분위기만으로 책정한 거 같아. 조금만 더 쓰면 내가 신나게 떠들 재료가 생길 텐데!";

      } else if (v >= 80) {

        talk = opener + " 와, 내 " + st.label + " " + v + "점이라니! 「" + q0.title + "」에 \"" + q0.text + "\"라고 적어 둔 거 보면 " + st.sub + " 에너지가 완전 느껴져. ";

        if (q1) talk += "거기다 「" + q1.title + "」의 \"" + q1.text + "\"까지… ";

        talk += name + "답게 잘 나왔지? 나 혼자 칭찬해도 되지~";

      } else if (v >= 55) {

        talk = opener + " 내 " + st.label + "은 " + v + "점(" + g.mark + "). 「" + q0.title + "」에 \"" + q0.text + "\"라고 써 놔서 " + st.sub + " 쪽으로 기운이 기운다. ";

        if (q1) talk += "「" + q1.title + "」도 살짝 참고했고. ";

        talk += "나쁘진 않은데… 조금만 더 쓰면 내가 더 신나서 말할 듯!";

      } else {

        talk = opener + " 내 " + st.label + " " + v + "점… 「" + q0.title + "」에 \"" + q0.text + "\"는 있는데, 아직 " + st.sub + " 신호가 약해. 괜찮아! 여기만 보강하면 점수 쑥 올라갈 거야.";

      }

    }



    if (vibe === "music" && look === "cute") talk += " 플리 틀어 놓고 한 번 더 생각해 볼까?";

    if (vibe === "food" && look !== "hero") talk += " 일단 뭔가 달달한 거 생각나네.";

    if (vibe === "game" && look === "fierce") talk += " 다음 판은 내가 캐리한다.";



    return { title: title, text: talk, voice: talk };

  }



  function hideBubble(immediate) {

    if (!els.bubble) return;

    clearTimeout(bubbleTimer);

    clearTypewriter();

    stopCharacterVoice();

    bubbleKey = "";

    setFaceSpeaking(false);

    Array.prototype.forEach.call(document.querySelectorAll(".inf-stat-ico.is-active, .inf-stat.is-talking"), function (n) {

      n.classList.remove("is-active", "is-talking");

    });

    if (immediate || els.bubble.hidden) {

      els.bubble.hidden = true;

      els.bubble.classList.remove("is-on", "is-out", "is-typing");

      return;

    }

    els.bubble.classList.remove("is-on");

    els.bubble.classList.add("is-out");

    bubbleTimer = setTimeout(function () {

      els.bubble.hidden = true;

      els.bubble.classList.remove("is-out", "is-typing");

    }, 260);

  }



  function showStatBubble(statKey) {

    if (!els.bubble || !lastLive.data || !lastLive.stats) return;

    var st = null;

    for (var i = 0; i < STATS.length; i++) {

      if (STATS[i].key === statKey) { st = STATS[i]; break; }

    }

    if (!st) return;



    if (bubbleKey === statKey && !els.bubble.hidden) {

      hideBubble(false);

      return;

    }



    var traits = lastLive.traits || null;

    var explained = explainStat(st, lastLive.data, lastLive.stats, traits);

    els.bubbleTitle.textContent = explained.title;

    typeBubbleText(explained.text);



    Array.prototype.forEach.call(document.querySelectorAll(".inf-stat-ico.is-active, .inf-stat.is-talking"), function (n) {

      n.classList.remove("is-active", "is-talking");

    });

    var row = els.stats.querySelector('.inf-stat[data-stat="' + statKey + '"]');

    var ico = els.stats.querySelector('.inf-stat-ico[data-stat="' + statKey + '"]');

    if (ico) ico.classList.add("is-active");

    if (row) row.classList.add("is-talking");



    clearTimeout(bubbleTimer);

    stopCharacterVoice();

    setFaceSpeaking(true);

    els.bubble.hidden = false;

    els.bubble.classList.remove("is-out");

    els.bubble.classList.remove("is-on");

    void els.bubble.offsetWidth;

    els.bubble.classList.add("is-on");

    bubbleKey = statKey;



    speakCharacterLine(explained.voice || explained.text, traits, function () {

      setFaceSpeaking(false);

      clearTimeout(bubbleTimer);

      bubbleTimer = setTimeout(function () {

        if (bubbleKey === statKey) hideBubble(false);

      }, 900);

    });



    /* 음성 실패 시에도 말풍선은 일정 시간 유지 */

    bubbleTimer = setTimeout(function () {

      if (bubbleKey === statKey && els.bubble && !els.bubble.hidden) {

        /* 아직 말하는 중이면 조금 더 기다림 */

        if (window.speechSynthesis && speechSynthesis.speaking) return;

        hideBubble(false);

      }

    }, 14000);

  }



  function renderStats(stats) {

    var rows = STATS.map(function (st) {

      var v = stats[st.key];

      var g = gradeOf(v);

      return (

        '<div class="inf-stat" role="listitem" tabindex="0" data-stat="' + st.key + '" aria-label="' + st.label + ' 혼잣말 듣기">' +

          '<button type="button" class="inf-stat-ico ' + st.cls + '" data-stat="' + st.key + '" tabindex="-1" aria-hidden="true">' + st.ico + "</button>" +

          '<div class="inf-stat-body">' +

            '<div class="inf-stat-top"><b>' + st.label + "</b><span>" + st.sub + "</span></div>" +

            '<div class="inf-stat-track" aria-hidden="true"><i class="inf-stat-fill ' + st.cls + '" data-w="' + v + '" style="width:0%"></i></div>' +

          "</div>" +

          '<div class="inf-stat-side">' +

            '<div class="inf-stat-val">' + v + "</div>" +

            '<span class="inf-stat-grade ' + g.cls + '">' + g.mark + "</span>" +

          "</div>" +

        "</div>"

      );

    }).join("");



    els.stats.innerHTML =
      '<p class="inf-stats-hint">글을 채울수록 스탯↑ · 캐릭터 커스터마이징! (클릭하면 혼잣말)</p>' +
      '<div class="inf-stats-grid" role="list">' + rows + "</div>";



    requestAnimationFrame(function () {

      requestAnimationFrame(function () {

        Array.prototype.forEach.call(els.stats.querySelectorAll(".inf-stat-fill"), function (bar) {

          bar.style.width = (bar.getAttribute("data-w") || "0") + "%";

        });

      });

    });

  }



  function setKakaoBtnFeedback(ok) {

    if (!els.kakao) return;

    var label = els.kakao.querySelector(".kakao-label");

    if (ok) {

      els.kakao.classList.add("is-ok");

      if (label) label.textContent = "저장 완료!";

      setTimeout(function () {

        els.kakao.classList.remove("is-ok");

        if (label) label.textContent = "사진 저장";

      }, 1600);

    }

  }



  function downloadKakaoProfile() {

    if (!els.face) return;



    var size = 640;

    var canvas = document.createElement("canvas");

    canvas.width = size;

    canvas.height = size;

    var ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.fillStyle = "#fff8ef";

    ctx.fillRect(0, 0, size, size);



    function finishDownload() {

      var nameNode = els.name && els.name.querySelector(".inf-name-text");

      var fileBase = String((nameNode && nameNode.textContent) || (lastLive && lastLive.data && lastLive.data._name) || "profile")

        .replace(/[\\/:*?"<>|]/g, "")

        .replace(/\s+/g, "_")

        .trim() || "profile";

      canvas.toBlob(function (blob) {

        if (!blob) return;

        var a = document.createElement("a");

        a.download = fileBase + "_사진.png";

        a.href = URL.createObjectURL(blob);

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1200);

        setKakaoBtnFeedback(true);

      }, "image/png");

    }



    function drawNameBadge(ringCol) {

      var nameNode = els.name && els.name.querySelector(".inf-name-text");

      var displayName = String(

        (nameNode && nameNode.textContent) ||

        (lastLive && lastLive.data && lastLive.data._name) ||

        ""

      ).trim();

      if (!displayName) displayName = "이름 미정";

      if (displayName.length > 16) displayName = displayName.slice(0, 16) + "…";

      ctx.save();

      ctx.font = "800 34px Segoe UI, Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif";

      ctx.textAlign = "center";

      ctx.textBaseline = "middle";

      var tw = Math.min(size * 0.86, ctx.measureText(displayName).width + 56);

      var bh = 52;

      var bx = size / 2 - tw / 2;

      var by = size - bh - 26;

      ctx.fillStyle = "rgba(255,255,255,0.94)";

      ctx.strokeStyle = ringCol || "#c96442";

      ctx.lineWidth = 3;

      if (ctx.roundRect) {

        ctx.beginPath();

        ctx.roundRect(bx, by, tw, bh, 26);

        ctx.fill();

        ctx.stroke();

      } else {

        ctx.fillRect(bx, by, tw, bh);

        ctx.strokeRect(bx, by, tw, bh);

      }

      ctx.fillStyle = "#1f1e1d";

      ctx.fillText(displayName, size / 2, by + bh / 2 + 1);

      ctx.restore();

    }



    function failSave(msg) {

      if (els.kakao) {

        var label = els.kakao.querySelector(".kakao-label");

        if (label) label.textContent = msg || "저장 실패 · 다시 시도";

        setTimeout(function () {

          if (label) label.textContent = "사진 저장";

        }, 1800);

      }

    }



    function drawPhotoImg(imgEl) {

      var src = imgEl.currentSrc || imgEl.src;

      if (!src) {

        failSave("사진 없음 · 다시 시도");

        return;

      }

      var img = new Image();

      img.crossOrigin = "anonymous";

      img.onload = function () {

        try {

          var pad = size * 0.07;

          ctx.save();

          ctx.beginPath();

          ctx.arc(size / 2, size / 2, size / 2 - pad, 0, Math.PI * 2);

          ctx.closePath();

          ctx.clip();

          ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);

          ctx.restore();

          var ring = els.face.querySelector(".inf-photo-ring");

          var ringCol = (ring && getComputedStyle(ring).getPropertyValue("--ring").trim()) || "#c96442";

          ctx.beginPath();

          ctx.arc(size / 2, size / 2, size / 2 - pad + 4, 0, Math.PI * 2);

          ctx.strokeStyle = ringCol;

          ctx.lineWidth = 10;

          ctx.stroke();

          var mbtiEl = els.face.querySelector(".inf-photo-mbti");

          if (mbtiEl && mbtiEl.textContent) {

            var code = mbtiEl.textContent.trim();

            ctx.font = "800 36px Segoe UI, Pretendard, system-ui, sans-serif";

            ctx.textAlign = "center";

            ctx.textBaseline = "middle";

            var tw = ctx.measureText(code).width + 48;

            var bx = size / 2 - tw / 2;

            var by = 28;

            var bh = 44;

            ctx.fillStyle = "rgba(255,255,255,0.92)";

            ctx.strokeStyle = ringCol;

            ctx.lineWidth = 3;

            if (ctx.roundRect) {

              ctx.beginPath();

              ctx.roundRect(bx, by, tw, bh, 22);

              ctx.fill();

              ctx.stroke();

            } else {

              ctx.fillRect(bx, by, tw, bh);

              ctx.strokeRect(bx, by, tw, bh);

            }

            ctx.fillStyle = "#1e3a8a";

            ctx.fillText(code, size / 2, by + bh / 2 + 1);

          }

          drawNameBadge(ringCol);

          finishDownload();

        } catch (err) {

          failSave("CORS 제한 · 화면 캡처를 이용해 주세요");

        }

      };

      img.onerror = function () {

        failSave("이미지 로드 실패 · 다시 시도");

      };

      img.src = src;

    }



    var svg = els.face.querySelector(".inf-photo-frame svg");

    if (!svg) {

      failSave("아바타 없음 · 다시 시도");

      return;

    }

    var clone = svg.cloneNode(true);

    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    clone.setAttribute("width", String(size));

    clone.setAttribute("height", String(size));

    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", "0 0 120 120");

    var xml = new XMLSerializer().serializeToString(clone);

    if (xml.indexOf("xmlns") === -1) {

      xml = xml.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');

    }

    var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

    var img = new Image();

    img.onload = function () {

      try {

        var pad = size * 0.04;

        ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);

        var ring = els.face.querySelector(".inf-photo-ring");

        var ringCol = (ring && getComputedStyle(ring).getPropertyValue("--ring").trim()) || "#c96442";

        ctx.beginPath();

        ctx.arc(size / 2, size / 2, size / 2 - pad + 2, 0, Math.PI * 2);

        ctx.strokeStyle = ringCol;

        ctx.lineWidth = 10;

        ctx.stroke();

        var mbtiEl = els.face.querySelector(".inf-photo-mbti");

        if (mbtiEl && mbtiEl.textContent) {

          var code = mbtiEl.textContent.trim();

          ctx.font = "800 36px Segoe UI, Pretendard, system-ui, sans-serif";

          ctx.textAlign = "center";

          ctx.textBaseline = "middle";

          var tw = ctx.measureText(code).width + 48;

          var bx = size / 2 - tw / 2;

          var by = 28;

          var bh = 44;

          ctx.fillStyle = "rgba(255,255,255,0.92)";

          ctx.strokeStyle = ringCol;

          ctx.lineWidth = 3;

          if (ctx.roundRect) {

            ctx.beginPath();

            ctx.roundRect(bx, by, tw, bh, 22);

            ctx.fill();

            ctx.stroke();

          } else {

            ctx.fillRect(bx, by, tw, bh);

            ctx.strokeRect(bx, by, tw, bh);

          }

          ctx.fillStyle = "#1e3a8a";

          ctx.fillText(code, size / 2, by + bh / 2 + 1);

        }

        drawNameBadge(ringCol);

        finishDownload();

      } catch (err) {

        failSave("저장 실패 · 다시 시도");

      }

    };

    img.onerror = function () { failSave("저장 실패 · 다시 시도"); };

    img.src = url;

  }



  function setStageLive(on) {

    if (els.stage) els.stage.classList.toggle("is-live", !!on);

    if (els.empty) {

      els.empty.hidden = !!on;

      els.empty.setAttribute("aria-hidden", on ? "true" : "false");

    }

    if (els.card) els.card.hidden = !on;

  }



  function update() {

    if (!els.code || !els.card) return;

    var data = collect();

    var stats = calcStats(data);

    var arch = pickArchetype(data, stats);

    var faceTraits = analyzeFaceTraits(data, stats);

    var tags = pickTags(data, arch, faceTraits);

    var html = buildHtmlDoc(data, stats, arch, tags);



    els.code.innerHTML = "<code>" + esc(html) + "</code>";



    if (data._filled === 0) {

      els.badge.textContent = "대기 중 · 1번을 작성해 주세요";

      els.badge.classList.remove("is-live");

      setStageLive(false);

      lastLive = { data: null, stats: null, traits: null };

      hideBubble(true);

      return;

    }



    els.badge.textContent = "LIVE · " + data._filled + "/14 슬롯 반영";

    els.badge.classList.add("is-live");

    setStageLive(true);

    lastLive = { data: data, stats: stats, traits: faceTraits };

    hideBubble(true);



    var mbti = extractMbti(data);

    var prevFaceKey = els.face.getAttribute("data-face-key") || "";

    var power = statPower(stats);
    var faceKey = String(faceTraits.seed) + ":" + faceTraits.mouth + faceTraits.eyes + faceTraits.style + faceTraits.accessory + ":" + faceTraits.hairIdx + ":" + faceTraits.shirtIdx + ":" + faceTraits.accentIdx + ":" + (faceTraits.gender || "") + ":" + (faceTraits.look || "") + ":" + (faceTraits.persona || "") + ":" + (faceTraits.vibe || "") + ":" + mbti + ":p" + power.tier + ":" + power.pct + ":f" + (data._filled || 0);

    var prevPower = els.face.getAttribute("data-power") || "";
    var nextFaceHtml = faceSvg(faceTraits, mbti, data, stats);
    els.face.innerHTML = nextFaceHtml;

    els.face.setAttribute("data-vibe", faceTraits.vibe || "neutral");
    els.face.setAttribute("data-look", faceTraits.look || "cute");
    els.face.setAttribute("data-persona", faceTraits.persona || "");
    els.face.setAttribute("data-gender", faceTraits.gender || "");
    els.face.setAttribute("data-power", String(power.tier));
    els.face.style.setProperty("--power-color", power.color);
    var moodEl = els.face.querySelector(".inf-photo");
    if (moodEl) {
      var ma = moodEl.style.getPropertyValue("--mood-a") || "#e7c9a8";
      var mb = moodEl.style.getPropertyValue("--mood-b") || "#d4a574";
      els.face.style.setProperty("--mood-a", ma);
      els.face.style.setProperty("--mood-b", mb);
      var stage = els.face.parentElement;
      if (stage) {
        stage.style.setProperty("--mood-a", ma);
        stage.style.setProperty("--mood-b", mb);
      }
      var portrait = stage && stage.parentElement;
      if (portrait && portrait.classList.contains("inf-portrait")) {
        portrait.style.setProperty("--mood-a", ma);
        portrait.style.setProperty("--mood-b", mb);
      }
      if (els.card) {
        els.card.style.setProperty("--mood-a", ma);
        els.card.style.setProperty("--mood-b", mb);
      }
      if (els.stage) {
        els.stage.style.setProperty("--mood-a", ma);
        els.stage.style.setProperty("--mood-b", mb);
      }
    }
    if (faceTraits.vibe2) els.face.setAttribute("data-vibe2", faceTraits.vibe2);
    else els.face.removeAttribute("data-vibe2");

    if (faceKey !== prevFaceKey) {
      els.face.setAttribute("data-face-key", faceKey);
      els.face.classList.remove("is-morph");
      void els.face.offsetWidth;
      els.face.classList.add("is-morph");
    }
    if (prevPower && prevPower !== String(power.tier)) {
      els.face.classList.remove("is-power-up");
      void els.face.offsetWidth;
      els.face.classList.add("is-power-up");
      setTimeout(function () { els.face.classList.remove("is-power-up"); }, 700);
    }

    els.name.innerHTML =
      '<span class="inf-name-text">' + esc(data._name) + "</span>" +
      '<span class="inf-class-badge" title="' + esc(arch.name) + (mbti ? " · MBTI " + mbti : "") + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.2 6.8 18.8l1-5.8L3.6 8.9l5.8-.8L12 2.8z"/></svg>' +
        "<b>" +
          esc(arch.name) +
          (mbti
            ? '<span class="inf-mbti-sep">,</span> MBTI는 <span class="inf-mbti-bit">' + esc(mbti) + "</span>"
            : "") +
        "</b>" +
      "</span>";
    if (els.klass) {

      els.klass.textContent = "";

      els.klass.setAttribute("hidden", "");

    }

    if (els.rank) {

      els.rank.textContent = "";

      els.rank.setAttribute("hidden", "");

    }

    els.tags.innerHTML = tags.map(function (t) {

      var label = typeof t === "string" ? t : t.text;

      var cls = "";

      if (t && t.cls) cls += " is-class";

      if (t && t.persona) cls += " is-persona";

      return '<span class="inf-tag' + cls + '" title="#' + esc(label) + '">#' + esc(label) + "</span>";

    }).join("");

    renderStats(stats);

  }



  var timer = null;

  function schedule() {

    clearTimeout(timer);

    timer = setTimeout(update, 220);

  }



  function fitTextarea(el) {

    if (!el || el.tagName !== "TEXTAREA") return;

    el.style.overflow = "hidden";

    el.style.height = "auto";

    var minH = parseInt(window.getComputedStyle(el).minHeight, 10);

    if (!minH || isNaN(minH)) minH = 84;

    el.style.height = Math.max(minH, el.scrollHeight) + "px";

  }

  function fitAllCardTextareas() {

    document.querySelectorAll(".na-card textarea, #fReflect").forEach(fitTextarea);

  }

  FIELD_META.forEach(function (m) {

    var n = document.getElementById(m.id);

    if (!n) return;

    n.addEventListener("input", function () {

      fitTextarea(n);

      schedule();

    });

    n.addEventListener("change", schedule);

  });

  var reflectEl = document.getElementById("fReflect");

  if (reflectEl) {

    reflectEl.addEventListener("input", function () {

      fitTextarea(reflectEl);

    });

  }

  
  function bindNameInput() {
    var el = document.getElementById("sheetDisplayName");
    if (!el) return;
    if (els.nameInput === el) return;
    els.nameInput = el;
    el.addEventListener("input", schedule);
    el.addEventListener("change", schedule);
  }
  bindNameInput();
  document.addEventListener("DOMContentLoaded", bindNameInput);
  setTimeout(bindNameInput, 0);
  setTimeout(bindNameInput, 80);


  fitAllCardTextareas();

  requestAnimationFrame(fitAllCardTextareas);

  setTimeout(fitAllCardTextareas, 0);

  window.addEventListener("resize", fitAllCardTextareas);



  if (els.copy) {

    els.copy.addEventListener("click", function () {

      var text = els.code ? els.code.textContent : "";

      var label = els.copy.querySelector(".copy-label");

      function ok() {

        els.copy.classList.add("is-ok");

        if (label) label.textContent = "복사됨";

        setTimeout(function () {

          els.copy.classList.remove("is-ok");

          if (label) label.textContent = "복사";

        }, 1400);

      }

      if (navigator.clipboard && navigator.clipboard.writeText) {

        navigator.clipboard.writeText(text).then(ok).catch(function () {

          var ta = document.createElement("textarea");

          ta.value = text;

          document.body.appendChild(ta);

          ta.select();

          try { document.execCommand("copy"); ok(); } catch (e) {}

          document.body.removeChild(ta);

        });

      }

    });

  }



  if (els.kakao) {

    els.kakao.addEventListener("click", downloadKakaoProfile);

  }



  if (els.stats) {

    els.stats.addEventListener("click", function (e) {

      var row = e.target.closest ? e.target.closest(".inf-stat") : null;

      if (!row || !els.stats.contains(row)) return;

      var key = row.getAttribute("data-stat");

      if (key) showStatBubble(key);

    });

    els.stats.addEventListener("keydown", function (e) {

      if (e.key !== "Enter" && e.key !== " ") return;

      var row = e.target.closest ? e.target.closest(".inf-stat") : null;

      if (!row || !els.stats.contains(row)) return;

      e.preventDefault();

      var key = row.getAttribute("data-stat");

      if (key) showStatBubble(key);

    });

  }



  update();

})();
