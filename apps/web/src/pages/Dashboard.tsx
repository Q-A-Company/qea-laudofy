import type { Database } from "@qea-laudofy/shared";
import { Building2, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { Badge, buttonClasses, Card, EmptyState, PageHeader, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import {
  PROPERTY_STATUS_LABEL,
  PROPERTY_STATUS_OPTIONS,
  PROPERTY_STATUS_TONE,
  type PropertyStatus,
} from "../lib/propertyStatus";
import { supabase } from "../lib/supabaseClient";

type Property = Database["public"]["Tables"]["properties"]["Row"];

const FILTER_ALL = "todos" as const;
type StatusFilter = typeof FILTER_ALL | PropertyStatus;

function saudacaoPorHorario(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function Dashboard() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>(FILTER_ALL);

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

  const filtered = useMemo(
    () => (filter === FILTER_ALL ? properties : properties.filter((p) => p.status === filter)),
    [properties, filter],
  );

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>([[FILTER_ALL, properties.length]]);
    for (const status of PROPERTY_STATUS_OPTIONS) {
      map.set(status, properties.filter((p) => p.status === status).length);
    }
    return map;
  }, [properties]);

  return (
    <AppShell>
      <PageHeader
        title="Imóveis"
        description={`${saudacaoPorHorario()}, ${
          profile?.name?.split(" ")[0] ?? ""
        }! Seja bem-vindo(a) à Q&A Laudofy.`}
        actions={
          <Link to="/properties/new" className={buttonClasses()}>
            <Plus className="size-4" strokeWidth={2.25} />
            Novo imóvel
          </Link>
        }
      />

      {!loading && properties.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {[FILTER_ALL, ...PROPERTY_STATUS_OPTIONS].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-accent-500 text-[#0a0a0f]"
                  : "border border-border text-text-muted hover:bg-surface-raised hover:text-text"
              }`}
            >
              {key === FILTER_ALL ? "Todos" : PROPERTY_STATUS_LABEL[key]} ({counts.get(key) ?? 0})
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!loading && properties.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Nenhum imóvel cadastrado ainda"
          description="Comece cadastrando o primeiro imóvel da carteira."
          action={
            <Link to="/properties/new" className={buttonClasses("secondary", "sm")}>
              <Plus className="size-4" strokeWidth={2.25} />
              Novo imóvel
            </Link>
          }
        />
      )}

      {!loading && properties.length > 0 && filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-text-muted">
          Nenhum imóvel com esse status.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((p) => (
          <Link key={p.id} to={`/properties/${p.id}`}>
            <Card className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:border-border-strong hover:bg-surface-hover">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {p.endereco || "(sem endereço)"}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  Cadastrado em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge tone={PROPERTY_STATUS_TONE[p.status]}>{PROPERTY_STATUS_LABEL[p.status]}</Badge>
                <ChevronRight className="size-4 text-text-faint" strokeWidth={2} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
