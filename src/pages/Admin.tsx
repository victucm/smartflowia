import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import TopNav from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Activity, AlertTriangle, CheckCircle2, Search, Inbox, TrendingUp, Filter,
  RefreshCw, ShieldAlert, Flame, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { isAdminAuthed } from "@/lib/auth";

const WEBHOOK_URL = "https://hook.us2.make.com/na0o7yw4o96qgxdhqg1ycndv1tnruazl";

interface Chamado {
  protocolo?: string;
  data_hora?: string;
  nome?: string;
  empresa?: string;
  email?: string;
  tipo_informado?: string;
  categoria_ia?: string;
  prioridade_ia?: string;
  criticidade_ia?: string;
  acao_recomendada?: string;
  status?: string;
  [k: string]: any;
}

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(WEBHOOK_URL, { method: "GET" });
      if (!res.ok) throw new Error("Falha ao buscar");
      const text = await res.text();
      let data: any = [];
      try { data = JSON.parse(text); } catch { data = []; }
      const list: Chamado[] = Array.isArray(data) ? data : (data.chamados || data.data || data.items || [data]);
      setItems(list.filter(Boolean));
    } catch (e: any) {
      setError("Não foi possível carregar os chamados. Tente novamente.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return items.filter((o) => {
      const matchQ = !q || [o.protocolo, o.nome, o.empresa].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase());
      const matchP = fPrio === "Todas" || (o.prioridade_ia || "").toLowerCase() === fPrio.toLowerCase();
      const matchC = fCrit === "Todas" || (o.criticidade_ia || "").toLowerCase() === fCrit.toLowerCase();
      const matchS = fStatus === "Todos" || (o.status || "").toLowerCase() === fStatus.toLowerCase();
      return matchQ && matchP && matchC && matchS;
    });
  }, [items, q, fPrio, fCrit, fStatus]);

  const stats = useMemo(() => ({
    total: items.length,
    criticos: items.filter((i) => (i.criticidade_ia || "").toLowerCase() === "crítica" || (i.criticidade_ia || "").toLowerCase() === "critica").length,
    altas: items.filter((i) => (i.prioridade_ia || "").toLowerCase() === "alta").length,
    recebidos: items.filter((i) => (i.status || "").toLowerCase() === "recebido" || (i.status || "").toLowerCase() === "recebidos").length,
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Inbox} label="Total de Chamados" value={stats.total} tone="primary" />
          <StatCard icon={Flame} label="Chamados Críticos" value={stats.criticos} tone="critical" />
          <StatCard icon={ShieldAlert} label="Alta Prioridade" value={stats.altas} tone="high" />
          <StatCard icon={CheckCircle2} label="Recebidos" value={stats.recebidos} tone="success" />
        </div>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar protocolo, nome, empresa..."
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={fPrio} onValueChange={setFPrio}>
              <SelectTrigger><Filter className="h-4 w-4" /><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as prioridades</SelectItem>
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
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" /> Ocorrências ({filtered.length})
            </CardTitle>
          </CardHeader>
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
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border/60">
                      <th className="px-4 py-3">Protocolo</th>
                      <th className="px-4 py-3">Data/Hora</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3 hidden md:table-cell">Empresa</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Tipo Informado</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Categoria IA</th>
                      <th className="px-4 py-3">Prioridade</th>
                      <th className="px-4 py-3">Criticidade</th>
                      <th className="px-4 py-3 hidden xl:table-cell">Ação Recomendada</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o, idx) => (
                      <tr key={o.protocolo || idx} className="border-b border-border/40 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 font-mono text-primary text-xs">{o.protocolo || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{o.data_hora || "—"}</td>
                        <td className="px-4 py-3">{o.nome || "—"}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{o.empresa || "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{o.tipo_informado || "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">{o.categoria_ia || "—"}</td>
                        <td className="px-4 py-3"><LevelBadge value={o.prioridade_ia} /></td>
                        <td className="px-4 py-3"><LevelBadge value={o.criticidade_ia} /></td>
                        <td className="px-4 py-3 hidden xl:table-cell text-xs max-w-xs truncate" title={o.acao_recomendada}>{o.acao_recomendada || "—"}</td>
                        <td className="px-4 py-3 text-xs">{o.status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, tone }: any) => {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 border-primary/30 text-primary",
    critical: "bg-red-500/10 border-red-500/40 text-red-500",
    high: "bg-orange-500/10 border-orange-500/40 text-orange-500",
    success: "bg-emerald-500/10 border-emerald-500/40 text-emerald-500",
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

const LevelBadge = ({ value }: { value?: string }) => {
  const v = (value || "").toLowerCase();
  let cls = "bg-secondary text-muted-foreground border-border";
  if (v === "crítica" || v === "critica") cls = "bg-red-500/15 text-red-500 border-red-500/40";
  else if (v === "alta") cls = "bg-orange-500/15 text-orange-500 border-orange-500/40";
  else if (v === "média" || v === "media") cls = "bg-yellow-500/15 text-yellow-500 border-yellow-500/40";
  else if (v === "baixa") cls = "bg-emerald-500/15 text-emerald-500 border-emerald-500/40";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {value || "—"}
    </span>
  );
};

export default Admin;
