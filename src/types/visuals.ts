export type VisualTopologyType =
  | 'hierarchy-pyramid'
  | 'concentric-circles'
  | 'matrix-2x2'
  | 'stacked-gauge'
  | 'process-cycle'
  | 'step-flow'
  | 'spectrum-continuum'
  | 'triadic-network';

export interface PyramidTierItem {
  tierLabel: string;
  title: string;
  proportion?: string;
  subtitle: string;
  details: string[];
  accentColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
}

export interface ConcentricLayerItem {
  ringName: string;
  title: string;
  subtitle: string;
  examples: string[];
  accentColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
}

export interface MatrixQuadrantItem {
  quadrantTitle: string;
  rowLabel: string;
  colLabel: string;
  badgeText: string;
  summary: string;
  example: string;
  tone: 'positive' | 'caution' | 'critical' | 'neutral';
}

export interface StackedGaugeBar {
  label: string;
  intrinsicPercent: number;
  extraneousPercent: number;
  germanePercent: number;
  unusedPercent: number;
  overflowWarning?: string;
  caption: string;
}

export interface ProcessStepNode {
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  highlightBadge?: string;
}

export interface ContinuumStageNode {
  stageLabel: string;
  title: string;
  locus: string;
  description: string;
  accentColor: 'slate' | 'rose' | 'amber' | 'sky' | 'indigo' | 'emerald';
}

export interface TriadicNodeItem {
  nodeTitle: string;
  subtitle: string;
  bullets: string[];
  accentColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
}

export interface ClinicalContrastRow {
  dimension: string;
  naiveApproach: string;
  evidenceBasedApproach: string;
}

export interface MicroSimulationOption {
  label: string;
  rationale: string;
  isOptimal: boolean;
}

export interface ConceptMicroSimulation {
  scenarioPrompt: string;
  options: MicroSimulationOption[];
}

export interface TheoryVisualBlueprint {
  theoryId: string;
  topology: VisualTopologyType;
  diagramTitle: string;
  diagramSubtitle: string;
  keyTakeawayBadge: string;
  illustrationUrl?: string;
  illustrationCaption?: string;
  clinicalContrastRows?: ClinicalContrastRow[];
  microSimulation?: ConceptMicroSimulation;
  pyramidTiers?: PyramidTierItem[];
  concentricLayers?: ConcentricLayerItem[];
  matrixAxis?: {
    xAxisLabel: string;
    yAxisLabel: string;
    colHeaders: [string, string];
    rowHeaders: [string, string];
    quadrants: [
      MatrixQuadrantItem,
      MatrixQuadrantItem,
      MatrixQuadrantItem,
      MatrixQuadrantItem
    ];
  };
  stackedGauges?: StackedGaugeBar[];
  processSteps?: ProcessStepNode[];
  continuumStages?: ContinuumStageNode[];
  triadicNodes?: {
    centerLabel: string;
    nodes: TriadicNodeItem[];
  };
}
