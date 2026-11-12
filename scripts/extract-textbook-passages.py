#!/usr/bin/env python3
"""
Builds verified verbatim textbook excerpt bundles (public/textbook/passages-mod1..5.json)
from Anita Woolfolk's Educational Psychology (13th Global Ed.) and
Kelvin Seifert & Rosemary Sutton's Educational Psychology (CC-BY 3.0).
"""
import fitz
import json
import os
import re
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
DB_ROOT = os.path.join(PROJECT_ROOT, "server", "db")
OUT_DIR = os.path.join(PROJECT_ROOT, "public", "textbook")

WOOLFOLK_PATH = "/Users/gimsong-yeon/Downloads/Educational_Psychology_-_Anita_Woolfolk.pdf"
SEIFERT_PATH = "/Users/gimsong-yeon/Downloads/educational psychology.pdf"

w_doc = fitz.open(WOOLFOLK_PATH)
s_doc = fitz.open(SEIFERT_PATH)


def clean_text(t: str) -> str:
    t = t.replace("\x00", "").replace("\xad", "")
    # Rejoin hyphenated line breaks ("develop-\nment" -> "development")
    t = re.sub(r"([a-zA-Z])-\s*\n\s*([a-zA-Z])", r"\1\2", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def norm_match(t: str) -> str:
    return (
        t.replace("“", '"')
        .replace("”", '"')
        .replace("‘", "'")
        .replace("’", "'")
        .replace("–", "-")
        .replace("—", "-")
        .lower()
        .strip()
    )


def trim_to_complete_sentences(text: str, max_chars: int = 860) -> str:
    """Ensure passage starts with an uppercase sentence and ends cleanly at sentence punctuation."""
    t = text.strip()
    if t and (t[0].islower() or t.startswith((",", ";", ":", ")", "-"))):
        m = re.search(r"[.?!]\s+([A-Z“\"][A-Za-z0-9])", t)
        if m and m.start() < len(t) * 0.55:
            t = t[m.start() + 2 :].strip()
    if len(t) > max_chars:
        cut = t[:max_chars]
        last_dot = max(cut.rfind(". "), cut.rfind("? "), cut.rfind("! "), cut.rfind('." '), cut.rfind('.” '))
        if last_dot > 220:
            t = cut[: last_dot + 1].strip()
    if t and t[-1] not in ".?!\"”’)" and len(t) > 260:
        last_p = max(t.rfind("."), t.rfind("?"), t.rfind("!"))
        if last_p > 200:
            t = t[: last_p + 1].strip()
    return t


# 1. Parse Woolfolk Glossary (PDF pages 657..666)
glossary_entries = []
for pno in range(656, 666):
    for b in w_doc[pno].get_text("blocks"):
        if b[6] != 0 or b[1] < 50 or b[3] > 750:
            continue
        txt = clean_text(b[4])
        if ":" in txt and 25 <= len(txt) <= 420:
            term, rest = txt.split(":", 1)
            term_s = term.strip()
            if 2 <= len(term_s) <= 70 and not term_s[0].isdigit():
                glossary_entries.append({
                    "term": term_s,
                    "term_norm": norm_match(term_s),
                    "page": pno + 1 - 2,
                    "full": f"{term_s}: {rest.strip()}"
                })


# 2. Parse Woolfolk TOC sections
w_toc = []
cur_ch_num = 0
cur_ch_title = ""
for level, title, pdf_page in w_doc.get_toc():
    clean_t = title.replace("\x00", "").strip()
    if level == 2 and clean_t.startswith("CHAPTER "):
        m = re.match(r"CHAPTER\s+(\d+):\s*(.+)", clean_t, re.I)
        if m:
            cur_ch_num = int(m.group(1))
            cur_ch_title = f"Chapter {cur_ch_num} · {m.group(2).title()}"
            w_toc.append((pdf_page, cur_ch_num, cur_ch_title, cur_ch_title))
    elif level == 3 and cur_ch_num > 0:
        w_toc.append((pdf_page, cur_ch_num, cur_ch_title, clean_t.title()))


def get_woolfolk_meta(pdf_page: int):
    ch_num, ch_label, sec_label = 1, "Chapter 1", "Overview"
    for p, cn, cl, sl in w_toc:
        if p <= pdf_page:
            ch_num, ch_label, sec_label = cn, cl, sl
        else:
            break
    return ch_num, ch_label, sec_label


# 3. Index clean full-width Woolfolk body paragraphs
w_paras = []
for pno in range(29, 638):
    pdf_page = pno + 1
    book_page = pdf_page - 2
    ch_num, ch_label, sec_label = get_woolfolk_meta(pdf_page)
    if any(skip in sec_label.upper() for skip in ["SUMMARY", "KEY TERMS", "TEACHERS’ CASEBOOK", "TEACHERS' CASEBOOK"]):
        continue
    for b in w_doc[pno].get_text("blocks"):
        if b[6] != 0 or b[1] < 52 or b[3] > 746:
            continue
        width = b[2] - b[0]
        if width < 275:
            continue
        raw = clean_text(b[4])
        if len(raw) < 200:
            continue
        if re.match(r"^(CHAPTER|FIGURE|TABLE|GUIDELINES|SOURCE)\b", raw, re.I):
            continue
        trimmed = trim_to_complete_sentences(raw)
        if len(trimmed) < 180:
            continue
        w_paras.append({
            "bookId": "woolfolk",
            "chapterNum": ch_num,
            "chapterLabel": ch_label,
            "sectionHeading": sec_label,
            "bookPage": book_page,
            "text": trimmed,
            "textNorm": norm_match(trimmed)
        })


# 4. Index clean prose Seifert & Sutton paragraphs (filtering out multi-column table cells)
SEIFERT_CHAPTERS = [
    (1, 8, "Chapter 1 · The Changing Teaching Profession"),
    (2, 20, "Chapter 2 · The Learning Process"),
    (3, 41, "Chapter 3 · Student Development"),
    (4, 66, "Chapter 4 · Student Diversity"),
    (5, 85, "Chapter 5 · Students with Special Educational Needs"),
    (6, 109, "Chapter 6 · Student Motivation"),
    (7, 138, "Chapter 7 · Classroom Management and the Learning Environment"),
    (8, 159, "Chapter 8 · The Nature of Classroom Communication"),
    (9, 183, "Chapter 9 · Facilitating Complex Thinking"),
    (10, 210, "Chapter 10 · Planning Instruction"),
    (11, 240, "Chapter 11 · Teacher-Made Assessment Strategies"),
    (12, 277, "Chapter 12 · Standardized and Other Formal Assessments"),
]


def get_seifert_ch(page_1based: int):
    cn, cl = 1, SEIFERT_CHAPTERS[0][2]
    for c_num, start_p, label in SEIFERT_CHAPTERS:
        if page_1based >= start_p:
            cn, cl = c_num, label
    return cn, cl


s_paras = []
for pno in range(7, 303):
    page_num = pno + 1
    ch_num, ch_label = get_seifert_ch(page_num)
    blocks = [
        b for b in s_doc[pno].get_text("blocks")
        if b[6] == 0 and 72 <= b[1] <= 765
    ]
    blocks.sort(key=lambda b: (round(b[1], 1), round(b[0], 1)))

    filtered_blocks = []
    i = 0
    while i < len(blocks):
        same_row = [blocks[i]]
        j = i + 1
        while j < len(blocks) and abs(blocks[j][1] - blocks[i][1]) < 5.0:
            same_row.append(blocks[j])
            j += 1
        if len(same_row) == 1 and same_row[0][0] <= 82:
            filtered_blocks.append(same_row[0])
        i = j

    cur_lines = []
    cur_sec = ch_label
    prev_y1 = None
    for b in filtered_blocks:
        line = clean_text(b[4])
        if not line or "Creative Commons Attribution" in line or line.isdigit():
            continue
        if line.startswith(("Table ", "Figure ", "Exhibit ")):
            continue
        is_heading = (
            len(line) < 72
            and not line.endswith((".", ",", ";", ":"))
            and line[0].isupper()
            and b[0] < 48
            and (prev_y1 is None or (b[1] - prev_y1) > 9.0)
        )
        new_indent = 52.0 <= b[0] <= 66.0
        big_gap = prev_y1 is not None and (b[1] - prev_y1) > 10.5

        if is_heading:
            if cur_lines and cur_sec.lower() not in ("references", "key terms", "further resources", "chapter summary"):
                joined = trim_to_complete_sentences(clean_text(" ".join(cur_lines)))
                if len(joined) >= 180 and not re.match(r"^[A-Z][A-Za-z\-]+,\s+[A-Z]\.", joined):
                    s_paras.append({
                        "bookId": "seifert",
                        "chapterNum": ch_num,
                        "chapterLabel": ch_label,
                        "sectionHeading": cur_sec,
                        "bookPage": page_num,
                        "text": joined,
                        "textNorm": norm_match(joined)
                    })
                cur_lines = []
            else:
                cur_lines = []
            cur_sec = line
            prev_y1 = b[3]
            continue

        if (new_indent or big_gap) and cur_lines:
            if cur_sec.lower() not in ("references", "key terms", "further resources", "chapter summary"):
                joined = trim_to_complete_sentences(clean_text(" ".join(cur_lines)))
                if len(joined) >= 180 and not re.match(r"^[A-Z][A-Za-z\-]+,\s+[A-Z]\.", joined):
                    s_paras.append({
                        "bookId": "seifert",
                        "chapterNum": ch_num,
                        "chapterLabel": ch_label,
                        "sectionHeading": cur_sec,
                        "bookPage": page_num,
                        "text": joined,
                        "textNorm": norm_match(joined)
                    })
            cur_lines = [line]
        else:
            cur_lines.append(line)
        prev_y1 = b[3]

    if cur_lines and cur_sec.lower() not in ("references", "key terms", "further resources", "chapter summary"):
        joined = trim_to_complete_sentences(clean_text(" ".join(cur_lines)))
        if len(joined) >= 180 and not re.match(r"^[A-Z][A-Za-z\-]+,\s+[A-Z]\.", joined):
            s_paras.append({
                "bookId": "seifert",
                "chapterNum": ch_num,
                "chapterLabel": ch_label,
                "sectionHeading": cur_sec,
                "bookPage": page_num,
                "text": joined,
                "textNorm": norm_match(joined)
            })


# 5. Curated search anchors per Theory (20 nodes)
THEORY_QUERY_SPEC = {
    "mod1-theory-piaget": {
        "w_ch": [2],
        "s_ch": [2, 3],
        "primary": ["equilibration", "assimilation", "accommodation", "neo-piagetian"],
        "context": ["piaget", "schemes", "conservation", "disequilibrium"],
        "glossary_terms": ["equilibration", "assimilation", "accommodation", "neo-piagetian theories"]
    },
    "mod1-theory-vygotsky": {
        "w_ch": [2],
        "s_ch": [2, 3],
        "primary": ["zone of proximal development", "scaffolding", "private speech"],
        "context": ["vygotsky", "cultural tools", "assisted learning", "novice"],
        "glossary_terms": ["zone of proximal development", "scaffolding", "private speech"]
    },
    "mod1-theory-ecological": {
        "w_ch": [3],
        "s_ch": [3],
        "primary": ["bioecological", "bronfenbrenner", "microsystem", "identity foreclosure", "moratorium"],
        "context": ["erikson", "mesosystem", "identity", "psychosocial"],
        "glossary_terms": ["bioecological model", "identity foreclosure", "moratorium"]
    },
    "mod1-theory-moral": {
        "w_ch": [3],
        "s_ch": [3],
        "primary": ["kohlberg", "moral reasoning", "gilligan", "theory of mind", "aggression"],
        "context": ["ethic of care", "perspective-taking", "hostile", "conventional"],
        "glossary_terms": ["moral reasoning", "theory of mind", "perspective-taking"]
    },
    "mod2-theory-chc": {
        "w_ch": [4],
        "s_ch": [4],
        "primary": ["fluid intelligence", "crystallized intelligence", "multiple intelligences", "learning styles"],
        "context": ["gardner", "cattell", "wechsler", "intelligence"],
        "glossary_terms": ["fluid intelligence", "crystallized intelligence", "learning styles"]
    },
    "mod2-theory-clt-prosthetics": {
        "w_ch": [8, 4],
        "s_ch": [9, 5],
        "primary": ["cognitive load", "intrinsic cognitive load", "extraneous cognitive load", "executive functioning"],
        "context": ["working memory", "automated", "schemas", "attention"],
        "glossary_terms": ["cognitive load", "intrinsic cognitive load", "extraneous cognitive load"]
    },
    "mod2-theory-rti": {
        "w_ch": [4],
        "s_ch": [5],
        "primary": ["response to intervention", "tier 1", "tier 2", "tier 3", "individualized education program"],
        "context": ["learning disabilities", "early intervention", "special education", "accommodations"],
        "glossary_terms": ["response to intervention (rti)", "learning disability"]
    },
    "mod2-theory-adhd": {
        "w_ch": [4],
        "s_ch": [5],
        "primary": ["attention-deficit", "hyperactivity", "adhd", "impulsivity"],
        "context": ["inattention", "behavioral", "medication", "self-control"],
        "glossary_terms": ["attention-deficit hyperactivity disorder (adhd)"]
    },
    "mod3-theory-operant-punishment": {
        "w_ch": [7],
        "s_ch": [2, 7],
        "primary": ["negative reinforcement", "presentation punishment", "removal punishment", "operant conditioning"],
        "context": ["positive reinforcement", "skinner", "aversive", "consequences"],
        "glossary_terms": ["negative reinforcement", "presentation punishment", "removal punishment"]
    },
    "mod3-theory-premack-shaping-task": {
        "w_ch": [7],
        "s_ch": [2],
        "primary": ["premack principle", "shaping", "successive approximations", "task analysis"],
        "context": ["token reinforcement", "response cost", "cues", "prompts"],
        "glossary_terms": ["premack principle", "shaping", "task analysis", "response cost"]
    },
    "mod3-theory-aba-differential": {
        "w_ch": [7],
        "s_ch": [2, 7],
        "primary": ["extinction", "applied behavior analysis", "differential reinforcement", "reinforcement schedules"],
        "context": ["inappropriate behavior", "ignoring", "positive practice"],
        "glossary_terms": ["extinction", "applied behavior analysis"]
    },
    "mod3-theory-fba-pbs": {
        "w_ch": [7],
        "s_ch": [7, 5],
        "primary": ["functional behavioral assessment", "positive behavior supports", "precorrection"],
        "context": ["antecedents", "functions of behavior", "replacement", "behavioral"],
        "glossary_terms": ["functional behavioral assessment (fba)", "positive behavior supports (pbs)", "precorrection"]
    },
    "mod4-theory-ipm-working-memory": {
        "w_ch": [8],
        "s_ch": [2, 9],
        "primary": ["phonological loop", "visuospatial sketchpad", "central executive", "episodic buffer"],
        "context": ["working memory", "baddeley", "short-term", "information processing"],
        "glossary_terms": ["working memory", "central executive", "phonological loop", "visuospatial sketchpad"]
    },
    "mod4-theory-clt-automatization-chunking": {
        "w_ch": [8, 9],
        "s_ch": [9, 2],
        "primary": ["chunking", "worked example", "germane", "automated basic skills"],
        "context": ["cognitive load", "extraneous", "schemas", "problem solving"],
        "glossary_terms": ["chunking", "worked example", "germane cognitive load", "automated basic skills"]
    },
    "mod4-theory-metacognition-srl": {
        "w_ch": [9, 11],
        "s_ch": [9, 6],
        "primary": ["metacognition", "self-regulated learning", "conditional knowledge"],
        "context": ["zimmerman", "planning", "monitoring", "evaluating", "metacognitive"],
        "glossary_terms": ["metacognition", "self-regulated learning", "conditional knowledge"]
    },
    "mod4-theory-bandura-meichenbaum-casel": {
        "w_ch": [11],
        "s_ch": [6, 2],
        "primary": ["triadic reciprocal causality", "self-efficacy", "cognitive behavior modification", "meichenbaum"],
        "context": ["mastery experiences", "bandura", "emotional self-regulation", "self-instruction"],
        "glossary_terms": ["triadic reciprocal causality", "self-efficacy", "cognitive behavior modification"]
    },
    "mod5-theory-sdt": {
        "w_ch": [12],
        "s_ch": [6],
        "primary": ["self-determination", "cognitive evaluation theory", "autonomy", "competence", "relatedness"],
        "context": ["controlling", "informational", "intrinsic motivation", "deci"],
        "glossary_terms": ["self-determination", "cognitive evaluation theory", "need for autonomy"]
    },
    "mod5-theory-achievement-goals-self-worth": {
        "w_ch": [12],
        "s_ch": [6],
        "primary": ["mastery goal", "performance goal", "self-handicapping", "self-worth"],
        "context": ["covington", "failure-avoiding", "entity view", "incremental"],
        "glossary_terms": ["mastery goal", "performance goal", "self-handicapping"]
    },
    "mod5-theory-attribution-helplessness": {
        "w_ch": [12],
        "s_ch": [6],
        "primary": ["attribution theories", "weiner", "learned helplessness", "locus", "controllability"],
        "context": ["stability", "effort", "ability", "attributions"],
        "glossary_terms": ["attribution theories", "learned helplessness"]
    },
    "mod5-theory-gordon-restorative-justice": {
        "w_ch": [13],
        "s_ch": [7, 8],
        "primary": ["empathetic listening", '"i" message', "restorative justice", "peer mediation"],
        "context": ["gordon", "problem ownership", "active listening", "conflict"],
        "glossary_terms": ["empathetic listening", '"i" message', "peer mediation"]
    },
}


# 6. Curated search anchors per Flashcard (all 47 nodes explicitly mapped!)
FLASHCARD_QUERY_SPEC = {
    # Module 1 (8 flashcards)
    "mod1-fc-equilibration": {
        "w_ch": [2], "s_ch": [2, 3],
        "primary": ["equilibration", "disequilibrium", "assimilation", "accommodation"],
        "context": ["piaget", "schemes"],
        "glossary_terms": ["equilibration", "disequilibrium"]
    },
    "mod1-fc-neopiagetian": {
        "w_ch": [2], "s_ch": [3, 2],
        "primary": ["neo-piagetian", "case", "executive", "working memory"],
        "context": ["piaget", "stages", "attention", "schemes"],
        "glossary_terms": ["neo-piagetian theories"]
    },
    "mod1-fc-zpd": {
        "w_ch": [2], "s_ch": [2, 3],
        "primary": ["zone of proximal development", "zpd"],
        "context": ["vygotsky", "guidance", "adult", "novice"],
        "glossary_terms": ["zone of proximal development"]
    },
    "mod1-fc-scaffolding": {
        "w_ch": [2, 10], "s_ch": [2, 3],
        "primary": ["scaffolding", "assisted learning", "contingent support"],
        "context": ["vygotsky", "prompts", "gradually", "support"],
        "glossary_terms": ["scaffolding"]
    },
    "mod1-fc-privatespeech": {
        "w_ch": [2], "s_ch": [2, 3],
        "primary": ["private speech", "egocentric speech", "inner speech", "muttering"],
        "context": ["vygotsky", "self-regulation", "talking"],
        "glossary_terms": ["private speech", "collective monologue"]
    },
    "mod1-fc-mesosystem": {
        "w_ch": [3], "s_ch": [3],
        "primary": ["mesosystem", "microsystem", "bioecological", "bronfenbrenner"],
        "context": ["exosystem", "macrosystem", "reciprocal", "family"],
        "glossary_terms": ["bioecological model"]
    },
    "mod1-fc-identitystatus": {
        "w_ch": [3], "s_ch": [3],
        "primary": ["identity foreclosure", "moratorium", "identity achievement", "marcia"],
        "context": ["exploration", "commitment", "erikson", "identity"],
        "glossary_terms": ["identity foreclosure", "moratorium", "identity achievement"]
    },
    "mod1-fc-hostileattribution": {
        "w_ch": [3], "s_ch": [3, 7],
        "primary": ["hostile", "instrumental aggression", "hostile aggression", "intention", "dodge"],
        "context": ["aggression", "relational aggression", "proactive", "peers"],
        "glossary_terms": ["hostile aggression", "instrumental aggression", "relational aggression"]
    },

    # Module 2 (9 flashcards)
    "mod2-fc-chc": {
        "w_ch": [4], "s_ch": [4],
        "primary": ["fluid intelligence", "crystallized intelligence", "carroll", "cattell"],
        "context": ["general intelligence", "broad abilities", "horn"],
        "glossary_terms": ["fluid intelligence", "crystallized intelligence"]
    },
    "mod2-fc-wmi-psi": {
        "w_ch": [4, 8], "s_ch": [4, 12],
        "primary": ["wechsler", "wisc", "working memory", "processing speed", "individual intelligence"],
        "context": ["stanford-binet", "iq", "deviation iq", "fluid intelligence"],
        "glossary_terms": ["deviation iq", "working memory"]
    },
    "mod2-fc-schema-automatization": {
        "w_ch": [8], "s_ch": [9, 2],
        "primary": ["automated basic skills", "automatization", "automaticity", "schemas"],
        "context": ["working memory", "cognitive load", "practice"],
        "glossary_terms": ["automated basic skills", "schemas"]
    },
    "mod2-fc-clt": {
        "w_ch": [8], "s_ch": [9, 2],
        "primary": ["extraneous cognitive load", "intrinsic cognitive load", "germane", "cognitive load"],
        "context": ["working memory", "sweller", "divided attention"],
        "glossary_terms": ["extraneous cognitive load", "intrinsic cognitive load", "cognitive load"]
    },
    "mod2-fc-prosthetics": {
        "w_ch": [4, 8], "s_ch": [5],
        "primary": ["executive functioning", "external", "accommodations", "assistive", "checklists"],
        "context": ["working memory", "adhd", "learning disabilities", "organization"],
        "glossary_terms": ["executive functioning", "assistive technology"]
    },
    "mod2-fc-rti": {
        "w_ch": [4], "s_ch": [5],
        "primary": ["response to intervention", "three-tiered", "tier 1", "tier 2", "tier 3"],
        "context": ["early intervention", "screening", "progress monitoring"],
        "glossary_terms": ["response to intervention (rti)"]
    },
    "mod2-fc-meshing": {
        "w_ch": [4], "s_ch": [4],
        "primary": ["learning styles", "learning preferences", "visual", "auditory"],
        "context": ["evidence", "matching", "pashler", "styles"],
        "glossary_terms": ["learning styles", "learning preferences"]
    },
    "mod2-fc-inhibition": {
        "w_ch": [4, 2], "s_ch": [5],
        "primary": ["executive functioning", "inhibitory", "impulsivity", "hyperactivity"],
        "context": ["self-control", "adhd", "prefrontal", "attention"],
        "glossary_terms": ["executive functioning", "attention-deficit hyperactivity disorder (adhd)"]
    },
    "mod2-fc-drc": {
        "w_ch": [4, 7], "s_ch": [5, 7],
        "primary": [" contingency contract", "report card", "home", "chart", "adhd", "token"],
        "context": ["parents", "daily", "reinforcement", "behavior"],
        "glossary_terms": ["contingency contract", "token reinforcement system"]
    },

    # Module 3 (10 flashcards)
    "mod3-fc-negative-reinforcement": {
        "w_ch": [7], "s_ch": [2],
        "primary": ["negative reinforcement", "aversive stimulus", "escape"],
        "context": ["punishment", "strengthening", "subtracting"],
        "glossary_terms": ["negative reinforcement", "aversive"]
    },
    "mod3-fc-presentation-removal-punishment": {
        "w_ch": [7], "s_ch": [2, 7],
        "primary": ["presentation punishment", "removal punishment", "type i", "type ii"],
        "context": ["punishment", "suppress", "privileges", "time-out"],
        "glossary_terms": ["presentation punishment", "removal punishment"]
    },
    "mod3-fc-premack": {
        "w_ch": [7], "s_ch": [2, 7],
        "primary": ["premack principle", "grandma's rule", "high-frequency behavior"],
        "context": ["low-frequency", "preferred activity", "reinforcer"],
        "glossary_terms": ["premack principle"]
    },
    "mod3-fc-shaping-task-analysis": {
        "w_ch": [7], "s_ch": [2, 10],
        "primary": ["shaping", "successive approximations", "task analysis"],
        "context": ["small steps", "component skills", "reinforcing progress"],
        "glossary_terms": ["shaping", "successive approximations", "task analysis"]
    },
    "mod3-fc-extinction-burst": {
        "w_ch": [7], "s_ch": [2],
        "primary": ["extinction", "extinction burst", "disappear", "withholding reinforcement"],
        "context": ["ignoring", "operant", "increase briefly", "schedule"],
        "glossary_terms": ["extinction"]
    },
    "mod3-fc-differential-reinforcement": {
        "w_ch": [7], "s_ch": [2, 7],
        "primary": ["differential reinforcement", "incompatible", "praise-and-ignore", "positive practice"],
        "context": ["reinforcing", "appropriate", "ignoring inappropriate"],
        "glossary_terms": ["positive practice", "reprimands"]
    },
    "mod3-fc-fba": {
        "w_ch": [7], "s_ch": [7, 5],
        "primary": ["functional behavioral assessment", "antecedents", "functions of behavior", "a-b-c"],
        "context": ["consequences", "observation", "reason for the behavior"],
        "glossary_terms": ["functional behavioral assessment (fba)"]
    },
    "mod3-fc-precorrection": {
        "w_ch": [7], "s_ch": [7],
        "primary": ["precorrection", "cueing", "prompt", "antecedent"],
        "context": ["positive behavior supports", "preventive", "setting events"],
        "glossary_terms": ["precorrection", "cueing"]
    },
    "mod3-fc-fct": {
        "w_ch": [7], "s_ch": [5, 7],
        "primary": ["positive behavior supports", "replace problem behaviors", "replacement", "functions of behavior"],
        "context": ["functional behavioral assessment", "ask for help", "break", "communication"],
        "glossary_terms": ["positive behavior supports (pbs)"]
    },
    "mod3-fc-token-response-cost": {
        "w_ch": [7], "s_ch": [2, 7],
        "primary": ["token reinforcement", "response cost", "tokens"],
        "context": ["points", "fines", "exchange", "rewards"],
        "glossary_terms": ["token reinforcement system", "response cost"]
    },

    # Module 4 (10 flashcards)
    "mod4-fc-baddeley-wm": {
        "w_ch": [8], "s_ch": [2, 9],
        "primary": ["phonological loop", "visuospatial sketchpad", "central executive", "episodic buffer"],
        "context": ["baddeley", "working memory", "temporary storage"],
        "glossary_terms": ["phonological loop", "visuospatial sketchpad", "central executive", "episodic buffer"]
    },
    "mod4-fc-clt-three-loads": {
        "w_ch": [8], "s_ch": [9, 2],
        "primary": ["intrinsic cognitive load", "extraneous cognitive load", "germane"],
        "context": ["cognitive load", "working memory", "complexity"],
        "glossary_terms": ["intrinsic cognitive load", "extraneous cognitive load", "germane cognitive load"]
    },
    "mod4-fc-schema-chunking": {
        "w_ch": [8], "s_ch": [2, 9],
        "primary": ["chunking", "bits of information", "automated basic skills", "schemas"],
        "context": ["working memory", "grouping", "capacity"],
        "glossary_terms": ["chunking", "schemas"]
    },
    "mod4-fc-worked-examples": {
        "w_ch": [9], "s_ch": [9],
        "primary": ["worked example", "worked examples", "expert solutions"],
        "context": ["cognitive load", "problem solving", "novices", "steps"],
        "glossary_terms": ["worked example"]
    },
    "mod4-fc-metacognition-conditional": {
        "w_ch": [9, 8], "s_ch": [9, 2],
        "primary": ["metacognition", "conditional knowledge", "when and why"],
        "context": ["declarative", "procedural", "planning", "monitoring", "evaluating"],
        "glossary_terms": ["metacognition", "conditional knowledge"]
    },
    "mod4-fc-triadic-reciprocal": {
        "w_ch": [11], "s_ch": [6, 2],
        "primary": ["triadic reciprocal causality", "reciprocal", "personal", "environmental", "behavioral"],
        "context": ["bandura", "social cognitive theory", "interplay"],
        "glossary_terms": ["triadic reciprocal causality", "social cognitive theory"]
    },
    "mod4-fc-self-efficacy-sources": {
        "w_ch": [11], "s_ch": [6],
        "primary": ["mastery experiences", "vicarious experiences", "social persuasion", "sources of self-efficacy"],
        "context": ["self-efficacy", "bandura", "physiological", "modeling"],
        "glossary_terms": ["self-efficacy", "mastery experiences", "vicarious experiences"]
    },
    "mod4-fc-meichenbaum-cbm": {
        "w_ch": [11], "s_ch": [6, 2],
        "primary": ["meichenbaum", "cognitive behavior modification", "self-instruction"],
        "context": ["talk themselves through", "private speech", "steps"],
        "glossary_terms": ["cognitive behavior modification"]
    },
    "mod4-fc-zimmerman-srl": {
        "w_ch": [11], "s_ch": [6, 9],
        "primary": ["forethought", "performance", "reflection", "zimmerman", "cycle of self-regulated learning"],
        "context": ["self-regulated learning", "goals", "monitoring", "self-evaluation"],
        "glossary_terms": ["self-regulated learning", "volition"]
    },
    "mod4-fc-casel-sel": {
        "w_ch": [11], "s_ch": [3, 7],
        "primary": ["emotional self-regulation", "social and emotional", "casel", "self-awareness", "social awareness"],
        "context": ["responsible decision", "relationship skills", "empathy", "emotions"],
        "glossary_terms": ["emotional self-regulation"]
    },

    # Module 5 (10 flashcards)
    "mod5-fc-sdt": {
        "w_ch": [12], "s_ch": [6],
        "primary": ["self-determination", "autonomy", "competence", "relatedness"],
        "context": ["deci", "ryan", "psychological needs", "classroom"],
        "glossary_terms": ["self-determination", "need for autonomy"]
    },
    "mod5-fc-informational-vs-controlling": {
        "w_ch": [12], "s_ch": [6],
        "primary": ["cognitive evaluation theory", "controlling", "informational"],
        "context": ["intrinsic motivation", "competence", "events", "autonomy"],
        "glossary_terms": ["cognitive evaluation theory"]
    },
    "mod5-fc-internalization-continuum": {
        "w_ch": [12], "s_ch": [6],
        "primary": ["introjected", "identified", "extrinsic motivation", "internalized", "continuum"],
        "context": ["intrinsic motivation", "external", "autonomous", "self-determination"],
        "glossary_terms": ["extrinsic motivation", "intrinsic motivation"]
    },
    "mod5-fc-mastery-performance-goals": {
        "w_ch": [12], "s_ch": [6],
        "primary": ["mastery goal", "performance goal", "approach", "avoidance"],
        "context": ["task-involved", "ego-involved", "achievement goals"],
        "glossary_terms": ["mastery goal", "performance goal"]
    },
    "mod5-fc-self-handicapping": {
        "w_ch": [12], "s_ch": [6],
        "primary": ["self-handicapping", "failure-avoiding", "covington", "self-worth"],
        "context": ["procrastinate", "effort", "protect", "ability"],
        "glossary_terms": ["self-handicapping", "failure-avoiding students"]
    },
    "mod5-fc-weiner-attribution": {
        "w_ch": [12], "s_ch": [6],
        "primary": ["weiner", "locus", "stability", "controllability"],
        "context": ["attribution theories", "internal", "external", "causes"],
        "glossary_terms": ["attribution theories"]
    },
    "mod5-fc-learned-helplessness": {
        "w_ch": [12], "s_ch": [6],
        "primary": ["learned helplessness", "uncontrollable", "helpless"],
        "context": ["failure-accepting", "depression", "motivation", "effort"],
        "glossary_terms": ["learned helplessness", "failure-accepting students"]
    },
    "mod5-fc-gordon-problem-ownership": {
        "w_ch": [13], "s_ch": [7, 8],
        "primary": ["empathetic listening", "active listening", "owns", "problem ownership", "gordon"],
        "context": ["helpful listener", "paraphrase", "student-owned", "communication"],
        "glossary_terms": ["empathetic listening", "paraphrase rule"]
    },
    "mod5-fc-i-message": {
        "w_ch": [13], "s_ch": [7, 8],
        "primary": ['"i" message', "i-message", "i-messages", "confrontation"],
        "context": ["gordon", "assertive discipline", "tell a student", "effect"],
        "glossary_terms": ['"i" message', "assertive discipline"]
    },
    "mod5-fc-restorative-justice": {
        "w_ch": [13], "s_ch": [7, 8],
        "primary": ["restorative justice", "peer mediation", "conflict", "negotiation"],
        "context": ["community", "harm", "repair", "mediation"],
        "glossary_terms": ["peer mediation"]
    },
}


def find_best_glossary(terms: list[str]) -> str | None:
    for kw in terms:
        kw_n = norm_match(kw)
        if len(kw_n) < 3:
            continue
        for g in glossary_entries:
            if g["term_norm"] == kw_n:
                return f"{g['full']} (Woolfolk Glossary, p. {g['page']})"
    for kw in terms:
        kw_n = norm_match(kw)
        if len(kw_n) < 4:
            continue
        for g in glossary_entries:
            if kw_n in g["term_norm"] or (len(g["term_norm"]) >= 5 and g["term_norm"] in kw_n):
                return f"{g['full']} (Woolfolk Glossary, p. {g['page']})"
    return None


def score_paragraph(para: dict, primary: list[str], context: list[str], allowed_chapters: list[int]) -> tuple[int, float]:
    """Returns (primary_hit_count, numeric_score). Paragraphs with primary_hit_count > 0 always rank above 0."""
    if allowed_chapters and para["chapterNum"] not in allowed_chapters:
        return (-1, -1.0)
    txt = para["textNorm"]
    primary_hits = 0
    score = 0.0
    for idx, kw in enumerate(primary):
        kw_n = norm_match(kw)
        if not kw_n:
            continue
        if kw_n in txt:
            primary_hits += 1
            base_w = 12.0 if idx == 0 else (9.0 if idx == 1 else 6.5)
            score += base_w + min(txt.count(kw_n) * 0.8, 2.4)
    context_hits = 0
    for kw in context:
        kw_n = norm_match(kw)
        if kw_n and kw_n in txt:
            context_hits += 1
            score += 2.2
    if primary_hits == 0 and context_hits == 0:
        return (0, 0.0)
    if 300 <= len(para["text"]) <= 780:
        score += 1.5
    return (1 if primary_hits > 0 else 0, score + primary_hits * 3.0)


def pick_highlight_sentences(text: str, keywords: list[str]) -> list[str]:
    sentences = re.split(r"(?<=[.?!])\s+", text)
    scored = []
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) < 35 or len(s_clean) > 360:
            continue
        s_norm = norm_match(s_clean)
        hits = 0
        for idx, kw in enumerate(keywords):
            kw_n = norm_match(kw)
            if kw_n and kw_n in s_norm:
                hits += 4 if idx < 3 else 2
        if any(cue in s_norm for cue in ["is the ", "are the ", "refers to", "means ", "called ", "defined as", "proposed", "according to"]):
            hits += 1
        if hits > 0:
            scored.append((hits, s_clean))
    scored.sort(key=lambda x: x[0], reverse=True)
    picks = []
    for _, sent in scored[:2]:
        if sent not in picks:
            picks.append(sent)
    if not picks and sentences:
        first_valid = next((s.strip() for s in sentences if len(s.strip()) >= 40), sentences[0].strip())
        picks.append(first_valid)
    return picks


