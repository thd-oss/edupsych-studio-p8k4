import { TheoryVisualBlueprint } from '../../types/visuals';
import { resolveAssetUrl } from '../../utils/assetUrl';

export const MOD2_VISUAL_BLUEPRINTS: Record<string, TheoryVisualBlueprint> = {
  'mod2-theory-chc': {
    theoryId: 'mod2-theory-chc',
    topology: 'hierarchy-pyramid',
    diagramTitle: 'CHC(Cattell-Horn-Carroll) 3층 위계 지능 모형 & K-WISC-V 프로파일 구조',
    diagramSubtitle:
      '다중지능·학습양식(VAK) 신화를 대체하는 현대 심리측정학의 표준 3층 위계 구조와 인지 병목 진단',
    keyTakeawayBadge:
      '전체 IQ 단일 수치보다 VCI·FRI 대비 WMI(작업기억)·PSI(처리속도) 병목 분석이 핵심',
    pyramidTiers: [
      {
        tierLabel: '제3층 (Stratum III · 최상위)',
        title: '일반지능 요인 (g · General Intelligence)',
        proportion: 'FSIQ 전체지능',
        subtitle: '모든 인지 과제 수행에 공통적으로 관여하는 상위 정신 에너지 (Spearman g)',
        details: [
          '가드너 다중지능이론의 주장과 달리 하위 인지 영역 간에는 유의미한 정적 상관(Positive Manifold)이 존재함',
          '단, 개인 내 지표 간 편차(Discrepancy)가 클 경우 단일 총점(FSIQ)만으로 아동의 잠재력을 재단해서는 안 됨'
        ],
        accentColor: 'indigo'
      },
      {
        tierLabel: '제2층 (Stratum II · 광범위 능력)',
        title: 'K-WISC-V 5대 기본 지표 (VCI · VSI · FRI · WMI · PSI)',
        proportion: '5대 광범위 지표',
        subtitle:
          '유동추론(Gf/FRI), 결정성지능(Gc/VCI), 시공간(Gv/VSI), 작업기억(Gsm/WMI), 처리속도(Gs/PSI)',
        details: [
          '일반능력(GAI: VCI·FRI)은 우수하나 인지효율성(CPI: WMI·PSI)이 낮을 때 심각한 학업 수행 병목 발생',
          '작업기억·처리속도 취약 학생에게는 시간제한 완화, 단계별 시각 보철, 구두 지시 단순화가 필수적'
        ],
        accentColor: 'emerald'
      },
      {
        tierLabel: '제1층 (Stratum I · 기초 특수 능력)',
        title: '70여 개 미시적 인지 과제 및 다중 표상(UDL) 적용 영역',
        proportion: '70+ 하위 기능',
        subtitle: '음운 부호화, 어휘 지식, 시각-운동 협응, 귀납 추론 등 구체적 하위 수행 요소',
        details: [
          '검증되지 않은 감각적 학습양식(VAK 맞추기) 대신 보편적 학습설계(UDL)의 다중 표상 원리로 접근성 보장',
          '하위 기초 기능(해독, 기본 연산)의 스키마 자동화를 통해 상위 추론(제2·3층) 자원을 확보'
        ],
        accentColor: 'amber'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '개인차 진단 및 학습자 유형화 관점',
        naiveApproach:
          '비표준화 다중지능·VAK 감각 양식 설문으로 학생을 ‘시각형/청각형/신체운동형’으로 고정 분류하고 해당 감각 자료만 편협하게 제공함(Meshing Hypothesis 오류)',
        evidenceBasedApproach:
          'CHC 이론 기반 K-WISC-V 5대 지표 간 내적 편차(GAI vs CPI)를 정밀 분석하고, 모든 학생에게 시각·언어 이중부호화(UDL 다중 표상)를 통합 제공함'
      },
      {
        dimension: '전체 IQ(FSIQ) 및 학업 부진 해석',
        naiveApproach:
          '전체 IQ 단일 총점만으로 학생의 지적 잠재력을 단정하거나, 개념 이해력은 높은데 시험 점수가 낮으면 ‘노력 부족·태만’으로 귀인함',
        evidenceBasedApproach:
          '언어이해(VCI)·유동추론(FRI) 대비 작업기억(WMI)·처리속도(PSI)의 상대적 저하로 인한 ‘인지 효율성 병목(Bottleneck)’을 규명하여 자존감 손상을 예방함'
      },
      {
        dimension: '교실 수업 및 평가 조정(Accommodation) 처방',
        naiveApproach:
          '처리속도와 작업기억이 취약한 학생에게 시간제한 깜지 쓰기나 다단계 구두 지시를 반복 부과하여 외재적 인지부하를 가중시킴',
        evidenceBasedApproach:
          '평가 시간 연장, 필기량 축소(구조화 빈칸 노트 제공), 복합 과제의 단계별 분할 제시를 통해 높은 추론 역량(FRI·VCI)이 온전히 발현되도록 지원함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '중학교 1학년 민준이는 수업 시간 토론에서는 깊이 있는 어휘와 논리적 통찰을 보여주지만, 시간제한이 있는 지필고사와 긴 알림장 받아쓰기에서는 성적이 최하위권입니다. K-WISC-V 검사 결과 언어이해(VCI 124)와 유동추론(FRI 120)은 상위권이나 작업기억(WMI 82)과 처리속도(PSI 79)가 경계선 수준으로 나타났습니다. 담임교사에게 제공할 자문으로 가장 적절한 것은?',
      options: [
        {
          label: '가드너의 언어지능 특화 및 청각형 학습양식(VAK) 맞춤 수업으로 전면 전환 권고',
          rationale:
            '감각적 학습양식 맞춤 가설(Meshing Hypothesis)은 실증적 효과가 없으며, 청각 지시만 늘릴 경우 오히려 취약한 음운 작업기억(WMI)에 심각한 과부하를 초래합니다.',
          isOptimal: false
        },
        {
          label: '일반능력(GAI) 대비 인지효율성(WMI·PSI) 병목 안내 및 시각적 절차 보철·시간제한 완화 처방',
          rationale:
            'CHC/WISC-V 프로파일에 근거하여 민준이의 부진이 태만이 아닌 작업기억·처리속도 병목 때문임을 설명하고, 구조화된 노트와 단계별 체크리스트 및 평가 시간 조정을 제공하는 과학자-실무자 개입입니다.',
          isOptimal: true
        },
        {
          label: '낮은 처리속도와 작업기억을 끌어올리기 위한 매일 30분 순발력 숫자 암기·속독 훈련 부과',
          rationale:
            '단순 기계적 기억·속도 훈련(Brain Training)은 실제 교과 학습으로 원거리 전이(Far Transfer)되지 않으며, 학생에게 정서적 좌절감과 학업 혐오만 가중시킵니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod2-theory-clt-prosthetics': {
    theoryId: 'mod2-theory-clt-prosthetics',
    topology: 'stacked-gauge',
    diagramTitle: '작업기억 용량 한계와 신경심리학적 환경적 보철(Prosthetics) 효과 비교',
    diagramSubtitle:
      '제한된 작업기억(100%) 내에서 외재적 부하를 제거하고 스키마 자동화로 본유적 부하를 확보하는 메커니즘',
    keyTakeawayBadge:
      '두뇌 훈련 대신 수행 시점(Point of Performance)의 환경적 보철과 스키마 자동화 투입',
    illustrationUrl: resolveAssetUrl('images/concepts/mod2-chc-clt.png'),
    illustrationCaption:
      '작업기억 병목(Working Memory Bottleneck)을 우회하는 스키마 자동화와 신경심리학적 환경적 보철 메커니즘',
    stackedGauges: [
      {
        label: '① 미지원 과부하 교실 (복합 구두 지시 + 순수 발견학습 강요)',
        intrinsicPercent: 50,
        extraneousPercent: 50,
        germanePercent: 0,
        unusedPercent: 0,
        overflowWarning: '작업기억 병목 초과! 스키마 형성(본유적 부하) 0%',
        caption:
          '높은 과제 복잡성(내재적 부하)에 모호한 다단계 구두 지시(외재적 부하)가 겹쳐 학습과 자기조절이 완전히 마비된 상태'
      },
      {
        label: '② 수행 시점 환경적 보철 투입 (완결된 예제 + 단계별 시각 체크리스트)',
        intrinsicPercent: 45,
        extraneousPercent: 10,
        germanePercent: 35,
        unusedPercent: 10,
        caption:
          '외부 시각 보철(Worked Examples, 절차 카드)로 외재적 인지부하를 대폭 덜어내어 스키마 정교화(본유적 부하 35%)가 시작됨'
      },
      {
        label: '③ 기초 스키마 자동화 달성 (Chunking & Automatization 완성 단계)',
        intrinsicPercent: 20,
        extraneousPercent: 10,
        germanePercent: 55,
        unusedPercent: 15,
        caption:
          '기초 해독·연산·절차가 장기기억 내 단일 청크(Chunk)로 자동화되어 내재적 부하가 축소되고 고차원 문제해결에 자원 집중'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '유동성 지능(Gf) 및 작업기억 한계에 대한 접근',
        naiveApproach:
          '작업기억 용량 자체를 늘리겠다며 교과와 무관한 컴퓨터 두뇌 게임(Brain Training)이나 N-back 암기 훈련에 시간을 소모함',
        evidenceBasedApproach:
          '작업기억의 생물학적 한계를 인정하고, 기초 절차의 장기기억 스키마 자동화(Chunking)와 수행 시점 환경적 보철로 작업기억을 우회함'
      },
      {
        dimension: '초보 학습자 및 부진 학생 교수 설계',
        naiveApproach:
          '스스로 깨우쳐야 사고력이 자란다며 기초 도식이 없는 초보자에게 최소 안내(Minimal Guidance) 순수 발견학습과 통문장 문제를 강요함',
        evidenceBasedApproach:
          '완결된 예제(Worked Examples)와 부분 완성 문제(Completion Problems)를 제공하여 외재적 부하를 낮추고 본유적 부하(스키마 정교화)를 극대화함'
      },
      {
        dimension: '교실 내 과제 지시 및 실행 지원 방식',
        naiveApproach:
          '4~5단계의 복합 구두 지시를 한꺼번에 말한 뒤 잊어버린 학생에게 “주의 깊게 듣지 않는다”고 질책함',
        evidenceBasedApproach:
          '수행 시점(Point of Performance) 책상 위에 단계별 시각 체크리스트와 그래픽 오거나이저를 배치하여 인지적 외주화(Cognitive Offloading)를 구현함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '초등학교 5학년 서연이는 분수의 나눗셈 서술형 문제를 풀 때 구구단과 통분 절차를 머릿속으로 계산하느라 정작 문제에서 구하라는 최종 질문이 무엇인지 잊어버리고 중도 포기합니다. 인지부하이론(CLT)과 신경심리학적 환경적 보철 관점에서 가장 효과적인 개입은?',
      options: [
        {
          label: '스스로 문제해결 원리를 터득하도록 힌트 없이 고난도 발견학습 서술형 문항을 반복 제시',
          rationale:
            '기초 스키마가 자동화되지 않은 상태에서 최소 안내 발견학습을 부과하면 외재적 인지부하가 폭증하여 작업기억이 즉각 마비됩니다.',
          isOptimal: false
        },
        {
          label: '수행 시점에 구구단·통분 참조표 및 완결된 예제(Worked Example) 보철을 배치하고 기초 연산 자동화 병행',
          rationale:
            '외부 시각 보철로 외재적·내재적 작업기억 부담을 덜어주어 서술형 문제 구조 파악(본유적 부하)을 돕고, 점진적 인출 연습으로 기초 연산 스키마를 자동화하는 최적의 처방입니다.',
          isOptimal: true
        },
        {
          label: '작업기억 용량 확장을 위해 매일 방과후 숫자 거꾸로 따라 말하기 두뇌 훈련만 집중 실시',
          rationale:
            '단순 작업기억 폭(Span) 훈련은 수학 서술형 문제해결 능력으로 원거리 전이되지 않는다는 것이 메타분석을 통해 확립되어 있습니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod2-theory-rti': {
    theoryId: 'mod2-theory-rti',
    topology: 'hierarchy-pyramid',
    diagramTitle: '중재반응모형(RTI) 및 다층적 지원체계(MTSS) 3단계 예방 피라미드',
    diagramSubtitle:
      '실패 대기 모형(Wait-to-Fail)과 매튜 효과를 차단하는 데이터 기반 조기 선별·단계적 학업·정서 지원 체계',
    keyTakeawayBadge: '진단 확정 전이라도 즉각적인 명시적 보충 교수와 CBM 진전도 모니터링 가동',
    pyramidTiers: [
      {
        tierLabel: 'Tier 3 · 집중적 개별화 지원',
        title: '고강도 1:1 개별화 중재 · 종합심리평가 · 전문기관 연계',
        proportion: '약 5% (고위험군)',
        subtitle:
          'Tier 2 중재에도 반응이 미흡한 학생을 위한 맞춤형 집중 개입 및 특수교육/Wee센터 연계',
        details: [
          'K-WISC-V 등 종합 심리·교육 평가를 통한 인지 처리 병목(음운처리, 작업기억 등) 정밀 규명',
          '1:1 집중 상담, 개별화교육계획(IEP) 수립 및 병원·지역사회 전문기관 다학제 협력'
        ],
        accentColor: 'rose'
      },
      {
        tierLabel: 'Tier 2 · 표적 집단 보충 지원',
        title: '소집단 명시적 보충 중재 & 교육과정 중심 측정(CBM) 추적',
        proportion: '약 15% (잠재 위험군)',
        subtitle:
          '보편적 선별에서 포착된 학업·정서 위험군 대상 주 3~4회 구조화된 소집단 프로그램',
        details: [
          '초기 문해력(음운인식·파닉스)·수 감각 명시적 교수 또는 사회정서 소집단 상담 즉시 투입',
          '격주 단위 CBM 진전도 모니터링(Progress Monitoring) 데이터로 중재 반응성 객관적 판별'
        ],
        accentColor: 'amber'
      },
      {
        tierLabel: 'Tier 1 · 보편적 예방 지원',
        title: '전교생 증거기반 일반수업 · 학급 차원 SEL · 보편적 선별검사',
        proportion: '약 80% (전체 학생)',
        subtitle: '모든 학생이 혜택을 받는 고품질 과학적 학급 교수 및 연 2~3회 조기 선별',
        details: [
          '보편적 학습설계(UDL), 학급 긍정적 행동지원(PBS), 전교생 사회정서학습(CASEL SEL) 운영',
          '학교상담교사의 담임교사 자문(Consultation)을 통해 교실 내 1차 예방 안전망 구축'
        ],
        accentColor: 'emerald'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '학습장애 및 위기 학생 선별·개입 시기',
        naiveApproach:
          '고학년이 되어 IQ와 성취도 간 격차가 통계적으로 크게 벌어질 때까지 기다리는 ‘실패 대기 모형(Wait-to-Fail)’을 고수함',
        evidenceBasedApproach:
          '초등 저학년부터 보편적 선별검사로 위험군을 조기 발굴하고, 공식 진단 전이라도 Tier 2 명시적 보충 중재를 즉시 가동함'
      },
      {
        dimension: '초기 문해력·수 감각 격차(매튜 효과) 대응',
        naiveApproach:
          '초기 해독(Decoding)이 안 되는 아동에게 “책을 많이 읽으면 자연히 트인다”며 통글자 다독만 권장하여 매튜 효과와 열등감을 심화시킴',
        evidenceBasedApproach:
          '음운인식과 파닉스(자소-음소 대응 규칙)를 체계적·명시적으로 교수하고 CBM 진전도 모니터링 기울기(Slope)로 반응성을 추적함'
      },
      {
        dimension: '학교상담실(Wee클래스) 운영 아키텍처',
        naiveApproach:
          '문제가 심각하게 폭발해 담임교사가 의뢰한 소수 학생만 상담실에서 1:1(Tier 3)로 만나는 사후 대증적 체제로 운영함',
        evidenceBasedApproach:
          'Tier 1(전교생 SEL·교사 자문) → Tier 2(소집단 표적 개입·CBM 추적) → Tier 3(1:1 심층상담·종합심리평가 연계)의 MTSS 예방 생태계를 구축함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '초등학교 1학년 2학기 보편적 문해력 선별검사에서 지후가 음운 해독(Decoding) 하위 10% 위험군으로 포착되었습니다. 지후는 국어 시간마다 배가 아프다며 보건실에 가려 하고 “나는 바보야”라고 말합니다. RTI/MTSS 모형에 기반한 학교상담교사 및 기초학력 지원팀의 조기 개입으로 가장 적절한 것은?',
      options: [
        {
          label: '3~4학년이 되어 지능-성취 불일치가 명확해질 때까지 공식 개입을 유보하고 가정 다독만 안내',
          rationale:
            '전형적인 실패 대기 모형(Wait-to-Fail)으로, 결정적 개입 시기를 놓쳐 매튜 효과(어휘·배경지식 연쇄 하락)와 2차적 정서 손상(학습된 무기력)을 고착화합니다.',
          isOptimal: false
        },
        {
          label: '즉시 Tier 2 소집단 명시적 음운인식·파닉스 보충 교수와 정서 효능감 지원을 투입하고 격주 CBM으로 진전도를 추적',
          rationale:
            '진단 확정 전이라도 Tier 2 증거기반 명시적 교수와 정서 지원을 즉각 제공하고, 교육과정 중심 측정(CBM) 데이터에 따라 Tier 3 심층 평가 여부를 결정하는 표준 RTI/MTSS 프로토콜입니다.',
          isOptimal: true
        },
        {
          label: '선별검사 직후 곧바로 일반 학급에서 분리하여 특수교육 대상자로 확정하고 Tier 3 종일제 개별 교육으로 전환',
          rationale:
            'Tier 1·2의 과학적 보충 교수에 대한 반응성(Response to Intervention)을 확인하지 않은 채 성급히 낙인을 찍고 분리하는 것은 최소제한환경(LRE) 및 RTI 원리에 위배됩니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod2-theory-adhd': {
    theoryId: 'mod2-theory-adhd',
    topology: 'triadic-network',
    diagramTitle:
      '바클리(Barkley)의 ADHD 실행기능 모형 & 수행 시점(Point of Performance) 다중 개입망',
    diagramSubtitle:
      '‘지식의 결함’이 아닌 ‘수행의 장애’를 보완하기 위해 반응 억제 중심축과 4대 실행기능에 배치하는 보철 체계',
    keyTakeawayBadge:
      '사후 훈계·다짐 대신 행동이 일어나는 바로 그 시점(Point of Performance)에 외적 보철 배치',
    triadicNodes: {
      centerLabel:
        '전두엽 반응 억제(Response Inhibition) 결함 보완 & 수행 시점(Point of Performance) 환경적 보철',
      nodes: [
        {
          nodeTitle: '비언어적 작업기억 (시각적 심상·시간 감각)',
          subtitle: '시간맹(Time Blindness)을 극복하는 시간·과제 외현화',
          bullets: [
            '추상적 시간을 눈으로 보게 하는 시각적 타이머(Time Timer) 배치',
            '긴 과제를 10~15분 단위의 마이크로 청크(Micro-chunks)로 분할 제공'
          ],
          accentColor: 'indigo'
        },
        {
          nodeTitle: '언어적 작업기억 (내면화된 혼잣말)',
          subtitle: '규칙과 절차를 눈앞에 고정하는 시각적 단서',
          bullets: [
            '책상 위 3단계 행동 순서 스티커 및 수행 시점 시각 프롬프트 부착',
            '마이켄바움 자기교수법과 전환 시간 2분 전 사전교정(Precorrection)'
          ],
          accentColor: 'emerald'
        },
        {
          nodeTitle: '정서 · 동기 · 각성의 자기조절',
          subtitle: '지연 할인(Delayed Discounting) 특성을 반영한 즉각적 강화',
          bullets: [
            '먼 미래의 큰 보상보다 수행 직후 즉각적이고 빈번한 토큰·구체적 칭찬 제공',
            '출석부 심부름·교구 배부 등 합법적 움직임 기회(Movement Breaks) 공식 부여'
          ],
          accentColor: 'amber'
        },
        {
          nodeTitle: '행동 재구성 & 가정-학교 연계 (DRC)',
          subtitle: '일일행동보고카드(Daily Report Card)와 정서 회복 상담',
          bullets: [
            '3개 이내의 구체적 목표 행동을 매일 점검하여 가정의 특권 보상과 즉시 연결',
            '잦은 지적과 실패로 손상된 자존감 및 또래 낙인 회복을 위한 개별·학급 개입'
          ],
          accentColor: 'violet'
        }
      ]
    },
    clinicalContrastRows: [
      {
        dimension: 'ADHD 핵심 문제행동에 대한 병리적 이해',
        naiveApproach:
          '규칙을 몰라서 어기거나 반항심 때문이라고 여겨 상담실에서 “다음 주엔 안 그러겠다”는 구두 다짐과 반성문을 반복해서 받음',
        evidenceBasedApproach:
          '바클리 모형에 따라 ‘지식의 결함이 아닌 수행의 장애(Disorder of Performance)’로 규정하고 행동이 일어나는 교실 현장의 환경을 재설계함'
      },
      {
        dimension: '시간 관리 및 과제 완수 지원 방식',
        naiveApproach:
          '40분 분량의 통짜 과제를 한 번에 주고 “끝날 때까지 꼼짝 말고 앉아 있으라”며 시간맹(Time Blindness) 아동을 압박함',
        evidenceBasedApproach:
          '수행 시점(Point of Performance)에 시각적 타이머(Time Timer)를 두고 과제를 10분 단위 마이크로 청크로 쪼개어 합법적 움직임 휴식과 결합함'
      },
      {
        dimension: '강화 유관(Contingency) 및 가정-학교 연계',
        naiveApproach:
          '한 달 뒤 시상식 같은 지연된 보상이나 수업 중 공개 벌점·쉬는 시간 박탈로 동기와 자존감을 동시에 파괴함',
        evidenceBasedApproach:
          '지연 할인(Delayed Discounting) 특성을 반영해 매 교시 즉각적 피드백을 주고 일일행동보고카드(DRC)로 당일 가정 보상과 연동함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        'ADHD 진단을 받은 초등학교 4학년 도윤이는 상담실에서 1:1로 대화할 때는 교실 규칙을 완벽히 말하고 “내일부터는 절대 돌아다니지 않겠다”고 진심으로 약속하지만, 교실 수업 시작 10분만 지나면 어김없이 자리를 이탈하고 불쑥 끼어듭니다. 바클리(Barkley)의 실행기능 모형에 기반한 가장 효과적인 개입은?',
      options: [
        {
          label: '상담실 회기를 주 3회로 늘려 규칙 준수의 도덕적 중요성을 깊이 성찰하게 하고 서약서 작성',
          rationale:
            'ADHD는 ‘무엇을 해야 할지 모르는 지식의 결함’이 아니라 ‘수행 시점에 실행하지 못하는 수행의 장애’이므로 교실 맥락과 분리된 상담실 내 구두 서약은 교실 행동으로 전이되지 않습니다.',
          isOptimal: false
        },
        {
          label: '수행 시점(교실 책상)에 시각 타이머·3단계 행동 스티커를 부착하고 10분 단위 과제 분할·사전교정 및 일일행동보고카드(DRC) 가동',
          rationale:
            '행동이 일어나는 바로 그 시점(Point of Performance)에 외현적 실행기능 보철을 배치하고, 합법적 움직임 기회와 즉각적 가정 연계 보상(DRC)을 결합한 과학자-실무자 표준 처방입니다.',
          isOptimal: true
        },
        {
          label: '자리 이탈 시마다 쉬는 시간 운동장 놀이 특권을 전면 박탈하여 에너지 발산 기회를 차단',
          rationale:
            '각성 조절을 위해 합법적 신체 움직임이 필요한 ADHD 아동에게 쉬는 시간 활동마저 박탈하면 다음 교시 과잉행동과 반항성이 오히려 폭증합니다.',
          isOptimal: false
        }
      ]
    }
  }
};
