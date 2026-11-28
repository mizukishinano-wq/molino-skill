-- PostgreSQL（Supabase）のときだけ、Flyway の migrate が終わるたびに実行される。
-- Supabase は public スキーマのテーブルを外から読み書きできる API（Data API）を持つため、
-- すべてのテーブルで RLS（行ごとのアクセス制御）を有効にし、許可のルール（ポリシー）は作らない。
-- これで Data API からは何も読み書きできなくなる。Spring Boot はテーブルの持ち主として接続するので影響を受けない。
-- 新しいテーブルを増やしたときも自動で対象になるよう、テーブル名を書かずに一覧から取り出す。
DO $$
DECLARE
    target record;
BEGIN
    FOR target IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target.tablename);
    END LOOP;
END
$$;
