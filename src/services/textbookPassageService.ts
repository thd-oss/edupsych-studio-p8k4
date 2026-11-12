import {
  GraphAdjacencyIndex,
  KnowledgeGraphNode,
  ModuleId
} from '../types/graph';
import {
  ModuleTextbookDataset,
  NodeTextbookBundle,
  TextbookExcerptCard
} from '../types/textbook';
import { resolveAssetUrl } from '../utils/assetUrl';

const moduleDatasetCache = new Map<ModuleId, Promise<ModuleTextbookDataset>>();

export function fetchModuleTextbookDataset(
  moduleId: ModuleId
): Promise<ModuleTextbookDataset> {
  const existing = moduleDatasetCache.get(moduleId);
  if (existing) {
    return existing;
  }

  const url = resolveAssetUrl(`textbook/passages-${moduleId}.json`);
  const request = fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`교재 원문 데이터를 불러오지 못했습니다 (${res.status})`);
      }
      return res.json() as Promise<ModuleTextbookDataset>;
    })
    .catch((err) => {
      moduleDatasetCache.delete(moduleId);
      throw err;
    });

  moduleDatasetCache.set(moduleId, request);
  return request;
}

function resolveConnectedTheoryIds(
  node: KnowledgeGraphNode,
  nodeMap: Record<string, KnowledgeGraphNode>,
  adjacency: GraphAdjacencyIndex
): string[] {
  const incomingEdges = adjacency.incomingByNode[node.id] ?? [];
  const connectedTheories: string[] = [];

  for (const edge of incomingEdges) {
    const srcNode = nodeMap[edge.source];
    if (srcNode?.kind === 'theory' && !connectedTheories.includes(srcNode.id)) {
      connectedTheories.push(srcNode.id);
    }
  }

  if (connectedTheories.length > 0) {
    return connectedTheories;
  }

  const moduleTheories = (adjacency.nodesByModule[node.moduleId] ?? [])
    .filter((candidate) => candidate.kind === 'theory')
    .map((candidate) => candidate.id);

  return moduleTheories.slice(0, 2);
}

export async function resolveNodeTextbookBundle(
  nodeId: string,
  nodeMap: Record<string, KnowledgeGraphNode>,
  adjacency: GraphAdjacencyIndex
): Promise<NodeTextbookBundle | null> {
  const node = nodeMap[nodeId];
  if (!node) {
    return null;
  }

  const primaryDataset = await fetchModuleTextbookDataset(node.moduleId);
  const directBundle = primaryDataset.entries[node.id];
  if (directBundle) {
    return directBundle;
  }

  const parentTheoryIds = resolveConnectedTheoryIds(node, nodeMap, adjacency);
  if (parentTheoryIds.length === 0) {
    return null;
  }

  const mergedExcerpts: TextbookExcerptCard[] = [];
  const citationLabels: string[] = [];
  const seenExcerptIds = new Set<string>();

  for (const theoryId of parentTheoryIds) {
    const theoryNode = nodeMap[theoryId];
    if (!theoryNode) continue;

    const dataset =
      theoryNode.moduleId === node.moduleId
        ? primaryDataset
        : await fetchModuleTextbookDataset(theoryNode.moduleId);
    const parentBundle = dataset.entries[theoryId];
    if (!parentBundle) continue;

    if (
      parentBundle.sourceCitation &&
      !citationLabels.includes(parentBundle.sourceCitation)
    ) {
      citationLabels.push(parentBundle.sourceCitation);
    }

    for (const excerpt of parentBundle.excerpts) {
      if (!seenExcerptIds.has(excerpt.id)) {
        seenExcerptIds.add(excerpt.id);
        mergedExcerpts.push(excerpt);
      }
    }
  }

  if (mergedExcerpts.length === 0) {
    return null;
  }

  return {
    nodeId: node.id,
    moduleId: node.moduleId,
    nodeKind: node.kind,
    titleKo: node.titleKo,
    titleEn: node.titleEn,
    sourceCitation: citationLabels.join(' · '),
    excerpts: mergedExcerpts
  };
}
