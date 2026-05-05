import { Link, useLocation } from "react-router-dom";
import { Activity, LayoutDashboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TopNav = () => {
  const { pathname } = useLocation();
  const links = [
    { to: "/", label: "Solicitações", icon: Activity },
    { to: "/admin", label: "Painel Admin", icon: LayoutDashboard },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-bold tracking-tight text-foreground">SmartFlow <span className="text-neon">IA</span></p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Intelligent Hub</p>
          </div>
        </Link>

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
      </div>
    </nav>
  );
};

export default TopNav;
