import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe a senha"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (!authLoading && session) {
    const from = (location.state as { from?: string })?.from ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setServerError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
      );
      return;
    }
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.15] blur-[120px]"
        style={{ background: "radial-gradient(circle, #7c82f5, transparent 70%)" }}
      />

      <div className="relative w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold tracking-tight text-text">Q&amp;A Laudofy</p>
          <p className="mt-1 text-sm text-text-faint">Uma solução da Q&amp;A Company</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-7 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
          <h1 className="text-[15px] font-semibold text-text">Entrar</h1>
          <p className="mt-1 text-sm text-text-muted">
            Acesse com o e-mail e a senha cadastrados pela sua imobiliária.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-text-muted">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                className="w-full rounded-lg border border-border bg-bg-inset px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent-500"
                {...register("email")}
              />
              {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-text-muted">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-border bg-bg-inset px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent-500"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[13px] text-danger">
                {serverError}
              </p>
            )}

            <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
              {!isSubmitting && (
                <>
                  Entrar
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