def select_top_passages(
    pool: list[dict],
    spec: dict,
    allowed_chapters: list[int],
    limit: int = 2,
    strict_chapters: bool = False,
    min_score: float = 0.0
) -> list[dict]:
    primary = spec["primary"]
    context = spec["context"]
    ranked = []
    for p in pool:
        tier, sc = score_paragraph(p, primary, context, allowed_chapters)
        if sc >= max(0.01, min_score):
            ranked.append((tier, sc, p))
    if not strict_chapters:
        has_primary = any(r[0] == 1 for r in ranked)
        if not has_primary:
            for p in pool:
                tier, sc = score_paragraph(p, primary, context, [])
                if tier == 1 and sc >= max(0.01, min_score):
                    ranked.append((tier, sc - 1.0, p))
        if not ranked:
            for p in pool:
                tier, sc = score_paragraph(p, primary, context, [])
                if sc >= max(0.01, min_score):
                    ranked.append((tier, sc, p))

    ranked.sort(key=lambda x: (x[0], x[1]), reverse=True)
    chosen = []
    seen_snippets = set()
    for _, _, p in ranked:
        sig = p["textNorm"][:90]
        if sig in seen_snippets:
            continue
        seen_snippets.add(sig)
        chosen.append(p)
        if len(chosen) >= limit:
            break
    return chosen


