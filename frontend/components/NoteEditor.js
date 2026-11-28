"use client";

import { useEffect, useRef, useState } from "react";
import { errorText, NOTE_MAX_LENGTH, saveStaffNote } from "../lib/api";

const LINE_HEIGHT_EM = 1.625; // leading-relaxed と同じ値。たたむ高さの計算に使う

// 改行で区切って1行ずつにする。先頭に「・」や「-」を自分で書いた人がいても、記号が二重にならないよう取り除く
function toLines(note) {
  return note
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripBullet(line) {
  return line.replace(/^[・\-*•]\s*/, "");
}

// コメントの表示。2行以上は箇条書きにし、lines 行を超える分は「続きを読む」でたたむ
export function NoteText({ note, lines = 4, small = false }) {
  const bodyRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  // 行の間に余白を入れると高さが「行数 × 行の高さ」からずれ、たたむ位置で文字が半分切れるので余白は付けない
  const items = toLines(note);

  useEffect(() => {
    // たたんでいるときだけ測る（開いた後に測ると、はみ出しがなくなりボタンが消えてしまうため）
    if (expanded || !bodyRef.current) return;
    const element = bodyRef.current;
    setOverflowing(element.scrollHeight > element.clientHeight + 2);
  }, [note, lines, expanded]);

  return (
    <div className={"rounded-md bg-stone-50 px-3 py-2 text-stone-700 " + (small ? "text-xs" : "text-sm")}>
      <div ref={bodyRef} className="overflow-hidden leading-relaxed break-words" style={expanded ? undefined : { maxHeight: lines * LINE_HEIGHT_EM + "em" }}>
        {items.length > 1 ? (
          <ul className="list-disc pl-4 marker:text-stone-400">
            {items.map((line, index) => (
              <li key={index}>{stripBullet(line)}</li>
            ))}
          </ul>
        ) : (
          <p>{items[0]}</p>
        )}
      </div>
      {overflowing && (
        <button type="button" aria-expanded={expanded} className="mt-1 text-xs font-medium text-[#1f6b4a]" onClick={() => setExpanded(!expanded)}>
          {expanded ? "閉じる" : "続きを読む"}
        </button>
      )}
    </div>
  );
}

// コメントの表示と編集。保存に成功したら、サーバーが返したスタッフを onSaved に渡す
export default function NoteEditor({ staff, onSaved, lines = 4, small = false }) {
  const saved = staff.note || "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  function startEdit() {
    setDraft(saved);
    setMessage(null);
    setEditing(true);
  }

  async function save() {
    // サーバーは前後の空白を取り除いて保存するので、比べるときも同じようにする
    if (draft.trim() === saved) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const next = await saveStaffNote(staff, draft);
      onSaved(next);
      setEditing(false);
      setMessage({ ok: true, text: "保存しました" });
    } catch (error) {
      setMessage({ ok: false, text: errorText(error) });
    } finally {
      setSaving(false);
    }
  }

  const status = message && (
    <span role={message.ok ? "status" : "alert"} className={"text-xs " + (message.ok ? "font-medium text-[#1f6b4a]" : "text-red-600")}>
      {message.text}
    </span>
  );

  if (editing) {
    return (
      <div className="mt-2">
        <textarea
          className="min-h-24 w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm leading-relaxed field-sizing-content"
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          autoFocus
          aria-label={staff.name + "さんのコメント"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <p className="text-xs text-stone-400">改行すると箇条書きで表示されます</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            className="rounded-md bg-[#1f6b4a] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            onClick={save}
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <button type="button" disabled={saving} className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs" onClick={() => setEditing(false)}>
            キャンセル
          </button>
          <span className="ml-auto text-xs text-stone-400">
            {draft.length}/{NOTE_MAX_LENGTH}
          </span>
        </div>
        {status}
      </div>
    );
  }

  return (
    <div className="mt-2">
      {saved && <NoteText note={saved} lines={lines} small={small} />}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button type="button" className="py-1 text-xs text-[#1f6b4a]" onClick={startEdit}>
          {saved ? "コメントを編集" : "＋ コメントを追加"}
        </button>
        {status}
      </div>
    </div>
  );
}
