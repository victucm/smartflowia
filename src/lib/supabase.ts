import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Chamado {
  id?: string;
  protocolo: string;
  data_hora?: string;
  data_hora_br?: string;
  nome?: string;
  email?: string;
  empresa?: string;
  tipo_solicitacao?: string;
  descricao?: string;
  urgencia?: string;
  categoria_ia?: string;
  prioridade_ia?: string;
  criticidade_ia?: string;
  complexidade_estimada?: string;
  acao_recomendada?: string;
  mensagem_ia?: string;
  status?: string;
  resumo_executivo?: string;
  tags?: string;
  sla_label?: string;
  prazo_atendimento?: string;
  requer_escalonamento?: boolean;
  responsavel?: string;
  resposta_admin?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AtualizacaoChamado {
  id?: string;
  protocolo: string;
  tipo: "criacao" | "atualizacao_admin" | "mensagem_cliente";
  titulo?: string;
  mensagem?: string;
  status_novo?: string;
  autor?: string;
  created_at?: string;
}
