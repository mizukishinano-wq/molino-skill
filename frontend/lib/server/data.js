import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { get, put } from "@vercel/blob";

const POSITIONS = ["ドリンク", "フリー", "デシャップ", "入口", "8階", "営業外"];
const TASK_NAMES = {
  ドリンク: ["生ビール", "サワー・ハイボール", "カクテル", "マシン飲料（紅茶・コーヒー・カフェオレ）", "ラテ系（抹茶・キャラメル）", "準備・補充"],
  フリー: ["オーダー取り", "料理説明", "配膳", "バッシング", "フロア対応"],
  デシャップ: ["アレルギー・皿チェック", "指示出し", "先読み"],
  入口: ["予約受付", "お会計", "席の指示", "周囲を見る"],
  "8階": ["少人数で回す", "7階に頼む物の把握"],
  営業外: ["営業前・営業後・パソコン"],
};
const DATA_PATH = "molino-data.json";
const MANAGER_EMAIL = "sato@example.com";
// These values were committed to a public repository, so they must never be accepted again.
const LEAKED_JWT_SECRET = "molino-skill-dev-secret-key-change-me-32b";
const LEAKED_MANAGER_PASSWORD = "password123";
const MIN_JWT_SECRET_LENGTH = 32;
const MIN_MANAGER_PASSWORD_LENGTH = 12;

let queue = Promise.resolve();

export class ApiError extends Error {
  constructor(status, message, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

// Fail closed: without safe secrets the API refuses every request before touching any data.
function assertSecureConfig() {
  const secret = process.env.JWT_SECRET || "";
  const password = process.env.MANAGER_PASSWORD || "";
  const problems = [];
  if (secret.length < MIN_JWT_SECRET_LENGTH || secret === LEAKED_JWT_SECRET) problems.push("JWT_SECRET");
  if (password.length < MIN_MANAGER_PASSWORD_LENGTH || password === LEAKED_MANAGER_PASSWORD) problems.push("MANAGER_PASSWORD");
  if (problems.length) {
    console.error("Unsafe or missing environment variables: " + problems.join(", "));
    throw new ApiError(503, "サーバーの設定が完了していません");
  }
}

function isAllowedEmail(email) {
  const normalized = text(email).toLowerCase();
  if (normalized === MANAGER_EMAIL) return true;
  return (process.env.ALLOWED_EMAILS || "").split(",").some((item) => text(item).toLowerCase() === normalized && normalized !== "");
}

function todayTokyo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function addMonths(iso, months) {
  const [year, month, day] = iso.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, lastDay))).toISOString().slice(0, 10);
}

function isNewcomer(joinDate) {
  return addMonths(joinDate, 3) >= todayTokyo();
}

function taskIndex(position, name) {
  const positionIndex = POSITIONS.indexOf(position);
  const names = TASK_NAMES[position] || [];
  const nameIndex = names.indexOf(name);
  return (positionIndex < 0 ? 99 : positionIndex) * 100 + (nameIndex < 0 ? 99 : nameIndex);
}

function staffMap(row) {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    joinDate: row.joinDate,
    active: row.active,
    status: row.active ? "在籍" : "退職",
    newcomer: isNewcomer(row.joinDate),
    note: row.note || "",
  };
}

