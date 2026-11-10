import { TheoryVisualBlueprint } from '../../types/visuals';
import { resolveAssetUrl } from '../../utils/assetUrl';

export const MOD1_VISUAL_BLUEPRINTS: Record<string, TheoryVisualBlueprint> = {
  'mod1-theory-piaget': {
    theoryId: 'mod1-theory-piaget',
    topology: 'step-flow',
    diagramTitle: '피아제 4단계 인지발달 흐름 & 신피아제 작업기억 재해석 도식',
    diagramSubtitle:
      '연령별 도식(Schema)의 질적 재구조화 단계와 신피아제 학파(Case)의 작업기억·자동화 기제',
    keyTakeawayBadge: '단순 성숙 대기 대신 작업기억 부하 축소 및 시각적 보철 투입',
    processSteps: [
      {
        stepNumber: 'Stage 1',
        title: '감각운동기 (0~2세)',
        subtitle: 'Sensorimotor Stage · 대상영속성과 초기 표상 획득',
        description:
          '감각 입력과 운동 행위의 직접적 협응을 통해 세상을 탐색하며, 눈앞에서 사라진 대상이 계속 존재함을 아는 대상영속성(Object Permanence)과 목적지향적 정신 표상의 기초를 획득합니다.',
        highlightBadge: '표상의 출발점'
      },
      {
        stepNumber: 'Stage 2',
        title: '전조작기 (2~7세)',
        subtitle: 'Preoperational Stage · 기호적 사고와 중심화 병목',
        description:
          '언어와 상징 놀이가 급격히 발달하나, 작업기억 집행처리 공간의 한계로 인해 한 번에 하나의 현저한 지각 차원에만 주의가 묶이는 중심화(Centration), 비가역성, 자기중심적 조망을 보입니다.',
        highlightBadge: '작업기억 용량 병목'
      },
      {
        stepNumber: 'Stage 3',
        title: '구체적 조작기 (7~11세)',
        subtitle: 'Concrete Operational Stage · 보존·가역성·유목포함',
        description:
          '구체적·가시적 사물이 주어질 때 다중 차원을 동시에 표상하여 보존개념(Conservation), 역산·보상성의 가역성(Reversibility), 서열화 및 유목포함(Class Inclusion)의 논리적 조작이 가능해집니다.',
        highlightBadge: '구체적 조작물 필수'
      },
      {
        stepNumber: 'Stage 4',
        title: '형식적 조작기 (11세~) & 신피아제 확장',
        subtitle: 'Formal Operational & Neo-Piagetian Working Memory',
        description:
          '가설연역적 추론과 조합적 사고, 상위인지 성찰이 가능해집니다. 신피아제 학파는 이 전환이 전두엽 성숙 및 영역특수적 스키마 자동화를 통한 작업기억 여유 용량 확장의 결과임을 규명했습니다.',
        highlightBadge: '스키마 자동화 & 보철'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '추상적 개념·성찰 실패의 원인 진단',
        naiveApproach:
          '학생이 아직 형식적 조작기에 도달하지 못한 불변적 발달 미성숙 상태라고 단정하고 연령이 자랄 때까지 기다림',
        evidenceBasedApproach:
          '신피아제 관점(Case)에 따라 다중 변인을 동시에 파지해야 하는 과제의 작업기억 과부하 및 하위 기초 스키마 미자동화 문제로 진단함'
      },
      {
        dimension: '수업 및 상담 과제의 제시 방식',
        naiveApproach:
          '구체적 보조 자료 없이 구두 설명이나 추상적 질문("네 삶의 가치를 돌아봐")만으로 고차원적 내면 성찰을 요구함',
        evidenceBasedApproach:
          '추상적 개념과 내면의 갈등을 가시화하는 다면 비교 매트릭스, 시각적 도식, 구체적 조작물(환경적 보철)을 투입하여 외재적 인지부하를 낮춤'
      },
      {
        dimension: '인지적 갈등(불균형)의 유발 수준',
        naiveApproach:
          '학생의 현재 사전지식 수준을 훨씬 뛰어넘는 고난도 딜레마를 제시하면 스스로 평형화를 이룰 것이라 기대함',
        evidenceBasedApproach:
          '기초 하위 절차를 먼저 반복 연습시켜 자동화(Automatization)한 뒤, 현재 도식에서 한 차원만 확장된 최적 불일치 자극으로 조절을 유도함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '중학교 1학년 남학생이 상담실에서 "내가 지금 게임을 줄여야 다음 달 시험 성적이 오르고 부모님과 갈등이 줄어든다"는 장기적 인과관계(가설연역적 추론)를 머릿속으로 연결하지 못하고, 당장 눈앞의 즉각적 재미에만 매몰되어 있습니다. 신피아제 학파의 관점을 적용한 전문상담교사의 가장 적절한 개입은 무엇입니까?',
      options: [
        {
          label: '시각적 타임라인 보드와 손익 카드 매트릭스를 활용해 작업기억을 외재화하기',
          rationale:
            '정답입니다. 신피아제 학파에 따르면 초기 청소년이 다중 변인과 미래 결과를 동시에 고려하지 못하는 것은 작업기억 용량 병목 때문입니다. 현재 선택과 1주 후·1달 후 결과를 눈에 보이는 카드와 타임라인(환경적 보철)으로 시각화하면 작업기억 부하가 줄어들어 가설연역적 비교와 성찰이 가능해집니다.',
          isOptimal: true
        },
        {
          label: '아직 형식적 조작기가 성숙하지 않았으므로 추상적 미래 계획 상담을 중3 때까지 보류하기',
          rationale:
            '부적절합니다. 피아제 단계를 생물학적으로 고정된 한계로 오해한 접근으로, 적절한 시각적 스캐폴딩과 작업기억 보철이 주어지면 중1 학생도 충분히 인과적 의사결정을 수행할 수 있습니다.',
          isOptimal: false
        },
        {
          label: '구두로만 "만약 네가 계속 게임을 한다면 5년 뒤 어떤 어른이 될지 추상적으로 상상해 봐"라고 반복 질문하기',
          rationale:
            '부적절합니다. 이미 내적 표상과 작업기억 유지에 어려움을 겪는 학생에게 순수 언어적·추상적 다중 추론을 강요하면 인지적 과부하와 회피 반응만 가중됩니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod1-theory-vygotsky': {
    theoryId: 'mod1-theory-vygotsky',
    topology: 'concentric-circles',
    diagramTitle: '비고츠키 근접발달영역(ZPD) 동심원 및 비계설정·혼잣말 내면화 구조',
    diagramSubtitle:
      '독립적 수행 영역에서 사회적 스캐폴딩과 사적 언어(Private Speech)를 거쳐 자기조절로 이행하는 동심원',
    keyTakeawayBadge: '초기 명시적 모델링·시각 단서 제공 후 숙달에 따른 점진적 소거(Fading)',
    illustrationUrl: resolveAssetUrl('images/concepts/mod1-vygotsky-zpd.png'),
    illustrationCaption:
      '비고츠키 근접발달영역(ZPD)과 비계설정(Scaffolding)·점진적 용암(Fading)의 역동적 도식',
    concentricLayers: [
      {
        ringName: '핵심 원 (Core)',
        title: '실제적 발달 수준 (Actual Developmental Level)',
        subtitle: '아동이 타인의 도움 없이 스스로 독립적 해결이 가능한 영역',
        examples: [
          '이미 장기기억 내 스키마로 자동화되어 작업기억 과부하 없이 독자적으로 수행하는 과제',
          '정적 표준화 검사(Static Assessment)가 포착하는 영역이나, 이 수준에만 머물면 인지적 성장이 정체됨'
        ],
        accentColor: 'emerald'
      },
      {
        ringName: '중간 원 (ZPD 핵심)',
        title: '근접발달영역 (Zone of Proximal Development)',
        subtitle: '교사·유능한 또래의 비계설정(Scaffolding)과 사적 언어로 해결 가능한 역동적 공간',
        examples: [
          '인지부하를 낮추는 완결된 예제(Worked Examples), 시각적 체크리스트, 인지적 모델링 제공',
          '아동의 외현적 혼잣말(Private Speech)이 내적 언어(Inner Speech)로 내면화되며 자기조절 발달',
          '학생의 유능감이 높아짐에 따라 외부 단서를 점진적으로 철회하는 용암(Fading) 및 주도권 이양 실시'
        ],
        accentColor: 'indigo'
      },
      {
        ringName: '바깥 원 (Outer Limit)',
        title: '현재 잠재적 발달 수준 너머 (Beyond Current ZPD)',
        subtitle: '지원이 주어져도 현재의 사전지식·작업기억으로는 해결 불가능한 영역',
        examples: [
          '과제분석(Task Analysis)을 통한 선행 기초 기술(Prerequisite Skills) 우선 구축 필요',
          '최소 안내(Minimal Guidance)로 방치할 경우 외재적 인지부하 폭증 및 학습된 무기력 유발'
        ],
        accentColor: 'rose'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '근접발달영역(ZPD) 및 잠재력 진단 방식',
        naiveApproach:
          '단 1회의 정적 표준화 지능·성취 검사 점수만으로 학생의 학습 가능성과 한계를 확정적으로 분류함',
        evidenceBasedApproach:
          '검사-중재-재검사 구조의 역동적 평가(Dynamic Assessment)를 실시하여 학생이 어떤 단계별 힌트와 단서에서 도약하는지 ZPD 폭을 진단함'
      },
      {
        dimension: '초기 비계설정(Scaffolding)의 형태',
        naiveApproach:
          '스캐폴딩을 "정답을 알려주지 않고 열린 질문을 던지며 스스로 깨달을 때까지 기다리는 것"으로 오해하여 최소 안내만 제공함',
        evidenceBasedApproach:
          '사전지식이 부족한 초기에는 완결된 예제(Worked Example)와 명시적 사고 구술 모델링을 제공해 작업기억 과부하를 차단한 뒤 점진적 용암(Fading)을 실행함'
      },
      {
        dimension: '수업·상담 중 아동의 혼잣말(Private Speech) 대처',
        naiveApproach:
          '과제 수행 중 중얼거리는 혼잣말을 산만함이나 미성숙한 자기중심적 행동으로 간주하여 조용히 하도록 제지함',
        evidenceBasedApproach:
          '혼잣말을 주의 집중과 행동 억제를 돕는 자기조절 도구로 인식하고, 마이켄바움(Meichenbaum)의 자기교수법 절차에 따라 내적 언어로 내면화하도록 훈련함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '초등학교 4학년 학생이 모둠 과제 중 친구와 의견이 다르면 즉시 소리부터 지르는 충동 조절 어려움을 겪고 있습니다. 비고츠키의 근접발달영역(ZPD), 비계설정(Scaffolding)·점진적 용암(Fading), 그리고 혼잣말 내면화 원리를 통합한 가장 과학적인 상담 개입은 무엇입니까?',
      options: [
        {
          label: '상담자 인지 모델링 → 시각적 3단계 멈춤 카드와 외현적 자기안내(혼잣말) 연습 → 숙달 후 카드 소거 및 내적 언어로 전환',
          rationale:
            '정답입니다. 비고츠키의 내면화 원리와 마이켄바움의 자기교수법을 결합한 증거기반 처방입니다. 초기에 명시적 모델링과 시각 카드(외부 비계)로 작업기억 부하를 낮추고, 외현적 혼잣말("잠깐 멈추고 숨 세 번 쉬자")을 연습시킨 뒤, 숙달됨에 따라 카드를 점진적으로 제거(Fading)하고 속말(내적 언어)로 전환해 자기조절을 완성합니다.',
          isOptimal: true
        },
        {
          label: '학생 스스로 갈등 해결법을 깨달아야 내면화되므로 구체적 방법 제시 없이 "어떻게 하면 화를 안 낼 수 있을까?"라는 열린 질문만 던지기',
          rationale:
            '부적절합니다. 자기조절 스키마가 없는 학생에게 최소 안내(Minimal Guidance) 방식의 열린 질문만 반복하면 작업기억 과부하와 좌절감만 유발할 뿐 새로운 대처 기술이 형성되지 않습니다.',
          isOptimal: false
        },
        {
          label: '교실에서 혼잣말로 자신을 달래는 행동은 또래에게 이상하게 보일 수 있으므로 즉시 금지하고 교사가 매번 개입해 제지하기',
          rationale:
            '부적절합니다. 외현적 혼잣말(Private Speech)을 억제하면 내적 자기조절로의 발달 경로가 차단되며, 교사의 외부 통제에만 영구히 의존하게 되어 점진적 용암(Fading)과 주도권 이양이 일어나지 않습니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod1-theory-ecological': {
    theoryId: 'mod1-theory-ecological',
    topology: 'concentric-circles',
    diagramTitle: '브론펜브레너 생물생태학적 동심원 체계 & 학교상담 자문 네트워크',
    diagramSubtitle:
      '개인 내적 귀인 오류를 넘어 아동을 둘러싼 다층적 환경 체계와 근접과정(Proximal Processes)을 조율하는 모델',
    keyTakeawayBadge: '1:1 상담실을 넘어 미시·중간체계(교사·가정)를 잇는 생태학적 자문가',
    concentricLayers: [
      {
        ringName: '중심 (Center)',
        title: '개인 및 생물학적 기질 (Individual & Erikson/Marcia)',
        subtitle: '아동의 신경생물학적 특성, 인지 처리속도, 근면성·정체성 발달 과업',
        examples: [
          '학령기 근면성 대 열등감(Industry vs. Inferiority): 추상적 위로가 아닌 실제 학업·사회적 성취경험이 핵심',
          '청소년기 정체성 지위(Marcia): 유실(Foreclosure)·혼미(Diffusion)를 넘어 능동적 탐색과 자율적 전념 지원'
        ],
        accentColor: 'violet'
      },
      {
        ringName: '제1층 (Microsystem)',
        title: '미시체계 (Microsystem) & 근접과정 (Proximal Processes)',
        subtitle: '아동이 매일 직접 상호작용하는 학급, 가정, 또래 집단 내 일상적 상호작용 엔진',
        examples: [
          '담임교사의 과정 중심 정보적 피드백과 학급 내 숙달목표(Mastery Goal) 풍토 조성',
          '또래 집단 내 심리적 안전감 및 협동학습 내 의미 있는 역할 부여'
        ],
        accentColor: 'indigo'
      },
      {
        ringName: '제2층 (Mesosystem)',
        title: '중간체계 (Mesosystem · 학교상담 핵심 개입 지점)',
        subtitle: '미시체계 간의 연결망 (가정-학급-상담실 협력 체제)',
        examples: [
          '학부모-담임교사-전문상담교사 간 일관된 자율성 지지 및 긍정적 행동지원(PBS) 소통 채널 구축',
          '가정과 학교의 상충된 기대(예: 부모의 과잉 통제 vs 학교의 자율 탐색)를 조율하는 생태학적 자문'
        ],
        accentColor: 'emerald'
      },
      {
        ringName: '제3·4층 (Exo/Macro/Chrono)',
        title: '외체계 · 거시체계 · 시간체계 (Exo / Macro / Chronosystem)',
        subtitle: '교육청 정책, 지역사회 복지망, 문화적 가치관 및 생애 전환기 사건',
        examples: [
          'Wee센터, 청소년상담복지센터, 소아정신과 등 지역사회 전문기관 연계망 가동',
          '상대평가 입시 경쟁 문화(거시체계)의 압력을 완충하는 학교 차원의 다층 지원 체계(MTSS)'
        ],
        accentColor: 'amber'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '학령기 열등감(Inferiority) 및 무기력 개입',
        naiveApproach:
          '열등감을 순수한 내면적 자존감 문제로 보고 상담실에서 "너는 소중한 사람이야"라는 무조건적 칭찬과 정서적 위로만 반복함',
        evidenceBasedApproach:
          '열등감의 뿌리를 기초학력 결손과 교실의 경쟁적 비교(미시체계)로 진단하고, 세분화된 과제 성공 경험(Mastery Experience)과 교사의 정보적 피드백(근접과정)을 재설계함'
      },
      {
        dimension: '마샤(Marcia)의 정체성 유실(Foreclosure) 학생 상담',
        naiveApproach:
          '부모가 정해준 진로에 순응하여 갈등 없이 공부하는 정체성 유실 학생을 "목표가 뚜렷한 성숙한 모범생"으로 오진하여 개입 대상에서 제외함',
        evidenceBasedApproach:
          '자율적 탐색(Exploration) 없이 부모의 조건부 통제에 조기 전념한 취약성을 포착하고, 실패 시 심리적 붕괴를 예방하기 위해 안전한 대안 탐색(유예 과정)과 부모 자문을 병행함'
      },
      {
        dimension: '학교 부적응 문제의 개입 단위 설정',
        naiveApproach:
          '학생의 문제 행동을 개인 내부의 결함으로만 귀인(근본적 귀인 오류)하여 주 1회 상담실 내 1:1 개인 면담에만 의존함',
        evidenceBasedApproach:
          '브론펜브레너의 PPCT 모형에 입각하여 학급 내 근접과정 조정(담임교사 자문)과 가정-학교 간 협력망(중간체계)을 동시에 재구조화함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '고등학교 1학년 여학생이 부모님의 강력한 요구에 따라 한 번도 다른 진로를 고민해 본 적 없이 의대 진학만을 목표로 공부해 왔으나(마샤의 정체성 유실), 첫 모의고사에서 성적이 크게 떨어지자 극심한 공황과 자해 충동을 호소하며 상담실을 찾았습니다. 브론펜브레너의 생태체계 모형과 마샤의 정체성 이론을 결합한 가장 적절한 개입은 무엇입니까?',
      options: [
        {
          label: '개인 상담에서 안전한 자기 탐색(유예 공간)을 지원함과 동시에, 학부모-담임교사 자문(중간체계 개입)을 통해 가정의 조건부 통제를 완화하고 과정 중심 피드백 환경 구축하기',
          rationale:
            '정답입니다. 자율적 탐색 없이 부모의 기대에 조기 전념한 정체성 유실(Foreclosure) 학생이 성취 위기 시 겪는 전형적 붕괴 양상입니다. 상담실 내에서 자신의 내재적 가치와 다양한 진로 대안을 안전하게 탐색(Moratorium)하도록 돕는 동시에, 미시·중간체계 수준에서 부모의 심리적 통제를 자율성 지지로 전환하고 교실의 평가 압력을 완충하는 생태학적 자문이 병행되어야 근본적 회복이 일어납니다.',
          isOptimal: true
        },
        {
          label: '이미 의대라는 확고한 목표 전념(Commitment)이 형성되어 있으므로 진로 고민으로 시간을 뺏지 말고 학습 시간표 관리와 불안 억제 훈련만 집중 실시하기',
          rationale:
            '부적절합니다. 정체성 유실(Foreclosure)을 건강한 정체성 성취(Achievement)로 오진한 사례로, 내면화되지 않은 외적 목표를 그대로 강요하면 학업 소진과 정체성 위기가 더욱 악화됩니다.',
          isOptimal: false
        },
        {
          label: '부모님이나 담임교사와 소통하면 학생의 비밀보장이 침해되므로 환경 개입은 일절 배제하고 상담실 안에서의 1:1 내면 정화 면담만 지속하기',
          rationale:
            '부적절합니다. 학생을 매일 압박하는 가정과 학급의 근접과정(Proximal Processes) 및 중간체계 역동을 그대로 방치한 채 주 1회 개인 상담만 진행하는 것은 생태학적 타당도가 결여된 반쪽짜리 개입입니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod1-theory-moral': {
    theoryId: 'mod1-theory-moral',
    topology: 'process-cycle',
    diagramTitle: '크릭과 닷지(Crick & Dodge)의 사회정보처리 6단계 순환 모형',
    diagramSubtitle:
      '공격적·갈등 행동이 발생하는 실시간 인지·정서 처리 루프와 적대적 귀인 편향(Hostile Attribution Bias) 개입 지점',
    keyTakeawayBadge: '당위적 도덕 훈계 대신 2단계 귀인 재구조화 및 4·5단계 비폭력 대안 인출 훈련',
    processSteps: [
      {
        stepNumber: 'Step 1',
        title: '사회적 단서의 부호화 (Encoding of Cues)',
        subtitle: '상황 내 타인의 표정·어조·맥락 단서에 주의 기울이기',
        description:
          '갈등 상황에서 반응적 공격성을 보이는 아동은 상대의 당황한 표정이나 사과·실수 단서는 무시하고 위협적·도발적 단서에만 선택적으로 주의를 기울입니다.',
        highlightBadge: '선택적 주의 재조정'
      },
      {
        stepNumber: 'Step 2',
        title: '단서의 해석 및 귀인 (Interpretation of Cues)',
        subtitle: '적대적 귀인 편향(Hostile Attribution Bias) 발생 핵심 지점',
        description:
          '의도가 모호한 타인의 행동(예: 복도에서 우연히 어깨가 부딪힘, 인사를 못 보고 지나침)을 "나를 무시해서 일부러 쳤다"는 악의적 의도로 즉각 오해합니다.',
        highlightBadge: '핵심 상담 표적: 대안 귀인'
      },
      {
        stepNumber: 'Step 3',
        title: '목표의 명료화 (Clarification of Goals)',
        subtitle: '관계 유지 목표 vs 즉각적 보복·지배 목표 설정',
        description:
          '적대적 귀인이 활성화되면 또래 관계 유지나 평화적 문제 해결 대신 즉각적인 보복, 상대 제압, 체면 방어를 최우선 목표로 설정하게 됩니다.',
        highlightBadge: '관계적 목표 활성화'
      },
      {
        stepNumber: 'Step 4',
        title: '반응 탐색 및 인출 (Response Access)',
        subtitle: '장기기억에서 대처 행동 레퍼토리 인출',
        description:
          '교감신경 과각성(분노 폭발)으로 작업기억이 협소해지면 친사회적 타협안 대신 장기기억에서 가장 강하게 자동화된 공격적·충동적 행동 스크립트만 인출됩니다.',
        highlightBadge: '각성 하강 & 대안 카드'
      },
      {
        stepNumber: 'Step 5',
        title: '반응 평가 및 결정 (Response Decision)',
        subtitle: '각 반응 대안의 결과 기대와 자기효능감 평가',
        description:
          '공격 행동이 즉각적인 굴복을 받아내는 데 효과적이라고 믿거나(왜곡된 결과 기대), 친사회적 대화 기술에 대한 자기효능감이 낮을 때 공격을 최종 선택합니다.',
        highlightBadge: '결과 기대 재평가'
      },
      {
        stepNumber: 'Step 6',
        title: '행동 실행 및 또래 피드백 (Behavioral Enactment)',
        subtitle: '실제 행동 표출 및 또래의 반응 → 1단계로 순환',
        description:
          '표출된 공격 행동은 또래의 실제 적대적 반응과 배척을 유발하여, 아동의 초기 신념("역시 애들은 다 나를 미워해")을 자기충족적 예언으로 고착화합니다.',
        highlightBadge: '역할극 & 피드백 교정'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '또래 폭력·공격 행동의 발생 원인 진단',
        naiveApproach:
          '학생이 콜버그 도덕 발달 단계가 낮아 "친구를 때리면 안 된다"는 도덕적 당위 규범을 모르기 때문에 폭력을 행사한다고 진단함',
        evidenceBasedApproach:
          '도덕 추론의 결여가 아니라 실시간 갈등 상황에서 모호한 단서를 악의적 공격으로 오해하는 크릭과 닷지(Crick & Dodge) 모형 2단계의 적대적 귀인 편향 및 정서 각성으로 인한 4단계 대안 인출 실패로 진단함'
      },
      {
        dimension: '규칙 위반 및 갈등 행동에 대한 교사의 훈육 피드백',
        naiveApproach:
          '투리엘(Turiel)의 사회적 영역 구분을 무시하고, 복장 규정 위반(관습 영역)과 또래 폭력(도덕 영역) 모두에 동일하게 "교칙이니까 무조건 지켜"라고 권위주의적으로 훈계함',
        evidenceBasedApproach:
          '사회관습적 영역은 집단 질서와 합의를 설명하고, 도덕적 영역 침해에 대해서는 피해 타인의 신체적·심리적 아픔과 권리 침해 결과를 조망수용하도록 영역 부합적 피드백을 제공함'
      },
      {
        dimension: '공격성 감소를 위한 학교상담 개입 프로그램',
        naiveApproach:
          '가설적 도덕 딜레마 토론이나 반성문 쓰기를 반복시켜 추상적 도덕 판단 단계를 높이려고 시도함',
        evidenceBasedApproach:
          '사회정보처리 6단계에 맞춰 ① 주변 맥락 단서 전체 보기(1단계) → ② 우연·실수 등 3가지 비적대적 대안 의도 찾기(2단계) → ③ 생리적 각성 이완 후 친사회적 의사소통 역할극 수행(4~6단계)을 훈련함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '체육 시간 피구 경기 중 다른 반 학생이 던진 공에 등을 맞은 중학교 2학년 남학생이 "저 자식이 평소 나한테 시비를 걸더니 일부러 내 얼굴을 노리고 세게 던졌다!"라며 격분하여 주먹을 휘두르려다 상담실로 의뢰되었습니다. 크릭과 닷지(Crick & Dodge)의 사회정보처리모형에 기반한 가장 효과적인 상담 개입은 무엇입니까?',
      options: [
        {
          label: '생리적 분노 각성을 먼저 낮춘 뒤, 당시 상황의 누락된 단서(경기 규칙, 상대의 위치·표정)를 재부호화하고 악의적 의도 외에 가능한 3가지 대안적 해석(2단계 귀인 재구조화)을 탐색하기',
          rationale:
            '정답입니다. 반응적 공격성 아동의 핵심 병목인 교감신경 과각성(작업기억 협소화)을 호흡 이완으로 먼저 낮춘 뒤, 사회정보처리 1단계(단서 부호화 확장)와 2단계(적대적 귀인 편향을 교정하는 대안적 의도 생성)를 순차적으로 개입하고 4·5단계의 비폭력적 확인 질문 기술을 연습시키는 과학자-실무자 표준 프로토콜입니다.',
          isOptimal: true
        },
        {
          label: '콜버그의 법과 질서 지향(4단계)에 도달할 수 있도록 폭력 행위가 교칙 위반임을 설명하고 도덕적 반성문을 작성하게 하기',
          rationale:
            '부적절합니다. 이 학생은 폭력이 나쁘다는 도덕적 지식이 부족해서가 아니라 상대에게 먼저 공격당했다는 적대적 귀인 편향 때문에 방어적 보복에 나선 것이므로, 당위적 규범 훈계는 억울함과 반발심만 키웁니다.',
          isOptimal: false
        },
        {
          label: '억압된 분노 에너지를 표출해야 공격성이 줄어들므로 상담실 샌드백을 상대 학생이라고 생각하고 마음껏 때리게 하기',
          rationale:
            '부적절합니다. 현대 심리학 연구에서 공격적 카타르시스(분노 표출)는 오히려 생리적 각성을 유지시키고 장기기억 내 공격 행동 스크립트(4단계 반응 인출)를 강화하여 재발률을 높이는 것으로 입증되었습니다.',
          isOptimal: false
        }
      ]
    }
  }
};
