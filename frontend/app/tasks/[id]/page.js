"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, LEVELS, levelClass } from "../../../lib/api";

const FILTERS = [
  [0, "すべて"],
  [1, "教わった以上"],
  [2, "1人でできる以上"],
  [3, "教えられる"],
];

export default function TaskDetailPage() {
  const { id } = useParams();
  const [minLevel, setMinLevel] = useState(2);
  const [data, setData] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api("/api/tasks/" + id + "?minLevel=" + minLevel).then(setData);
  }, [id, minLevel]);

  async function remove() {
    await api("/api/tasks/" + id, { method: "DELETE" });
    window.location.href = "/tasks";
  }

  if (!data) return null;
  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{data.task.name}</h1>
          <p className="mt-1 text-sm text-stone-500">{data.task.position}</p>
        </div>
        <div className="flex gap-2">
          <Link href={"/tasks/" + id + "/edit"} className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm">編集</Link>
          <button className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm text-red-600" onClick={() => setConfirming(true)}>削除</button>
        </div>
      </div>
      <h2 className="mb-3 font-bold">この仕事ができる人</h2>
      <section className="overflow-x-auto rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            {FILTERS.map(([value, label]) => (
              <button key={value} className={"rounded-md px-3 py-1.5 text-sm " + (minLevel === value ? "bg-[#1f6b4a] text-white" : "border border-stone-300 bg-white")} onClick={() => setMinLevel(value)}>{label}</button>
            ))}
          </div>
          <span className="text-sm text-stone-500">{data.people.length}名</span>
        </div>
        <div className="mb-3 grid min-w-[520px] grid-cols-3 bg-stone-50 px-3 py-2 text-xs text-stone-500">
          <span>名前</span><span>習熟度</span><span>最終更新日</span>
        </div>
        {data.people.length === 0 && <p className="px-3 py-4 text-sm text-stone-500">この条件のスタッフはいません。</p>}
        {data.people.map((person) => (
          <div key={person.staffId} className="grid min-w-[520px] grid-cols-3 items-center border-t px-3 py-3 text-sm">
            <Link className="text-[#1f6b4a]" href={"/staffs/" + person.staffId}>
              {person.name}
              {person.newcomer && <span className="ml-2 rounded bg-[#e5f5ec] px-1.5 py-0.5 text-xs text-[#1f6b4a]">新人</span>}
            </Link>
            <span className={"w-fit rounded-md px-3 py-1 text-xs " + levelClass(person.level)}>{person.level} {LEVELS[person.level]}</span>
            <span>{person.updatedOn}</span>
          </div>
        ))}
      </section>
      {confirming && (
        <div className="fixed inset-0 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold">仕事を削除</h2>
            <p className="mt-3 text-sm">{data.task.name}を削除しますか。この仕事のスキルも一緒に削除されます。</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md bg-red-700 px-4 py-2 text-sm text-white" onClick={remove}>削除する</button>
              <button className="rounded-md border px-4 py-2 text-sm" onClick={() => setConfirming(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
