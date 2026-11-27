"use client";

import Link from "next/link";
import { useState } from "react";
import { api, errorText, LEVELS } from "../lib/api";
import { ErrorMessage } from "./ui";

// スタッフ詳細に表示する「育成のアドバイス」。ボタンを押したときだけ AI を呼ぶ（呼ぶたびに料金がかかるため）
export default function AdvicePanel({ staffId }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function request() {
    setLoading(true);
    setError("");
    try {
      setAdvice(await api("/api/staffs/" + staffId + "/advice", { method: "POST" }));
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">育成のアドバイス</h2>
          <p className="mt-1 text-xs text-stone-500">今の習熟度から、次に教えるとよい仕事を AI が提案します。AI に名前は送りません。</p>
        </div>
        <button type="button" disabled={loading} className="rounded-md bg-[#1f6b4a] px-4 py-2 text-sm text-white disabled:opacity-60" onClick={request}>
          {loading ? "考えています...（20秒ほど）" : advice ? "もう一度提案してもらう" : "アドバイスをもらう"}
        </button>
      </div>
      <ErrorMessage message={error} />
      {advice && (
        <div className="mt-4">
          {advice.overview && <p className="rounded-md bg-[#f1f8f4] px-3 py-2 text-sm text-stone-700">{advice.overview}</p>}
          <ol className="mt-3 space-y-3">
            {advice.suggestions.map((item, index) => (
              <li key={item.taskId} className="rounded-lg border border-stone-200 p-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-bold">{index + 1}.</span>
                  <Link className="font-bold text-[#1f6b4a]" href={"/tasks/" + item.taskId}>
                    {item.taskName}
                  </Link>
                  <span className="text-xs text-stone-500">
                    {item.position}・今は「{LEVELS[item.currentLevel]}」
                  </span>
                </div>
                <p className="mt-1 text-stone-700">{item.reason}</p>
                <p className="mt-1 text-xs text-stone-500">
                  教えられる人：{item.teachers.length ? item.teachers.join("、") : "いません（社員が教えるか、先に誰かを「教えられる」まで育てましょう）"}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-stone-400">AI の提案は参考です。実際に教えるかどうかは、現場の状況に合わせて判断してください。</p>
        </div>
      )}
    </section>
  );
}