function blankState() {
  const state = { nextId: 1, users: [], staffs: [], tasks: [], skills: [] };
  const add = (list, row) => {
    list.push({ ...row, id: state.nextId });
    state.nextId += 1;
    return list[list.length - 1].id;
  };
  add(state.users, { name: "佐藤店長", email: MANAGER_EMAIL, passwordHash: bcrypt.hashSync(process.env.MANAGER_PASSWORD, 10) });
  const staffIds = {};
  for (const [name, position, joinDate, active] of [
    ["佐藤美咲", "ドリンク", "2023-04-01", true],
    ["田中健太", "ドリンク", "2024-01-15", true],
    ["鈴木彩", "フリー", "2024-08-01", true],
    ["高橋悠斗", "デシャップ", "2025-03-01", true],
    ["山本蓮", "入口", "2026-08-01", true],
    ["伊藤葵", "ドリンク", "2026-09-01", true],
    ["中村結衣", "8階", "2026-09-15", true],
    ["小林翔", "フリー", "2026-10-01", true],
    ["渡辺修", "入口", "2022-06-01", false],
  ]) staffIds[name] = add(state.staffs, { name, position, joinDate, active });
  const taskIds = {};
  for (const [position, names] of Object.entries(TASK_NAMES)) {
    for (const name of names) taskIds[name] = add(state.tasks, { name, position });
  }
  for (const [person, task, level, updatedOn] of [
    ["佐藤美咲", "生ビール", 3, "2026-10-02"],
    ["佐藤美咲", "マシン飲料（紅茶・コーヒー・カフェオレ）", 3, "2026-10-03"],
    ["佐藤美咲", "サワー・ハイボール", 3, "2026-10-07"],
    ["佐藤美咲", "カクテル", 2, "2026-10-10"],
    ["佐藤美咲", "オーダー取り", 3, "2026-10-01"],
    ["佐藤美咲", "予約受付", 2, "2026-04-12"],
    ["田中健太", "生ビール", 3, "2026-10-04"],
    ["田中健太", "サワー・ハイボール", 3, "2026-09-12"],
    ["田中健太", "カクテル", 2, "2026-08-20"],
    ["田中健太", "マシン飲料（紅茶・コーヒー・カフェオレ）", 3, "2026-08-02"],
    ["鈴木彩", "生ビール", 2, "2026-10-06"],
    ["鈴木彩", "サワー・ハイボール", 3, "2026-09-15"],
    ["鈴木彩", "マシン飲料（紅茶・コーヒー・カフェオレ）", 3, "2026-08-11"],
    ["鈴木彩", "オーダー取り", 2, "2026-08-19"],
    ["高橋悠斗", "生ビール", 2, "2026-10-08"],
    ["高橋悠斗", "サワー・ハイボール", 2, "2026-07-22"],
    ["高橋悠斗", "マシン飲料（紅茶・コーヒー・カフェオレ）", 2, "2026-06-01"],
    ["高橋悠斗", "アレルギー・皿チェック", 2, "2026-05-20"],
    ["山本蓮", "生ビール", 1, "2026-10-01"],
    ["山本蓮", "マシン飲料（紅茶・コーヒー・カフェオレ）", 2, "2026-09-28"],
    ["伊藤葵", "生ビール", 2, "2026-10-09"],
    ["伊藤葵", "サワー・ハイボール", 2, "2026-10-11"],
    ["伊藤葵", "マシン飲料（紅茶・コーヒー・カフェオレ）", 2, "2026-09-30"],
    ["中村結衣", "マシン飲料（紅茶・コーヒー・カフェオレ）", 1, "2026-10-05"],
    ["小林翔", "生ビール", 1, "2026-10-03"],
    ["小林翔", "バッシング", 1, "2026-10-04"],
  ]) state.skills.push({ id: state.nextId++, staffId: staffIds[person], taskId: taskIds[task], level, updatedOn });
  return state;
}

async function loadState() {
  const result = await get(DATA_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode === 304 || !result.stream) return blankState();
  const raw = await new Response(result.stream).text();
  if (!raw) return blankState();
  return JSON.parse(raw);
}

