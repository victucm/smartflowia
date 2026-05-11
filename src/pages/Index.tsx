import { useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Send, Loader2, CheckCircle2, Clock, AlertTriangle, Sparkles,
  Building2, Mail, User as UserIcon, MessageSquare, Tag, Flame,
  CircuitBoard, Cpu, Copy, RotateCcw,
} from "lucide-react";
import TopNav from "@/components/TopNav";

const WEBHOOK_URL = "https://victucm.app.n8n.cloud/webhook-test/receber-chamado";

const TIPOS = [
  "Suporte Técnico", "TI / Infraestrutura", "Financeiro", "Comercial / Vendas",
  "Recursos Humanos", "Jurídico / Compliance", "Produto / Desenvolvimento",
  "Operações", "Atendimento ao Cliente", "Segurança da Informação", "Outro",
];
const URGENCIAS = ["Baixa", "Média", "Alta", "Crítica"];

const formSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  empresa: z.string().trim().min(1, "Empresa é obrigatória").max(120),
  tipo_solicitacao: z.string().min(1, "Selecione o tipo"),
  descricao: z.string().trim().min(1, "Descrição é obrigatória").max(2000),
  urgencia: z.string().min(1, "Selecione a urgência"),
});
type FormData = z.infer<typeof formSchema>;

interface Resultado {
  sucesso?: boolean;
  protocolo?: string;
  categoria?: string;
  prioridade?: string;
  criticidade?: string;
  complexidade?: string;
  acao?: string;
  status?: string;
  mensagem?: string;
  resumo?: string;
  tags?: string[] | string;
  sla?: string;
  prazo_atendimento?: string;
  requer_escalonamento?: boolean | string;
  sentimento?: string;
  data_hora?: string;
}

const initialForm: FormData = {
  nome: "", email: "", empresa: "", tipo_solicitacao: "", descricao: "", urgencia: "",
};

const fetchWithTimeout = (url: string, opts: RequestInit, timeout = 30000) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
};