os.makedirs(OUT_DIR, exist_ok=True)

total_bundles = 0
for mod_idx in range(1, 6):
    mod_id = f"mod{mod_idx}"
    mod_dir = os.path.join(DB_ROOT, mod_id)
    theories = json.load(open(os.path.join(mod_dir, "theories.json"), encoding="utf-8"))
    flashcards = json.load(open(os.path.join(mod_dir, "flashcards.json"), encoding="utf-8"))

    entries = {}

    # 1) Build Theory textbook bundles
    for th in theories:
        th_id = th["id"]
        spec = THEORY_QUERY_SPEC[th_id]
        all_kws = spec["primary"] + spec["context"]
        s_hits = select_top_passages(s_paras, spec, spec["s_ch"], limit=1, strict_chapters=True, min_score=4.5)
        w_limit = 2 if s_hits else 3
        w_hits = select_top_passages(w_paras, spec, spec["w_ch"], limit=w_limit)
        gloss = find_best_glossary(spec.get("glossary_terms", []) + spec["primary"])

        excerpts = []
        for idx, p in enumerate(w_hits):
            excerpts.append({
                "id": f"{th_id}-w-{idx+1}",
                "bookId": "woolfolk",
                "bookTitle": "Woolfolk · Educational Psychology (13th Global Ed.)",
                "chapterLabel": p["chapterLabel"],
                "sectionHeading": p["sectionHeading"],
                "pageLabel": f"p. {p['bookPage']}",
                "verbatimExcerpt": p["text"],
                "highlightQuotes": pick_highlight_sentences(p["text"], all_kws),
                "glossaryEntry": gloss if idx == 0 else None,
                "koreanContextGuide": th["textbookDefinition"][min(idx, len(th["textbookDefinition"]) - 1)]
            })

        for idx, p in enumerate(s_hits):
            excerpts.append({
                "id": f"{th_id}-s-{idx+1}",
                "bookId": "seifert",
                "bookTitle": "Seifert & Sutton · Educational Psychology (Open Textbook)",
                "chapterLabel": p["chapterLabel"],
                "sectionHeading": p["sectionHeading"],
                "pageLabel": f"p. {p['bookPage']}",
                "verbatimExcerpt": p["text"],
                "highlightQuotes": pick_highlight_sentences(p["text"], all_kws),
                "glossaryEntry": None,
                "koreanContextGuide": th["criticalPerspective"][:240] + ("…" if len(th["criticalPerspective"]) > 240 else "")
            })

        entries[th_id] = {
            "nodeId": th_id,
            "moduleId": mod_id,
            "nodeKind": "theory",
            "titleKo": th["titleKo"],
            "titleEn": th["titleEn"],
            "sourceCitation": th["sourceMapping"],
            "excerpts": excerpts
        }
        total_bundles += 1

    # 2) Build Flashcard textbook bundles
    for fc in flashcards:
        fc_id = fc["id"]
        spec = FLASHCARD_QUERY_SPEC[fc_id]
        all_kws = spec["primary"] + spec["context"]
        s_hits = select_top_passages(s_paras, spec, spec["s_ch"], limit=1, strict_chapters=True, min_score=4.5)
        w_limit = 1 if s_hits else 2
        w_hits = select_top_passages(w_paras, spec, spec["w_ch"], limit=w_limit)
        gloss = find_best_glossary(spec.get("glossary_terms", []) + spec["primary"])

        excerpts = []
        for idx, p in enumerate(w_hits):
            excerpts.append({
                "id": f"{fc_id}-w-{idx+1}",
                "bookId": "woolfolk",
                "bookTitle": "Woolfolk · Educational Psychology (13th Global Ed.)",
                "chapterLabel": p["chapterLabel"],
                "sectionHeading": p["sectionHeading"],
                "pageLabel": f"p. {p['bookPage']}",
                "verbatimExcerpt": p["text"],
                "highlightQuotes": pick_highlight_sentences(p["text"], all_kws),
                "glossaryEntry": gloss if idx == 0 else None,
                "koreanContextGuide": f"{fc['definition']} (현장 적용: {fc['classroomExample']})"
            })

        for idx, p in enumerate(s_hits):
            excerpts.append({
                "id": f"{fc_id}-s-{idx+1}",
                "bookId": "seifert",
                "bookTitle": "Seifert & Sutton · Educational Psychology (Open Textbook)",
                "chapterLabel": p["chapterLabel"],
                "sectionHeading": p["sectionHeading"],
                "pageLabel": f"p. {p['bookPage']}",
                "verbatimExcerpt": p["text"],
                "highlightQuotes": pick_highlight_sentences(p["text"], all_kws),
                "glossaryEntry": None,
                "koreanContextGuide": f"{fc['definition']}"
            })

        cite_parts = [f"{'Woolfolk' if e['bookId']=='woolfolk' else 'Seifert & Sutton'} {e['pageLabel']}" for e in excerpts]
        entries[fc_id] = {
            "nodeId": fc_id,
            "moduleId": mod_id,
            "nodeKind": "flashcard",
            "titleKo": fc["termKo"],
            "titleEn": fc["termEn"],
            "sourceCitation": " · ".join(cite_parts) if cite_parts else "Woolfolk 13e / Seifert & Sutton",
            "excerpts": excerpts
        }
        total_bundles += 1

    out_path = os.path.join(OUT_DIR, f"passages-{mod_id}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "moduleId": mod_id,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "entries": entries
            },
            f,
            ensure_ascii=False,
            indent=2
        )
    size_kb = os.path.getsize(out_path) / 1024
    print(f"Generated {out_path} ({len(entries)} nodes, {size_kb:.1f} KB)")

print(f"Done! Total textbook passage bundles generated: {total_bundles}")
