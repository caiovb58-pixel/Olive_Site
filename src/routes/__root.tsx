import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Salad, TrendingUp, Settings, Leaf, Search, Plus, Loader2,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NewPatientProvider, useNewPatient } from "@/contexts/NewPatientContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NewPatientModal } from "@/components/NewPatientModal";
import { ProfileMenu } from "@/components/ProfileMenu";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">Página não encontrada</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Voltar</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Tentar novamente</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Olive Diet — Plataforma para Nutricionistas" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/plano-alimentar", label: "Plano Alimentar", icon: Salad },
  { to: "/evolucao", label: "Evolução", icon: TrendingUp },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
          <Leaf className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display text-base font-bold tracking-tight">Olive Diet</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Healthtech</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-md)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "" : "text-muted-foreground group-hover:text-accent-foreground"}`} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function Topbar() {
  const { open } = useNewPatient();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Buscar pacientes, alimentos..."
          className="h-10 w-full rounded-xl border border-border bg-secondary/50 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-background"
        />
      </div>
      <button
        onClick={open}
        className="hidden md:inline-flex h-10 items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] hover:opacity-95 transition-opacity"
      >
        <Plus className="h-4 w-4" />
        Nova consulta
      </button>
      <ProfileMenu />
    </header>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[image:var(--gradient-soft)]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
          <Leaf className="h-7 w-7 text-white" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    </div>
  );
}

function AppLayout() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NewPatientProvider>
          <div className="min-h-screen bg-[image:var(--gradient-soft)]">
            <Sidebar />
            <div className="md:pl-64">
              <Topbar />
              <main className="px-6 py-8 lg:px-10">
                <Outlet />
              </main>
            </div>
          </div>
          <NewPatientModal />
        </NewPatientProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") navigate({ to: "/login" });
    if (user && pathname === "/login") navigate({ to: "/" });
  }, [loading, user, pathname, navigate]);

  if (loading) return <LoadingScreen />;

  if (pathname === "/login") {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  if (!user) return <LoadingScreen />;

  return <AppLayout />;
}
