export interface Ocorrencia {
  id: string;
  createdAt: string;
  nome: string;
  email: string;
  empresa: string;
  tipo_solicitacao: string;
  descricao: string;
  urgencia: string;
  protocolo: string;
  categoria: string;
  prioridade: string;
  criticidade: string;
  acao_recomendada: string;
  mensagem: string;
  status: string;
}

const KEY = "smartflow_ocorrencias";

export function getOcorrencias(): Ocorrencia[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addOcorrencia(o: Ocorrencia) {
  const list = getOcorrencias();
  list.unshift(o);
  localStorage.setItem(KEY, JSON.stringify(list));
}
