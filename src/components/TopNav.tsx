import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, LayoutDashboard, Lock, LogOut, Moon, Shield, Sparkles, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdminAuthed, loginAdmin, logoutAdmin } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const TopNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(isAdminAuthed());

  const links = [{ to: "/", label: "Solicitações", icon: Activity }];
  if (authed) links.push({ to: "/admin", label: "Painel de Ocorrências", icon: LayoutDashboard });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(user, pass)) {
      setAuthed(true);
      setOpen(false);
      setUser(""); setPass(""); setError("");
      navigate("/admin");
    } else {
      setError("Usuário ou senha inválidos.");
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setAuthed(false);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-bold tracking-tight text-foreground">SmartFlow <span className="text-neon">IA</span></p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:block">Intelligent Hub</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/60 border border-border">
            {links.map((l) => {
              const active = pathname === l.to;
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              );
            })}
          </div>

          {authed ? (
            <Button onClick={handleLogout} variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          ) : (
            <Button onClick={() => setOpen(true)} size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Login Admin</span>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-border max-w-sm">
          <DialogHeader>
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 border border-primary/40 flex items-center justify-center mb-2 animate-pulse-glow">
              <Shield className="h-6 w-6 text-neon" />
            </div>
            <DialogTitle className="text-center">Acesso Administrativo</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Informe suas credenciais para acessar o Painel de Ocorrências.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Usuário</Label>
              <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" className="bg-input/60" autoFocus />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Senha</Label>
              <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" className="bg-input/60" />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center bg-destructive/10 border border-destructive/30 rounded-lg py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">
              Entrar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default TopNav;
