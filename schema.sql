-- Schema do sistema de chamados — PostgreSQL puro
-- Execute como superusuário ou o usuário 'sistemas'

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuários administrativos
CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  nome        VARCHAR(255) NOT NULL,
  nivel       VARCHAR(50)  NOT NULL DEFAULT 'tecnico', -- 'gestor' | 'tecnico'
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Salas físicas vinculadas a QR codes
CREATE TABLE IF NOT EXISTS salas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(255) NOT NULL,
  localizacao   VARCHAR(255),
  qrcode_token  VARCHAR(255) UNIQUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chamados de manutenção
CREATE TABLE IF NOT EXISTS chamados (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_unico         VARCHAR(20) NOT NULL UNIQUE,
  tipo_problema        VARCHAR(100) NOT NULL,
  descricao            TEXT NOT NULL,
  urgencia             VARCHAR(20) NOT NULL,   -- 'baixa' | 'media' | 'alta' | 'muito_alta'
  status               VARCHAR(30) NOT NULL DEFAULT 'enviado',
  sala_id              UUID REFERENCES salas(id) ON DELETE SET NULL,
  responsavel_id       UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  previsao_resolucao   DATE,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em        TIMESTAMPTZ
);

-- Histórico de mudanças de status
CREATE TABLE IF NOT EXISTS chamado_historico (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id       UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  status_anterior  VARCHAR(30),
  status_novo      VARCHAR(30) NOT NULL,
  observacao       TEXT,
  admin_id         UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fotos/anexos dos chamados
CREATE TABLE IF NOT EXISTS anexos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id  UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,  -- base64 ou URL
  tipo        VARCHAR(20),    -- 'usuario' | 'equipe'
  admin_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notificações internas para gestores
CREATE TABLE IF NOT EXISTS notificacoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo              VARCHAR(255) NOT NULL,
  mensagem            TEXT NOT NULL,
  lido                BOOLEAN NOT NULL DEFAULT FALSE,
  destinatario_nivel  VARCHAR(50) NOT NULL DEFAULT 'gestor',
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chamados_status     ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_criado_em  ON chamados(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_historico_chamado   ON chamado_historico(chamado_id);
CREATE INDEX IF NOT EXISTS idx_anexos_chamado      ON anexos(chamado_id);
CREATE INDEX IF NOT EXISTS idx_notif_lido          ON notificacoes(lido, destinatario_nivel);
