-- 1. Criar tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  nivel TEXT NOT NULL DEFAULT 'tecnico' CHECK (nivel IN ('tecnico', 'gestor')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Usuário autenticado lê seu próprio perfil
CREATE POLICY "perfil_proprio" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. Gestores leem todos os perfis
CREATE POLICY "gestor_le_todos" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.nivel = 'gestor'
    )
  );

-- 5. Gestor pode inserir/atualizar perfis
CREATE POLICY "gestor_gerencia" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.nivel = 'gestor'
    )
  );

-- 6. Inserir perfil gestor para todos os usuários existentes (sem conflito)
INSERT INTO profiles (id, nome, nivel)
SELECT id, COALESCE(raw_user_meta_data->>'nome', email), 'gestor'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
