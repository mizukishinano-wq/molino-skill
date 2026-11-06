"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, POSITIONS } from "../../lib/api";
import { Card } from "../../components/ui";

export default function TaskListPage() {
  const [position, setPosition] = useState("全て");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api("/api/tasks?position=" + encodeURIComponent(position)).then(setRows);
  }, [position]);

  const groups = POSITIONS.filter((item) => position === "全て" || position === item);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">仕事一覧</h1>
        <Link href="/tasks/create" className="rounded-md bg-[#1f6b4a] px-4 py-2 text-sm text-white">仕事を登録</Link>
      </div>
      <Card className="mb-4 flex items-center justify-between px-4 py-3">
        <label className="text-sm">ポジション
          <select className="ml-3 rounded-md border border-stone-300 px-3 py-2" value={position} onChange={(event) => setPosition(event.target.value)}>
            <option>全て</option>
            {POSITIONS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <span className="text-sm text-stone-500">全{rows.length}仕事</span>
      </Card>
      {groups.map((item) => {
        const group = rows.filter((task) => task.position === item);
        if (!group.length) return null;
        return (
          <Card key={item} className="mb-4 overflow-x-auto">
            <h2 className="bg-stone-50 px-4 py-3 text-sm font-bold">{item} <span className="font-normal text-stone-500">{group.length}仕事</span></h2>
            <div className="grid min-w-[520px] grid-cols-2 bg-stone-50 px-4 py-2 text-xs text-stone-500">
              <span>仕事名</span><span>ポジション</span>
            </div>
            {group.map((task) => (
              <div key={task.id} className="grid min-w-[520px] grid-cols-2 border-t px-4 py-3 text-sm">
                <Link className="text-[#1f6b4a]" href={"/tasks/" + task.id}>{task.name}</Link>
                <span>{task.position}</span>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}
