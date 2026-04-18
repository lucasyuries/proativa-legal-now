// ============================================================================
// Layout pathless `_authenticated` — protege rotas filhas exigindo login.
// Não há prefixo de URL. Qualquer rota em src/routes/_authenticated/* fica
// protegida automaticamente.
// ============================================================================

import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/integrations/supabase/auth-context";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!loading && !user) {
      // Evita redirect-loop: se a "rota atual" já é uma página pública de auth,
      // não acumula `?redirect=` em cima de si mesma.
      const path = location.pathname;
      const isAuthRoute =
        path === "/login" || path === "/cadastro" || path.startsWith("/esqueci-senha") || path.startsWith("/reset-password");
      const safeRedirect = isAuthRoute ? "/" : location.href;
      navigate({
        to: "/login",
        search: { redirect: safeRedirect },
        replace: true,
      });
    }
  }, [loading, user, navigate, location.href, location.pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Outlet />;
}