async function saveState(state) {
  await put(DATA_PATH, JSON.stringify(state), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

function hashMatches(hash, password) {
  if (typeof hash !== "string" || !hash) return false;
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

function repair(state) {
  let changed = false;
  if (!Array.isArray(state.users)) { state.users = []; changed = true; }
  if (!Array.isArray(state.staffs)) { state.staffs = []; changed = true; }
  if (!Array.isArray(state.tasks)) { state.tasks = []; changed = true; }
  if (!Array.isArray(state.skills)) { state.skills = []; changed = true; }
  if (!state.nextId) { state.nextId = 1; changed = true; }
  const manager = state.users.find((user) => user.email === MANAGER_EMAIL);
  if (!manager || !hashMatches(manager.passwordHash, process.env.MANAGER_PASSWORD)) {
    const passwordHash = bcrypt.hashSync(process.env.MANAGER_PASSWORD, 10);
    if (manager) manager.passwordHash = passwordHash;
    else state.users.push({ id: state.nextId++, name: "佐藤店長", email: MANAGER_EMAIL, passwordHash });
    changed = true;
  }
  if (state.staffs.length === 0 || state.tasks.length === 0) {
    const seeded = blankState();
    state.staffs = seeded.staffs;
    state.tasks = seeded.tasks;
    state.skills = seeded.skills;
    state.nextId = Math.max(state.nextId, seeded.nextId);
    changed = true;
  }
  for (const [position, names] of Object.entries(TASK_NAMES)) {
    for (const name of names) {
      if (!state.tasks.some((task) => task.name === name && task.position === position)) {
        state.tasks.push({ id: state.nextId++, name, position });
        changed = true;
      }
    }
  }
  return changed;
}

function withState(write, work) {
  const run = queue.then(async () => {
    const state = await loadState();
    const changed = repair(state);
    if (changed) await saveState(state);
    const result = await work(state);
    if (write) await saveState(state);
    return result;
  });
  queue = run.then(() => {}, () => {});
  return run;
}

function secretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

async function tokenFor(email) {
  return new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(email).setIssuedAt().setExpirationTime("7d").sign(secretKey());
}

async function requireUser(request, state) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new ApiError(401, "ログインしてください");
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const user = state.users.find((item) => item.email === payload.sub);
    if (!user || !isAllowedEmail(user.email)) throw new Error("not allowed");
    return user;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "ログインしてください");
  }
}

function findStaff(state, id) {
  const row = state.staffs.find((item) => item.id === Number(id));
  if (!row) throw new ApiError(404, "スタッフが見つかりません");
  return row;
}

function findTask(state, id) {
  const row = state.tasks.find((item) => item.id === Number(id));
  if (!row) throw new ApiError(404, "仕事が見つかりません");
  return row;
}

function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function parseLevel(raw) {
  const isScalar = typeof raw === "number" || typeof raw === "string";
  const level = isScalar && /^[+-]?\d+$/.test(String(raw)) ? Number(raw) : NaN;
  if (!Number.isInteger(level) || level < 0 || level > 3) throw new ApiError(400, "習熟度は未登録、1、2、3から選んでください");
  return level;
}

function applyStaff(body) {
  const name = text(body.name);
  const position = text(body.position);
  const joinDate = text(body.joinDate);
  const fields = {};
  if (!name) fields.name = "名前を入力してください";
  else if (name.length > 20) fields.name = "名前は20文字以内で入力してください";
  if (!POSITIONS.includes(position)) fields.position = "メインポジションを選んでください";
  if (!joinDate) fields.joinDate = "入店日を入力してください";
  else if (!isRealDate(joinDate)) fields.joinDate = "入店日の形式が正しくありません";
  const note = text(body.note);
  if (note.length > 200) fields.note = "メモは200文字以内で入力してください";
  if (Object.keys(fields).length) throw new ApiError(400, "入力内容を確認してください", fields);
  return { name, position, joinDate, note };
}

function applyTask(state, body, currentId) {
  const name = text(body.name);
  const position = text(body.position);
  const fields = {};
  if (!name) fields.name = "仕事名を入力してください";
  else if (name.length > 30) fields.name = "仕事名は30文字以内で入力してください";
  if (!POSITIONS.includes(position)) fields.position = "ポジションを選んでください";
  if (Object.keys(fields).length) throw new ApiError(400, "入力内容を確認してください", fields);
  const existing = state.tasks.find((item) => item.name === name && item.position === position);
  if (existing && existing.id !== currentId) {
    const message = position + "の「" + name + "」はすでに登録されています";
    throw new ApiError(400, message, { name: message });
  }
  return { name, position };
}

function taskMap(state, task) {
  const capableCount = state.skills.filter((skill) => skill.taskId === task.id && skill.level >= 2 && state.staffs.find((staff) => staff.id === skill.staffId && staff.active)).length;
  return { id: task.id, name: task.name, position: task.position, capableCount };
}

