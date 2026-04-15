import { useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send, CheckCircle2, Clock, Building2, Zap } from "lucide-react";

const formSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  empresa: z.string().trim().min(1, "Empresa é obrigatória").max(100),
  tipo_solicitacao: z.string().min(1, "Selecione o tipo de solicitação"),
  descricao: z.string().trim().min(1, "Descrição é obrigatória").max(2000),
  urgencia: z.string().min(1, "Selecione a urgência"),
});

type FormData = z.infer<typeof formSchema>;

interface Resultado {
  protocolo: string;
  setor: string;
  status: string;
  mensagem: string;
}

const initialForm: FormData = {
  nome: "",
  email: "",
  empresa: "",
  tipo_solicitacao: "",
  descricao: "",
  urgencia: "",
};

const Index = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = formSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast({ title: "Erro de validação", description: "Corrija os campos destacados.", variant: "destructive" });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch("https://hook.us2.make.com/q2vm1radsn93zaqmk3beuyi95icfjbxf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          empresa: form.empresa,
          tipo_solicitacao: form.tipo_solicitacao,
          descricao: form.descricao,
          urgencia: form.urgencia,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      const data = await response.json();

      setResultado({
        protocolo: data.protocolo || "N/A",
        setor: data.setor || "N/A",
        status: data.status || "Recebido",
        mensagem: data.mensagem || "Solicitação registrada com sucesso.",
      });

      toast({ title: "Solicitação enviada!", description: `Protocolo: ${data.protocolo || "Gerado"}` });
      setForm(initialForm);
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: error instanceof Error ? error.message : "Não foi possível enviar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full py-8 px-4 text-primary-foreground" style={{ background: "var(--gradient-header)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Zap className="h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">SmartFlow IA</h1>
          </div>
          <p className="text-lg md:text-xl font-medium opacity-90">
            Central Inteligente de Solicitações Empresariais
          </p>
          <p className="mt-3 text-sm md:text-base opacity-80 max-w-2xl mx-auto">
            Preencha o formulário abaixo para registrar sua solicitação. Após o envio, o sistema processará
            automaticamente os dados e retornará um protocolo de acompanhamento.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Nova Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome completo"
                    value={form.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    className={errors.nome ? "border-destructive" : ""}
                  />
                  {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa *</Label>
                  <Input
                    id="empresa"
                    placeholder="Nome da empresa"
                    value={form.empresa}
                    onChange={(e) => handleChange("empresa", e.target.value)}
                    className={errors.empresa ? "border-destructive" : ""}
                  />
                  {errors.empresa && <p className="text-sm text-destructive">{errors.empresa}</p>}
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <Label>Tipo de Solicitação *</Label>
                  <Select value={form.tipo_solicitacao} onValueChange={(v) => handleChange("tipo_solicitacao", v)}>
                    <SelectTrigger className={errors.tipo_solicitacao ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Atendimento ao Cliente">Atendimento ao Cliente</SelectItem>
                      <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipo_solicitacao && <p className="text-sm text-destructive">{errors.tipo_solicitacao}</p>}
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva sua solicitação em detalhes..."
                  rows={4}
                  value={form.descricao}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  className={errors.descricao ? "border-destructive" : ""}
                />
                {errors.descricao && <p className="text-sm text-destructive">{errors.descricao}</p>}
              </div>

              {/* Urgência */}
              <div className="space-y-3">
                <Label>Urgência *</Label>
                <RadioGroup
                  value={form.urgencia}
                  onValueChange={(v) => handleChange("urgencia", v)}
                  className="flex gap-6"
                >
                  {["Baixa", "Média", "Alta"].map((u) => (
                    <div key={u} className="flex items-center gap-2">
                      <RadioGroupItem value={u} id={`urgencia-${u}`} />
                      <Label htmlFor={`urgencia-${u}`} className="cursor-pointer font-normal">
                        {u}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.urgencia && <p className="text-sm text-destructive">{errors.urgencia}</p>}
              </div>

              <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" /> Processando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" /> Enviar Solicitação
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className={resultado ? "border-success/50" : "border-dashed"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className={`h-5 w-5 ${resultado ? "text-success" : "text-muted-foreground"}`} />
              Resultado da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Protocolo</p>
                  <p className="font-semibold font-mono text-primary">{resultado.protocolo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Setor</p>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{resultado.setor}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {resultado.status}
                  </span>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Mensagem</p>
                  <p className="text-sm">{resultado.mensagem}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-6">
                Nenhuma solicitação processada ainda. Preencha o formulário acima e clique em "Enviar Solicitação".
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} SmartFlow IA — Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Index;
