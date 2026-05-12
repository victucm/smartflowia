import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "@/components/TopNav";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase, type Chamado } from "@/lib/supabase";
import {
  Search, Loader2, Inbox, AlertTriangle, Clock, ChevronRight,
  Ticket, Mail, Building2, Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const norm = (s?: string) => (s || "").toLowerCase().trim();

const statusCfg: Record<string, { label: string; cls: string }> = {
  recebido:           { label: "Recebido",            cls: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40" },
  "em análise":       { label: "Em Análise",           cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/40" },
  "em analise":       { label: "Em Análise",           cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/40" },
  "aguardando cliente": { label: "Aguardando Cliente", cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40" },
  "em desenvolvimento": { label: "Em Desenvolvimento", cls: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/40" },
  resolvido:          { label: "Resolvido",            cls: "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/40" },
  cancelado:          { label: "Cancelado",            cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40" },
};

const getStatusCfg = (status?: string) =>
  statusCfg[norm(status)] ?? { label: status || "—", cls: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40" };

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
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
    {children}
  </span>
);

const MeusChamados = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [chamados, setChamados] = useState<Chamado[] | null>(null);
  const [searched, setSearched] = useState(false);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed) return;
    setLoading(true);
    setChamados(null);
    setSearched(false);
    try {
      const { data, error } = await supabase
        .from("chamados")
        .select("*")
        .ilike("email", emailTrimmed)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setChamados(data ?? []);
      setSearched(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao buscar chamados", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />

      <section className="border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <Ticket className="h-6 w-6 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Portal do Cliente</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Meus Chamados</h1>
          <p className="text-muted-foreground text-sm">
            Informe seu e-mail para visualizar suas solicitações e acompanhar as atualizações.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={buscar} className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-95 min-w-[120px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" />Buscar</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <div className="text-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
            <p className="text-sm">Buscando seus chamados...</p>
          </div>
        )}

        {!loading && searched && chamados !== null && chamados.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma solicitação encontrada</p>
            <p className="text-sm mt-1">Não encontramos chamados para o e-mail <strong>{email}</strong>.</p>
          </div>
        )}

        {!loading && chamados && chamados.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest px-1">
              {chamados.length} solicitaç{chamados.length === 1 ? "ão encontrada" : "ões encontradas"}
            </p>
            {chamados.map((c) => {
              const sCfg = getStatusCfg(c.status);
              const descPreview = (c.descricao || "").slice(0, 120) + ((c.descricao || "").length > 120 ? "…" : "");
              return (
                <button
                  key={c.protocolo}
                  onClick={() => navigate(`/chamado/${c.protocolo}`)}
                  className="w-full text-left"
                >
                  <Card className="glass-card rounded-2xl hover:border-primary/40 hover:shadow-glow transition-all group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-primary">{c.protocolo}</span>
                            <Badge className={sCfg.cls}>{sCfg.label}</Badge>
                            {c.prioridade_ia && (
                              <Badge className={prioCls(c.prioridade_ia)}>{c.prioridade_ia}</Badge>
                            )}
                          </div>

                          {descPreview && (
                            <p className="text-sm text-foreground/80 line-clamp-2">{descPreview}</p>
                          )}

                          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                            {c.empresa && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> {c.empresa}
                              </span>
                            )}
                            {c.tipo_solicitacao && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" /> {c.tipo_solicitacao}
                              </span>
                            )}
                            {c.data_hora_br && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {c.data_hora_br}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MeusChamados;
