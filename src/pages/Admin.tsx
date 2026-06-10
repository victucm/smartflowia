import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import TopNav from "@/components/TopNav";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Activity, AlertTriangle, CheckCircle2, Search, Inbox, RefreshCw,
  ShieldAlert, Flame, Loader2, Eye, Copy, Clock, Sparkles,
  ArrowUpRight, Layers, MessageSquare, Ticket, History,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { isAdminAuthed } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { Chamado } from "@/lib/supabase";

const SUPABASE_URL = "https://zorcruyohscjnaefhkxz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcmNydXlvaHNjam5hZWZoa3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTIwNDUsImV4cCI6MjA5NDE2ODA0NX0.mFj4hImmWaRgMtRkKnZvZdfiUhYLhDvDHhgYlazLaYo";
const WEBHOOK_BUSCAR   = "https://victucm.app.n8n.cloud/webhook/buscar-chamados";
const WEBHOOK_ATUALIZAR = "https://victucm.app.n8n.cloud/webhook/atualizar-chamado";
const STATUS_LIST = ["Recebido", "Em Análise", "Aguardando Cliente", "Em Desenvolvimento", "Resolvido", "Cancelado"];

const norm = (s?: string) => (s || "").toLowerCase().trim();

const prioCls = (v?: string) => {
  const x = norm(v);
  if (x.startsWith("crít") || x.startsWith("crit")) return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40";
  if (x === "alta") return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/40";
  if (x.startsWith("méd") || x.startsWith("med")) return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/40";
  if (x === "baixa") return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/40";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40";
};

const critCls = (v?: string) => {
  const x = norm(v);
  if (x.startsWith("bloque")) return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/40";
  if (x === "alto") return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40";
  if (x.startsWith("méd") || x.startsWith("med")) return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/40";
  if (x === "baixo") return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/40";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40";
};

const statusCls = (v?: string) => {
  const x = norm(v);
  if (x === "recebido") return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40";
  if (x === "em análise" || x === "em analise") return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/40";
  if (x === "aguardando cliente") return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40";
  if (x === "em desenvolvimento") return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/40";
  if (x === "resolvido") return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/40";
  if (x === "cancelado") return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40";
};

