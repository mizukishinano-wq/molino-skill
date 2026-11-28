"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText, POSITIONS, formatJoin } from "../../lib/api";
import { ErrorMessage } from "../../components/ui";
import NoteEditor from "../../components/NoteEditor";

// スタッフごとのコメント（注意事項）を1か所で確認する画面。
// データは既存のスタッフ一覧 API をそのまま使い、絞り込みと検索は画面側で行う（API を増やさずに済むため）
export default function NotesPage() {
  const [position, setPosition] = useState("全て");
  const [query, setQuery] = useState("");
  const [showEmpty, setShowEmpty] = useState(false);
  const [staffs, setStaffs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ name: "", position, includeRetired: false });
    setError("");
    api("/api/staffs?" + params)
      .then(setStaffs)
      .catch((cause) => setError(errorText(cause)));
  }, [position]);

  function updateNote(saved) {
    setStaffs((current) => current.map((item) => (item.id === saved.id ? { ...item, note: saved.note || "" } : item)));
  }

  const keyword = query.trim().toLowerCase();
  const withNote = staffs ? staffs.filter((staff) => staff.note).length : 0;
  const visible = (staffs || []).filter(
    (staff) => (showEmpty || staff.note) && (!keyword || staff.name.toLowerCase().includes(keyword) || (staff.note || "").toLowerCase().includes(keyword)),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">注意事項</h1>
      <p className="mt-1 text-sm text-stone-500">スタッフごとのコメントをまとめて確認できます。在籍中のスタッフだけを表示します。</p>
      <div className="mt-4 mb-3 flex gap-2 overflow-x-auto pb-1">
        {["全て", ...POSITIONS].map((item) => (
          <button
            key={item}
            type="button"
            className={"shrink-0 rounded-lg px-4 py-2 text-sm " + (position === item ? "bg-[#1f6b4a] text-white" : "border border-stone-300 bg-white")}
            onClick={() => setPosition(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <input
          type="search"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm sm:w-72"
          placeholder="名前やコメントの言葉で検索"
          aria-label="名前やコメントの言葉で検索"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showEmpty} onChange={(event) => setShowEmpty(event.target.checked)} />
          コメントがない人も表示
        </label>
      </div>
      <ErrorMessage message={error} />
      {!staffs ? (
        !error && <p>読み込み中...</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-stone-500">
            {visible.length}名を表示（コメントあり {withNote}名 / {staffs.length}名）
          </p>
          {visible.length === 0 ? (
            <p className="rounded-xl border border-stone-200 bg-white px-4 py-6 text-center text-sm text-stone-500">
              {keyword ? "検索に一致するスタッフがいません。" : "コメントが登録されたスタッフがいません。「コメントがない人も表示」から追加できます。"}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visible.map((staff) => (
                <article key={staff.id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <Link className="font-bold text-[#1f6b4a]" href={"/staffs/" + staff.id}>
                    {staff.name}
                  </Link>
                  {staff.newcomer && <span className="ml-2 rounded bg-[#e5f5ec] px-1.5 py-0.5 text-xs text-[#1f6b4a]">新人</span>}
                  <div className="text-xs text-stone-400">
                    {staff.position} ・ {formatJoin(staff.joinDate)}
                  </div>
                  <NoteEditor staff={staff} onSaved={updateNote} lines={6} />
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
