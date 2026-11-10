import { TheoryVisualBlueprint } from '../../types/visuals';
import { resolveAssetUrl } from '../../utils/assetUrl';

export const MOD5_VISUAL_BLUEPRINTS: Record<string, TheoryVisualBlueprint> = {
  'mod5-theory-sdt': {
    theoryId: 'mod5-theory-sdt',
    topology: 'spectrum-continuum',
    diagramTitle: '데시와 라이언(Deci & Ryan) 자기결정이론(SDT) 동기 내면화 스펙트럼',
    diagramSubtitle:
      '자율성·유능감·관계성 3대 기본 심리욕구 충족과 정보적 피드백을 통해 외적 통제에서 자율적 동기로 이행하는 연속체',
    keyTakeawayBadge:
      '자율성 지지 + 명확한 구조화(Structure) 및 정보적 피드백으로 동일시·내재적 동기로 내면화 촉진',
    illustrationUrl: resolveAssetUrl('images/concepts/mod5-sdt-restorative.png'),
    illustrationCaption:
      '데시와 라이언(Deci & Ryan)의 3대 기본 심리욕구(자율성·유능감·관계성)와 회복적 학급 공동체 서클',
    continuumStages: [
      {
        stageLabel: '단계 0 · 무조절',
        title: '무동기 (Amotivation)',
        locus: '비인격적 인과소재 (Impersonal)',
        description:
          '행동과 결과 간의 유관성을 전혀 느끼지 못하며 유능감과 통제감이 상실된 무기력 상태입니다.',
        accentColor: 'slate'
      },
      {
        stageLabel: '외재적 동기 ①',
        title: '외적 조절 (External Regulation)',
        locus: '외적 인과소재 (External)',
        description:
          '오직 외부의 보상 획득이나 처벌·감시 회피를 위해서만 타율적으로 행동하며 통제 제거 시 즉시 소거됩니다.',
        accentColor: 'rose'
      },
      {
        stageLabel: '외재적 동기 ②',
        title: '부과된 조절 (Introjected Regulation)',
        locus: '다소 외적 인과소재 (Somewhat External)',
        description:
          '죄책감·수치심을 피하거나 조건부 자존심을 지키기 위해 강박적으로 수행하여 높은 불안을 동반합니다.',
        accentColor: 'amber'
      },
      {
        stageLabel: '자율적 외재 동기 ③',
        title: '동일시 조절 (Identified Regulation)',
        locus: '다소 내적 인과소재 (Somewhat Internal)',
        description:
          '과제가 자신의 목표와 성장에 왜 중요한지 개인적 가치(Rationale)를 스스로 납득하고 주체적으로 수용합니다.',
        accentColor: 'sky'
      },
      {
        stageLabel: '자율적 외재 동기 ④',
        title: '통합된 조절 (Integrated Regulation)',
        locus: '내적 인과소재 (Internal)',
        description:
          '학습 행동의 가치가 개인의 핵심 정체성 및 삶의 가치관과 완전한 조화를 이루며 자율적으로 실행됩니다.',
        accentColor: 'indigo'
      },
      {
        stageLabel: '최적 자율 동기 ⑤',
        title: '내재적 동기 (Intrinsic Motivation)',
        locus: '완전 내적 인과소재 (Intrinsic)',
        description:
          '외적 보상 없이도 앎의 즐거움, 호기심, 도전 자체의 몰입으로 학습하며 통제적 보상 부여 시 과잉정당화 효과로 훼손될 수 있습니다.',
        accentColor: 'emerald'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '자율성 지지(Autonomy Support)와 학급 구조화(Structure)의 관계',
        naiveApproach:
          '자율성 지지를 아무런 규칙이나 가이드라인 없이 학생 마음대로 하게 두는 자유방임(Permissiveness)으로 오해하여 교실의 혼돈과 유능감 저하를 초래함',
        evidenceBasedApproach:
          '명확한 성취 기대치와 단계적 비계를 제공하는 높은 구조화(Structure) 속에 합리적 이유 설명(Rationale)과 의미 있는 선택권을 결합하여 자율성과 유능감을 동시 충족함'
      },
      {
        dimension: '보상 및 피드백의 제시 방식 (인지평가이론)',
        naiveApproach:
          '이미 흥미를 느끼는 활동에도 등수별 상품이나 조건부 물질 보상과 감시를 부과하여 인과소재를 외부로 이동시키고 내재적 동기를 파괴함(과잉정당화 효과)',
        evidenceBasedApproach:
          '통제적 당위 언어(~해야만 한다)를 배제하고, 학생의 구체적 전략 향상과 숙달 과정을 알려주는 비통제적·정보적 피드백(Informational Feedback)으로 유능감을 강화함'
      },
      {
        dimension: '무미건조한 필수 과제에 대한 동기 내면화 전략',
        naiveApproach:
          '하기 싫어하는 학생에게 “학생이니까 당연히 해야지, 안 하면 벌점이다”라며 죄책감·불안(부과된 조절)이나 처벌 회피(외적 조절)를 압박함',
        evidenceBasedApproach:
          '과제가 왜 지루하고 힘든지 부정적 감정을 먼저 공감·수용(관계성)한 뒤, 학생의 진로·성장과 연결된 가치(Rationale)를 설명하여 동일시 조절(Identified Regulation)로 내면화함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '평소 과학 실험과 탐구를 좋아하던 중학교 2학년 학생이, 학급에서 ‘탐구보고서 제출 건수마다 상점 스티커와 문화상품권을 주는 경쟁 이벤트’가 시작된 이후 오히려 쉬운 주제만 골라 형식적으로 분량만 채우고 상품이 걸리지 않은 자율 탐구는 전혀 하지 않게 되었습니다. 데시와 라이언(Deci & Ryan)의 자기결정이론에 기반한 가장 적절한 교사의 개입은 무엇입니까?',
      options: [
        {
          label:
            '상점과 문화상품권의 보상 단가를 두 배로 높이고 미제출 시 벌점을 부과하여 다시 탐구보고서 작성에 매진하도록 외적 유인을 강화한다.',
          rationale:
            '외적 통제와 조건부 보상을 더욱 강화하면 인과소재가 완전히 외부로 고착되어 내재적 동기가 영구 소실되고 보상이 멈추는 즉시 학습 행동이 소거됩니다.',
          isOptimal: false
        },
        {
          label:
            '조건부 물질 보상 경쟁이 낳은 과잉정당화 효과를 진단하여 외적 보상 조건을 거두고, 학생 스스로 탐구 주제와 실험 방식을 선택하게(자율성) 한 뒤 탐구 설계의 논리적 진전을 짚어주는 정보적 피드백(유능감)을 제공한다.',
          rationale:
            '인지평가이론에 따라 통제적 보상을 제거해 내적 인과소재를 회복시키고, 자율성 지지(선택권 부여)와 정보적 피드백(유능감 충족)을 통해 내재적 동기를 되살리는 과학자-실무자 처방입니다.',
          isOptimal: true
        },
        {
          label:
            '학생의 자율성을 100% 보장하기 위해 어떠한 보고서 양식이나 마감 기한, 교사의 피드백도 일절 제공하지 않는 완전 자유방임 환경을 만든다.',
          rationale:
            '명확한 구조화(Structure)와 정보적 피드백이 결여된 자유방임(Chaos)은 학생의 유능감 욕구를 좌절시켜 무동기 상태를 유발합니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod5-theory-achievement-goals-self-worth': {
    theoryId: 'mod5-theory-achievement-goals-self-worth',
    topology: 'matrix-2x2',
    diagramTitle: '성취목표이론 × 코빙턴(Covington) 자기가치 방어 및 TARGET 학급 구조 매트릭스',
    diagramSubtitle:
      '능력에 대한 암묵적 신념(성장 vs 고정 마인드셋)과 실패 위협 시 작동하는 자기구실 만들기(Self-Handicapping) 분석',
    keyTakeawayBadge:
      '자기구실 만들기는 게으름이 아니라 ‘무능 판정’으로부터 자기가치를 지키려는 처절한 수행회피 방어기제',
    matrixAxis: {
      xAxisLabel: '성취 동기의 방향성 (Approach vs. Avoidance Valence)',
      yAxisLabel: '역량 평가의 준거 틀 (Mastery vs. Performance Standard)',
      colHeaders: [
        '접근 지향 (Approach · 성장 및 유능감 추구)',
        '회피 및 방어 지향 (Avoidance · 무능 노출 방어)'
      ],
      rowHeaders: [
        '숙달 및 개인 내 성장 준거 (Mastery & Growth Mindset)',
        '타인 비교 및 수행 준거 (Performance & Self-Worth Threat)'
      ],
      quadrants: [
        {
          quadrantTitle: '숙달접근 목표 (Mastery-Approach Goal)',
          rowLabel: '숙달 · 개인 내 준거',
          colLabel: '접근 지향',
          badgeText: '가장 적응적인 목표 지향',
          summary:
            '어제의 나보다 성장하고 과제를 깊이 이해하는 데 집중합니다(드웩 성장 마인드셋). 실패와 오류를 학습을 위한 유용한 정보로 활용합니다.',
          example:
            '어려운 심화 문제를 틀려도 좌절하지 않고 오답 원인을 분석하며 자기조절학습 전략을 적극적으로 수정함',
          tone: 'positive'
        },
        {
          quadrantTitle: 'TARGET 모형 기반 숙달 풍토 재구조화',
          rowLabel: '숙달 · 개인 내 준거',
          colLabel: '방어 기제 해체 처방',
          badgeText: '능력과 인간적 자기가치 분리',
          summary:
            '교실의 과제(Task)·자율성(Authority)·인정(Recognition)·집단(Grouping)·평가(Evaluation)·시간(Time)을 개인 내 성장 중심으로 재설계합니다.',
          example:
            '공개 석차 게시를 폐지하고 과거 자신의 기록 대비 향상도와 전략적 시도를 인정하여 실패의 공포를 제거함',
          tone: 'positive'
        },
        {
          quadrantTitle: '수행접근 목표 (Performance-Approach Goal)',
          rowLabel: '타인 비교 · 수행 준거',
          colLabel: '접근 지향',
          badgeText: '순풍 시 성취 · 역풍 시 취약',
          summary:
            '타인보다 높은 등수와 우월한 능력을 입증하는 데 초점을 둡니다. 성적이 잘 나올 때는 노력하나 실패 시 수행회피로 급격히 전락할 위험이 있습니다.',
          example:
            '깊이 있는 탐구보다는 시험에 나오는 정답 암기와 타인과의 등수 경쟁에 높은 불안을 느끼며 매달림',
          tone: 'caution'
        },
        {
          quadrantTitle: '수행회피 목표 & 자기구실 만들기 (Self-Handicapping)',
          rowLabel: '타인 비교 · 수행 준거',
          colLabel: '회피 및 방어 지향',
          badgeText: '자기가치 방어용 노력 철회',
          summary:
            '노력했는데도 실패하면 ‘진짜 머리가 나쁜 무능한 사람’으로 판명되므로, 일부러 노력을 안 해 실패의 핑곗거리를 만드는 자기가치 방어기제입니다.',
          example:
            '시험 전날 밤새 게임을 하거나 일부러 공부를 안 한 뒤 “안 해서 그렇지 마음먹으면 잘해”라며 자존감을 방어함',
          tone: 'critical'
        }
      ]
    },
    clinicalContrastRows: [
      {
        dimension: '자기구실 만들기(Self-Handicapping) 행동에 대한 임상적 해석',
        naiveApproach:
          '시험 전날 게임을 하거나 과제를 미루는 학생을 단순히 게으르고 성실성이 결여된 의지박약으로 규정하여 강하게 질책하고 반성문을 부과함',
        evidenceBasedApproach:
          '노력 후 실패할 경우 ‘무능한 사람’으로 판명되는 수치심으로부터 자기가치(Self-Worth)를 보호하려는 수행회피적 심리 방어기제로 진단하고 실패의 공포를 낮춤'
      },
      {
        dimension: '학급의 평가 및 인정 구조 설계 (Epstein의 TARGET 모형)',
        naiveApproach:
          '성적순 자리 배치나 공개 석차 게시로 경쟁심을 자극하면 모든 학생이 자극받아 더 열심히 공부할 것이라고 믿음(수행 풍토 조장)',
        evidenceBasedApproach:
          '상대평가와 공개 비교를 지양하고, 개인의 과거 성취 대비 향상도와 오류 수정 과정을 비공개적으로 인정(Recognition & Evaluation)하는 숙달목표 풍토를 구축함'
      },
      {
        dimension: '지능 및 능력에 대한 교사의 칭찬 피드백 방식 (Dweck 마인드셋)',
        naiveApproach:
          '성공했을 때 “너는 정말 머리가 좋구나(천재네)”라고 타고난 능력을 칭찬하여 고정 마인드셋과 어려운 과제 회피를 무의식적으로 강화함',
        evidenceBasedApproach:
          '“이번에 조건을 표로 정리한 전략과 끈기 있게 오답을 수정한 과정이 훌륭했어”라고 과정·전략 중심 피드백을 제공하여 성장 마인드셋을 내면화함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '고등학교 1학년 남학생이 수학 지필평가를 앞둔 전날 밤새 모바일 게임을 하고 와서 시험 시간에 잠을 잔 뒤, 친구들과 교사에게 “어제 밤새 게임하느라 한 문제도 안 풀었어. 나도 마음잡고 공부하면 1등급 받을 수 있는데 귀찮아서 안 한 거야”라고 자랑하듯 말합니다. 코빙턴(Covington)의 자기가치이론과 성취목표이론에 근거할 때 가장 타당한 상담 및 학급 개입은 무엇입니까?',
      options: [
        {
          label:
            '학생의 변명이 거짓임을 직면시키기 위해 다음 시험에서는 방과후 자율학습실에 강제로 남겨 매일 4시간씩 문제풀이를 감시하고 성적이 오르지 않으면 엄벌하겠다고 경고한다.',
          rationale:
            '자기가치 방어 수단(핑곗거리)을 강압적으로 박탈한 채 경쟁적 평가에 노출시키면 극심한 불안과 수업 이탈, 완전한 학업 포기(무기력)로 이어집니다.',
          isOptimal: false
        },
        {
          label:
            '노력 후 실패 시 무능함이 드러나는 수치심을 피하려는 자기구실 만들기(수행회피)임을 공감적으로 이해하고, 시험 점수와 인간적 자기가치를 분리해 준 뒤 TARGET 모형에 따라 개인 내 지난 단원 대비 향상도와 풀이 전략에 초점을 맞춘 단계별 숙달 목표를 함께 설정한다.',
          rationale:
            '자기구실 만들기의 근본 원인인 자기가치 위협(무능 노출 공포)을 해체하고, 타인 비교가 아닌 개인 내 성장 준거(숙달접근 목표)로 안전하게 재진입시키는 증거기반 개입입니다.',
          isOptimal: true
        },
        {
          label:
            '학생의 자존감을 높여주기 위해 “너는 원래 머리가 비상한 천재니까 마음만 먹으면 언제든 전교 1등을 할 수 있다”라고 타고난 지능을 반복해서 칭찬해 준다.',
          rationale:
            '타고난 지능(고정 마인드셋)에 대한 칭찬은 오히려 실패 시 ‘천재가 아니라는 사실이 들통날까 봐’ 다시 노력을 회피하게 만드는 역효과를 낳습니다.',
          isOptimal: false
        }
      ]
    }
  },

  'mod5-theory-attribution-helplessness': {
    theoryId: 'mod5-theory-attribution-helplessness',
    topology: 'matrix-2x2',
    diagramTitle: '와이너(Weiner) 3차원 귀인 매트릭스 & 학습된 무기력 재귀인 훈련(Attribution Retraining)',
    diagramSubtitle:
      '인과소재(내적/외적) × 안정성(안정/불안정) × 통제가능성에 따른 학업 실패 귀인 유형과 과학적 재귀인 표적',
    keyTakeawayBadge:
      '근거 없는 노력 강요는 재실패 시 무능 확증을 낳으므로 반드시 [구체적 학습 전략 귀인 + 스캐폴딩] 병행',
    matrixAxis: {
      xAxisLabel: '원인의 안정성 및 통제가능성 (Stability & Controllability)',
      yAxisLabel: '원인의 인과소재 (Locus of Causality)',
      colHeaders: [
        '안정적 · 통제 불가능 (Stable & Uncontrollable)',
        '불안정적 · 변화 가능 (Unstable & Modifiable)'
      ],
      rowHeaders: [
        '내적 귀인 (Internal Locus · 자존감 직결)',
        '외적 귀인 (External Locus · 환경 요인)'
      ],
      quadrants: [
        {
          quadrantTitle: '타고난 능력 부족 귀인 (Low Aptitude)',
          rowLabel: '내적 귀인',
          colLabel: '안정적 · 통제 불가능',
          badgeText: '학습된 무기력 핵심 기제',
          summary:
            '실패 원인을 ‘내 머리가 원래 나빠서(내적·안정적·통제불가)’로 귀인하여 수치심과 미래 성공 기대 상실, 완전한 노력 포기에 빠집니다.',
          example:
            '교사가 과잉 동정(Pity)이나 지나치게 쉬운 과제만 주면 학생은 “선생님도 나를 바보로 본다”는 암묵적 단서를 내면화함',
          tone: 'critical'
        },
        {
          quadrantTitle: '구체적 학습 전략 & 조절 가능한 노력 귀인',
          rowLabel: '내적 귀인',
          colLabel: '불안정적 · 통제 가능',
          badgeText: '재귀인 훈련(Retraining) 최우선 표적',
          summary:
            '실패 원인을 ‘이번에 사용한 공부 방법(전략)이 과제에 맞지 않아서(내적·불안정·통제가능)’로 귀인하여 미래 성공 기대와 통제감을 회복합니다.',
          example:
            '단순 정신력 강요 대신 실제로 성공할 수 있는 단계별 과제분석과 인출 연습 전략을 함께 코칭하여 성공 경험을 입증함',
          tone: 'positive'
        },
        {
          quadrantTitle: '과제 난이도 및 구조적 편견 귀인 (Task Difficulty)',
          rowLabel: '외적 귀인',
          colLabel: '안정적 · 통제 불가능',
          badgeText: '외적 체념 · 과제 회피',
          summary:
            '“시험이 원래 불가능하게 어렵다”거나 “선생님이 나를 싫어한다”고 귀인하여 개인의 수치심은 덜하나 학습 참여 동기를 상실합니다.',
          example:
            '과제 난이도를 학생의 근접발달영역(ZPD) 내로 재조정하고 루브릭 평가 기준을 투명하게 공개하여 통제감을 부여함',
          tone: 'caution'
        },
        {
          quadrantTitle: '운 · 우연 · 일시적 컨디션 귀인 (Luck)',
          rowLabel: '외적 귀인',
          colLabel: '불안정적 · 통제 불가능',
          badgeText: '성공의 내면화 실패 주의',
          summary:
            '무기력 학생은 어쩌다 거둔 성공조차 “찍은 게 운 좋게 맞았다(외적·불안정·통제불가)”고 귀인하여 자기효능감이 오르지 않습니다.',
          example:
            '성공 직후 교사가 “운이 좋았던 게 아니라 네가 조건에 밑줄 치며 3단계 전략을 정확히 써서 맞힌 거야”라고 전략 귀인 피드백을 제공함',
          tone: 'neutral'
        }
      ]
    },
    clinicalContrastRows: [
      {
        dimension: '무기력 학생에 대한 노력 귀인 지도의 방식',
        naiveApproach:
          '기초 스키마와 학습 전략이 전혀 없는 학생에게 “노력하면 무조건 할 수 있어! 네가 노력을 안 해서 그래”라며 맹목적 노력 귀인만 강요함(재실패 시 무능 확증 초래)',
        evidenceBasedApproach:
          '실패 원인을 추상적 정신력이 아닌 ‘구체적이고 수정 가능한 학습 전략의 부재(내적·불안정·통제가능)’로 재귀인시키고 명시적 인지 전략 스캐폴딩을 함께 제공함'
      },
      {
        dimension: '실패한 학생을 대하는 교사의 정서 반응과 암묵적 단서',
        naiveApproach:
          '안쓰러운 마음에 너무 쉬운 빈칸 채우기만 주거나 과잉 동정(Pity)과 무조건적 위로를 보내 학생에게 ‘너는 능력이 부족하다’는 암묵적 메시지를 전달함',
        evidenceBasedApproach:
          '과잉 동정이나 분노를 배제하고, 학생의 근접발달영역(ZPD)에 맞춘 적정 도전 과제와 단서 제공을 통해 ‘전략을 바꾸면 숙달할 수 있다’는 높은 기대를 전달함'
      },
      {
        dimension: '성공 경험 직후의 귀인 피드백 처리',
        naiveApproach:
          '학생이 문제를 맞혔을 때 “와, 이번엔 운이 좋았네!” 또는 단순 결과 칭찬만 하여 학생이 성공을 외적·통제불가 요인(운·쉬운 문제)으로 치부하게 방치함',
        evidenceBasedApproach:
          '성공 직후 “운이 아니라 네가 핵심 단어를 동그라미 치고 두 문단을 연결해 읽는 전략을 정확히 적용해서 풀었어”라고 내적·통제가능한 전략 귀인을 명시적으로 연결함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '영어 독해 시험에서 거듭 낮은 점수를 받은 중학교 1학년 학생이 “선생님, 저는 원래 어학 머리가 없는 돌머리인가 봐요. 아무리 해봤자 소용없어요”라며 학습된 무기력 증상을 보입니다. 와이너(Weiner)의 3차원 귀인이론과 재귀인 훈련(Attribution Retraining) 원리에 부합하는 가장 효과적인 교사의 대응은 무엇입니까?',
      options: [
        {
          label:
            '학생이 상처받지 않도록 “괜찮아, 영어 못해도 사는 데 아무 지장 없어”라고 따뜻하게 동정(Pity)해 주며 초등학교 3학년 수준의 알파벳 쓰기 활동지만 따로 내어준다.',
          rationale:
            '교사의 과잉 동정과 지나치게 낮은 수준의 과제 부여는 학생에게 ‘선생님도 내 능력 결함을 인정했다’는 내적·안정·통제불가 귀인을 확증시켜 무기력을 고착화합니다.',
          isOptimal: false
        },
        {
          label:
            '“노력이 부족해서 그런 거야! 오늘부터 무작정 영어 지문 20개씩 깜지로 외우면 성적이 오를 테니 정신력을 발휘해 봐”라며 노력 귀인을 강하게 독려한다.',
          rationale:
            '효과적인 독해 전략 없이 무작정 노력(깜지 암기)만 강요하면, 다음 시험에서 재실패했을 때 ‘열심히 노력해도 안 되니 진짜 머리가 나쁘다’는 절망에 빠지게 됩니다.',
          isOptimal: false
        },
        {
          label:
            '실패 원인을 타고난 머리(안정·통제불가)가 아닌 ‘문단 중심문장 찾기와 접속사 단서 활용 전략을 아직 적용하지 않은 것(내적·불안정·통제가능)’으로 재귀인시키고, 한 문단짜리 지문에서 해당 전략을 함께 연습해 성공한 즉시 전략 사용의 효과를 구체적으로 피드백한다.',
          rationale:
            '내적·불안정·통제가능한 구체적 전략 귀인으로 전환함과 동시에 실제 성공을 보장하는 인지적 스캐폴딩을 결합한 과학적 재귀인 훈련입니다.',
          isOptimal: true
        }
      ]
    }
  },

  'mod5-theory-gordon-restorative-justice': {
    theoryId: 'mod5-theory-gordon-restorative-justice',
    topology: 'step-flow',
    diagramTitle:
      '고든(Gordon) 의사소통 모형(문제 소유권) & 회복적 정의(Restorative Justice) 실행 흐름도',
    diagramSubtitle:
      '갈등 상황에서 문제 소유권을 판별하여 경청과 나-전달법을 구분하고 회복적 서클로 공동체를 치유하는 4단계',
    keyTakeawayBadge:
      '응보적 처벌(누가 규칙을 어겼는가)에서 회복적 정의(누가 상처 입었고 어떻게 관계를 회복할 것인가)로 전환',
    processSteps: [
      {
        stepNumber: 'Step 1',
        title: '문제 소유권(Problem Ownership)의 정밀 판별',
        subtitle: '현재 상황에서 누구의 욕구가 직접 좌절되고 감정이 상했는가?',
        description:
          '학생의 개인적 고민·불안·또래 상처인지(학생 소유), 학생의 행동이 교사의 수업 진행이나 타인의 안전을 직접 침해하는지(교사 소유), 아니면 양측의 정당한 욕구가 충돌하는지 변별합니다.',
        highlightBadge: '소유권 판별이 첫 단추'
      },
      {
        stepNumber: 'Step 2A',
        title: '[학생 소유 문제] 의사소통 걸림돌 배제 & 적극적 경청',
        subtitle: 'Active Listening · 훈계·성급한 조언·심문을 멈추고 이면 감정 반영',
        description:
          '친구의 은밀한 소외나 시험 불안으로 힘들어하는 학생에게 성급한 충고(걸림돌) 대신 “단톡방에서 혼자만 빠져서 정말 외롭고 막막했겠구나”라고 감정과 의미를 공감적으로 되비추어 줍니다.',
        highlightBadge: '정서적 안전기지 제공'
      },
      {
        stepNumber: 'Step 2B',
        title: '[교사 소유 / 욕구 충돌] 3요소 나-전달법(I-Message) & 무패법',
        subtitle: '비평가적 행동 기술 + 구체적 영향 + 교사의 감정 및 무패법(No-Lose) 합의',
        description:
          '인격을 비난하는 너-전달법 대신 “수업 중에 큰 소리로 장난을 치면(행동) 다른 친구들이 설명을 듣기 어렵고(영향) 선생님도 수업 흐름이 끊겨 당황스럽단다(감정)”라고 전달한 뒤 대안을 함께 합의합니다.',
        highlightBadge: '비난 없는 한계 설정'
      },
      {
        stepNumber: 'Step 3',
        title: '회복적 정의(Restorative Justice) & 회복적 서클 운영',
        subtitle: '피해자 안전 회복 · 가해자의 자발적 책임 수용 · 학급 공동체 재통합',
        description:
          '강제 사과나 벌점 부과(응보적 정의)가 낳는 보복성 은밀한 따돌림을 막기 위해, 평상시 신뢰 서클(Tier 1) → 갈등 조정 대화모임(Tier 2) → 피해 회복 및 재통합 서클(Tier 3)을 통해 공동체 규범을 세웁니다.',
        highlightBadge: '공동체 신뢰 회복'
      }
    ],
    clinicalContrastRows: [
      {
        dimension: '문제 소유권(Problem Ownership)에 따른 교사의 대화 기법 선택',
        naiveApproach:
          '상처받아 찾아온 학생(학생 소유 문제)에게는 “네가 예민해서 그래, 먼저 다가가 봐”라며 충고·훈계(걸림돌)를 하고, 수업 방해 학생(교사 소유 문제)에게는 “너는 왜 늘 이기적이니”라며 너-전달법으로 비난함',
        evidenceBasedApproach:
          '학생 소유 문제에는 의사소통 걸림돌을 멈추고 이면 감정을 반영하는 적극적 경청을 제공하고, 교사 소유 문제에는 [비평가적 행동+구체적 영향+감정]의 3요소 나-전달법과 무패법을 적용함'
      },
      {
        dimension: '학급 내 관계적 공격성(은밀한 따돌림·단톡방 배제) 대응 패러다임',
        naiveApproach:
          '응보적 정의에 따라 가해 학생에게 벌점을 부과하고 교무실에서 억지로 손잡고 사과하게 하여, 뒤에서 보복성 2차 은밀한 배제가 더욱 교묘해지도록 방치함',
        evidenceBasedApproach:
          '회복적 정의에 기반해 사전 개별 면담(Pre-circle)으로 피해자의 안전과 가해자의 책임 인식을 확보한 뒤, 회복적 서클을 통해 구체적인 피해 회복 약속과 학급 공동체 규범을 재구축함'
      },
      {
        dimension: '나-전달법(I-Message) 구사 시의 언어적 정확성',
        naiveApproach:
          '“선생님은 네가 그렇게 무례하고 버릇없게 행동해서 정말 화가 난다”처럼 ‘나’로 시작하지만 실제로는 학생의 인격을 평가·낙인찍는 위장된 너-전달법을 사용함',
        evidenceBasedApproach:
          '가치판단 없이 관찰 가능한 행동 사실만 기술하고, 그 행동이 수업과 타인에게 미친 실질적 영향과 교사의 감정을 분리해 전달하여 학생의 방어적 저항을 최소화함'
      }
    ],
    microSimulation: {
      scenarioPrompt:
        '중학교 2학년 여학생이 눈물을 글썽이며 상담실을 찾아와 “친한 친구들이 새로 단톡방을 만들어서 저만 빼고 이야기하고, 복도에서 마주치면 자기들끼리만 귓속말하며 비웃어요”라고 호소합니다(관계적 공격성 피해). 고든(Gordon)의 의사소통 모형과 회복적 정의(Restorative Justice)에 입각한 가장 적절한 개입 절차는 무엇입니까?',
      options: [
        {
          label:
            '“친구들이 설마 일부러 그랬겠니? 네가 너무 예민하게 받아들이지 말고 내일 먼저 간식을 사서 나눠주며 살갑게 다가가 봐”라고 즉각적인 해결책을 조언한다.',
          rationale:
            '학생이 문제를 소유한 고통스러운 상황에서 가벼운 위안과 성급한 조언(고든의 의사소통 걸림돌)을 사용하면 학생은 자신의 고통이 부정당했다고 느껴 마음의 문을 닫게 됩니다.',
          isOptimal: false
        },
        {
          label:
            '즉시 가해 학생들을 교실 앞으로 불러내어 공개적으로 크게 혼내고 벌점을 부과한 뒤, 피해 학생 앞에서 당장 미안하다고 사과하고 단톡방에 초대하라고 명령한다.',
          rationale:
            '관계적 공격성 상황에서 준비 없는 공개 질책과 응보적 강제 사과는 가해 학생들의 보복 심리를 자극하여 더욱 은밀하고 집요한 2차 따돌림을 유발합니다.',
          isOptimal: false
        },
        {
          label:
            '먼저 적극적 경청으로 피해 학생의 소외감과 두려움을 충분히 공감해 정서적 안전기지를 제공(학생 소유 문제 수용)한 뒤, 사전 개별 모임(Pre-circle)을 거쳐 가해 학생들의 자발적 책임 수용과 학급 구성원의 관계 회복 수칙을 합의하는 회복적 대화모임(서클)을 진행한다.',
          rationale:
            '고든의 적극적 경청으로 피해자의 심리적 안전을 우선 확보하고, 회복적 정의의 사전 모임 및 서클 절차를 통해 2차 가해를 예방하며 실질적인 관계·공동체 회복을 이끌어내는 최선의 개입입니다.',
          isOptimal: true
        }
      ]
    }
  }
};
