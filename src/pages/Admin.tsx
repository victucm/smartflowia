import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import TopNav from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Activity, AlertTriangle, CheckCircle2, Search, Inbox, Filter,
  RefreshCw, ShieldAlert, Flame, Loader2, Eye, User, FileText, Sparkles, Hash,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { isAdminAuthed } from "@/lib/auth";

const WEBHOOK_URL = "https://hook.us2.make.com/na0o7yw4o96qgxdhqg1ycndv1tnruazl";

interface Chamado {
  protocolo?: string;
  data_hora?: string;
  nome?: string;
  email?: string;
  empresa?: string;
  tipo_solicitacao?: string;
  tipo_informado?: string;
  descricao?: string;
  urgencia?: string;
  categoria_ia?: string;
  prioridade_ia?: string;
  criticidade_ia?: string;
  acao_recomendada?: string;
  status?: string;
  mensagem_ia?: string;
  mensagem?: string;
  [k: string]: any;
}

const norm = (s?: string) => (s || "").toLowerCase().trim();

const Admin = () => {
  useEffect(() => { document.title = "Painel de Ocorrências - SmartFlow IA"; }, []);
  if (!isAdminAuthed()) return <Navigate to="/" replace />;

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
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "buscar_chamados" }),
      });
      if (!res.ok) throw new Error("Falha ao buscar");
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = {}; }
      const rawList: any[] = Array.isArray(data)
        ? data
        : (data.chamados || data.data || data.items || []);
      const list: Chamado[] = (rawList || []).filter(Boolean).map(mapChamado);
      setItems(list);
    } catch (e) {
      setError("Não foi possível carregar os chamados. Tente novamente.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return items.filter((o) => {
      const matchQ = !q || [o.protocolo, o.nome, o.empresa, o.email]
        .filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase());
      const matchP = fPrio === "Todas" || norm(o.prioridade_ia) === norm(fPrio);
      const matchC = fCrit === "Todas" || norm(o.criticidade_ia) === norm(fCrit);
      const matchS = fStatus === "Todos" || norm(o.status) === norm(fStatus);
      return matchQ && matchP && matchC && matchS;
    });
  }, [items, q, fPrio, fCrit, fStatus]);

  const stats = useMemo(() => ({
    total: items.length,
    criticos: items.filter((i) => ["crítica", "critica"].includes(norm(i.criticidade_ia))).length,
    altas: items.filter((i) => norm(i.prioridade_ia) === "alta").length,
    recebidos: items.filter((i) => norm(i.status) === "recebido").length,
    analise: items.filter((i) => ["em análise", "em analise"].includes(norm(i.status))).length,
  }), [items]);

  return (
    <div className="min-h-screen">
      <TopNav />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gradient mb-1">Painel Administrativo</p>
              <h1 className="text-3xl md:text-4xl font-bold">Central de Ocorrências</h1>
              <p className="text-sm text-muted-foreground mt-1">Monitore e gerencie chamados em tempo real</p>
            </div>
            <Button onClick={fetchData} variant="outline" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Atualizar
            </Button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={Inbox} label="Total" value={stats.total} tone="primary" />
          <StatCard icon={Flame} label="Críticos" value={stats.criticos} tone="critical" />
          <StatCard icon={ShieldAlert} label="Alta Prioridade" value={stats.altas} tone="high" />
          <StatCard icon={CheckCircle2} label="Recebidos" value={stats.recebidos} tone="info" />
          <StatCard icon={Activity} label="Em Análise" value={stats.analise} tone="purple" />
        </div>

        {/* Filters */}
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar protocolo, nome, empresa, email..."
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={fPrio} onValueChange={setFPrio}>
              <SelectTrigger><Filter className="h-4 w-4" /><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as prioridades</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fCrit} onValueChange={setFCrit}>
              <SelectTrigger><Flame className="h-4 w-4" /><SelectValue placeholder="Criticidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as criticidades</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><Activity className="h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os status</SelectItem>
                <SelectItem value="Recebido">Recebido</SelectItem>
                <SelectItem value="Em análise">Em análise</SelectItem>
                <SelectItem value="Resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="glass-card rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" /> Ocorrências ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
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
              <div className="space-y-3">
                {filtered.map((o, idx) => (
                  <ChamadoRow key={o.protocolo || idx} chamado={o} onView={() => setSelected(o)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <DetailsDialog chamado={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

const ChamadoRow = ({ chamado: o, onView }: { chamado: Chamado; onView: () => void }) => (
  <div className="group rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:shadow-md hover:border-primary/40 transition-all p-4">
    <div className="grid grid-cols-12 gap-3 items-center">
      <div className="col-span-12 md:col-span-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Protocolo</p>
        <p className="font-mono text-primary text-sm font-semibold truncate">{o.protocolo || "—"}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{o.data_hora || "—"}</p>
      </div>
      <div className="col-span-12 md:col-span-3">
        <p className="text-sm font-medium truncate">{o.nome || "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{o.empresa || "—"}</p>
      </div>
      <div className="col-span-6 md:col-span-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoria</p>
        <p className="text-sm truncate">{o.categoria_ia || "—"}</p>
      </div>
      <div className="col-span-6 md:col-span-3 flex flex-wrap gap-1.5">
        <LevelBadge value={o.prioridade_ia} kind="prio" />
        <LevelBadge value={o.criticidade_ia} kind="crit" />
        <StatusBadge value={o.status} />
      </div>
      <div className="col-span-12 md:col-span-2 flex md:justify-end">
        <Button size="sm" variant="outline" onClick={onView} className="w-full md:w-auto">
          <Eye className="h-4 w-4" /> Ver detalhes
        </Button>
      </div>
    </div>
  </div>
);

const DetailsDialog = ({ chamado, onClose }: { chamado: Chamado | null; onClose: () => void }) => (
  <Dialog open={!!chamado} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Detalhes do Chamado
        </DialogTitle>
        <DialogDescription className="font-mono text-primary">
          {chamado?.protocolo || "—"}
        </DialogDescription>
      </DialogHeader>

      {chamado && (
        <div className="space-y-5 mt-2">
          <Section icon={User} title="Dados do Cliente">
            <Field label="Nome" value={chamado.nome} />
            <Field label="Email" value={chamado.email} />
            <Field label="Empresa" value={chamado.empresa} />
          </Section>

          <Section icon={FileText} title="Solicitação Enviada">
            <Field label="Tipo de Solicitação" value={chamado.tipo_solicitacao || chamado.tipo_informado} />
            <Field label="Urgência" value={chamado.urgencia} />
            <Field label="Descrição" value={chamado.descricao} full />
          </Section>

          <Section icon={Sparkles} title="Análise da IA">
            <div className="col-span-2 flex flex-wrap gap-2 mb-2">
              <LevelBadge value={chamado.prioridade_ia} kind="prio" />
              <LevelBadge value={chamado.criticidade_ia} kind="crit" />
              <StatusBadge value={chamado.status} />
            </div>
            <Field label="Categoria IA" value={chamado.categoria_ia} />
            <Field label="Ação Recomendada" value={chamado.acao_recomendada} full />
            <Field label="Mensagem da IA" value={chamado.mensagem_ia || chamado.mensagem} full />
          </Section>

          <Section icon={Hash} title="Dados do Sistema">
            <Field label="Protocolo" value={chamado.protocolo} mono />
            <Field label="Data / Hora" value={chamado.data_hora} />
          </Section>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

const Section = ({ icon: Icon, title, children }: any) => (
  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
  </div>
);

const Field = ({ label, value, full, mono }: { label: string; value?: string; full?: boolean; mono?: boolean }) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
    <p className={`text-sm ${mono ? "font-mono text-primary" : ""} whitespace-pre-wrap break-words`}>
      {value || "—"}
    </p>
  </div>
);

const StatCard = ({ icon: Icon, label, value, tone }: any) => {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 border-primary/30 text-primary",
    critical: "bg-red-500/10 border-red-500/40 text-red-500",
    high: "bg-orange-500/10 border-orange-500/40 text-orange-500",
    info: "bg-blue-500/10 border-blue-500/40 text-blue-500",
    purple: "bg-purple-500/10 border-purple-500/40 text-purple-500",
  };
  return (
    <Card className="glass-card rounded-2xl">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const LevelBadge = ({ value, kind }: { value?: string; kind?: "prio" | "crit" }) => {
  const v = norm(value);
  let cls = "bg-secondary text-muted-foreground border-border";
  if (v === "crítica" || v === "critica") cls = "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40";
  else if (v === "alta") cls = "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40";
  else if (v === "média" || v === "media") cls = "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/40";
  else if (v === "baixa") cls = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40";
  if (!value) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {kind === "prio" ? "Prio: " : kind === "crit" ? "Crit: " : ""}{value}
    </span>
  );
};

const StatusBadge = ({ value }: { value?: string }) => {
  const v = norm(value);
  let cls = "bg-secondary text-muted-foreground border-border";
  if (v === "recebido") cls = "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40";
  else if (v === "em análise" || v === "em analise") cls = "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40";
  else if (v === "resolvido" || v === "concluído" || v === "concluido") cls = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40";
  if (!value) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {value}
    </span>
  );
};

export default Admin;
