-- SmartFlow IA — Migração Inicial
-- Execute no Supabase SQL Editor: Dashboard → SQL Editor → New query

-- Tabela principal de chamados
CREATE TABLE IF NOT EXISTS chamados (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo             TEXT        UNIQUE NOT NULL,
  data_hora             TEXT,
  data_hora_br          TEXT,
  nome                  TEXT,
  email                 TEXT,
  empresa               TEXT,
  tipo_solicitacao      TEXT,
  descricao             TEXT,
  urgencia              TEXT,
  categoria_ia          TEXT,
  prioridade_ia         TEXT,
  criticidade_ia        TEXT,
  complexidade_estimada TEXT,
  acao_recomendada      TEXT,
  mensagem_ia           TEXT,
  status                TEXT        DEFAULT 'Recebido',
  resumo_executivo      TEXT,
  tags                  TEXT,
  sla_label             TEXT,
  prazo_atendimento     TEXT,
  requer_escalonamento  BOOLEAN     DEFAULT FALSE,
  responsavel           TEXT,
  resposta_admin        TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de histórico / timeline de atualizações
CREATE TABLE IF NOT EXISTS atualizacoes_chamado (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo   TEXT        NOT NULL REFERENCES chamados(protocolo) ON DELETE CASCADE,
  tipo        TEXT        NOT NULL, -- 'criacao' | 'atualizacao_admin' | 'mensagem_cliente'
  titulo      TEXT,
  mensagem    TEXT,
  status_novo TEXT,
  autor       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chamados_email     ON chamados(email);
CREATE INDEX IF NOT EXISTS idx_chamados_status    ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_created   ON chamados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atualizacoes_proto ON atualizacoes_chamado(protocolo);

-- Row Level Security
ALTER TABLE chamados           ENABLE ROW LEVEL SECURITY;
ALTER TABLE atualizacoes_chamado ENABLE ROW LEVEL SECURITY;

-- service_role tem acesso total (usado pelo n8n)
CREATE POLICY "service_role_all_chamados" ON chamados
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_atualizacoes" ON atualizacoes_chamado
  FOR ALL USING (auth.role() = 'service_role');

-- anon pode LER (portal do cliente via frontend)
CREATE POLICY "anon_select_chamados" ON chamados
  FOR SELECT USING (true);

CREATE POLICY "anon_select_atualizacoes" ON atualizacoes_chamado
  FOR SELECT USING (true);

-- anon pode INSERIR mensagens do cliente na timeline
CREATE POLICY "anon_insert_mensagem_cliente" ON atualizacoes_chamado
  FOR INSERT WITH CHECK (tipo = 'mensagem_cliente');
