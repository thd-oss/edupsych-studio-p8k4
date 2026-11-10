#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DB_ROOT = path.join(ROOT_DIR, 'server', 'db');
const MANIFEST_FILE = path.join(DB_ROOT, 'manifest.json');
const USER_PROGRESS_FILE = path.join(DB_ROOT, 'user-progress.json');
const GRAPH_EDGES_FILE = path.join(DB_ROOT, 'graph-edges.json');

const DEFAULT_PORT = Number(process.env.PORT || 5174);
const SHOULD_OPEN_APP_WINDOW = process.argv.includes('--open-app');

const MODULE_META_LIST = [
  {
    id: 'mod1',
    number: 1,
    title: '인지·자아·사회·도덕성 발달',
    subtitle: 'Cognitive, Self, Social & Moral Development',
    sourceMapping: 'Woolfolk Ch.2, 3 / Seifert & Sutton Ch.3',
    description:
      '피아제·비고츠키 인지발달론의 현대적 재해석(신피아제 학파·작업기억 병목), 브론펜브레너 생태체계이론, 에릭슨·마샤 정체성 발달, 마음이론과 사회정보처리모형 기반 도덕·사회성 발달을 다룹니다.'
  },
  {
    id: 'mod2',
    number: 2,
    title: '학습자 다양성과 특수 교육적 요구',
    subtitle: 'Learner Differences, CHC/Wechsler, CLT, Prosthetics, RTI & ADHD',
    sourceMapping: 'Woolfolk Ch.4 / Seifert & Sutton Ch.4, 5',
    description:
      '가드너 다중지능·학습양식 통념 비판과 CHC/웩슬러 지능이론, 유동성 지능의 안정성을 보완하는 스키마 자동화·인지부하이론(CLT), 신경심리학적 환경적 보철, RTI/MTSS 및 ADHD 실행기능 지원을 다룹니다.'
  },
  {
    id: 'mod3',
    number: 3,
    title: '행동주의 학습이론과 긍정적 행동지원',
    subtitle: 'Behavioral Learning, FBA & Positive Behavior Support (PBS)',
    sourceMapping: 'Woolfolk Ch.7 / Seifert & Sutton Ch.2',
    description:
      '조작적 조건형성, 부적 강화와 처벌의 역설, 기능적 행동평가(FBA: A-B-C 분석), 사전교정(Precorrection), 대체행동 교수 및 긍정적 행동지원(PBS)을 다룹니다.'
  },
  {
    id: 'mod4',
    number: 4,
    title: '인지·사회인지 학습과 자기조절',
    subtitle: 'Cognitive & Social Cognitive Learning, Metacognition & SRL',
    sourceMapping: 'Woolfolk Ch.8, 9, 11 / Seifert & Sutton Ch.2, 9',
    description:
      '작업기억-장기기억 정보처리 모형, 메타인지(유창성 착각)와 바람직한 어려움(인출연습·분산학습), 반두라 자기효능감과 짐머만의 자기조절학습(SRL) 3단계 순환 모형을 다룹니다.'
  },
  {
    id: 'mod5',
    number: 5,
    title: '학습 동기 및 상담적 학급경영',
    subtitle: 'Motivation (SDT, Attribution, Self-Worth) & Classroom Management',
    sourceMapping: 'Woolfolk Ch.12, 13 / Seifert & Sutton Ch.6, 7, 8',
    description:
      '데시와 라이언의 자기결정성이론(자율성·유능감·관계성), 와이너 귀인이론, 코빙턴 자기가치이론(자기구실 만들기) 및 고든 의사소통·회복적 정의를 다룹니다.'
  }
];

