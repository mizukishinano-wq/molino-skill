"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorText, LEVELS, LEVEL_MEANINGS, POSITIONS } from "../../../../../lib/api";
import { ErrorMessage } from "../../../../../components/ui";

export default function SkillEditPage() {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [levels, setLevels] = useState({});
  const [position, setPosition] = useState("ドリンク");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/api/staffs/" + id), api("/api/tasks"), api("/api/staffs/" + id + "/skills")])
      .then(([staffRow, taskRows, skillRows]) => {
        setStaff(staffRow);
        setTasks(taskRows);
        // 登録されていない仕事は「未登録（0）」として扱い、全仕事の習熟度を画面で選べるようにする
        const next = {};
        taskRows.forEach((task) => {
          next[task.id] = 0;
        });
        skillRows.forEach((skill) => {
          next[skill.taskId] = skill.level;
        });
        setLevels(next);
      })
      .catch((cause) => setError(errorText(cause)));
  }, [id]);

  async function save() {
    setError("");
    try {
      await api("/api/staffs/" + id + "/skills", {
        method: "PUT",
        body: JSON.stringify({ items: Object.entries(levels).map(([taskId, level]) => ({ taskId: Number(taskId), level })) }),
      });
      window.location.href = "/staffs/" + id;
    } catch (cause) {
      setError(errorText(cause));
    }
  }

  if (!staff) return <ErrorMessage message={error} />;
  const visible = tasks.filter((task) => position === "全て" || task.position === position);
  return (
    <div>
      <h1 className="text-2xl font-bold">
        スキル一括編集 <span className="ml-2 text-lg font-normal">{staff.name}</span>
      </h1>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {["全て", ...POSITIONS].map((item) => (
          <button
            key={item}
            type="button"
            className={"rounded-lg px-4 py-2 text-sm " + (position === item ? "bg-[#1f6b4a] text-white" : "border border-stone-300 bg-white")}
            onClick={() => setPosition(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between bg-stone-50 px-4 py-3 text-sm">
          <span className="font-bold">{position}</span>
          <span className="text-stone-500">{visible.length}仕事</span>
        </div>
        <div className="grid grid-cols-[180px_1fr] bg-stone-50 px-4 py-2 text-xs text-stone-500">
          <span>仕事名</span>
          <span>習熟度</span>
        </div>
        {visible.map((task) => (
          <div key={task.id} className="grid grid-cols-[180px_1fr] items-center border-t px-4 py-3 text-sm">
            <span className="text-[#1f6b4a]">{task.name}</span>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((label, level) => {
                const selected = levels[task.id] === level;
                return (
                  <button
                    key={label}
                    type="button"
                    className={"rounded-md border px-3 py-1 text-xs " + (selected ? "border-[#1f6b4a] bg-[#1f6b4a] text-white" : "border-stone-300 bg-white")}
                    onClick={() => setLevels({ ...levels, [task.id]: level })}
                  >
                    {level === 0 ? "未登録" : level + " " + label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>
      <div className="mt-3 space-y-1 text-xs text-stone-600">
        {LEVEL_MEANINGS.map(
          (meaning, level) =>
            meaning && (
              <p key={level}>
                <span className="font-medium text-stone-700">{LEVELS[level]}</span>　{meaning}
              </p>
            ),
        )}
        <p>未登録を選ぶと、そのスキルは削除されます。</p>
      </div>
      <ErrorMessage message={error} />
      <div className="mt-4 flex gap-2">
        <button className="rounded-md bg-[#1f6b4a] px-4 py-2 text-sm text-white" onClick={save}>
          まとめて保存
        </button>
        <button className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm" onClick={() => history.back()}>
          キャンセル
        </button>
      </div>
    </div>
  );
}
