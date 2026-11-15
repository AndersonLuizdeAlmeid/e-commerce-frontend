"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert } from "@/shared/ui/form";
import { backofficeApi, backofficeKeys, type AdminUser, type UserFilters, type UserRole } from "../backoffice";
import { EmptyState, Notice, Pagination, ReasonDialog, formatShortDate, useNotice } from "./BackofficeUi";
import { PageHeader, StatusMark, adminButtonGhost, adminLink, cellInput } from "./ui";

type Change = { user: AdminUser; kind: "role" | "status" };

/** RF-054: buscar, ativar/desativar e promover/rebaixar. A própria conta fica sem ações (CA1). */
export function UsersPanel() {
  const client = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({ page: 1, role: null, isActive: null, search: "" });
  const [change, setChange] = useState<Change | null>(null);
  const [notice, setNotice] = useNotice();
  const users = useQuery({ queryKey: [...backofficeKeys.users, filters], queryFn: () => backofficeApi.users(filters), placeholderData: keepPreviousData });

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ ...filters, page: 1, search: String(new FormData(event.currentTarget).get("q") ?? "") });
  }

  const data = users.data;

  return (
    <>
      <PageHeader title="Usuários" description="Clientes e administradoras. Desativar ou mudar o perfil encerra as sessões da pessoa na hora." />
      {notice && <Notice>{notice}</Notice>}

      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-3">
        <form onSubmit={search} role="search" className="flex min-w-60 flex-1 items-end gap-2">
          <label htmlFor="busca-usuarios" className="sr-only">Buscar por nome ou e-mail</label>
          <input id="busca-usuarios" name="q" type="search" placeholder="Nome ou e-mail" className={`${cellInput} min-h-10 placeholder:text-tinta-suave`} />
          <button type="submit" className={adminButtonGhost}>Buscar</button>
        </form>
        <label className="text-xs font-medium uppercase tracking-[0.12em]">
          Perfil
          <select
            value={filters.role ?? ""}
            onChange={(e) => setFilters({ ...filters, page: 1, role: (e.target.value || null) as UserRole | null })}
            className={`${cellInput} mt-1 min-h-10 cursor-pointer normal-case tracking-normal`}
          >
            <option value="">Todos</option>
            <option value="Customer">Clientes</option>
            <option value="Admin">Administradoras</option>
          </select>
        </label>
        <label className="text-xs font-medium uppercase tracking-[0.12em]">
          Situação
          <select
            value={filters.isActive === null ? "" : String(filters.isActive)}
            onChange={(e) => setFilters({ ...filters, page: 1, isActive: e.target.value === "" ? null : e.target.value === "true" })}
            className={`${cellInput} mt-1 min-h-10 cursor-pointer normal-case tracking-normal`}
          >
            <option value="">Todas</option>
            <option value="true">Ativas</option>
            <option value="false">Desativadas</option>
          </select>
        </label>
      </div>

      {users.isPending && <p className="text-sm text-tinta-suave">Carregando…</p>}
      {users.isError && <FormAlert kind="error">{errorMessage(users.error)}</FormAlert>}
      {data && data.items.length === 0 && <EmptyState>Ninguém com esses filtros.</EmptyState>}

      {data && data.items.length > 0 && (
        <ul className={`border-t border-tinta/30 ${users.isFetching ? "opacity-70" : ""}`}>
          {data.items.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-linha py-3">
              <div className="min-w-0 flex-1 basis-64">
                <p className="truncate text-sm font-medium">
                  {user.name ?? user.email}
                  {user.isSelf && <span className="font-normal text-tinta-suave"> (você)</span>}
                </p>
                <p className="truncate text-xs text-tinta-suave">{user.email}</p>
              </div>
              <p className="w-36 text-sm">
                {user.role === "Admin" ? "Administradora" : "Cliente"}
                <span className="block text-xs text-tinta-suave">
                  {user.emailConfirmed ? "E-mail confirmado" : "E-mail não confirmado"}
                  {user.isLockedOut && " · bloqueada por senha"}
                </span>
              </p>
              <p className="w-40 text-sm">
                {user.orderCount === 0 ? (
                  <span className="text-tinta-suave">Nenhum pedido</span>
                ) : (
                  <Link href={`/admin/pedidos?busca=${encodeURIComponent(user.email)}`} className="underline">
                    {user.orderCount === 1 ? "1 pedido" : `${user.orderCount} pedidos`}
                  </Link>
                )}
                <span className="numeros block text-xs text-tinta-suave">desde {formatShortDate(user.createdAt)}</span>
              </p>
              <div className="w-28"><StatusMark active={user.isActive} on="Ativa" off="Desativada" /></div>
              <div className="flex w-full items-center gap-4 sm:w-auto">
                {user.isSelf ? (
                  <span className="text-xs text-tinta-suave">Outra administradora muda a sua conta.</span>
                ) : (
                  <>
                    <button type="button" className={adminLink} onClick={() => setChange({ user, kind: "role" })}>
                      {user.role === "Admin" ? "Tornar cliente" : "Tornar administradora"}
                    </button>
                    <button type="button" className={`${adminLink} ${user.isActive ? "text-alerta" : ""}`} onClick={() => setChange({ user, kind: "status" })}>
                      {user.isActive ? "Desativar" : "Reativar"}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={(page) => setFilters({ ...filters, page })} />}

      {change && (
        <ReasonDialog
          {...dialogText(change)}
          label=""
          withoutReason
          danger={change.kind === "status" && change.user.isActive}
          onConfirm={async () => {
            const updated =
              change.kind === "role"
                ? await backofficeApi.setUserRole(change.user.id, change.user.role === "Admin" ? "Customer" : "Admin")
                : await backofficeApi.setUserActive(change.user.id, !change.user.isActive);
            setNotice(`${updated.name ?? updated.email}: ${updated.role === "Admin" ? "administradora" : "cliente"}, ${updated.isActive ? "ativa" : "desativada"}.`);
            void client.invalidateQueries({ queryKey: backofficeKeys.users });
          }}
          onClose={() => setChange(null)}
        />
      )}
    </>
  );
}

function dialogText({ user, kind }: Change): { title: string; description: string; confirmLabel: string } {
  const who = user.name ?? user.email;
  if (kind === "role") {
    return user.role === "Admin"
      ? { title: `Tornar ${who} cliente?`, description: "O acesso ao painel cai na hora; para comprar, é só entrar de novo na loja.", confirmLabel: "Tornar cliente" }
      : {
          title: `Tornar ${who} administradora?`,
          description: "A conta passa a ver pedidos, clientes e o painel inteiro, e deixa de comprar. O acesso vale a partir do próximo login.",
          confirmLabel: "Tornar administradora",
        };
  }
  return user.isActive
    ? { title: `Desativar ${who}?`, description: "A conta não entra mais e as sessões abertas caem na hora. Os pedidos da conta continuam no painel.", confirmLabel: "Desativar" }
    : { title: `Reativar ${who}?`, description: "A conta volta a entrar com a mesma senha.", confirmLabel: "Reativar" };
}