const Index = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = formSchema.safeParse(form);
    if (!r.success) {
      const fe: Partial<Record<keyof FormData, string>> = {};
      r.error.errors.forEach((er) => (fe[er.path[0] as keyof FormData] = er.message));
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        nome: form.nome,
        email: form.email,
        empresa: form.empresa,
        tipo_solicitacao: form.tipo_solicitacao,
        descricao: form.descricao,
        urgencia: form.urgencia,
      };
      console.log("[SmartFlow] Enviando para n8n:", JSON.stringify(payload, null, 2));
      const response = await fetchWithTimeout(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      let data: Resultado = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { mensagem: text }; }
      setResultado(data);
      setForm(initialForm);
      toast({ title: "Chamado registrado!", description: data.protocolo });
    } catch (err) {
      console.error("[SmartFlow] Falha:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const novoChamado = () => { setResultado(null); setForm(initialForm); };

  return (
    <div className="min-h-screen">
      <TopNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs uppercase tracking-widest text-muted-foreground mb-5">
            <Cpu className="h-3 w-3 text-primary" /> Powered by AI
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3">
            SmartFlow <span className="text-gradient">IA</span>
          </h1>
          <p className="text-base md:text-lg text-foreground/90 font-medium">
            Ecossistema Inteligente de Gestão de Solicitações
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        {!resultado ? (
          <Card className="glass-card rounded-2xl">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="flex items-center gap-2.5 text-lg">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <CircuitBoard className="h-4.5 w-4.5 text-neon" />
                </div>
                Abertura de Chamado
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Nome completo" icon={UserIcon} error={errors.nome}>
                    <Input value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Seu nome" />
                  </Field>
                  <Field label="E-mail corporativo" icon={Mail} error={errors.email}>
                    <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="seu@empresa.com" />
                  </Field>
                  <Field label="Empresa" icon={Building2} error={errors.empresa}>
                    <Input value={form.empresa} onChange={(e) => handleChange("empresa", e.target.value)} placeholder="Nome da empresa" />
                  </Field>
                  <Field label="Tipo de solicitação" icon={Tag} error={errors.tipo_solicitacao}>
                    <Select value={form.tipo_solicitacao} onValueChange={(v) => handleChange("tipo_solicitacao", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Descreva sua solicitação" icon={MessageSquare} error={errors.descricao}>
                  <Textarea rows={5} value={form.descricao} onChange={(e) => handleChange("descricao", e.target.value)} placeholder="Descreva em detalhes..." className="resize-none" />
                </Field>

                <Field label="Urgência" icon={Flame} error={errors.urgencia}>
                  <Select value={form.urgencia} onValueChange={(v) => handleChange("urgencia", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione a urgência" /></SelectTrigger>
                    <SelectContent>
                      {URGENCIAS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-brand text-primary-foreground font-semibold rounded-xl shadow-glow hover:opacity-95"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Analisando...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Enviar Solicitação</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <ResultCard data={resultado} onNovo={novoChamado} />
        )}
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SmartFlow IA · Ecossistema Inteligente de Gestão
      </footer>
    </div>
  );
};

const Field = ({ label, icon: Icon, error, children }: { label: string; icon: any; error?: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" /> {label}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const prioCls = (v?: string) => {
  const x = (v || "").toLowerCase();
  if (x.startsWith("crít") || x.startsWith("crit")) return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40";
  if (x === "alta") return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/40";
  if (x.startsWith("méd") || x.startsWith("med")) return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/40";
  if (x === "baixa") return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/40";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40";
};
const critCls = (v?: string) => {
  const x = (v || "").toLowerCase();
  if (x.startsWith("bloque")) return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/40";
  if (x === "alto") return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40";
  if (x.startsWith("méd") || x.startsWith("med")) return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/40";
  if (x === "baixo") return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/40";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40";
};

const Badge = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}>{children}</span>
);

const ResultCard = ({ data, onNovo }: { data: Resultado; onNovo: () => void }) => {
  const { toast } = useToast();
  const tags = Array.isArray(data.tags) ? data.tags : (typeof data.tags === "string" ? data.tags.split(",").map(s => s.trim()).filter(Boolean) : []);
  const escal = data.requer_escalonamento === true || data.requer_escalonamento === "Sim" || data.requer_escalonamento === "true";
  const copy = () => {
    if (data.protocolo) {
      navigator.clipboard.writeText(data.protocolo);
      toast({ title: "Protocolo copiado!" });
    }
  };
  return (
    <Card className="glass-card rounded-2xl animate-fade-in-up">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-success/10 border border-success/40 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Chamado registrado com sucesso!</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{data.data_hora || ""}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {data.protocolo && (
          <button onClick={copy} className="w-full text-left p-4 rounded-xl bg-secondary/60 border border-border hover:border-primary/40 transition-all group">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center justify-between">
              Protocolo <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100" />
            </p>
            <p className="font-mono text-lg md:text-xl font-bold text-primary">{data.protocolo}</p>
          </button>
        )}

        <div className="flex flex-wrap gap-2">
          {data.prioridade && <Badge className={prioCls(data.prioridade)}>Prioridade: {data.prioridade}</Badge>}
          {data.criticidade && <Badge className={critCls(data.criticidade)}>Criticidade: {data.criticidade}</Badge>}
          {data.status && <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/40">{data.status}</Badge>}
          {data.categoria && <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40">{data.categoria}</Badge>}
          {escal && <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40">⚠ Requer Escalamento</Badge>}
        </div>

        {(data.sla || data.prazo_atendimento) && (
          <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              {data.sla && <p>Prazo de atendimento: <span className="font-semibold">{data.sla}</span></p>}
              {data.prazo_atendimento && <p className="text-xs text-muted-foreground mt-0.5">Limite: {data.prazo_atendimento}</p>}
            </div>
          </div>
        )}

        {data.mensagem && (
          <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/30">
            <p className="text-[10px] uppercase tracking-widest text-yellow-700 dark:text-yellow-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Mensagem da IA
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{data.mensagem}</p>
          </div>
        )}

        {data.acao && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/30">
            <p className="text-[10px] uppercase tracking-widest text-green-700 dark:text-green-300 mb-1.5">Próximos passos</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{data.acao}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-2 border-t border-border/60">
          {data.complexidade && <Detail label="Complexidade" value={data.complexidade} />}
          {data.sentimento && <Detail label="Sentimento" value={data.sentimento} />}
          {data.resumo && <div className="md:col-span-2"><Detail label="Resumo" value={data.resumo} /></div>}
          {tags.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-secondary border border-border text-foreground">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button onClick={onNovo} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4" /> Abrir novo chamado
        </Button>
      </CardContent>
    </Card>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
    <p className="text-sm">{value}</p>
  </div>
);

export default Index;
