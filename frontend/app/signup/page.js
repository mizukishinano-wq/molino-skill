import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8">
        <h1 className="text-2xl font-bold">新規登録は停止しています</h1>
        <p className="mt-2 text-sm text-stone-500">アカウントが必要な場合は、管理者に連絡してください。</p>
        <p className="mt-6 text-center text-sm text-green-800"><Link href="/login">ログイン画面へ戻る</Link></p>
      </section>
    </main>
  );
}
