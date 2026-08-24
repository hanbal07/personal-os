// Prerequisite-aware learning recommendations.
//
// Rules (real data only):
// - Skills arrive in their seeded sequence (array order = curriculum order).
// - A skill is UNLOCKED when every earlier skill is fully completed,
//   OR when the user has explicitly started it (any topic status changed,
//   logged practice hours, or a last-studied date).
// - Within a skill, topics follow phase order then their seed order.
// - Focus = most recently practised IN_PROGRESS topic; otherwise the first
//   available NOT_STARTED topic across unlocked skills in sequence.

export interface Topic {
  id: string;
  title: string;
  status: string;
  phase?: string;
  order?: number;
  durationMins?: number | null;
  description?: string | null;
}

export interface Skill {
  id: string;
  name: string;
  progress: number;
  topicsCompleted: number;
  topicsTotal: number;
  practiceHours: number;
  lastStudied: string | null;
  topics: Topic[];
}

export const PHASE_SEQUENCE = ["FUNDAMENTALS", "INTERMEDIATE", "ADVANCED", "MASTERY"];

const phaseIdx = (t: Topic) => {
  const i = PHASE_SEQUENCE.indexOf(t.phase || "FUNDAMENTALS");
  return i === -1 ? 0 : i;
};

const sortTopics = (topics: Topic[]) =>
  [...topics].sort((a, b) => phaseIdx(a) - phaseIdx(b) || (a.order ?? 0) - (b.order ?? 0));

export function isSkillStarted(s: Skill): boolean {
  return (
    s.topics.some((t) => t.status !== "NOT_STARTED") ||
    s.practiceHours > 0 ||
    s.lastStudied != null
  );
}

/** A prerequisite counts as satisfied once the learner demonstrably engaged:
 *  skill finished, or at least one topic completed, or ≥1h logged practice. */
function prereqSatisfied(s: Skill): boolean {
  return s.progress >= 100 || s.topicsCompleted > 0 || s.practiceHours >= 1;
}

export function skillUnlocked(skills: Skill[], index: number): boolean {
  for (let j = 0; j < index; j++) {
    if (!prereqSatisfied(skills[j])) return false;
  }
  return true;
}

/** Name of the first earlier skill still blocking this one, if any. */
export function blockingSkillName(skills: Skill[], index: number): string | null {
  for (let j = 0; j < index; j++) {
    if (!prereqSatisfied(skills[j])) return skills[j].name;
  }
  return null;
}

function firstOpen(topics: Topic[]): Topic | null {
  const sorted = sortTopics(topics);
  return sorted.find((t) => t.status === "IN_PROGRESS") ?? sorted.find((t) => t.status === "NOT_STARTED") ?? null;
}

export interface Recommendation {
  focus: { skill: Skill; topic: Topic } | null;
  nextUp: Array<{ skill: Skill; topic: Topic }>;
  currentBySkill: Record<string, Topic | null>;
  unlockedBySkill: Record<string, boolean>;
  blockedBySkill: Record<string, string | null>;
}

export function recommend(skills: Skill[]): Recommendation {
  // 1. Explicit focus: IN_PROGRESS topic from the most recently studied skill.
  let focus: { skill: Skill; topic: Topic } | null = null;
  const inProgressCandidates = skills
    .map((s) => ({ s, t: sortTopics(s.topics).find((t) => t.status === "IN_PROGRESS") }))
    .filter((c): c is { s: Skill; t: Topic } => c.t != null)
    .sort((a, b) => (b.s.lastStudied ?? "").localeCompare(a.s.lastStudied ?? ""));
  if (inProgressCandidates.length > 0) {
    focus = { skill: inProgressCandidates[0].s, topic: inProgressCandidates[0].t };
  }

  // 2. Otherwise: first open topic across unlocked skills in curriculum order.
  if (!focus) {
    for (let i = 0; i < skills.length; i++) {
      if (!skillUnlocked(skills, i)) continue;
      const t = firstOpen(skills[i].topics);
      if (t) {
        focus = { skill: skills[i], topic: t };
        break;
      }
    }
  }

  // 3. Next Up: up to 3 follow-on topics after focus along the same path.
  const nextUp: Array<{ skill: Skill; topic: Topic }> = [];
  const seen = new Set<string>();
  const pushUnique = (skill: Skill, topic: Topic) => {
    if (nextUp.length >= 3 || seen.has(topic.id)) return;
    seen.add(topic.id);
    nextUp.push({ skill, topic });
  };

  if (focus) {
    const sortedFocus = sortTopics(focus.skill.topics);
    const fi = sortedFocus.findIndex((t) => t.id === focus!.topic.id);
    for (const t of sortedFocus.slice(fi + 1)) {
      if (nextUp.length >= 3) break;
      if (t.status !== "COMPLETED") pushUnique(focus.skill, t);
    }
    if (nextUp.length < 3) {
      for (let i = 0; i < skills.length; i++) {
        if (skills[i].id === focus.skill.id || !skillUnlocked(skills, i)) continue;
        const t = firstOpen(skills[i].topics);
        if (t) pushUnique(skills[i], t);
        if (nextUp.length >= 3) break;
      }
    }
  }

  // 4. Per-skill views for the grid.
  const currentBySkill: Record<string, Topic | null> = {};
  const unlockedBySkill: Record<string, boolean> = {};
  const blockedBySkill: Record<string, string | null> = {};
  skills.forEach((s, i) => {
    const unlocked = skillUnlocked(skills, i);
    unlockedBySkill[s.id] = unlocked;
    blockedBySkill[s.id] = unlocked ? null : blockingSkillName(skills, i);
    currentBySkill[s.id] = unlocked ? firstOpen(s.topics) : null;
  });

  return { focus, nextUp, currentBySkill, unlockedBySkill, blockedBySkill };
}
