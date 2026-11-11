export const POSITIONS = ["ドリンク", "フリー", "デシャップ", "入口", "8階", "営業外"];
export const LEVELS = ["未経験", "教わった", "1人でできる", "教えられる"];
export const LEVEL_MEANINGS = [
  "",
  "やり方は習った。まだ一人には任せず、見守りが必要。",
  "言われなくても、その仕事を一人でやり切れる。",
  "ほかの人に教えて、一人でできる状態まで育てられる。",
];

export function levelClass(level) {
  if (level === 3) return "bg-[#124b3a] text-white";
  if (level === 2) return "bg-[#1e4e8c] text-white";
  if (level === 1) return "bg-[#8f3d32] text-white";
  return "border border-stone-200 text-stone-400";
}

export function formatJapaneseDate(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return Number(year) + "年" + Number(month) + "月" + Number(day) + "日";
}

export function formatJoin(iso) {
  if (!iso) return "";
  const [year, month] = iso.split("-");
  return year + "年" + Number(month) + "月入店";
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) headers.Authorization = "Bearer " + token;
  const response = await fetch((process.env.NEXT_PUBLIC_API_URL || "") + path, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/signup")) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
  if (!response.ok) {
    const error = new Error(data.message || "エラーが発生しました");
    error.fields = data.fields || {};
    throw error;
  }
  return data;
}
