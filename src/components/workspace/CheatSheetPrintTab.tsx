import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckSquare,
  Columns,
  FileText,
  Printer
} from 'lucide-react';
import { ModuleId } from '../../types/graph';
import {
  InterviewDraftRecord,
  ModulePayload
} from '../../types/study';

interface CheatSheetPrintTabProps {
  modules: ModulePayload[];
  selectedModule: ModuleId | 'all';
  bookmarks: string[];
  userNotes: Record<string, string>;
  interviewDrafts: Record<string, InterviewDraftRecord>;
}

type PrintPreset = 'summary' | 'weakness' | 'master';

export const CheatSheetPrintTab: React.FC<CheatSheetPrintTabProps> = ({
  modules,
  selectedModule,
  bookmarks,
  userNotes,
  interviewDrafts
}) => {
  const [preset, setPreset] = useState<PrintPreset>('summary');
  const [twoColumns, setTwoColumns] = useState<boolean>(false);
  const [pageBreakPerModule, setPageBreakPerModule] = useState<boolean>(true);

  const visibleModules =
    selectedModule === 'all'
      ? modules
      : modules.filter((m) => m.id === selectedModule);

  return (
    <div className="space-y-6">
      {/* 인쇄 설정 컨트롤 바 (인쇄 시 자동 숨김) */}
      <div className="no-print print:hidden surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-900/[0.08] px-2.5 py-0.5 text-xs font-extrabold text-slate-800">
              <Printer className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>A4 요약 시트 &amp; PDF 생성기</span>
            </span>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
              시험장·면접장 지참용 A4 맞춤 요약 시트 &amp; PDF 출력기
            </h3>
            <p className="text-xs text-slate-600">
              상단 네비게이션과 버튼은 인쇄 시 자동으로 제거되며, A4 용지 폭과 페이지 넘김(`break-inside: avoid`)에 맞춰 깔끔하게 출력됩니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>A4 인쇄 / PDF로 저장 (⌘P)</span>
          </button>
        </div>

        {/* 3대 프리셋 선택 & 다단 옵션 */}
        <div className="pt-3 border-t border-slate-900/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                {
                  id: 'summary',
                  label: '① 핵심 이론 & 면접 킬러 포인트 요약본',
                  icon: <BookOpen className="w-3.5 h-3.5 shrink-0" />
                },
                {
                  id: 'weakness',
                  label: '② 취약 노드(Again/Review) & 북마크·개인노트 오답노트',
                  icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                },
                {
                  id: 'master',
                  label: '③ 90-Node 전수 마스터 핸드북 (이론·용어·사례·면접 전체)',
                  icon: <FileText className="w-3.5 h-3.5 shrink-0" />
                }
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold border transition-colors ${
                  preset === p.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-900/[0.08] hover:bg-slate-100'
                }`}
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTwoColumns((prev) => !prev)}
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold border transition-colors ${
                twoColumns
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                  : 'bg-white text-slate-600 border-slate-900/[0.08]'
              }`}
            >
              <Columns className="w-3.5 h-3.5 shrink-0" />
              <span>{twoColumns ? '2단 압축 레이아웃' : '1단 표준 레이아웃'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPageBreakPerModule((prev) => !prev)}
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold border transition-colors ${
                pageBreakPerModule
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                  : 'bg-white text-slate-600 border-slate-900/[0.08]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
              <span>모듈별 페이지 나누기</span>
            </button>
          </div>
        </div>
      </div>

      {/* 실제 인쇄 및 미리보기 시트 영역 */}
      <div className="surface-card p-6 sm:p-8 space-y-8 print:border-0 print:p-0 print:shadow-none">
        {/* 인쇄 문서 타이틀 헤더 */}
        <header className="border-b-2 border-slate-900 pb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold text-indigo-700">
              교육심리학 스튜디오 · 대학원 지필 &amp; 구술면접 핵심 요약본
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              교육심리학 90-Node 도메인 지식 그래프 핵심 요약 시트 (
              {preset === 'summary'
                ? '이론·면접 압축본'
                : preset === 'weakness'
                ? '취약 노드·오답노트'
                : '전수 마스터 핸드북'}
              )
            </h1>
          </div>
          <span className="text-xs font-bold text-slate-500 tabular-nums">
            Woolfolk (13e) × Seifert &amp; Sutton · 출력일:{' '}
            {new Date().toISOString().slice(0, 10)}
          </span>
        </header>

        {/* 모듈별 섹션 */}
        {visibleModules.map((mod, mIdx) => {
          const filteredTheories =
            preset === 'weakness'
              ? mod.theories.filter(
                  (t) =>
                    bookmarks.includes(t.id) ||
                    Boolean((userNotes[t.id] ?? t.userNote ?? '').trim())
                )
              : mod.theories;

          const filteredCards =
            preset === 'weakness'
              ? mod.flashcards.filter(
                  (fc) =>
                    fc.status === 'again' ||
                    fc.status === 'review' ||
                    bookmarks.includes(fc.id)
                )
              : mod.flashcards;

          const filteredQuestions =
            preset === 'weakness'
              ? mod.questions.filter((q) => {
                  const draft = interviewDrafts[q.id];
                  return (
                    bookmarks.includes(q.id) ||
                    !draft ||
                    draft.coveragePercent < 80
                  );
                })
              : mod.questions;

          return (
            <section
              key={mod.id}
              className={`space-y-4 ${
                pageBreakPerModule && mIdx > 0 ? 'print-page-break pt-4' : ''
              }`}
            >
              <div className="rounded-xl bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm sm:text-base font-extrabold">
                  Module {mod.number}. {mod.title} ({mod.subtitle})
                </h2>
                <span className="text-xs font-semibold text-indigo-200">
                  {mod.sourceMapping}
                </span>
              </div>

              {/* 1. 핵심 이론 섹션 */}
              {filteredTheories.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 border-b border-indigo-200 pb-1">
                    ■ 핵심 이론 &amp; 과학자-실무자 면접 포인트 ({filteredTheories.length})
                  </h3>
                  <div
                    className={`grid gap-3 ${
                      twoColumns ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    {filteredTheories.map((t) => {
                      const note = userNotes[t.id] ?? t.userNote ?? '';
                      return (
                        <div
                          key={t.id}
                          className="print-card rounded-xl border border-slate-300 p-3.5 space-y-2"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {t.titleKo}{' '}
                              <span className="font-normal text-slate-500">
                                ({t.titleEn})
                              </span>
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">
                              {t.sourceMapping}
                            </span>
                          </div>

                          <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 leading-relaxed">
                            {t.textbookDefinition.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>

                          <div className="rounded-lg bg-slate-100 p-2.5 text-xs text-slate-800 space-y-1">
                            <p>
                              <strong>비판적 재해석:</strong>{' '}
                              {t.criticalPerspective}
                            </p>
                            <p className="text-indigo-950 font-medium">
                              <strong>면접 포인트:</strong> {t.interviewPoint}
                            </p>
                            {note && (
                              <p className="text-emerald-900 font-bold">
                                <strong>개인 노트:</strong> {note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. 한-영 학술 용어 섹션 */}
              {(preset !== 'summary' || filteredCards.length > 0) &&
                filteredCards.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1">
                      ■ 필수 한-영 학술 용어 &amp; 교실 처방 ({filteredCards.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {filteredCards.map((fc) => (
                        <div
                          key={fc.id}
                          className="print-card rounded-xl border border-slate-300 p-3 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-slate-900 font-extrabold">
                              {fc.termKo} ({fc.termEn})
                            </strong>
                            <span className="text-[10px] font-bold uppercase text-slate-500">
                              [{fc.status}]
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">
                            {fc.definition}
                          </p>
                          <p className="text-slate-600 leading-relaxed">
                            <strong>적용:</strong> {fc.classroomExample}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* 3. 마스터 핸드북일 때: 교실 사례 포함 */}
              {preset === 'master' && mod.cases.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-violet-800 border-b border-violet-200 pb-1">
                    ■ 교실 임상 사례 3중 렌즈 처방 ({mod.cases.length})
                  </h3>
                  <div className="space-y-2.5">
                    {mod.cases.map((c) => (
                      <div
                        key={c.id}
                        className="print-card rounded-xl border border-slate-300 p-3.5 space-y-1.5 text-xs"
                      >
                        <strong className="text-slate-900 font-extrabold block">
                          {c.title} ({c.studentGrade})
                        </strong>
                        <p className="text-slate-700">{c.scenario}</p>
                        <p className="text-emerald-900">
                          <strong>① 행동(FBA/PBS):</strong>{' '}
                          {c.lenses.behavioral}
                        </p>
                        <p className="text-indigo-900">
                          <strong>② 인지(CLT/보철):</strong>{' '}
                          {c.lenses.cognitive}
                        </p>
                        <p className="text-amber-950">
                          <strong>③ 동기·상담:</strong> {c.lenses.motivational}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. 압박 면접 문항 섹션 */}
              {filteredQuestions.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 border-b border-rose-200 pb-1">
                    ■ 실전 압박 면접 &amp; 꼬리질문 모범 답안 ({filteredQuestions.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filteredQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="print-card rounded-xl border border-slate-300 p-3.5 space-y-1.5 text-xs"
                      >
                        <p className="font-extrabold text-slate-900">
                          Q. {q.question}
                        </p>
                        <p className="font-bold text-rose-800">
                          ↳ 꼬리질문: {q.followUpQuestion}
                        </p>
                        <p className="text-indigo-800 font-semibold">
                          필수 키워드: {q.requiredKeywords.join(' · ')}
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                          <strong>모범 구술:</strong> {q.modelAnswer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
