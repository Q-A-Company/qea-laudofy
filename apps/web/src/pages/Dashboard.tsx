import type { Database } from "@qea-laudofy/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

type Property = Database["public"]["Tables"]["properties"]["Row"];

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProperties(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">QEA Laudofy</h1>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>
            {profile?.name} <span className="text-slate-400">·</span>{" "}
            {profile?.role === "admin" ? "Administrador" : "Corretor"}
          </span>
          {profile?.role === "admin" && (
            <Link to="/admin/users" className="hover:underline">
              Corretores
            </Link>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Imóveis</h2>
          <Link
            to="/properties/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Novo imóvel
          </Link>
        </div>

        {loading && <p className="text-slate-500">Carregando...</p>}

        {!loading && properties.length === 0 && (
          <p className="text-slate-500">Nenhum imóvel cadastrado ainda.</p>
        )}

        <ul className="flex flex-col gap-2">
          {properties.map((p) => (
            <li key={p.id}>
              <Link
                to={`/properties/${p.id}`}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
              >
                <p className="text-sm font-medium text-slate-900">
                  {p.endereco || "(sem endereço)"}
                </p>
                <p className="text-xs text-slate-500">
                  {p.status} ·{" "}
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
