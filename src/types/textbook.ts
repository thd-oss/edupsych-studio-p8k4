import { ModuleId } from './graph';

export type TextbookBookId = 'woolfolk' | 'seifert';

export interface TextbookExcerptCard {
  id: string;
  bookId: TextbookBookId;
  bookTitle: string;
  chapterLabel: string;
  sectionHeading: string;
  pageLabel: string;
  verbatimExcerpt: string;
  highlightQuotes: string[];
  glossaryEntry: string | null;
  koreanContextGuide: string;
}

export interface NodeTextbookBundle {
  nodeId: string;
  moduleId: ModuleId;
  nodeKind: 'theory' | 'flashcard' | 'case' | 'question' | 'module';
  titleKo: string;
  titleEn: string;
  sourceCitation: string;
  excerpts: TextbookExcerptCard[];
}

export interface ModuleTextbookDataset {
  moduleId: ModuleId;
  generatedAt: string;
  entries: Record<string, NodeTextbookBundle>;
}
