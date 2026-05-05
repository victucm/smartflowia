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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Send, Loader2, Bot, Hash, Tag, Flame, AlertTriangle, Lightbulb, MessageSquare,
  CircuitBoard, Building2, Mail, User as UserIcon, Sparkles, ShieldCheck, Cpu,
} from "lucide-react";
import TopNav from "@/components/TopNav";
import { addOcorrencia } from "@/lib/storage";

const formSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  empresa: z.string().trim().min(1, "Empresa é obrigatória").max(100),
  tipo_solicitacao: z.string().min(1, "Selecione o tipo"),
  descricao: z.string().trim().min(1, "Descrição é obrigatória").max(2000),
  urgencia: z.string().min(1, "Selecione a urgência"),
});
type FormData = z.infer<typeof formSchema>;

interface Resultado {
  protocolo?: string;
  categoria?: string;
  prioridade?: string;
  criticidade?: string;
  acao_recomendada?: string;
  mensagem?: string;
  setor?: string;
  status?: string;
}

const initialForm: FormData = {
  nome: "", email: "", empresa: "", tipo_solicitacao: "", descricao: "", urgencia: "",
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
      toast({ title: "Erro de validação", description: "Verifique os campos.", variant: "destructive" });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await fetch("https://hook.us2.make.com/q2vm1radsn93zaqmk3beuyi95icfjbxf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      const text = await response.text();
      let data: Resultado = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { mensagem: text }; }

      const res: Resultado = {
        protocolo: data.protocolo,
        categoria: data.categoria || data.setor,
        prioridade: data.prioridade,
        criticidade: data.criticidade,
        acao_recomendada: data.acao_recomendada,
        mensagem: data.mensagem,
        status: data.status || "Recebido",
      };
      setResultado(res);

      addOcorrencia({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        nome: form.nome,
        email: form.email,
        empresa: form.empresa,
        tipo_solicitacao: form.tipo_solicitacao,
        descricao: form.descricao,
        urgencia: form.urgencia,
        protocolo: res.protocolo || `SF-${Date.now().toString(36).toUpperCase()}`,
        categoria: res.categoria || form.tipo_solicitacao,
        prioridade: res.prioridade || form.urgencia,
        criticidade: res.criticidade || "—",
        acao_recomendada: res.acao_recomendada || "—",
        mensagem: res.mensagem || "Solicitação registrada.",
        status: res.status || "Recebido",
      });

      toast({ title: "Solicitação enviada com sucesso!", description: res.protocolo ? `Protocolo ${res.protocolo}` : undefined });
      setForm(initialForm);
    } catch (err) {
      toast({
        title: "Falha no envio",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onlyMessage = resultado && !resultado.protocolo && !resultado.categoria && !resultado.prioridade && !resultado.criticidade && !resultado.acao_recomendada && resultado.mensagem;

  return (
    <div className="min-h-screen">
      <TopNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/70 border border-border text-xs uppercase tracking-widest text-muted-foreground mb-5">
            <Cpu className="h-3 w-3 text-neon" /> Powered by AI
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3">
            SmartFlow <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">IA</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">
            Ecossistema Inteligente de Gestão de Solicitações
          </p>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl mx-auto">
            Registre seu chamado e receba uma análise automática com categoria, prioridade e ação recomendada pela nossa IA.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-16 grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <Card className="glass-card lg:col-span-3 rounded-2xl">
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
                <Field label="Nome" icon={UserIcon} error={errors.nome}>
                  <Input value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Seu nome" className="bg-input/60" />
                </Field>
                <Field label="E-mail" icon={Mail} error={errors.email}>
                  <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="seu@email.com" className="bg-input/60" />
                </Field>
                <Field label="Empresa" icon={Building2} error={errors.empresa}>
                  <Input value={form.empresa} onChange={(e) => handleChange("empresa", e.target.value)} placeholder="Nome da empresa" className="bg-input/60" />
                </Field>
                <Field label="Tipo de Solicitação" icon={Tag} error={errors.tipo_solicitacao}>
                  <Select value={form.tipo_solicitacao} onValueChange={(v) => handleChange("tipo_solicitacao", v)}>
                    <SelectTrigger className="bg-input/60"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Atendimento ao Cliente">Atendimento ao Cliente</SelectItem>
                      <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Descrição" icon={MessageSquare} error={errors.descricao}>
                <Textarea rows={4} value={form.descricao} onChange={(e) => handleChange("descricao", e.target.value)} placeholder="Descreva sua solicitação em detalhes..." className="bg-input/60 resize-none" />
              </Field>

              <div className="space-y-2.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" /> Urgência
                </Label>
                <RadioGroup value={form.urgencia} onValueChange={(v) => handleChange("urgencia", v)} className="grid grid-cols-3 gap-3">
                  {[
                    { v: "Baixa", active: "border-success bg-success/10 text-success", dot: "bg-success" },
                    { v: "Média", active: "border-warning bg-warning/10 text-warning", dot: "bg-warning" },
                    { v: "Alta", active: "border-destructive bg-destructive/10 text-destructive", dot: "bg-destructive" },
                  ].map((u) => (
                    <label
                      key={u.v}
                      htmlFor={`u-${u.v}`}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        form.urgencia === u.v
                          ? u.active
                          : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={u.v} id={`u-${u.v}`} className="sr-only" />
                      <span className={`h-2 w-2 rounded-full ${u.dot}`} />
                      <span className="text-sm font-medium">{u.v}</span>
                    </label>
                  ))}
                </RadioGroup>
                {errors.urgencia && <p className="text-xs text-destructive">{errors.urgencia}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:opacity-95 transition-all"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processando com IA...</>
                ) : (
                  <><Send className="h-4 w-4" /> Enviar Solicitação</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Response */}
        <Card className="glass-card lg:col-span-2 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-48 w-48 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
          <CardHeader className="border-b border-border/60 relative">
            <CardTitle className="flex items-center gap-2.5 text-lg">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${resultado ? "bg-success/10 border-success/40" : "bg-primary/10 border-primary/30"}`}>
                <Bot className={`h-4.5 w-4.5 ${resultado ? "text-success" : "text-neon"}`} />
              </div>
              Resposta da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 relative">
            {!resultado && !loading && (
              <div className="text-center py-12">
                <div className="inline-flex h-16 w-16 rounded-2xl bg-secondary/60 border border-border items-center justify-center mb-4">
                  <Sparkles className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aguardando solicitação.<br />A IA analisará e classificará seu chamado em segundos.
                </p>
              </div>
            )}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/10 border border-primary/40 items-center justify-center mb-4 animate-pulse-glow">
                  <Bot className="h-7 w-7 text-neon" />
                </div>
                <p className="text-sm text-muted-foreground">Processando análise inteligente...</p>
              </div>
            )}
            {resultado && !loading && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {onlyMessage ? (
                  <ResField icon={MessageSquare} label="Mensagem" value={resultado.mensagem!} mono={false} />
                ) : (
                  <>
                    {resultado.protocolo && <ResField icon={Hash} label="Protocolo" value={resultado.protocolo} mono />}
                    {resultado.categoria && <ResField icon={Tag} label="Categoria" value={resultado.categoria} />}
                    {resultado.prioridade && <ResField icon={Flame} label="Prioridade" value={resultado.prioridade} badge />}
                    {resultado.criticidade && <ResField icon={AlertTriangle} label="Criticidade" value={resultado.criticidade} badge />}
                    {resultado.acao_recomendada && <ResField icon={Lightbulb} label="Ação Recomendada" value={resultado.acao_recomendada} />}
                    {resultado.mensagem && <ResField icon={MessageSquare} label="Mensagem" value={resultado.mensagem} />}
                  </>
                )}
                <div className="flex items-center gap-2 pt-2 text-xs text-success">
                  <ShieldCheck className="h-3.5 w-3.5" /> Solicitação processada e armazenada
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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

const ResField = ({ icon: Icon, label, value, mono, badge }: { icon: any; label: string; value: string; mono?: boolean; badge?: boolean }) => (
  <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
      <Icon className="h-3 w-3" /> {label}
    </div>
    {badge ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/40 text-neon text-sm font-semibold">
        {value}
      </span>
    ) : (
      <p className={`text-sm text-foreground ${mono ? "font-mono text-neon" : ""}`}>{value}</p>
    )}
  </div>
);

export default Index;
