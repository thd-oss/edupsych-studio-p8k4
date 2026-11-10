import { TheoryVisualBlueprint } from '../../types/visuals';
import { resolveAssetUrl } from '../../utils/assetUrl';

export const MOD3_VISUAL_BLUEPRINTS: Record<string, TheoryVisualBlueprint> = {
  'mod3-theory-operant-punishment': {
    theoryId: 'mod3-theory-operant-punishment',
    topology: 'matrix-2x2',
    diagramTitle: '스키너 조작적 조건형성 2×2 매트릭스: 강화와 벌의 기능적 분류',
    diagramSubtitle:
      '환경 자극의 제시(+)·제거(-)와 미래 행동 빈도의 증가(강화)·감소(벌)에 따른 4사분면 정밀 대조',
    keyTakeawayBadge: '부적 강화(과제 회피로 문제행동 증가)와 벌(행동 감소)을 혼동하지 않는 것이 핵심',
    matrixAxis: {
      xAxisLabel: '자극의 조작 방식 (Stimulus Contingency)',
      yAxisLabel: '목표 행동 빈도 변화 (Behavioral Effect)',
      colHeaders: ['자극의 제시 (+ Added)', '자극의 제거 / 철회 (- Removed)'],
      rowHeaders: [
        '행동 빈도 증가 (강화 Reinforcement)',
        '행동 빈도 감소 (벌 Punishment)'
      ],
      quadrants: [
        {
          quadrantTitle: '정적 강화 (Positive Reinforcement)',
          rowLabel: '행동 증가 (강화)',
          colLabel: '자극 제시 (+)',
          badgeText: '가장 권장되는 핵심 전략',
          summary:
            '목표 행동 직후 선호 자극(구체적 칭찬, 토큰, 선호 활동 기회)을 제시하여 바람직한 행동 빈도를 높입니다.',
          example:
            '수업 중 손을 들고 발표한 직후 교사가 구체적 행동 칭찬과 학급 포인트를 즉시 제공함',
          tone: 'positive'
        },
        {
          quadrantTitle: '부적 강화 (Negative Reinforcement)',
          rowLabel: '행동 증가 (강화)',
          colLabel: '자극 제거 (-)',
          badgeText: '교실 내 과제 회피 역설 주의',
          summary:
            '행동 직후 혐오 자극이 제거됨으로써 그 행동의 빈도가 증가합니다. 교사가 문제행동에 굴복해 과제를 면제해 주면 문제행동이 부적 강화됩니다.',
          example:
            '바람직한 활용: 집중해서 기본 문제 완수 시 보충 숙제 면제 / 역기능적 함정: 난동 부릴 때 복도로 내보내어 어려운 수업을 탈출(Escape)하게 해 줌',
          tone: 'caution'
        },
        {
          quadrantTitle: '수여 벌 (Presentation Punishment · 제1형 벌)',
          rowLabel: '행동 감소 (벌)',
          colLabel: '자극 제시 (+)',
          badgeText: '심각한 부작용 · 사용 지양',
          summary:
            '문제행동 직후 혐오 자극(꾸중, 벌점, 반성문)을 부과하여 행동을 일시 억압하나, 대체행동을 전혀 가르치지 못합니다.',
          example:
            '교사와 학교가 고전적으로 조건화된 공포·회피 자극이 되며, 은폐 행동과 공격적 모델링을 유발함',
          tone: 'critical'
        },
        {
          quadrantTitle: '박탈 벌 (Removal Punishment · 제2형 벌)',
          rowLabel: '행동 감소 (벌)',
          colLabel: '자극 제거 (-)',
          badgeText: '대체행동 정적 강화와 병행 시에만 제한 사용',
          summary:
            '누리던 정적 강화물이나 특권을 일시 회수하여 문제행동 빈도를 낮추는 반응대가(Response Cost)와 타임아웃(Time-out)입니다.',
          example:
            '규칙 위반 시 토큰 1개 차감(반응대가)하되, 곧바로 대체행동 수행 시 토큰을 재획득할 수 있는 복구 기회를 반드시 제공함',
          tone: 'neutral'
        }
      ]
    },
    clinicalContrastRows: [
      {
        dimension: '문제행동 원인의 해석 (귀인 vs A-B-C 유관)',
        naiveApproach:
          '“저 아이는 원래 반항적이고 학습 의지가 박약한 성향(Trait)이다”라며 아동 내면의 고정된 꼬리표로 원인을 설명하는 순환논리에 빠진다.',
        evidenceBasedApproach:
          '순환논리적 성향 명명을 배제하고, 어떤 선행사건(A)에서 행동(B)이 촉발되어 어떤 후속결과(C)로 유지되는지 관찰 가능한 3항 유관 함수 관계를 분석한다.'
      },
      {
        dimension: '교실 밖 퇴거(타임아웃)의 실제 작동 기제',
        naiveApproach:
          '수업 시간에 소란을 피우거나 과제를 거부할 때 복도에 나가 서 있게 하면 반성하고 문제행동이 줄어들 것(벌)이라 믿는다.',
        evidenceBasedApproach:
          '어려운 수업을 회피(Escape)하려는 학생에게 복도 퇴거는 혐오 과제를 합법적으로 면제해 주는 강력한 부적 강화(Negative Reinforcement)가 되어 소란 행동을 오히려 고착화시킨다.'
      },
      {
        dimension: '훈육 및 행동 교정의 핵심 수단',
        naiveApproach:
          '벌점 부과, 공개적 질책, 반성문 쓰기 등 수여 벌(제1형 벌)에 의존하여 문제행동을 당장 억누르는 데만 급급하다.',
        evidenceBasedApproach:
          '처벌은 대체행동을 가르치지 못하므로 구체적 대체행동에 대한 정적 강화를 주축으로 삼고, 불가피한 반응대가(제2형 벌) 사용 시에도 즉각적 포인트 복구 기회를 결합한다.'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '초등 5학년 민수는 수학 서술형 문제 풀이 시간만 되면 연필을 부러뜨리고 큰 소리로 불평합니다. 담임교사는 매번 민수를 교실 뒤편 타임아웃 의자로 보내거나 복도에 나가 있게 했지만, 민수의 문제행동 빈도는 지난 한 달간 오히려 2배 이상 증가했습니다. 담임교사에게 제공할 과학자-실무자 자문으로 가장 적절한 것은?',
      options: [
        {
          label: '복도 퇴거가 수학 과제 탈출이라는 부적 강화로 작동했음을 설명하고, 과제 난이도 조정 및 완수 시 보충 문제를 면제하는 적응적 부적·정적 강화 유관으로 재설계한다.',
          rationale:
            '정답입니다. 민수의 문제행동은 혐오스러운 수학 과제로부터 도피(Escape)하여 부적 강화되고 있었습니다. 퇴거 조치를 중단하고 과제를 세분화한 뒤, 목표량 완수 시 숙제를 줄여주거나(적응적 부적 강화) 선호 특권을 부여(정적 강화)해야 합니다.',
          isOptimal: true
        },
        {
          label: '복도에 서 있는 시간(타임아웃)이 너무 짧아 처벌의 강도가 부족했으므로, 방과 후 남아서 반성문 3장을 추가로 작성하게 하는 수여 벌을 결합하도록 자문한다.',
          rationale:
            '수여 벌의 강도를 높이면 수학 시간과 교사 자체가 고전적으로 조건화된 공포·혐오 자극이 되어 등교 거부나 공격성만 심화시킬 뿐, 수학 서술형 수행 기술을 전혀 가르치지 못합니다.',
          isOptimal: false
        },
        {
          label: '민수의 내재적 학습 동기와 수학 효능감이 형성될 때까지 서술형 과제를 전면 면제해 주고 자유 독서 시간을 부여하도록 권고한다.',
          rationale:
            '문제행동 직후 과제를 영구 면제해 주는 것은 회피 행동을 완전히 공고화하며, 과제분석과 단계적 성공 경험을 통한 유능감 회복 기회를 박탈하는 방임적 대처입니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod3-theory-premack-shaping-task': {
    theoryId: 'mod3-theory-premack-shaping-task',
    topology: 'step-flow',
    diagramTitle: '과제분석(Task Analysis) · 조형(Shaping) · 프리맥 원리 및 용암(Fading) 4단계 파이프라인',
    diagramSubtitle:
      '행동 레퍼토리가 전무한 무기력 학생에게 작은 성공 경험을 구축하고 자기주도적 습관으로 일반화하는 절차',
    keyTakeawayBadge: '진입 장벽을 낮추는 과제 세분화 → 점진적 접근 강화 → 고빈도 행동 연결 → 간헐 강화 전환',
    processSteps: [
      {
        stepNumber: 'Phase 1',
        title: '과제분석 (Task Analysis) 및 연쇄화 설계',
        subtitle: '거대한 목표 행동을 진입 가능한 미시적 하위 단계(Sub-skills)로 쪼개기',
        description:
          '복합 과제를 학생이 즉시 성공할 수 있는 작은 행동 단위로 분해하여 초기 착수 장벽과 인지적 부담을 제거합니다.',
        highlightBadge: '첫 단추 진입 장벽 해소'
      },
      {
        stepNumber: 'Phase 2',
        title: '조형 (Shaping · 점진적 접근의 차별강화)',
        subtitle: 'Successive Approximations · 완성 행동이 나올 때까지 기다리지 않기',
        description:
          '최종 목표 행동에 가까워지는 미세한 근사 행동(예: 교과서 펴기 → 1문제 풀기 → 3문제 풀기)마다 즉시 정적 강화를 제공합니다.',
        highlightBadge: '초기 연속 강화(CRF)'
      },
      {
        stepNumber: 'Phase 3',
        title: '프리맥 원리 (Premack Principle) & 토큰 유관',
        subtitle: 'First [저빈도 목표 행동] → Then [고빈도 선호 행동] 연결',
        description:
          '학생이 자발적으로 즐겨 하는 고빈도 행동(학급 보드게임, 칠판 지우기, 태블릿 탐색)을 저빈도 학습 과제 완수 직후의 강화물로 배치합니다.',
        highlightBadge: '할머니의 법칙 적용'
      },
      {
        stepNumber: 'Phase 4',
        title: '간헐 강화 전환 및 용암 (Fading & Generalization)',
        subtitle: '외적 토큰에서 자연적·사회적 강화 및 자기모니터링으로 이양',
        description:
          '행동이 궤도에 오르면 소거 저항을 높이기 위해 변동비율(VR) 등 간헐 강화로 전환하고, 스스로 성취를 점검하는 내적 유능감으로 일반화합니다.',
        highlightBadge: '유지 및 일반화 완성'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '목표 행동의 요구 수준 설정 (All-or-Nothing vs 과제분석·조형)',
        naiveApproach:
          '“다른 애들처럼 40분 동안 앉아서 학습지 2쪽을 완벽히 다 풀어오면 칭찬해 줄게”라며 최종 완성 행동이 나올 때까지 강화를 유보한다.',
        evidenceBasedApproach:
          '과제분석(Task Analysis)으로 과제를 쪼개고, ‘이름 쓰기 → 1번 문제 읽기 → 1문제 풀기’ 등 점진적 접근(Shaping) 단계마다 즉시 강화하여 착수 장벽을 허문다.'
      },
      {
        dimension: '프리맥 원리(Premack Principle)의 유관 순서',
        naiveApproach:
          '“기분 좋게 먼저 좋아하는 보드게임 15분 실컷 하게 해 줄 테니, 끝나고 나면 약속대로 수학 문제 꼭 풀어야 한다”라며 보상을 선지급한다.',
        evidenceBasedApproach:
          '보상을 먼저 주면 저빈도 행동을 수행할 동기가 소멸하므로, 반드시 ‘먼저(First) 수학 2문제를 풀면, 그다음에(Then) 보드게임 10분을 한다’는 후속 유관을 엄수한다.'
      },
      {
        dimension: '토큰 강화 체제의 사후 관리 및 유지 전략',
        naiveApproach:
          '스티커판이 다 채워진 뒤 어느 날 갑자기 토큰 제도를 전면 중단하거나, 반대로 학기 내내 동일한 물질적 보상에만 영구 의존한다.',
        evidenceBasedApproach:
          '행동이 안정화되면 연속 강화에서 변동비율(VR) 간헐 강화로 전환하고, 자기점검표(Self-monitoring)와 구체적 사회적 칭찬으로 점진적 용암(Fading)을 실시한다.'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '초등 3학년 지호는 글쓰기 시간만 되면 백지를 쳐다보며 엎드려 있고 단 한 줄도 쓰지 못합니다. 반면 쉬는 시간에는 학급 곤충 사육장을 관찰하거나 친구들에게 곤충 그림을 그려주는 활동을 매일 열정적으로 합니다. 지호의 글쓰기 행동을 형성하기 위한 가장 과학적인 처방은?',
      options: [
        {
          label: '글쓰기 과제를 ‘곤충 이름 단어 1개 적기 → 한 문장 묘사하기’로 과제분석·조형(Shaping)하고, 목표 단계 완수 직후 사육장 관찰·그림 그리기 시간(프리맥 원리)을 부여한다.',
          rationale:
            '정답입니다. 과제분석을 통해 첫 진입 장벽을 낮추고 점진적 접근을 강화(Shaping)하면서, 지호의 자연적 고빈도 행동(곤충 관찰·그리기)을 저빈도 행동(글쓰기) 직후의 강화물로 연결한 모범적인 설계입니다.',
          isOptimal: true
        },
        {
          label: '글쓰기 시작 전에 먼저 곤충 그림을 20분 동안 충분히 그리게 해 준 다음, 기분이 좋아졌을 때 일기 한 바닥을 완성하도록 약속(비유관적 선행 보상)한다.',
          rationale:
            '고빈도 선호 행동을 먼저 허용하면 정작 높은 인지적 노력이 필요한 저빈도 행동(글쓰기)을 수행할 강화 유관이 사라져 과제 회피가 재발합니다.',
          isOptimal: false
        },
        {
          label: '3학년 수준에 맞는 원고지 1장 분량의 글쓰기를 끝내기 전까지는 쉬는 시간에도 사육장 근처에 가지 못하게 금지(박탈 벌)하여 동기를 자극한다.',
          rationale:
            '기초 행동 레퍼토리가 없는 상태에서 너무 높은 최종 준거를 강요하고 특권 박탈만 부과하면 학습된 무기력과 글쓰기 혐오만 가중됩니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod3-theory-aba-differential': {
    theoryId: 'mod3-theory-aba-differential',
    topology: 'matrix-2x2',
    diagramTitle: '응용행동분석(ABA) 차별강화 3유형(DRA·DRI·DRO) & 소거 폭발 관리 매트릭스',
    diagramSubtitle:
      '단순 무시의 한계를 넘어 문제행동은 소거(Extinction)하고 바람직한 행동을 선택적으로 강화하는 4대 축',
    keyTakeawayBadge: '소거 폭발(Extinction Burst) 정점에서 굴복하면 최악의 간헐 강화가 학습됨을 명심',
    matrixAxis: {
      xAxisLabel: '강화 및 소거 유관의 초점 (Reinforcement & Extinction Target)',
      yAxisLabel: '행동 중재 전략 차원 (ABA Differential Strategy)',
      colHeaders: [
        '대체·상반 행동 명시적 강화 (Active Replacement)',
        '부적절 행동 부재 강화 & 소거 폭발 관리 (Extinction Control)'
      ],
      rowHeaders: [
        '구체적 표적 행동 형성 (Targeted Behavior)',
        '행동 전반 조절 및 소거 위기 관리 (Global & Burst Management)'
      ],
      quadrants: [
        {
          quadrantTitle: 'DRA (대체행동 차별강화)',
          rowLabel: '구체적 표적 행동',
          colLabel: '대체 행동 강화',
          badgeText: '기능적 등가 행동 교수',
          summary:
            '문제행동에 대한 강화는 철회(소거)하면서, 문제행동과 동일한 기능을 수행하는 바람직한 대체행동을 집중 강화합니다.',
          example:
            '소리 질러 관심 끌기는 무시(소거)하고, “선생님 봐주세요”라고 말하거나 도움 카드를 들었을 때 즉시 다가가 관심을 줌',
          tone: 'positive'
        },
        {
          quadrantTitle: 'DRO (타행동 차별강화 · 문제행동 부재 강화)',
          rowLabel: '구체적 표적 행동',
          colLabel: '부재 구간 강화',
          badgeText: '일정 시간 무발생 시 강화',
          summary:
            '정해진 시간 간격(Interval) 동안 표적 문제행동이 단 한 번도 발생하지 않았을 때 그 외의 어떤 행동이든 강화합니다.',
          example:
            '수업 시작 후 10분 동안 욕설이나 자리 이탈이 없었을 때 즉시 타이머 확인 후 칭찬 스티커를 제공함',
          tone: 'neutral'
        },
        {
          quadrantTitle: 'DRI (상반행동 차별강화)',
          rowLabel: '전반 조절 & 위기 관리',
          colLabel: '상반 행동 강화',
          badgeText: '물리적 양립 불가능 행동',
          summary:
            '문제행동과 신체적·물리적으로 동시에 일어날 수 없는 상반행동(Incompatible Behavior)을 선정하여 강화합니다.',
          example:
            '교실 돌아다니기(자리 이탈)와 물리적으로 양립 불가능한 ‘의자에 바르게 착석해 활동지 풀기’를 강화함',
          tone: 'positive'
        },
        {
          quadrantTitle: '소거 폭발 (Extinction Burst) 일관성 관리',
          rowLabel: '전반 조절 & 위기 관리',
          colLabel: '소거 폭발 관리',
          badgeText: '정점 타협 절대 금지',
          summary:
            '소거 초기에는 기존 강화물을 얻기 위해 문제행동의 빈도·강도가 일시 급증합니다. 이때 반응하면 고강도 문제행동이 간헐 강화됩니다.',
          example:
            '소거 폭발이 예상될 것을 담임교사에게 사전 안내하고, 폭발 시 안전을 확보하되 강화는 철회하며 즉각 DRA/DRI 행동을 촉구함',
          tone: 'critical'
        }
      ]
    },
    clinicalContrastRows: [
      {
        dimension: '소거 폭발(Extinction Burst)에 대한 해석과 대처',
        naiveApproach:
          '계획적 무시를 시도했다가 아이가 더 크게 소리 지르고 책상을 치면 “무시 기법이 안 통한다”며 당황하여 다가가 달래주거나 반응해 버린다.',
        evidenceBasedApproach:
          '소거 폭발을 ‘소거가 정상 작동 중이라는 지표’로 예측하며, 정점에서 타협할 경우 고강도 문제행동이 변동비율(VR) 간헐 강화됨을 숙지하여 일관된 소거를 유지한다.'
      },
      {
        dimension: '단순 소거(계획적 무시) 단독 사용 vs 차별강화 결합',
        naiveApproach:
          '아이가 부적절한 행동을 할 때 그저 눈을 마주치지 않고 무시하기만 하면 알아서 바람직한 행동을 깨우칠 것이라 기대한다.',
        evidenceBasedApproach:
          '소거만으로는 대체행동을 알 수 없으므로, 반드시 물리적 상반행동(DRI: 착석 유지)이나 기능적 대체행동(DRA: 손들고 질문하기)을 촉구하여 즉각 정적 강화를 제공한다.'
      },
      {
        dimension: '관심 추구 행동에 대한 선제적 동기조작(MO)',
        naiveApproach:
          '학생이 조용히 앉아 공부할 때는 당연하게 여겨 아무런 관심을 주지 않다가, 소란을 피울 때만 이름을 부르며 주목한다.',
        evidenceBasedApproach:
          '문제행동이 발생하지 않는 구간(DRO)이나 정해진 주기마다 교사가 먼저 다가가 따뜻한 관심을 주는 비유관 강화(NCR)로 관심 결핍(확립조작)을 선제 해소한다.'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '담임교사가 수업 중 관심을 끌기 위해 괴성을 지르는 초등 2학년 현우의 행동을 고치겠다며 ‘계획적 무시(소거)’를 시작했습니다. 사흘째 되던 날 현우가 평소보다 두 배나 큰 소리로 발을 구르며 괴성을 지르자, 담임교사는 “무시했더니 증상이 더 악화됐다”며 결국 현우에게 다가가 타일렀습니다. 전문상담교사의 자문으로 가장 핵심적인 것은?',
      options: [
        {
          label: '행동이 일시 급증한 것은 중재 실패가 아닌 ‘소거 폭발(Extinction Burst)’임을 안내하고, 폭발 정점에서의 반응이 고강도 괴성을 간헐 강화함을 설명한 뒤 조용히 손들기(DRA/DRI)와 병행하도록 자문한다.',
          rationale:
            '정답입니다. 소거 초기의 소거 폭발 메커니즘과 변동비율(VR) 간헐 강화의 위험성을 정확히 짚어내고, 단순 소거의 한계를 극복하기 위해 DRA/DRI 차별강화를 결합한 과학적 자문입니다.',
          isOptimal: true
        },
        {
          label: '현우에게는 행동주의적 소거 기법이 맞지 않으므로 계획적 무시를 즉시 철회하고, 괴성을 지를 때마다 상담실로 보내 감정 해소를 돕도록 권고한다.',
          rationale:
            '소거 폭발을 기법 부적합으로 오판하고 문제행동 직후 관심과 수업 면제를 제공하면 괴성 행동이 정적·부적으로 강력히 강화됩니다.',
          isOptimal: false
        },
        {
          label: '소거 폭발을 빠르게 제압하기 위해 괴성을 지를 때마다 학급 전체 앞에서 이름을 칠판에 적고 쉬는 시간을 전면 박탈하도록 조언한다.',
          rationale:
            '공개적 칠판 게시조차 관심을 추구하는 아동에게는 또래와 교사의 주목이라는 정적 강화물로 기능할 위험이 크며, 대체행동을 전혀 가르치지 못합니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod3-theory-fba-pbs': {
    theoryId: 'mod3-theory-fba-pbs',
    topology: 'process-cycle',
    diagramTitle: '기능적 행동평가(FBA) & 긍정적 행동지원(PBS) 4단계 순환 프로세스',
    diagramSubtitle:
      '문제행동의 외현적 형태(Topography)가 아닌 의사소통 기능(Function)을 진단하여 생태계를 재설계하는 루프',
    keyTakeawayBadge: '과제 회피(Escape) 기능의 문제행동에 교실 퇴거(타임아웃)를 쓰면 부적 강화가 되는 역설 차단',
    illustrationUrl: resolveAssetUrl('images/concepts/mod3-fba-pbs.png'),
    illustrationCaption:
      'A-B-C 기능적 행동평가(FBA)에서 사전교정(Precorrection)·기능적 의사소통 훈련(FCT)으로 전환하는 긍정적 행동지원(PBS) 블루프린트',
    processSteps: [
      {
        stepNumber: 'Stage 1',
        title: '배경사건(Setting Events) & 선행사건(A) 분석 · 사전교정',
        subtitle: '문제행동을 촉발하는 환경 맥락 파악 및 Precorrection 투입',
        description:
          '수면 부족·가정 갈등(배경사건)과 특정 과제·전환 시간(선행사건 A)을 분석하고, 문제행동 발생 직전에 기대 행동을 미리 시연·안내하는 사전교정과 과제 난이도 조정을 실시합니다.',
        highlightBadge: '선제적 예방 (Precorrection)'
      },
      {
        stepNumber: 'Stage 2',
        title: '표적 행동(B)의 조작적 정의 및 기초선 관찰',
        subtitle: '모호한 성향 꼬리표 대신 관찰·측정 가능한 행동 단위로 기술',
        description:
          '“산만하고 반항적임”이라는 순환논리적 명명 대신 “수학 시간 독립 과제 제시 후 3분 이내에 교구를 던지거나 책상 밑으로 들어감”처럼 명확히 정의합니다.',
        highlightBadge: '조작적 정의 수립'
      },
      {
        stepNumber: 'Stage 3',
        title: '후속결과(C) 추적 및 4대 행동 기능(Function) 가설 수립',
        subtitle: '① 관심 획득(Attention) ② 실물 획득(Tangible) ③ 과제 회피(Escape) ④ 감각 자극(Sensory)',
        description:
          '문제행동 직후 아동이 무엇을 얻거나(정적 강화) 무엇에서 벗어나는지(부적 강화)를 분석하여 행동의 숨은 의사소통 목적을 규명합니다.',
        highlightBadge: '4대 기능 정밀 변별'
      },
      {
        stepNumber: 'Stage 4',
        title: '기능적 의사소통 훈련(FCT) & 대체행동 차별강화(DRA)',
        subtitle: '문제행동보다 적은 노력으로 동일한 기능을 달성하는 대체 기술 교수',
        description:
          '과제 회피가 목적이면 ‘2분 휴식 카드’나 ‘도움 요청 카드’ 사용법(FCT)을 가르쳐 즉시 수용하고, 문제행동에는 더 이상 기존 기능이 작동하지 않게 후속결과를 재구조화합니다.',
        highlightBadge: 'FCT & 생태학적 PBS'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '행동 평가의 초점 (형태 Topography vs 기능 Function)',
        naiveApproach:
          '‘욕설하기, 학습지 찢기’라는 외현적 형태만 보고 행동의 목적과 무관하게 동일한 처벌 규정을 일률적으로 적용한다.',
        evidenceBasedApproach:
          '동일한 ‘학습지 찢기’라도 교사의 주목을 얻으려는 것(관심 획득)인지 어려운 과제를 피하려는 것(과제 회피)인지 A-B-C 관찰(FBA)로 4대 기능을 먼저 변별한다.'
      },
      {
        dimension: '개입의 시점 (사후 반응적 처벌 vs 선행사건 사전교정)',
        naiveApproach:
          '체육 시간 후 교실로 이동할 때마다 소란이 터진 뒤에야 화를 내며 사후 훈계와 벌점을 부과한다.',
        evidenceBasedApproach:
          '전환 시간 2분 전(선행사건 A)에 이동 규칙을 미리 상기·시연시키고 시각 단서를 제공하는 사전교정(Precorrection)으로 문제행동 발생 자체를 예방한다.'
      },
      {
        dimension: '대체행동 교수의 원리 (무조건적 참기 강요 vs 기능적 의사소통 훈련 FCT)',
        naiveApproach:
          '과제가 어려워 책상을 엎는 아이에게 “무조건 참고 끝까지 앉아서 다 풀어”라며 의사소통 수단 없이 인내만 강요한다.',
        evidenceBasedApproach:
          '문제행동과 동일한 기능을 훨씬 적은 노력으로 달성해 주는 기능적 등가 대체행동(FCT: ‘선생님 도와주세요 카드’ 또는 ‘2분 휴식 카드’ 제시)을 명시적으로 가르치고 즉시 강화한다.'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        'A-B-C 기능적 행동평가(FBA) 결과, 초등 4학년 수빈이가 모둠 토의 시간마다 옆 친구의 학용품을 빼앗고 장난을 치는 행동(B)은 모둠 활동에서 소외될 때(A) 친구들과 교사의 즉각적인 반응과 시선을 얻기 위한 ‘사회적 관심 획득(Attention)’ 기능(C)으로 밝혀졌습니다. 수빈이를 위한 긍정적 행동지원(PBS) 설계로 가장 타당한 것은?',
      options: [
        {
          label: '모둠 토의 시작 직전 기대 역할과 질문법을 미리 연습시키는 사전교정(Precorrection)을 실시하고, 적절한 방식으로 발언권이나 관심을 요청하는 의사소통 기술(FCT)을 가르쳐 즉시 또래·교사의 인정을 받게(DRA) 한다.',
          rationale:
            '정답입니다. FBA로 규명된 ‘관심 획득’ 기능에 맞추어 선행사건 단계의 사전교정(역할 부여)과 기능적 등가 대체행동(적절한 관심 요청 기술 FCT) 교수, 그리고 대체행동에 대한 즉각적 관심 강화(DRA)를 완벽히 결합한 PBS 처방입니다.',
          isOptimal: true
        },
        {
          label: '수빈이가 친구 학용품을 빼앗을 때마다 모둠 과제가 너무 어려워서 회피하려는 것으로 간주하여 모둠 과제를 면제해 주고 혼자 쉬게 한다.',
          rationale:
            '수빈이의 행동 기능은 ‘과제 회피’가 아니라 ‘관심 획득’입니다. 기능 진단과 맞지 않는 과제 면제는 소속감 결핍과 관심 박탈(확립조작)을 더욱 악화시킵니다.',
          isOptimal: false
        },
        {
          label: '관심을 끌지 못하도록 모둠 토의 시간마다 수빈이의 책상을 교실 맨 뒤 구석으로 영구 분리하여 혼자 개별 학습지를 풀게 한다.',
          rationale:
            '교육적 통합과 긍정적 행동지원의 생태학적 원리에 위배되는 배제적 격리 조치로, 또래와의 친사회적 상호작용 기술을 배울 기회를 원천 차단합니다.',
          isOptimal: false
        }
      ]
    }
  }
};
