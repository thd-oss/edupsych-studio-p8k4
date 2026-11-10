import { TheoryVisualBlueprint } from '../../types/visuals';
import { resolveAssetUrl } from '../../utils/assetUrl';

export const MOD4_VISUAL_BLUEPRINTS: Record<string, TheoryVisualBlueprint> = {
  'mod4-theory-ipm-working-memory': {
    theoryId: 'mod4-theory-ipm-working-memory',
    topology: 'triadic-network',
    diagramTitle: '배들리(Baddeley) 다중요소 작업기억 네트워크 & 이중부호화(Dual Coding) 구조',
    diagramSubtitle:
      '제한된 의식적 작업대(4±1 청크)를 통제하는 중앙집행기와 하위 루프 간 상호작용 및 장기기억 정교화',
    keyTakeawayBadge: '음운루프(청각 지시) 단독 과부하를 막고 시공간잡기장(시각 도식)을 결합한 이중부호화 실행',
    illustrationUrl: resolveAssetUrl('images/concepts/mod4-working-memory.png'),
    illustrationCaption:
      '배들리(Baddeley)의 다중요소 작업기억 모형(중앙집행기·음운루프·시공간잡기장·일화완충기)과 장기기억 스키마 부호화',
    triadicNodes: {
      centerLabel:
        '중앙집행기 (Central Executive · 주의 자원 배분, 간섭 억제, 인지 전략 통제 및 하위 체계 감독 허브)',
      nodes: [
        {
          nodeTitle: '감각기억 & 선택적 주의 (Sensory Memory)',
          subtitle: '환경 자극 유입의 1차 관문 (시각 0.5초 · 청각 2~3초)',
          bullets: [
            '교실 내 배경 소음과 불필요한 시각 장식을 줄여 핵심 학습 단서에 선택적 주의 유도',
            '학습자 사전지식을 깨우는 사전조직자(Advance Organizer)로 하향식(Top-down) 지각 활성화'
          ],
          accentColor: 'amber'
        },
        {
          nodeTitle: '음운루프 (Phonological Loop)',
          subtitle: '말소리·언어 정보의 단기 보유 및 내적 조음 시연(Articulatory Loop)',
          bullets: [
            '다단계 구두 지시가 쏟아지면 조음 루프 용량을 초과해 앞선 정보가 즉각 소멸(Decay)·간섭됨',
            '핵심 구두 지시는 한 번에 1단계씩 짧고 명료한 문장으로 끊어 전달'
          ],
          accentColor: 'rose'
        },
        {
          nodeTitle: '시공간잡기장 (Visuospatial Sketchpad)',
          subtitle: '시각적 이미지와 공간적 관계의 유지·조작 통로',
          bullets: [
            '구두 설명과 함께 시각적 도표·플로우차트·실물 단서를 동시 제시(Paivio 이중부호화)',
            '상호 독립된 두 채널(음운루프+시공간잡기장)에 부하를 분산하여 전체 작업기억 처리 효율 극대화'
          ],
          accentColor: 'indigo'
        },
        {
          nodeTitle: '일화완충기 & 장기기억 (Episodic Buffer & LTM)',
          subtitle: '음운·시공간 정보와 장기기억 스키마의 다중양식 통합 및 의미 부호화',
          bullets: [
            '단순 기계적 되뇌기(유지 시연) 대신 기존 스키마와 연결하는 정교화 시연·조직화 수행',
            '절차적 기억의 자동화를 통해 중앙집행기의 주의 자원을 고차원 추론에 해방'
          ],
          accentColor: 'emerald'
        }
      ]
    },
    clinicalContrastRows: [
      {
        dimension: '다단계 구두 지시 불이행 학생에 대한 원인 진단',
        naiveApproach:
          '교사의 말을 흘려듣는 "청취 태도 불량"이나 "산만함·성의 부족"으로 귀인하여 반복해서 크게 꾸짖음',
        evidenceBasedApproach:
          '음운루프(Phonological Loop) 용량 병목과 역행 간섭으로 진단하고, 지시를 1단계씩 분할하며 칠판 시각 체크리스트(외적 기억 보철)를 병행함'
      },
      {
        dimension: '수업 정보 제시 및 설명 양식 (Modality)',
        naiveApproach:
          '복잡한 개념을 구두 설명과 빽빽한 줄글 판서(언어-음운 채널 단일 과부하)로만 일방 전달함',
        evidenceBasedApproach:
          '페이비오(Paivio) 이중부호화 원리에 따라 핵심 구두 설명(음운루프)과 구조화된 도식·다이어그램(시공간잡기장)을 동시 제시해 작업기억 용량을 확장함'
      },
      {
        dimension: '장기기억 부호화 및 복습 유도 방식',
        naiveApproach:
          '교과서 정의를 소리 내어 열 번씩 읽거나 노트에 똑같이 베껴 쓰는 단순 유지 시연(Maintenance Rehearsal) 부과',
        evidenceBasedApproach:
          '일화완충기를 통해 자신의 경험·사전지식과 연결해 자기 말로 설명하고 마인드맵으로 묶어내는 정교화·조직화 시연(Elaborative Rehearsal) 유도'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '초등학교 4학년 민준이는 지능검사상 언어이해(VCI)와 유동추론(FRI)은 평균 이상이나 작업기억(WMI)이 경계선 수준입니다. 과학 실험 시간에 담임교사가 "보안경을 쓰고, 비커 A에 물 50ml를 따른 뒤, 시약을 한 스푼 넣고 유리막대로 저어 색 변화를 관찰일지 2번 칸에 적으세요"라고 지시하자, 민준이는 비커에 물만 따른 채 그다음에 무엇을 해야 할지 몰라 멍하니 서 있다가 짝꿍의 실험 도구를 건드려 혼이 났습니다. 학교상담교사로서 담임교사에게 제공할 가장 과학적인 자문은 무엇입니까?',
      options: [
        {
          label: '민준이가 교사의 말에 끝까지 주의를 기울이도록 지시 직후 방금 들은 5가지 순서를 큰 소리로 복창하게 훈련시킨다.',
          rationale:
            '이미 음운루프 용량(4±1 청크)을 초과한 5단계 구두 정보를 강제로 복창하게 하는 것은 작업기억 과부하와 공개적 실패 불안만 가중시킵니다.',
          isOptimal: false
        },
        {
          label: '배들리 모형의 음운루프 병목을 우회하기 위해 구두 지시를 1~2단계로 끊어 말하고, 실험대 위에 그림 아이콘이 포함된 [1~5단계 시각 실험 순서 카드]를 부착해 완료할 때마다 체크하게 한다.',
          rationale:
            '음운루프에 집중된 외재적 부하를 덜어내고, 시공간잡기장을 활용하는 시각적 절차 보철(이중부호화 및 외적 작업대)을 수행 시점에 배치한 최적의 과학자-실무자 처방입니다.',
          isOptimal: true
        },
        {
          label: '실험 활동이 민준이에게 좌절감을 주므로, 실험 조작은 모둠원들에게 맡기고 민준이는 마지막에 결과만 베껴 적도록 역할을 축소한다.',
          rationale:
            '작업기억 보철 지원 없이 과제 참여 자체를 배제하는 것은 학습 기회 박탈과 학업적 무기력을 초래하는 부적절한 회피 조치입니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod4-theory-clt-automatization-chunking': {
    theoryId: 'mod4-theory-clt-automatization-chunking',
    topology: 'stacked-gauge',
    diagramTitle: '스웰러(Sweller) 인지부하이론 3대 부하 배분 & 청킹·완결된 예제 효과 비교',
    diagramSubtitle:
      '초보 학습자의 순수 발견학습 실패 원인과 완결된 예제(Worked Examples)·청킹을 통한 본유적 부하 극대화',
    keyTakeawayBadge: '외재적 부하 축소 + 부분 과제로 내재적 부하 조절 → 본유적 인지부하(스키마 정교화) 극대화',
    stackedGauges: [
      {
        label: '① 초보자 순수 발견학습 (최소 안내 + 분리된 정보 배치 Split-Attention)',
        intrinsicPercent: 45,
        extraneousPercent: 55,
        germanePercent: 0,
        unusedPercent: 0,
        overflowWarning: '시행착오 탐색으로 외재적 부하 55% 폭증! 스키마 형성 0%',
        caption:
          '기초 도식이 없는 학생에게 문제만 던져주면 무작위 시행착오(Means-Ends Analysis)와 시선 이동에 작업기억이 100% 소진되어 스키마가 전혀 형성되지 않음'
      },
      {
        label: '② 완결된 예제(Worked Examples) & 부분 완성 문제(Completion Problems) 제시',
        intrinsicPercent: 35,
        extraneousPercent: 10,
        germanePercent: 45,
        unusedPercent: 10,
        caption:
          '풀이 전 과정이 도표 안에 통합 제시된 예제와 시각적 보철로 외재적 부하를 10%로 낮추어 문제해결 구조 파악(본유적 부하 45%)에 집중'
      },
      {
        label: '③ 청킹(Chunking) 및 스키마 자동화 이후 고차원 응용 단계',
        intrinsicPercent: 15,
        extraneousPercent: 5,
        germanePercent: 65,
        unusedPercent: 15,
        caption:
          '개별 개념들이 상위 청크로 묶이고 하위 절차가 자동화되어 내재적 부하가 15%로 급감하며 창의적·비판적 전이(본유적 부하 65%) 달성'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '초보 학습자·학습부진아 대상 신규 개념 도입 방식',
        naiveApproach:
          '"스스로 부딪치며 깨우쳐야 진짜 실력이 된다"며 기초 스키마가 없는 학생에게 고난도 탐구 과제나 순수 발견학습을 부과함',
        evidenceBasedApproach:
          '무작위 시행착오(외재적 부하 폭증)를 막기 위해 풀이 전 단계가 명시된 완결된 예제(Worked Examples) → 부분 완성 문제 → 독립 문제해결 순으로 스캐폴딩을 제공함'
      },
      {
        dimension: '학습지 및 시각 자료의 공간적 배치 (Split-Attention 관리)',
        naiveApproach:
          '기하 도형이나 그래프는 페이지 상단에 두고, 각 기호의 설명과 풀이 식은 페이지 하단에 분리 배치하여 학생이 시선을 계속 오가게 만듦',
        evidenceBasedApproach:
          '주의분산 효과(Split-Attention Effect)를 제거하기 위해 도형·그래프의 해당 위치 바로 옆에 핵심 수치와 풀이 단계를 물리적으로 통합 배치함'
      },
      {
        dimension: '기초 연산·해독 미숙 학생의 서술형 응용문제 지도',
        naiveApproach:
          '구구단이나 기본 어휘 해독이 자동화되지 않은 상태에서 문장제 응용문제만 반복해서 풀게 하여 이중 과부하 유발',
        evidenceBasedApproach:
          '수행 시점에는 구구단표·공식 참조 카드(환경적 보철)를 허용해 내재적 부하를 낮추고, 별도의 짧은 분산 연습으로 기초 기능의 청킹과 스키마 자동화를 병행 구축함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '중학교 1학년 수학 시간에 일차방정식 활용(거속시 문제) 단원을 처음 배우는 하위권 학생들이 학습지를 받자마자 "무슨 말인지 하나도 모르겠어요"라며 엎드려 버립니다. 기존 학습지는 페이지 맨 위에 긴 문장제 문제 5개가 적혀 있고, 힌트 공식은 칠판 구석에 적혀 있으며, 교사는 "모둠별로 토론해서 스스로 식을 세워 보세요"라고 지시한 상태입니다. 스웰러(Sweller)의 인지부하이론에 기반한 가장 효과적인 수업 재설계 자문은 무엇입니까?',
      options: [
        {
          label: '모둠 토론 시간을 20분에서 40분으로 늘려주고, 가장 먼저 식을 세운 모둠에게 매점 상품권을 주는 외적 보상을 걸어 동기를 높인다.',
          rationale:
            '사전 스키마가 없는 초보자에게 시간과 외적 보상만 늘려주는 것은 무작위 시행착오(외재적 인지부하)와 주의분산 효과를 전혀 해결하지 못합니다.',
          isOptimal: false
        },
        {
          label: '칠판과 학습지로 분리된 공식을 문제 속 선분도 안에 직접 통합(주의분산 제거)하고, 1번은 풀이 전 과정이 적힌 완결된 예제(Worked Example), 2~3번은 핵심 식의 빈칸만 채우는 부분 완성 문제로 재구성한다.',
          rationale:
            '주의분산 효과(Split-Attention)와 시행착오 탐색에 따른 외재적 인지부하를 제거하고, 완결된 예제와 부분 완성 문제를 통해 제한된 작업기억을 스키마 형성(본유적 인지부하)에 집중시킨 정확한 처방입니다.',
          isOptimal: true
        },
        {
          label: '일차방정식 활용 개념은 중학교 1학년 하위권 학생들의 내재적 부하를 초과하므로 해당 단원 수업을 전면 면제하고 초등학교 덧셈·뺄셈 문제지만 풀게 한다.',
          rationale:
            '과제 분할(Segmenting)이나 완결된 예제 같은 교수적 보철을 통해 내재적·외재적 부하를 조절할 수 있음에도 교육과정 자체를 포기하는 것은 부적절합니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod4-theory-metacognition-srl': {
    theoryId: 'mod4-theory-metacognition-srl',
    topology: 'process-cycle',
    diagramTitle: '지머만(Zimmerman)의 순환적 자기조절학습 3단계 & 초인지 조절 루프',
    diagramSubtitle:
      '유창성 착각(Illusion of Competence)을 타파하는 조건적 지식(언제·왜)과 능동적 인출·분산 연습의 순환',
    keyTakeawayBadge: '반복 읽기·형광펜 밑줄의 유창성 착각을 버리고 계획-인출점검-전략귀인 순환을 외현화',
    processSteps: [
      {
        stepNumber: 'Phase 1',
        title: '계획 단계 (Forethought Phase)',
        subtitle: '과제 분석 · 구체적 하위 목표 설정 · 조건적 지식 활성화',
        description:
          '과제 특성과 자신의 현재 이해도를 분석하고, “이 단원은 개념 간 비교가 핵심이므로 단순 읽기 대신 백지 비교표를 써야겠다”는 초인지적 조건적 지식(언제·왜 특정 전략을 쓰는가)과 자기효능감을 가동합니다.',
        highlightBadge: '조건적 지식 & 목표 설정'
      },
      {
        stepNumber: 'Phase 2',
        title: '수행 및 의지 통제 단계 (Performance Phase)',
        subtitle: '초인지 모니터링 · 자기교수 · 능동적 인출 연습(Retrieval Practice)',
        description:
          '단순 반복 읽기(유창성 착각) 대신 책을 덮고 핵심 개념을 스스로 인출해 보며 아는 것과 모르는 것을 실시간 변별(Self-monitoring)하고, 주의 산만 시 자기교수 스크립트로 집중력을 유지합니다.',
        highlightBadge: '능동적 인출 & 실시간 점검'
      },
      {
        stepNumber: 'Phase 3',
        title: '자기성찰 단계 (Self-Reflection Phase)',
        subtitle: '준거 지향 자기평가 · 수정 가능한 전략 귀인 · 차기 계획 재조정',
        description:
          '수행 결과를 목표 기준에 비추어 평가하고, 미흡한 부분을 ‘타고난 머리 탓’이 아닌 ‘적용한 학습 전략의 문제’로 적응적 귀인하여 다음 계획 단계(Phase 1)의 전략을 정교하게 수정합니다.',
        highlightBadge: '전략 귀인 ↻ Phase 1 순환'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '시험 대비 복습 및 이해도 확인 방법',
        naiveApproach:
          '교과서와 필기 노트를 눈으로 5번씩 반복해 읽고 형광펜을 칠하며 "눈에 익으니 다 외웠다"는 유창성 착각(Illusion of Competence)에 빠짐',
        evidenceBasedApproach:
          '책을 덮고 백지에 핵심 구조를 그려보거나 셀프 퀴즈를 푸는 능동적 인출 연습(Retrieval Practice)과 시간 간격을 둔 분산 연습(Spaced Practice)으로 실제 인출 가능 여부를 메타인지적으로 점검함'
      },
      {
        dimension: '학습 전략 교육의 초점 (선언적 vs 조건적 지식)',
        naiveApproach:
          '외부 강사를 초빙해 마인드맵 그리기나 코넬 노트 필기법의 형식(절차적 지식)만 일괄 강의하고 끝냄',
        evidenceBasedApproach:
          '각 교과 과제의 성격에 따라 "언제(When), 왜(Why)" 마인드맵 대신 비교표나 백지 인출을 선택해야 하는지 초인지적 조건적 지식(Conditional Knowledge)을 실제 단원 내용에 결합해 코칭함'
      },
      {
        dimension: '시험 실패 후 피드백 및 성찰 유도 (Self-Reflection)',
        naiveApproach:
          '점수 등수만 확인하고 "다음엔 더 열심히 오래 앉아 있어라"라고 다그쳐 학생이 자신의 지능 부족(내적·안정적 귀인)으로 자책하게 방치함',
        evidenceBasedApproach:
          '지머만의 성찰 단계에 맞춰 오답 원인을 [개념 오해 / 인출 연습 부족 / 시간 배분 실패]로 분석하는 전략 귀인표를 작성하게 하여 차기 계획 단계의 전략 수정으로 연결함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '고등학교 1학년 수빈이는 매일 밤 12시까지 독서실에서 교과서를 네다섯 번씩 정독하고 세 가지 색깔 형광펜으로 꼼꼼히 밑줄을 긋지만, 정작 시험만 보면 기억이 나지 않아 성적이 하위권에 머물자 "저는 아무리 노력해도 안 되는 바보인가 봐요"라며 눈물을 흘립니다. 수빈이의 학습 문제를 진단하고 지머만(Zimmerman)의 자기조절학습 모형으로 개입할 때 가장 적절한 상담 전략은 무엇입니까?',
      options: [
        {
          label: '수빈이의 노력을 인정해 주고, 시험 불안을 줄이기 위해 교과서 정독 횟수를 5회에서 8회로 늘려 완전히 눈에 익힐 때까지 반복 읽기를 권유한다.',
          rationale:
            '단순 반복 읽기(Rereading) 횟수를 늘리는 것은 지각적 친숙성을 지식 습득으로 오인하는 유창성 착각(Illusion of Competence)만 심화시킬 뿐 장기기억 인출 경로를 만들지 못합니다.',
          isOptimal: false
        },
        {
          label: '반복 읽기와 형광펜 긋기가 유발한 유창성 착각임을 설명해 능력 부족 자책을 멈추게 한 뒤, [계획: 단원 핵심 질문 3개 만들기 → 수행점검: 책을 덮고 백지에 인출한 뒤 막히는 부분만 표시하기 → 성찰: 인출 실패 원인을 분석해 분산 복습일 지정하기]의 순환 루프를 훈련한다.',
          rationale:
            '유창성 착각을 교정하여 비적응적 능력 귀인을 수정 가능한 전략 귀인으로 전환하고, 조건적 지식과 능동적 인출 연습(Retrieval Practice)을 지머만의 3단계 순환 모형에 결합한 최적의 코칭입니다.',
          isOptimal: true
        },
        {
          label: '혼자 공부하는 시간이 너무 길어 지친 것이므로 독서실 자습을 중단시키고 유명 인터넷 강의를 하루 4시간씩 연속 시청하게 한다.',
          rationale:
            '수동적 강의 시청 역시 유창성 착각을 유발하기 쉬우며, 초인지적 자기점검(Self-monitoring)과 능동적 인출 과정이 빠져 있어 근본적 해결책이 되지 못합니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod4-theory-bandura-meichenbaum-casel': {
    theoryId: 'mod4-theory-bandura-meichenbaum-casel',
    topology: 'step-flow',
    diagramTitle: '마이켄바움(Meichenbaum) 인지행동수정(CBM) 5단계 자기교수 내면화 사다리',
    diagramSubtitle:
      '반두라의 대처 모델링(Coping Model)과 비고츠키의 내적 언어 발달 원리를 결합한 자기조절 스크립트 체화 과정',
    keyTakeawayBadge: '완벽한 숙달 모델 대신 실수를 전략으로 극복하는 대처 모델링(Think-Aloud)부터 내적 언어까지 5단계 이행',
    processSteps: [
      {
        stepNumber: 'Step 1',
        title: '인지적 모델링 (Cognitive Modeling · Think-Aloud)',
        subtitle: '성인 또는 또래 대처 모델(Coping Model)이 소리 내어 자기대화 시연',
        description:
          '교사가 과제를 수행하며 “문제가 복잡하네, 당황하지 말고 첫 번째 조건부터 천천히 밑줄 쳐 보자. 아, 실수했네! 지우고 다시 확인하자”라고 문제 정의·주의 집중·오류 대처·자기강화를 소리 내어 시연합니다.',
        highlightBadge: '대처 모델링 시연'
      },
      {
        stepNumber: 'Step 2',
        title: '외현적 외적 안내 (Overt External Guidance)',
        subtitle: '교사가 옆에서 들려주는 언어적 안내에 따라 학생이 과제 수행',
        description:
          '교사가 단계별 자기대화 스크립트를 소리 내어 말해주면, 학생은 그 외적 언어 가이드를 따라 행동을 조절하며 초기 성취경험(Mastery Experience)을 쌓습니다.',
        highlightBadge: '외적 언어 스캐폴딩'
      },
      {
        stepNumber: 'Step 3',
        title: '외현적 자기안내 (Overt Self-Guidance)',
        subtitle: '학생 스스로 큰 소리로 혼잣말(Private Speech)을 하며 과제 수행',
        description:
          '학생이 책상 위 시각적 프롬프트 카드를 보며 스스로 소리 내어 “천천히 문제를 읽자 → 순서대로 풀자 → 틀려도 괜찮아 → 잘했어!”라고 말하며 충동을 억제하고 행동을 안내합니다.',
        highlightBadge: '외현적 혼잣말 가동'
      },
      {
        stepNumber: 'Step 4',
        title: '용암된 외현적 자기안내 (Faded Overt Self-Guidance)',
        subtitle: '목소리를 낮추어 작은 속삭임(Whispering)이나 입술 움직임으로 조절',
        description:
          '외현적 발성을 점진적으로 축소(Fading)하여 교실 내 다른 학생에게 방해되지 않는 속삭임 수준으로 자기안내를 이어갑니다.',
        highlightBadge: '점진적 용암(Fading)'
      },
      {
        stepNumber: 'Step 5',
        title: '내현적 자기교수 (Covert Self-Instruction · 내적 언어 완성)',
        subtitle: '머릿속 내적 언어(Inner Speech)를 통한 자율적 인지·정서 자기조절',
        description:
          '외적 소리 없이 머릿속 내적 대화만으로 과제 착수, 정서 각성 조절(CASEL 자기관리), 문제해결을 독립적으로 수행하며 높은 자기효능감을 확립합니다.',
        highlightBadge: '내적 언어 & 자기효능감'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '대리경험(Vicarious Experience)을 위한 역할 모델 제시 방식',
        naiveApproach:
          '한 번도 틀리지 않고 단숨에 문제를 풀어내는 전교 1등 우등생(숙달 모델 Mastery Model)을 본받으라며 비교함',
        evidenceBasedApproach:
          '처음에는 막막해하고 실수도 하지만 자기대화 전략을 사용해 차근차근 오류를 극복해 내는 유사한 또래 대처 모델(Coping Model)을 제시하여 자기효능감을 높임'
      },
      {
        dimension: '충동적·과제 착수 곤란 아동의 자기조절 지도',
        naiveApproach:
          '문제를 대충 찍거나 화를 내며 시험지를 구기는 아동에게 "침착해라", "생각 좀 하고 행동해라"라고 추상적 훈계를 반복함',
        evidenceBasedApproach:
          '내적 언어(Inner Speech) 결함을 보완하기 위해 마이켄바움의 5단계 CBM 절차로 [문제 정의 → 주의 집중 → 오류 대처 → 자기강화] 스크립트를 소리 내어 모델링하고 점진적으로 내면화시킴'
      },
      {
        dimension: '자기효능감 증진을 위한 격려 및 정서 각성 개입',
        naiveApproach:
          '근거 없이 "넌 천재야, 무조건 잘할 수 있어!"라는 빈말 칭찬만 하거나 시험 전 긴장을 나약함으로 취급함',
        evidenceBasedApproach:
          '과제를 소단계로 쪼개어 실제 성취경험(Mastery Experience)을 최우선으로 누적시키고, 심장 두근거림을 "뇌가 집중할 준비를 마쳤다는 에너지 신호"로 긍정적 재해석하게 도움'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '초등학교 3학년 도윤이는 수학 서술형 문제나 조금만 복잡한 만들기 과제가 주어지면 첫 줄도 읽지 않고 급하게 답을 찍거나, 막히면 "에이, 짜증 나! 안 해!"라고 소리치며 연필을 던집니다. 담임교사가 옆자리의 모범생 친구를 가리키며 "지수처럼 침착하게 앉아서 풀어봐"라고 타일렀으나 도윤이는 더욱 반항하며 과제를 거부합니다. 반두라의 사회인지이론과 마이켄바움(Meichenbaum)의 인지행동수정(CBM)에 입각한 최적의 개입은 무엇입니까?',
      options: [
        {
          label: '모범생 지수 대신 반에서 수학을 가장 잘하는 영재학급 학생과 짝을 지어주어 완벽한 문제 풀이 속도를 옆에서 매일 관찰하게 한다.',
          rationale:
            '자신과 역량 격차가 큰 완벽한 숙달 모델(Mastery Model)과의 비교는 대리경험 효과를 내지 못하고 오히려 열등감과 과제 회피만 악화시킵니다.',
          isOptimal: false
        },
        {
          label: '교사가 먼저 "어라, 문제가 길어서 당황스럽네. 심호흡 한 번 하고 첫 문장 조건에만 동그라미 쳐 보자. 틀려도 지우개로 지우면 돼!"라고 소리 내어 시연(대처 모델링·Step 1)한 뒤, 도윤이가 이 4단계 자기대화 카드를 보며 큰 소리(Step 3)에서 속삭임(Step 4), 속마음 대화(Step 5)로 따라 하며 첫 하위 문제를 풀어내게 돕는다.',
          rationale:
            '실수와 불안을 다루는 대처 모델(Coping Model)과 마이켄바움의 5단계 자기교수 내면화 절차, 그리고 소단계 과제 완수를 통한 실제 성취경험(자기효능감 1순위 원천)을 완벽히 결합한 처방입니다.',
          isOptimal: true
        },
        {
          label: '연필을 던질 때마다 쉬는 시간 10분을 압수하는 반응대가(Response Cost)를 엄격히 적용하여 충동적 분노 표출을 즉각 억압한다.',
          rationale:
            '과제를 조율할 내적 언어(Inner Speech) 스크립트와 대처 기술이 없는 상태에서 처벌만 부과하면 정서적 과각성과 적대감만 증폭됩니다.',
          isOptimal: false
        }
      ]
    }
  }
};
