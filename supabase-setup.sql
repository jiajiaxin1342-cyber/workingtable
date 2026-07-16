-- ────────────────────────────────────────────────────────────────────────────
-- AI 工作台 — Supabase 数据表创建
-- 在 Supabase Dashboard → SQL Editor 中执行以下 SQL
-- ────────────────────────────────────────────────────────────────────────────

-- 创建数据表
CREATE TABLE IF NOT EXISTS user_data (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   text NOT NULL UNIQUE,
  data        jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 启用行级安全（RLS）
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 允许匿名读写（因为目前没有用户认证系统）
-- 生产环境建议加上用户认证
CREATE POLICY "Allow anonymous read" ON user_data
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert" ON user_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON user_data
  FOR UPDATE USING (true);

-- 创建 updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at
  ON user_data (updated_at DESC);