export function handleApi(request, path) {
  assertSecureConfig();
  const method = request.method;
  const write = method !== "GET" && method !== "HEAD";
  return withState(write, async (state) => {
    const [head, id, tail] = path;
    const url = new URL(request.url);
    const body = write ? await request.json().catch(() => ({})) : {};
    if (!(head === "auth" && (id === "login" || id === "signup") && method === "POST")) await requireUser(request, state);

    if (head === "auth" && id === "signup" && method === "POST") throw new ApiError(403, "新規登録は停止しています。管理者に連絡してください");
    if (head === "auth" && id === "login" && method === "POST") return login(state, body);
    if (head === "auth" && id === "me" && method === "GET") {
      const user = await requireUser(request, state);
      return { name: user.name, email: user.email };
    }
    if (head === "skill-map" && method === "GET") return skillMap(state, url.searchParams.get("position") || "全て", url.searchParams.get("newcomersOnly") === "true");
    if (head === "staffs" && !id && method === "GET") return listStaff(state, url);
    if (head === "staffs" && !id && method === "POST") return createStaff(state, body);
    if (head === "staffs" && id && !tail && method === "GET") return staffMap(findStaff(state, id));
    if (head === "staffs" && id && !tail && method === "PUT") return updateStaff(state, id, body);
    if (head === "staffs" && id && !tail && method === "DELETE") {
      findStaff(state, id);
      state.skills = state.skills.filter((skill) => skill.staffId !== Number(id));
      state.staffs = state.staffs.filter((staff) => staff.id !== Number(id));
      return { message: "削除しました" };
    }
    if (head === "staffs" && id && tail === "skills" && method === "GET") return staffSkills(state, id);
    if (head === "staffs" && id && tail === "skills" && method === "PUT") return saveSkills(state, id, body.items);
    if (head === "tasks" && !id && method === "GET") return listTasks(state, url.searchParams.get("position"));
    if (head === "tasks" && !id && method === "POST") return createTask(state, body);
    if (head === "tasks" && id && method === "GET") return taskDetail(state, id, Number(url.searchParams.get("minLevel") ?? 2));
    if (head === "tasks" && id && method === "PUT") return updateTask(state, id, body);
    if (head === "tasks" && id && method === "DELETE") {
      findTask(state, id);
      state.skills = state.skills.filter((skill) => skill.taskId !== Number(id));
      state.tasks = state.tasks.filter((task) => task.id !== Number(id));
      return { message: "削除しました" };
    }
    throw new ApiError(404, "見つかりません");
  });
}

async function login(state, body) {
  const email = text(body.email);
  const password = body.password == null ? "" : String(body.password);
  const user = state.users.find((item) => item.email === email);
  if (!user || !isAllowedEmail(user.email) || !bcrypt.compareSync(password, user.passwordHash)) throw new ApiError(401, "メールアドレスまたはパスワードが正しくありません");
  return { token: await tokenFor(user.email), name: user.name, email: user.email };
}

function listStaff(state, url) {
  const name = text(url.searchParams.get("name"));
  const position = url.searchParams.get("position");
  const includeRetired = url.searchParams.get("includeRetired") === "true";
  return state.staffs
    .slice()
    .sort((a, b) => a.joinDate.localeCompare(b.joinDate) || a.id - b.id)
    .filter((row) => includeRetired || row.active)
    .filter((row) => !position || position === "全て" || row.position === position)
    .filter((row) => !name || row.name.includes(name))
    .map(staffMap);
}

function createStaff(state, body) {
  const value = applyStaff(body);
  const row = { id: state.nextId++, ...value, active: true, note: value.note };
  state.staffs.push(row);
  return staffMap(row);
}

function updateStaff(state, id, body) {
  const current = findStaff(state, id);
  const value = applyStaff(body);
  const status = text(body.status);
  current.name = value.name;
  current.position = value.position;
  current.joinDate = value.joinDate;
  current.note = value.note;
  if (status === "退職") current.active = false;
  if (status === "在籍") current.active = true;
  return staffMap(current);
}

function listTasks(state, position) {
  return state.tasks
    .filter((row) => !position || position === "全て" || row.position === position)
    .slice()
    .sort((a, b) => taskIndex(a.position, a.name) - taskIndex(b.position, b.name))
    .map((task) => taskMap(state, task));
}

