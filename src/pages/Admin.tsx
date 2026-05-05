import { useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getOcorrencias, Ocorrencia } from "@/lib/storage";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Search, Inbox, TrendingUp, Filter,
  Building2, Mail, Hash, RefreshCw, ShieldAlert,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const Admin = () => {
  const [items, setItems] = useState<Ocorrencia[]>(() => getOcorrencias());
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [selected, setSelected] = useState<Ocorrencia | null>(null);

  const refresh = () => setItems(getOcorrencias());

  const filtered = useMemo(() => {
    return items.filter((o) => {
      const matchQ = !q || [o.nome, o.empresa, o.protocolo, o.email, o.descricao].join(" ").toLowerCase().includes(q.toLowerCase());
      const matchF = filtro === "Todas" || o.prioridade === filtro || o.urgencia === filtro;
      return matchQ && matchF;
    });
  }, [items, q, filtro]);

  const stats = useMemo(() => ({
    total: items.length,
    altas: items.filter((i) => (i.prioridade || i.urgencia) === "Alta").length,
    medias: items.filter((i) => (i.prioridade || i.urgencia) === "Média").length,
    baixas: items.filter((i) => (i.prioridade || i.urgencia) === "Baixa").length,
  }), [items]);

  return (
    <div className="min-h-screen">
      <TopNav />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-neon mb-1">Painel Administrativo</p>
              <h1 className="text-3xl md:text-4xl font-bold">Central de Ocorrências</h1>
              <p className="text-sm text-muted-foreground mt-1">Monitore e gerencie chamados em tempo real</p>
            </div>
            <Button onClick={refresh} variant="outline" className="border-primary/40 hover:bg-primary/10">
              <RefreshCw className="h-4 w-4" /> Atualizar
            </Button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Inbox} label="Total" value={stats.total} color="primary" />
          <StatCard icon={ShieldAlert} label="Alta Prioridade" value={stats.altas} color="destructive" />
          <StatCard icon={TrendingUp} label="Média" value={stats.medias} color="warning" />
          <StatCard icon={CheckCircle2} label="Baixa" value={stats.baixas} color="success" />
        </div>

        {/* Filters */}
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa, protocolo..."
                className="pl-9 bg-input/60"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="md:w-56 bg-input/60">
                <Filter className="h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as prioridades</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="glass-card rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-neon" /> Ocorrências ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma ocorrência registrada ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border/60">
                      <th className="px-4 py-3">Protocolo</th>
                      <th className="px-4 py-3">Solicitante</th>
                      <th className="px-4 py-3 hidden md:table-cell">Empresa</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Categoria</th>
                      <th className="px-4 py-3">Prioridade</th>
                      <th className="px-4 py-3 hidden md:table-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => setSelected(o)}
                        className="border-b border-border/40 hover:bg-primary/5 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-neon text-xs">{o.protocolo}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{o.nome}</div>
                          <div className="text-xs text-muted-foreground">{o.email}</div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{o.empresa}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">{o.categoria}</td>
                        <td className="px-4 py-3"><PriorityBadge value={o.prioridade || o.urgencia} /></td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail */}
        {selected && (
          <Card className="glass-card rounded-2xl neon-border">
            <CardHeader className="border-b border-border/60 flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hash className="h-4 w-4 text-neon" />
                <span className="font-mono text-neon">{selected.protocolo}</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Fechar</Button>
            </CardHeader>
            <CardContent className="pt-6 grid md:grid-cols-2 gap-4">
              <Detail icon={Building2} label="Empresa" value={selected.empresa} />
              <Detail icon={Mail} label="E-mail" value={selected.email} />
              <Detail label="Solicitante" value={selected.nome} />
              <Detail label="Categoria" value={selected.categoria} />
              <Detail label="Prioridade" value={selected.prioridade || selected.urgencia} />
              <Detail label="Criticidade" value={selected.criticidade} />
              <Detail label="Ação Recomendada" value={selected.acao_recomendada} full />
              <Detail label="Descrição" value={selected.descricao} full />
              <Detail label="Mensagem da IA" value={selected.mensagem} full />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 border-primary/30 text-neon",
    destructive: "bg-destructive/10 border-destructive/40 text-destructive",
    warning: "bg-warning/10 border-warning/40 text-warning",
    success: "bg-success/10 border-success/40 text-success",
  };
  return (
    <Card className="glass-card rounded-2xl">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${colors[color]}`}>
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

const PriorityBadge = ({ value }: { value: string }) => {
  const map: Record<string, string> = {
    Alta: "bg-destructive/15 text-destructive border-destructive/40",
    Média: "bg-warning/15 text-warning border-warning/40",
    Baixa: "bg-success/15 text-success border-success/40",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[value] || "bg-secondary text-muted-foreground border-border"}`}>
      {value || "—"}
    </span>
  );
};

const Detail = ({ icon: Icon, label, value, full }: { icon?: any; label: string; value?: string; full?: boolean }) => (
  <div className={`p-3 rounded-xl bg-secondary/40 border border-border/60 ${full ? "md:col-span-2" : ""}`}>
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
      {Icon && <Icon className="h-3 w-3" />} {label}
    </div>
    <p className="text-sm">{value || "—"}</p>
  </div>
);

export default Admin;