const Badge = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${className}`}>{children}</span>
);

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
};

// ─── Admin page ───────────────────────────────────────────────────────────────
const Admin = () => {
  useEffect(() => { document.title = "Painel de Ocorrências - SmartFlow IA"; }, []);
  if (!isAdminAuthed()) return <Navigate to="/" replace />;

  const { toast } = useToast();
  const [items, setItems] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [fPrio, setFPrio] = useState("Todas");
  const [fCrit, setFCrit] = useState("Todas");
  const [fStatus, setFStatus] = useState("Todos");
  const [selected, setSelected] = useState<Chamado | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(WEBHOOK_BUSCAR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.sucesso === false) throw new Error(json.erro || "Erro ao buscar");
      setItems(json.chamados ?? []);
    } catch (e) {
      console.error(e);
      setError("Não foi possível carregar os chamados.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return items.filter((o) => {
      const matchQ = !ql || [o.protocolo, o.nome, o.empresa, o.email, o.tags, o.categoria_ia]
        .filter(Boolean).join(" ").toLowerCase().includes(ql);
      const matchP = fPrio === "Todas" || norm(o.prioridade_ia) === norm(fPrio);
      const matchC = fCrit === "Todas" || norm(o.criticidade_ia) === norm(fCrit);
      const matchS = fStatus === "Todos" || norm(o.status) === norm(fStatus);
      return matchQ && matchP && matchC && matchS;
    });
  }, [items, q, fPrio, fCrit, fStatus]);

  const metricas = useMemo(() => ({
    total: items.length,
    criticos: items.filter((i) => norm(i.prioridade_ia).startsWith("crít") || norm(i.prioridade_ia).startsWith("crit")).length,
    alta_prioridade: items.filter((i) => norm(i.prioridade_ia) === "alta").length,
    recebidos: items.filter((i) => norm(i.status) === "recebido").length,
    em_analise: items.filter((i) => norm(i.status) === "em análise" || norm(i.status) === "em analise").length,
    resolvidos: items.filter((i) => norm(i.status) === "resolvido").length,
    bloqueantes: items.filter((i) => norm(i.criticidade_ia).startsWith("bloque")).length,
    escalonamentos: items.filter((i) => i.requer_escalonamento === true).length,
  }), [items]);

  const m = metricas;

  return (
    <div className="min-h-screen">
      <TopNav />

      <section className="border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gradient mb-1">Painel Administrativo</p>
            <h1 className="text-3xl md:text-4xl font-bold">Central de Ocorrências</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitore e gerencie chamados em tempo real</p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Atualizar
          </Button>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={Inbox} label="Total" value={m.total} tone="bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400" />
          <Stat icon={Flame} label="Críticos" value={m.criticos} tone="bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400" />
          <Stat icon={ShieldAlert} label="Alta Prioridade" value={m.alta_prioridade} tone="bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400" />
          <Stat icon={CheckCircle2} label="Recebidos" value={m.recebidos} tone="bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400" />
          <Stat icon={Activity} label="Em Análise" value={m.em_analise} tone="bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400" />
          <Stat icon={CheckCircle2} label="Resolvidos" value={m.resolvidos} tone="bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" />
          <Stat icon={Layers} label="Bloqueantes" value={m.bloqueantes} tone="bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400" />
          <Stat icon={ArrowUpRight} label="Escalamentos" value={m.escalonamentos} tone="bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400" />
        </div>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar protocolo, nome, empresa, email, tags..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={fPrio} onValueChange={setFPrio}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as prioridades</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fCrit} onValueChange={setFCrit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as criticidades</SelectItem>
                <SelectItem value="Bloqueante">Bloqueante</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Baixo">Baixo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os status</SelectItem>
                {STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
                <p className="text-sm">Carregando chamados...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>Tentar novamente</Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum chamado encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr className="text-left text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-3">Protocolo</th>
                      <th className="px-4 py-3">Data/Hora</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Empresa</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Prioridade</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">SLA</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o, idx) => {
                      const escal = o.requer_escalonamento === true;
                      return (
                        <tr
                          key={o.protocolo || idx}
                          className={`border-t border-border/60 hover:bg-muted/30 transition-colors ${escal ? "border-l-4 border-l-red-500" : ""}`}
                        >
                          <td className="px-4 py-3 font-mono text-primary text-xs whitespace-nowrap">{o.protocolo || "—"}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{o.data_hora_br || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{o.nome || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{o.empresa || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{o.categoria_ia || "—"}</td>
                          <td className="px-4 py-3">{o.prioridade_ia ? <Badge className={prioCls(o.prioridade_ia)}>{o.prioridade_ia}</Badge> : "—"}</td>
                          <td className="px-4 py-3">{o.status ? <Badge className={statusCls(o.status)}>{o.status}</Badge> : "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">{o.sla_label || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelected(o)}
                              className="border-primary/40 text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4 mr-1" /> Abrir
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <ChamadoModal
        chamado={selected}
        onClose={() => setSelected(null)}
        onUpdated={fetchData}
      />
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone: string }) => (
  <Card className="glass-card rounded-2xl">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{label}</p>
        <p className="text-xl md:text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

// ─── Unified Chamado Modal (details + history + update) ───────────────────────
const ChamadoModal = ({
  chamado,
  onClose,
  onUpdated,
}: {
  chamado: Chamado | null;
  onClose: () => void;
  onUpdated: () => void;
}) => {
  const { toast } = useToast();
  const [atualizacoes, setAtualizacoes] = useState<any[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [novoStatus, setNovoStatus] = useState("");
  const [respostaAdmin, setRespostaAdmin] = useState("");
  const [adminNome, setAdminNome] = useState("Admin");
  const [savingUpdate, setSavingUpdate] = useState(false);

  useEffect(() => {
    if (!chamado) { setAtualizacoes([]); return; }
    setNovoStatus(chamado.status || "Recebido");
    setRespostaAdmin(chamado.resposta_admin || "");
    setAdminNome("Admin");
    (async () => {
      setLoadingHist(true);
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/atualizacoes_chamado?protocolo=eq.${encodeURIComponent(chamado.protocolo || "")}&select=*&order=created_at.asc`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (res.ok) setAtualizacoes((await res.json()) ?? []);
      } catch {
        // silent — history is supplementary
      } finally {
        setLoadingHist(false);
      }
    })();
  }, [chamado?.protocolo]);

  const salvarAtualizacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamado || !novoStatus) return;
    setSavingUpdate(true);
    try {
      const res = await fetch(WEBHOOK_ATUALIZAR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocolo: chamado.protocolo,
          novo_status: novoStatus,
          resposta_admin: respostaAdmin,
          admin_nome: adminNome,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || `HTTP ${res.status}`);
      }
      toast({ title: "Chamado atualizado!", description: "Cliente notificado por email." });
      onClose();
      onUpdated();
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSavingUpdate(false);
    }
  };

  if (!chamado) return null;

  const escal = chamado.requer_escalonamento === true;
  const tags = (chamado.tags || "").split(",").map((s) => s.trim()).filter(Boolean);

  const copy = () => {
    if (chamado.protocolo) {
      navigator.clipboard.writeText(chamado.protocolo);
      toast({ title: "Protocolo copiado!" });
    }
  };

  const timelineIcon = (tipo: string) => {
    if (tipo === "criacao") return <Ticket className="h-3.5 w-3.5 text-blue-400" />;
    if (tipo === "atualizacao_admin") return <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />;
    if (tipo === "mensagem_cliente") return <MessageSquare className="h-3.5 w-3.5 text-green-400" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const timelineDotCls = (tipo: string) => {
    if (tipo === "criacao") return "border-blue-400 bg-blue-400/10";
    if (tipo === "atualizacao_admin") return "border-violet-400 bg-violet-400/10";
    if (tipo === "mensagem_cliente") return "border-green-400 bg-green-400/10";
    return "border-border bg-muted";
  };

  return (
    <Dialog open={!!chamado} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-primary" />
            Detalhes do Chamado
            <span className="font-mono text-sm text-primary">{chamado.protocolo}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-2">
          {/* Identificação */}
          <Section title="Identificação">
            <button onClick={copy} className="text-left p-3 rounded-lg bg-secondary/60 border border-border hover:border-primary/40 group w-full">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center justify-between">
                Protocolo <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100" />
              </p>
              <p className="font-mono text-base md:text-lg font-bold text-primary">{chamado.protocolo || "—"}</p>
            </button>
            <Field label="Data/Hora de abertura" value={chamado.data_hora_br} />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Status atual</p>
              {chamado.status ? <Badge className={statusCls(chamado.status)}>{chamado.status}</Badge> : "—"}
            </div>
          </Section>

          {/* Solicitante */}
          <Section title="Solicitante">
            <Field label="Nome" value={chamado.nome} />
            <Field label="E-mail" value={chamado.email} />
            <Field label="Empresa" value={chamado.empresa} />
          </Section>

          {/* Solicitação Original */}
          <Section title="Solicitação Original">
            <Field label="Tipo" value={chamado.tipo_solicitacao} />
            <Field label="Urgência informada" value={chamado.urgencia} />
            <div className="md:col-span-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Descrição</p>
              <textarea
                readOnly
                value={chamado.descricao || ""}
                className="w-full min-h-[80px] max-h-[160px] rounded-lg border border-border bg-muted/30 p-3 text-sm resize-none"
              />
            </div>
          </Section>

          {/* Análise da IA */}
          <Section title="Análise da IA">
            <Field label="Categoria" value={chamado.categoria_ia} />
            <Field label="Complexidade" value={chamado.complexidade_estimada} />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Prioridade</p>
              {chamado.prioridade_ia ? <Badge className={prioCls(chamado.prioridade_ia)}>{chamado.prioridade_ia}</Badge> : "—"}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Criticidade</p>
              {chamado.criticidade_ia ? <Badge className={critCls(chamado.criticidade_ia)}>{chamado.criticidade_ia}</Badge> : "—"}
            </div>
            <Field label="SLA" value={chamado.sla_label} />
            <Field label="Prazo de atendimento" value={chamado.prazo_atendimento} />
            {tags.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-secondary border border-border">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {chamado.resumo_executivo && (
              <div className="md:col-span-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Resumo executivo</p>
                <p className="text-sm italic text-foreground/90">{chamado.resumo_executivo}</p>
              </div>
            )}
            {escal && (
              <div className="md:col-span-2">
                <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40">⚠ Requer Escalamento</Badge>
              </div>
            )}
          </Section>

          {/* Análise Interna (ação recomendada + mensagem IA) */}
          {(chamado.acao_recomendada || chamado.mensagem_ia) && (
            <Section title="Análise Interna (IA)">
              {chamado.acao_recomendada && (
                <div className="md:col-span-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/30">
                  <p className="text-[10px] uppercase tracking-widest text-green-700 dark:text-green-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Ação recomendada
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{chamado.acao_recomendada}</p>
                </div>
              )}
              {chamado.mensagem_ia && (
                <div className="md:col-span-2 p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/30">
                  <p className="text-[10px] uppercase tracking-widest text-yellow-700 dark:text-yellow-300 mb-1 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Mensagem ao cliente (gerada pela IA)
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{chamado.mensagem_ia}</p>
                </div>
              )}
            </Section>
          )}

          {/* Resposta Admin Registrada */}
          {chamado.resposta_admin && (
            <Section title="Resposta Admin Registrada">
              <div className="md:col-span-2 p-3 rounded-lg border border-violet-200 bg-violet-50 dark:bg-violet-500/10 dark:border-violet-500/30">
                <p className="text-sm whitespace-pre-wrap">{chamado.resposta_admin}</p>
              </div>
            </Section>
          )}

          {/* Histórico de Atualizações */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border/60 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" /> Histórico de Atualizações
            </h3>
            {loadingHist ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico...
              </div>
            ) : atualizacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atualização registrada ainda.</p>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/60" />
                {atualizacoes.map((a, i) => (
                  <div key={a.id || i} className="relative flex gap-3 pb-4 last:pb-0">
                    <div className={`relative z-10 flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center ${timelineDotCls(a.tipo)}`}>
                      {timelineIcon(a.tipo)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold leading-snug">{a.titulo || "Atualização"}</p>
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(a.created_at)}</p>
                      </div>
                      {a.mensagem && <p className="text-sm text-foreground/70 leading-relaxed">{a.mensagem}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {a.status_novo && <Badge className={statusCls(a.status_novo)}>{a.status_novo}</Badge>}
                        {a.autor && <span className="text-[10px] text-muted-foreground">por {a.autor}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Atualizar Chamado */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 pb-2 border-b border-primary/20">
              Atualizar Chamado
            </h3>
            <form onSubmit={salvarAtualizacao} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Novo Status *</Label>
                <Select value={novoStatus} onValueChange={setNovoStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_LIST.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Resposta para o Cliente</Label>
                <Textarea
                  value={respostaAdmin}
                  onChange={(e) => setRespostaAdmin(e.target.value)}
                  placeholder="Mensagem para o cliente (enviada por email e exibida no portal do cliente)..."
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Seu Nome</Label>
                <Input value={adminNome} onChange={(e) => setAdminNome(e.target.value)} placeholder="Nome do responsável" />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-brand text-primary-foreground"
                disabled={savingUpdate || !novoStatus}
              >
                {savingUpdate
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                  : "Confirmar Atualização"}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border/60">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
    <p className="text-sm break-words">{value || "—"}</p>
  </div>
);

export default Admin;
