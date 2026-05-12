import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import TopNav from "@/components/TopNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Chamado as ChamadoType, AtualizacaoChamado } from "@/lib/supabase";

const SUPABASE_URL = "https://zorcruyohscjnaefhkxz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcmNydXlvaHNjam5hZWZoa3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTIwNDUsImV4cCI6MjA5NDE2ODA0NX0.mFj4hImmWaRgMtRkKnZvZdfiUhYLhDvDHhgYlazLaYo";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, AlertTriangle, ArrowLeft, Clock, CheckCircle2,
  MessageSquare, PlusCircle, Send, Ticket, Building2, Mail,
  Tag, CalendarClock, Shield, Sparkles,
} from "lucide-react";

const norm = (s?: string) => (s || "").toLowerCase().trim();

const statusCfg: Record<string, { label: string; cls: string }> = {
  recebido:             { label: "Recebido",            cls: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40" },
  "em análise":         { label: "Em Análise",           cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/40" },
  "em analise":         { label: "Em Análise",           cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/40" },
  "aguardando cliente": { label: "Aguardando Cliente",   cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40" },
  "em desenvolvimento": { label: "Em Desenvolvimento",   cls: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/40" },
  resolvido:            { label: "Resolvido",            cls: "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/40" },
  cancelado:            { label: "Cancelado",            cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40" },
};

const getStatusCfg = (status?: string) =>
  statusCfg[norm(status)] ?? { label: status || "—", cls: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/15 dark:text-slate-300" };

const prioCls = (v?: string) => {
  const x = norm(v);
  if (x.startsWith("crít") || x.startsWith("crit"))
    return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40";
  if (x === "alta")
    return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/40";
  if (x.startsWith("méd") || x.startsWith("med"))
    return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/40";
  return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/40";
};

const Badge = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
    {children}
  </span>
);

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const timelineIcon = (tipo: string) => {
  if (tipo === "criacao")           return <Ticket className="h-4 w-4 text-blue-400" />;
  if (tipo === "atualizacao_admin") return <CheckCircle2 className="h-4 w-4 text-violet-400" />;
  if (tipo === "mensagem_cliente")  return <MessageSquare className="h-4 w-4 text-green-400" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

const timelineDot = (tipo: string) => {
  if (tipo === "criacao")           return "border-blue-400 bg-blue-400/10";
  if (tipo === "atualizacao_admin") return "border-violet-400 bg-violet-400/10";
  if (tipo === "mensagem_cliente")  return "border-green-400 bg-green-400/10";
  return "border-border bg-muted";
};

const ChamadoPage = () => {
  const { protocolo } = useParams<{ protocolo: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [chamado, setChamado] = useState<ChamadoType | null>(null);
  const [atualizacoes, setAtualizacoes] = useState<AtualizacaoChamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);

  const isEncerrado = ["resolvido", "cancelado"].includes(norm(chamado?.status));

  const fetchData = async () => {
    if (!protocolo) return;
    setLoading(true);
    try {
      const [resC, resA] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/chamados?protocolo=eq.${encodeURIComponent(protocolo)}&select=*`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        ),
        fetch(
          `${SUPABASE_URL}/rest/v1/atualizacoes_chamado?protocolo=eq.${encodeURIComponent(protocolo)}&select=*&order=created_at.asc`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        ),
      ]);
      if (!resC.ok) throw new Error(`HTTP ${resC.status}`);
      const cArray = await resC.json();
      if (!Array.isArray(cArray) || cArray.length === 0) { setNotFound(true); return; }
      const aData = resA.ok ? await resA.json() : [];
      setChamado(cArray[0]);
      setAtualizacoes(Array.isArray(aData) ? aData : []);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao carregar chamado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [protocolo]);

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim() || !protocolo) return;
    setSending(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/atualizacoes_chamado`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          protocolo,
          tipo: "mensagem_cliente",
          titulo: "Informação adicional do cliente",
          mensagem: mensagem.trim(),
          autor: chamado?.nome || "Cliente",
          created_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMensagem("");
      toast({ title: "Mensagem enviada!", description: "Sua informação foi registrada no chamado." });
      await fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (notFound || !chamado) {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-bold mb-2">Chamado não encontrado</h2>
          <p className="text-muted-foreground text-sm mb-6">
            O protocolo <strong>{protocolo}</strong> não foi encontrado.
          </p>
          <Button variant="outline" onClick={() => navigate("/meus-chamados")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos meus chamados
          </Button>
        </div>
      </div>
    );
  }

  const sCfg = getStatusCfg(chamado.status);
  const tags = (chamado.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="min-h-screen">
      <TopNav />

      <section className="border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link
            to="/meus-chamados"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Meus Chamados
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-sm font-bold text-primary">{chamado.protocolo}</span>
                <Badge className={sCfg.cls}>{sCfg.label}</Badge>
                {chamado.prioridade_ia && <Badge className={prioCls(chamado.prioridade_ia)}>{chamado.prioridade_ia}</Badge>}
              </div>
              <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Aberto em {chamado.data_hora_br || formatDate(chamado.created_at)}
              </p>
            </div>
            {chamado.sla_label && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">SLA</p>
                <p className="text-sm font-medium">{chamado.sla_label}</p>
                {chamado.prazo_atendimento && (
                  <p className="text-xs text-muted-foreground">{chamado.prazo_atendimento}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Resposta do Admin */}
        {chamado.resposta_admin && (
          <Card className="border-violet-500/40 bg-violet-500/5 rounded-2xl">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Resposta da Equipe
              </p>
              <p className="text-sm leading-relaxed">{chamado.resposta_admin}</p>
            </CardContent>
          </Card>
        )}

        {/* Informações da solicitação */}
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold pb-2 border-b border-border/60">
              Solicitação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chamado.nome && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Solicitante:</span>
                  <span className="font-medium truncate">{chamado.nome}</span>
                </div>
              )}
              {chamado.empresa && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Empresa:</span>
                  <span className="font-medium truncate">{chamado.empresa}</span>
                </div>
              )}
              {chamado.tipo_solicitacao && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium truncate">{chamado.tipo_solicitacao}</span>
                </div>
              )}
              {chamado.prazo_atendimento && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Prazo:</span>
                  <span className="font-medium truncate">{chamado.prazo_atendimento}</span>
                </div>
              )}
            </div>
            {chamado.descricao && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Descrição</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3 border border-border/60">
                  {chamado.descricao}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Análise da IA */}
        {(chamado.categoria_ia || chamado.resumo_executivo || chamado.mensagem_ia || tags.length > 0) && (
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold pb-2 border-b border-border/60 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Análise IA
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {chamado.categoria_ia && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Categoria</p>
                    <p className="text-sm font-medium">{chamado.categoria_ia}</p>
                  </div>
                )}
                {chamado.complexidade_estimada && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Complexidade</p>
                    <p className="text-sm font-medium">{chamado.complexidade_estimada}</p>
                  </div>
                )}
              </div>
              {chamado.resumo_executivo && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Resumo</p>
                  <p className="text-sm italic text-foreground/80">{chamado.resumo_executivo}</p>
                </div>
              )}
              {chamado.mensagem_ia && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-[10px] uppercase tracking-widest text-amber-500 mb-1">Orientação</p>
                  <p className="text-sm leading-relaxed">{chamado.mensagem_ia}</p>
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-secondary border border-border">{t}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold pb-3 border-b border-border/60 mb-4">
              Histórico de Atualizações
            </h3>
            {atualizacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atualização ainda.</p>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border/60" />
                {atualizacoes.map((a, i) => (
                  <div key={a.id || i} className="relative flex gap-4 pb-5 last:pb-0">
                    <div className={`relative z-10 flex-shrink-0 h-10 w-10 rounded-full border-2 flex items-center justify-center ${timelineDot(a.tipo)}`}>
                      {timelineIcon(a.tipo)}
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold leading-snug">{a.titulo || "Atualização"}</p>
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(a.created_at)}</p>
                      </div>
                      {a.mensagem && (
                        <p className="text-sm text-foreground/80 leading-relaxed">{a.mensagem}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {a.status_novo && <Badge className={getStatusCfg(a.status_novo).cls}>{getStatusCfg(a.status_novo).label}</Badge>}
                        {a.autor && <span className="text-[10px] text-muted-foreground">por {a.autor}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário adicionar informações */}
        {!isEncerrado && (
          <Card className="glass-card rounded-2xl border-primary/20">
            <CardContent className="p-5">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold pb-3 border-b border-border/60 mb-4 flex items-center gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" /> Adicionar Informações
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Tem mais detalhes para compartilhar? Adicione informações que possam ajudar na resolução.
              </p>
              <form onSubmit={enviarMensagem} className="space-y-3">
                <Textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Descreva as informações adicionais..."
                  rows={4}
                  required
                  className="resize-none"
                />
                <Button
                  type="submit"
                  disabled={sending || !mensagem.trim()}
                  className="bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-95"
                >
                  {sending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Enviar Informação</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ChamadoPage;
