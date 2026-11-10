import { TheoryConcept } from '../types/study';
import { TheoryVisualBlueprint } from '../types/visuals';
import { MOD1_VISUAL_BLUEPRINTS } from './visuals/mod1Visuals';
import { MOD2_VISUAL_BLUEPRINTS } from './visuals/mod2Visuals';
import { MOD3_VISUAL_BLUEPRINTS } from './visuals/mod3Visuals';
import { MOD4_VISUAL_BLUEPRINTS } from './visuals/mod4Visuals';
import { MOD5_VISUAL_BLUEPRINTS } from './visuals/mod5Visuals';

export const THEORY_VISUAL_BLUEPRINTS: Record<string, TheoryVisualBlueprint> = {
  ...MOD1_VISUAL_BLUEPRINTS,
  ...MOD2_VISUAL_BLUEPRINTS,
  ...MOD3_VISUAL_BLUEPRINTS,
  ...MOD4_VISUAL_BLUEPRINTS,
  ...MOD5_VISUAL_BLUEPRINTS
};

const FALLBACK_STEP_SLICE_LIMIT = 4;

export function getTheoryVisualBlueprint(
  theory: TheoryConcept
): TheoryVisualBlueprint {
  const existing = THEORY_VISUAL_BLUEPRINTS[theory.id];
  if (existing) {
    return existing;
  }

  const fallbackSteps = theory.textbookDefinition
    .slice(0, FALLBACK_STEP_SLICE_LIMIT)
    .map((defText, idx) => ({
      stepNumber: `0${idx + 1}`,
      title: theory.tags[idx] ? `${theory.tags[idx]} 핵심 원리` : `핵심 명제 ${idx + 1}`,
      subtitle: theory.sourceMapping,
      description: defText,
      highlightBadge: idx === 0 ? '출발 개념' : undefined
    }));

  return {
    theoryId: theory.id,
    topology: 'step-flow',
    diagramTitle: `${theory.titleKo} 핵심 메커니즘 흐름도`,
    diagramSubtitle: theory.titleEn,
    keyTakeawayBadge: '과학자-실무자 통합 구조 도식',
    processSteps:
      fallbackSteps.length > 0
        ? fallbackSteps
        : [
            {
              stepNumber: '01',
              title: theory.titleKo,
              subtitle: theory.titleEn,
              description: theory.criticalPerspective
            }
          ]
  };
}