const COLLECTION_FILE_MAP = {
  theory: 'theories.json',
  flashcard: 'flashcards.json',
  case: 'cases.json',
  question: 'questions.json'
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function readJsonSafe(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJsonSafe(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

async function rebuildManifest() {
  const items = [];
  const modulesSummary = [];
  const totalCounts = { theories: 0, flashcards: 0, cases: 0, questions: 0 };

  for (const mod of MODULE_META_LIST) {
    const modDir = path.join(DB_ROOT, mod.id);
    const theories = await readJsonSafe(path.join(modDir, 'theories.json'), []);
    const flashcards = await readJsonSafe(path.join(modDir, 'flashcards.json'), []);
    const cases = await readJsonSafe(path.join(modDir, 'cases.json'), []);
    const questions = await readJsonSafe(path.join(modDir, 'questions.json'), []);

    totalCounts.theories += theories.length;
    totalCounts.flashcards += flashcards.length;
    totalCounts.cases += cases.length;
    totalCounts.questions += questions.length;

    modulesSummary.push({
      ...mod,
      counts: {
        theories: theories.length,
        flashcards: flashcards.length,
        cases: cases.length,
        questions: questions.length
      }
    });

    for (const t of theories) {
      items.push({
        id: String(t.id),
        moduleId: mod.id,
        type: 'theory',
        titleKo: String(t.titleKo ?? ''),
        titleEn: String(t.titleEn ?? ''),
        filePath: `server/db/${mod.id}/theories.json`
      });
    }
    for (const fc of flashcards) {
      items.push({
        id: String(fc.id),
        moduleId: mod.id,
        type: 'flashcard',
        titleKo: String(fc.termKo ?? ''),
        titleEn: String(fc.termEn ?? ''),
        filePath: `server/db/${mod.id}/flashcards.json`
      });
    }
    for (const c of cases) {
      items.push({
        id: String(c.id),
        moduleId: mod.id,
        type: 'case',
        titleKo: String(c.title ?? ''),
        titleEn: String(c.studentGrade ?? ''),
        filePath: `server/db/${mod.id}/cases.json`
      });
    }
    for (const q of questions) {
      const kws = Array.isArray(q.requiredKeywords) ? q.requiredKeywords.join(', ') : '';
      items.push({
        id: String(q.id),
        moduleId: mod.id,
        type: 'question',
        titleKo: String(q.question ?? ''),
        titleEn: kws,
        filePath: `server/db/${mod.id}/questions.json`
      });
    }
  }

  const manifestObj = {
    updatedAt: new Date().toISOString(),
    totalCounts,
    modules: modulesSummary,
    items
  };
  await writeJsonSafe(MANIFEST_FILE, manifestObj);
  return manifestObj;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += String(chunk);
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
  const pathname = parsedUrl.pathname;
  const method = (req.method ?? 'GET').toUpperCase();

  if (pathname.startsWith('/api/')) {
    try {
      if (method === 'GET' && pathname === '/api/manifest') {
        const existingManifest = await readJsonSafe(MANIFEST_FILE, null);
        const manifest = existingManifest ?? (await rebuildManifest());
        const userProgress = await readJsonSafe(USER_PROGRESS_FILE, {
          updatedAt: new Date().toISOString(),
          preferredEntryMode: 'story',
          story: {
            visitedBeats: {},
            simulationChoices: {},
            completedModules: [],
            lastActiveNodeId: null
          },
          flashcardStatus: {},
          userNotes: {},
          bookmarks: [],
          interviewDrafts: {}
        });
        const graphEdges = await readJsonSafe(GRAPH_EDGES_FILE, null);
        sendJson(res, 200, { manifest, userProgress, graphEdges });
        return;
      }

      const moduleMatch = pathname.match(/^\/api\/module\/([a-zA-Z0-9_-]+)$/);
      if (method === 'GET' && moduleMatch) {
        const requestedId = moduleMatch[1];
        const loadSingleModule = async (modMeta) => {
          const modDir = path.join(DB_ROOT, modMeta.id);
          const [theories, flashcards, cases, questions] = await Promise.all([
            readJsonSafe(path.join(modDir, 'theories.json'), []),
            readJsonSafe(path.join(modDir, 'flashcards.json'), []),
            readJsonSafe(path.join(modDir, 'cases.json'), []),
            readJsonSafe(path.join(modDir, 'questions.json'), [])
          ]);
          return { ...modMeta, theories, flashcards, cases, questions };
        };

        if (requestedId === 'all') {
          const modules = await Promise.all(MODULE_META_LIST.map(loadSingleModule));
          sendJson(res, 200, { modules });
          return;
        }

        const targetMeta = MODULE_META_LIST.find((m) => m.id === requestedId);
        if (!targetMeta) {
          sendJson(res, 404, { error: `Module not found: ${requestedId}` });
          return;
        }
        const moduleData = await loadSingleModule(targetMeta);
        sendJson(res, 200, moduleData);
        return;
      }

      const itemMatch = pathname.match(/^\/api\/item\/([^/]+)$/);
      if (method === 'PATCH' && itemMatch) {
        const itemId = decodeURIComponent(itemMatch[1]);
        const body = await readRequestBody(req);
        const patchData = body.patch ?? body;

        const manifest = (await readJsonSafe(MANIFEST_FILE, null)) ?? (await rebuildManifest());
        const entry = manifest.items.find((i) => i.id === itemId);

        const userProgress = await readJsonSafe(USER_PROGRESS_FILE, {
          updatedAt: new Date().toISOString(),
          preferredEntryMode: 'story',
          story: {
            visitedBeats: {},
            simulationChoices: {},
            completedModules: [],
            lastActiveNodeId: null
          },
          flashcardStatus: {},
          userNotes: {},
          bookmarks: [],
          interviewDrafts: {}
        });

        let updatedItem = null;
        if (entry) {
          const absFilePath = path.join(ROOT_DIR, entry.filePath);
          const list = await readJsonSafe(absFilePath, []);
          const idx = list.findIndex((i) => String(i.id) === itemId);
          if (idx !== -1) {
            const itemPatch = { ...patchData };
            delete itemPatch.bookmarked;
            delete itemPatch.interviewDraft;
            delete itemPatch.type;
            delete itemPatch.story;
            delete itemPatch.preferredEntryMode;
            updatedItem = { ...list[idx], ...itemPatch, id: itemId };
            list[idx] = updatedItem;
            await writeJsonSafe(absFilePath, list);
          }
        }

        if (typeof patchData.userNote === 'string') {
          userProgress.userNotes[itemId] = patchData.userNote;
        }
        if (typeof patchData.status === 'string') {
          userProgress.flashcardStatus[itemId] = patchData.status;
        }
        if (typeof patchData.bookmarked === 'boolean') {
          const exists = userProgress.bookmarks.includes(itemId);
          if (patchData.bookmarked && !exists) {
            userProgress.bookmarks.push(itemId);
          } else if (!patchData.bookmarked && exists) {
            userProgress.bookmarks = userProgress.bookmarks.filter((b) => b !== itemId);
          }
        }
        if (patchData.interviewDraft && typeof patchData.interviewDraft === 'object') {
          userProgress.interviewDrafts[itemId] = patchData.interviewDraft;
        }
        if (patchData.story && typeof patchData.story === 'object') {
          userProgress.story = patchData.story;
        }
        if (typeof patchData.preferredEntryMode === 'string') {
          userProgress.preferredEntryMode = patchData.preferredEntryMode;
        }

        userProgress.updatedAt = new Date().toISOString();
        await writeJsonSafe(USER_PROGRESS_FILE, userProgress);
        const nextManifest = await rebuildManifest();

        sendJson(res, 200, {
          status: 'ok',
          item: updatedItem,
          userProgress,
          manifest: nextManifest
        });
        return;
      }

      if (method === 'POST' && pathname === '/api/item') {
        const body = await readRequestBody(req);
        const type = String(body.type ?? 'question');
        const moduleId = String(body.moduleId ?? 'mod1');
        const item = body.item ?? {};
        const fileName = COLLECTION_FILE_MAP[type];
        if (!fileName) {
          sendJson(res, 400, { error: `Invalid item type: ${type}` });
          return;
        }

        const itemId =
          typeof item.id === 'string' && item.id.trim()
            ? item.id.trim()
            : `${moduleId}-${type}-${Date.now()}`;
        const newItem = { ...item, id: itemId, moduleId };
        const targetFile = path.join(DB_ROOT, moduleId, fileName);
        const list = await readJsonSafe(targetFile, []);
        const existingIdx = list.findIndex((i) => String(i.id) === itemId);
        if (existingIdx !== -1) {
          list[existingIdx] = newItem;
        } else {
          list.push(newItem);
        }

        await writeJsonSafe(targetFile, list);
        const nextManifest = await rebuildManifest();
        sendJson(res, 201, { status: 'ok', item: newItem, manifest: nextManifest });
        return;
      }

      if (method === 'PUT' && pathname === '/api/progress') {
        const body = await readRequestBody(req);
        const nextProgress = {
          updatedAt: new Date().toISOString(),
          preferredEntryMode:
            body.preferredEntryMode === 'workspace' ? 'workspace' : 'story',
          story: body.story ?? {
            visitedBeats: {},
            simulationChoices: {},
            completedModules: [],
            lastActiveNodeId: null
          },
          flashcardStatus: body.flashcardStatus ?? {},
          userNotes: body.userNotes ?? {},
          bookmarks: Array.isArray(body.bookmarks) ? body.bookmarks : [],
          interviewDrafts: body.interviewDrafts ?? {}
        };
        await writeJsonSafe(USER_PROGRESS_FILE, nextProgress);
        sendJson(res, 200, { status: 'ok', userProgress: nextProgress });
        return;
      }

      sendJson(res, 404, { error: `Unhandled API route: ${method} ${pathname}` });
      return;
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Internal Server Error'
      });
      return;
    }
  }

  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  let filePath = path.join(DIST_DIR, safePath);
  if (!existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found. Run `npm run build` first.');
  }
}

function launchDesktopAppWindow(url) {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const edgePath = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';

  if (existsSync(chromePath)) {
    exec(`"${chromePath}" --app="${url}"`);
  } else if (existsSync(edgePath)) {
    exec(`"${edgePath}" --app="${url}"`);
  } else {
    exec(`open "${url}"`);
  }
}

function startServer(port) {
  const server = http.createServer((req, res) => {
    void handleRequest(req, res);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const targetUrl = `http://127.0.0.1:${port}`;
      console.log(`Server already running at ${targetUrl}`);
      if (SHOULD_OPEN_APP_WINDOW) {
        launchDesktopAppWindow(targetUrl);
      }
      process.exit(0);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    const targetUrl = `http://127.0.0.1:${port}`;
    console.log(`EduPsych Interactive Studio Standalone App running at ${targetUrl}`);
    if (SHOULD_OPEN_APP_WINDOW) {
      launchDesktopAppWindow(targetUrl);
    }
  });
}

startServer(DEFAULT_PORT);
