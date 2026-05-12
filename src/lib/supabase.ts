import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://zorcruyohscjnaefhkxz.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcmNydXlvaHNjam5hZWZoa3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTIwNDUsImV4cCI6MjA5NDE2ODA0NX0.mFj4hImmWaRgMtRkKnZvZdfiUhYLhDvDHhgYlazLaYo";

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
