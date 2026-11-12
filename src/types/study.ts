export type ModuleId = 'mod1' | 'mod2' | 'mod3' | 'mod4' | 'mod5';

export type FlashcardStatus = 'unseen' | 'again' | 'review' | 'mastered';

export type StudyItemType = 'theory' | 'flashcard' | 'case' | 'question';

export interface TheoryConcept {
  id: string;
  moduleId: ModuleId;
  titleKo: string;
  titleEn: string;
  sourceMapping: string;
  tags: string[];
  textbookDefinition: string[];
  criticalPerspective: string;
  interviewPoint: string;
  userNote: string;
}

export interface Flashcard {
  id: string;
  moduleId: ModuleId;
  termEn: string;
  termKo: string;
  definition: string;
  classroomExample: string;
  status: FlashcardStatus;
}

export interface CaseLenses {
  behavioral: string;
  cognitive: string;
  motivational: string;
}

export interface ClassroomCase {
  id: string;
  moduleId: ModuleId;
  title: string;
  studentGrade: string;
  scenario: string;
  lenses: CaseLenses;
}

export interface InterviewQuestion {
  id: string;
  moduleId: ModuleId;
  question: string;
  followUpQuestion: string;
  requiredKeywords: string[];
  modelAnswer: string;
}

export interface ModulePayload {
  id: ModuleId;
  number: number;
  title: string;
  subtitle: string;
  sourceMapping: string;
  description: string;
  theories: TheoryConcept[];
  flashcards: Flashcard[];
  cases: ClassroomCase[];
  questions: InterviewQuestion[];
}

export interface ManifestItemEntry {
  id: string;
  moduleId: ModuleId;
  type: StudyItemType;
  titleKo: string;
  titleEn: string;
  filePath: string;
}

export interface ManifestModuleSummary {
  id: ModuleId;
  number: number;
  title: string;
  subtitle: string;
  sourceMapping: string;
  description: string;
  counts: {
    theories: number;
    flashcards: number;
    cases: number;
    questions: number;
  };
}

export interface ManifestData {
  updatedAt: string;
  totalCounts: {
    theories: number;
    flashcards: number;
    cases: number;
    questions: number;
  };
  modules: ManifestModuleSummary[];
  items: ManifestItemEntry[];
}

export interface InterviewDraftRecord {
  questionId: string;
  mainAnswer: string;
  followUpAnswer: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  coveragePercent: number;
  updatedAt: string;
}

export interface UserProgressData {
  updatedAt: string;
  flashcardStatus: Record<string, FlashcardStatus>;
  userNotes: Record<string, string>;
  bookmarks: string[];
  interviewDrafts: Record<string, InterviewDraftRecord>;
}

export type StudyItemUnion =
  | TheoryConcept
  | Flashcard
  | ClassroomCase
  | InterviewQuestion;

export interface ApiPatchItemRequest {
  type?: StudyItemType;
  moduleId?: ModuleId;
  patch: Partial<TheoryConcept> &
    Partial<Flashcard> &
    Partial<ClassroomCase> &
    Partial<InterviewQuestion> & {
      bookmarked?: boolean;
      interviewDraft?: InterviewDraftRecord;
    };
}

export interface ApiPostItemRequest {
  type: StudyItemType;
  moduleId: ModuleId;
  item: StudyItemUnion;
}