function createTask(state, body) {
  const value = applyTask(state, body, null);
  const row = { id: state.nextId++, ...value };
  state.tasks.push(row);
  return taskMap(state, row);
}

function updateTask(state, id, body) {
  const current = findTask(state, id);
  const value = applyTask(state, body, current.id);
  current.name = value.name;
  current.position = value.position;
  return taskMap(state, current);
}

function taskDetail(state, id, minLevel) {
  const task = findTask(state, id);
  const people = state.skills
    .filter((skill) => skill.taskId === task.id && skill.level >= minLevel)
    .map((skill) => ({ skill, staff: state.staffs.find((item) => item.id === skill.staffId) }))
    .filter((entry) => entry.staff && entry.staff.active)
    .sort((a, b) => b.skill.level - a.skill.level || a.staff.name.localeCompare(b.staff.name, "ja"))
    .map((entry) => ({
      staffId: entry.staff.id,
      name: entry.staff.name,
      position: entry.staff.position,
      newcomer: isNewcomer(entry.staff.joinDate),
      level: entry.skill.level,
      updatedOn: entry.skill.updatedOn,
    }));
  return { task: taskMap(state, task), people };
}

function staffSkills(state, id) {
  findStaff(state, id);
  return state.skills
    .filter((skill) => skill.staffId === Number(id))
    .map((skill) => ({ skill, task: state.tasks.find((item) => item.id === skill.taskId) }))
    .filter((entry) => entry.task)
    .sort((a, b) => POSITIONS.indexOf(a.task.position) - POSITIONS.indexOf(b.task.position) || b.skill.level - a.skill.level || a.task.name.localeCompare(b.task.name, "ja"))
    .map((entry) => ({
      taskId: entry.task.id,
      taskName: entry.task.name,
      position: entry.task.position,
      level: entry.skill.level,
      updatedOn: entry.skill.updatedOn,
    }));
}

function saveSkills(state, staffId, items) {
  findStaff(state, staffId);
  if (!Array.isArray(items)) throw new ApiError(400, "保存するスキルがありません");
  const today = todayTokyo();
  for (const item of items) {
    const taskId = Number(item?.taskId);
    findTask(state, taskId);
    const level = parseLevel(item.level);
    const index = state.skills.findIndex((skill) => skill.staffId === Number(staffId) && skill.taskId === taskId);
    if (level === 0) {
      if (index >= 0) state.skills.splice(index, 1);
      continue;
    }
    if (index >= 0) {
      if (state.skills[index].level !== level) {
        state.skills[index].level = level;
        state.skills[index].updatedOn = today;
      }
    } else {
      state.skills.push({ id: state.nextId++, staffId: Number(staffId), taskId, level, updatedOn: today });
    }
  }
  return staffSkills(state, staffId);
}

function skillMap(state, position, newcomersOnly) {
  const staffs = state.staffs
    .filter((row) => row.active && (!newcomersOnly || isNewcomer(row.joinDate)))
    .slice()
    .sort((a, b) => a.joinDate.localeCompare(b.joinDate) || a.id - b.id);
  const staffIds = new Set(staffs.map((row) => row.id));
  const tasks = state.tasks
    .filter((row) => !position || position === "全て" || row.position === position)
    .slice()
    .sort((a, b) => taskIndex(a.position, a.name) - taskIndex(b.position, b.name));
  const cells = [];
  let updatedOn = "";
  const taskRows = tasks.map((task) => {
    let capableCount = 0;
    for (const skill of state.skills.filter((item) => item.taskId === task.id && item.level > 0)) {
      if (!staffIds.has(skill.staffId)) continue;
      if (skill.level >= 2) capableCount += 1;
      if (skill.updatedOn > updatedOn) updatedOn = skill.updatedOn;
      cells.push({ staffId: skill.staffId, taskId: task.id, level: skill.level });
    }
    return { id: task.id, name: task.name, position: task.position, capableCount };
  });
  return { staffs: staffs.map(staffMap), tasks: taskRows, cells, updatedOn };
}
