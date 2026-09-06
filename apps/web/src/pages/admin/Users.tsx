import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Badge, Button, Card, PageHeader } from "../../components/ui";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type AdminUser,
} from "../../lib/adminUsers";

const fieldClass =
  "rounded-lg border border-border bg-bg-inset px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent-500";

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "corretor">("corretor");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await createUser({ name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("corretor");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar usuário");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setRowError(null);
    try {
      await deleteUser(id);
      setConfirmingId(null);
      await refresh();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Falha ao excluir usuário");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Corretores" description="Gerencie as contas de corretores e administradores." />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold text-text">Novo usuário</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              required
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
            <input
              required
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
            <input
              required
              type="password"
              placeholder="Senha provisória"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "corretor")}
              className={fieldClass}
            >
              <option value="corretor">Corretor</option>
              <option value="admin">Administrador</option>
            </select>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" loading={creating} className="mt-1">
              {!creating && "Criar usuário"}
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-text">Usuários cadastrados</h2>
          {rowError && <p className="mb-3 text-sm text-danger">{rowError}</p>}
          {loading ? (
            <p className="text-sm text-text-muted">Carregando...</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {users.map((u) =>
                editingId === u.id ? (
                  <EditUserRow
                    key={u.id}
                    user={u}
                    busy={busyId === u.id}
                    onCancel={() => setEditingId(null)}
                    onSave={async (input) => {
                      setBusyId(u.id);
                      setRowError(null);
                      try {
                        await updateUser(u.id, input);
                        setEditingId(null);
                        await refresh();
                      } catch (err) {
                        setRowError(err instanceof Error ? err.message : "Falha ao editar usuário");
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  />
                ) : (
                  <li
                    key={u.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{u.name}</p>
                      <p className="truncate text-xs text-text-muted">{u.email}</p>
                    </div>

                    {confirmingId === u.id ? (
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-text-muted">Excluir?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id)}
                          disabled={busyId === u.id}
                          className="text-xs font-semibold text-danger hover:text-danger/80 disabled:opacity-50"
                        >
                          {busyId === u.id ? "Excluindo..." : "Confirmar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="text-xs text-text-muted hover:text-text"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge tone={u.role === "admin" ? "accent" : "neutral"}>
                          {u.role === "admin" ? "Administrador" : "Corretor"}
                        </Badge>
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => {
                            setRowError(null);
                            setEditingId(u.id);
                          }}
                          className="text-text-faint transition-colors hover:text-text"
                        >
                          <Pencil className="size-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          title="Excluir"
                          onClick={() => {
                            setRowError(null);
                            setConfirmingId(u.id);
                          }}
                          className="text-text-faint transition-colors hover:text-danger"
                        >
                          <Trash2 className="size-4" strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </li>
                ),
              )}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function EditUserRow({
  user,
  busy,
  onCancel,
  onSave,
}: {
  user: AdminUser;
  busy: boolean;
  onCancel: () => void;
  onSave: (input: { name: string; email: string; role: "admin" | "corretor" }) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<"admin" | "corretor">(user.role);

  return (
    <li className="rounded-lg border border-accent-500/40 bg-surface-raised p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={name} onChange={(e) => setName(e.target.value)} className={`${fieldClass} flex-1`} />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${fieldClass} flex-1`}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "corretor")}
          className={fieldClass}
        >
          <option value="corretor">Corretor</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" size="sm" loading={busy} onClick={() => onSave({ name, email, role })}>
          {!busy && "Salvar"}
        </Button>
      </div>
    </li>
  );
}
