"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, POSITIONS } from "../../lib/api";
import { Card } from "../../components/ui";

export default function StaffListPage() {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("全て");
  const [includeRetired, setIncludeRetired] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams({ name, position, includeRetired });
    api("/api/staffs?" + params).then(setRows);
  }, [name, position, includeRetired]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">スタッフ一覧</h1>
        <Link href="/staffs/create" className="rounded-md bg-[#1f6b4a] px-4 py-2 text-sm text-white">スタッフを登録</Link>
      </div>
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-6">
          <label className="text-sm">名前検索
            <input className="mt-1 block w-64 rounded-md border border-stone-300 px-3 py-2" placeholder="名前で検索" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="text-sm">ポジション
            <select className="mt-1 block rounded-md border border-stone-300 px-3 py-2" value={position} onChange={(event) => setPosition(event.target.value)}>
              <option>全て</option>
              {POSITIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeRetired} onChange={(event) => setIncludeRetired(event.target.checked)} />
            退職者も表示
          </label>
        </div>
      </Card>
      <Card className="overflow-x-auto">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-bold">スタッフ</h2>
          <span className="text-sm text-stone-500">{rows.length}名</span>
        </div>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="p-3 font-normal">名前</th>
              <th className="font-normal">メインポジション</th>
              <th className="font-normal">入店日</th>
              <th className="font-normal">新人</th>
              <th className="font-normal">在籍状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((staff) => (
              <tr key={staff.id} className="border-t">
                <td className="p-3"><Link className="text-[#1f6b4a]" href={"/staffs/" + staff.id}>{staff.name}</Link></td>
                <td>{staff.position}</td>
                <td>{staff.joinDate}</td>
                <td>{staff.newcomer ? <span className="rounded bg-[#e5f5ec] px-2 py-0.5 text-xs text-[#1f6b4a]">新人</span> : "-"}</td>
                <td>{staff.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
