import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrLogo } from "@/components/TrLogo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — TR Estratégia Empresarial" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard", replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode entrar.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground relative overflow-hidden"
           style={{ backgroundImage: "var(--gradient-primary)" }}>
        <div className="flex items-center gap-3">
          <TrLogo className="text-primary-foreground" />
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-5xl leading-tight">
            Estratégia, gestão e crescimento inteligente.
          </h1>
          <p className="mt-4 text-primary-foreground/80">
            Plataforma interna da TR Estratégia Empresarial para análise de PGDAS,
            geração automática de relatórios financeiros e acompanhamento mensal dos clientes.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© TR Estratégia Empresarial</p>
        <div aria-hidden className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full"
             style={{ backgroundImage: "var(--gradient-accent)", filter: "blur(80px)", opacity: 0.5 }} />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><TrLogo /></div>
          <h2 className="font-display text-3xl text-primary">
            {mode === "login" ? "Bem-vindo de volta" : "Criar acesso"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Entre para acessar seu painel." : "Cadastre um novo acesso interno."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email}
                     onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="mt-6 text-sm text-muted-foreground hover:text-foreground transition">
            {mode === "login" ? "Não tem acesso? Criar conta" : "Já tem conta? Entrar"}
          </button>

          <p className="mt-12 text-xs text-muted-foreground">
            <Link to="/login" className="hover:underline">Recuperar senha</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
