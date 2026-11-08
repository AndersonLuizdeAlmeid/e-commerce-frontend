"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/shared/api/client";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert, primaryButtonClass } from "@/shared/ui/form";
import { emptyAddressFields, formatAddressLine, formatAddressPlace, toAddressRequest, type AddressFields } from "../address-fields";
import { addressesApi, type Address } from "../api";
import { AddressForm } from "./AddressForm";

/** Igual ao limite da API (AddressBook.MaxAddresses). */
const MAX_ADDRESSES = 10;

type Editing = { kind: "none" } | { kind: "new" } | { kind: "edit"; address: Address };

function toFields(address: Address): AddressFields {
  return {
    recipient: address.recipient,
    postalCode: address.postalCode,
    street: address.street,
    number: address.number,
    complement: address.complement ?? "",
    district: address.district,
    city: address.city,
    state: address.state,
  };
}

/** Caderno de endereços em /conta/enderecos (RF-007). */
export function AddressBook() {
  const { status } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const [notice, setNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=/conta/enderecos");
    }
  }, [status, router]);

  const reload = useCallback(async () => setAddresses(await addressesApi.list()), []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    let active = true;
    addressesApi
      .list()
      .then((loaded) => active && setAddresses(loaded))
      .catch((err: unknown) => {
        if (active) {
          setLoadError(
            err instanceof ApiError && err.status === 403
              ? "Esta é uma conta de administrador, que não faz compras pela loja."
              : errorMessage(err, "Não foi possível carregar seus endereços."),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [status]);

  if (status !== "authenticated" || (!addresses && !loadError)) {
    return <p className="text-tinta-suave">Carregando seus endereços…</p>;
  }

  if (loadError || !addresses) {
    return <FormAlert kind="info">{loadError}</FormAlert>;
  }

  if (editing.kind !== "none") {
    const isNew = editing.kind === "new";
    return (
      <section aria-labelledby="form-endereco">
        <h2 id="form-endereco" className="font-display text-2xl leading-tight">
          {isNew ? "Novo endereço" : "Editar endereço"}
        </h2>
        <div className="mt-6">
          <AddressForm
            initial={isNew ? emptyAddressFields : toFields(editing.address)}
            submitLabel={isNew ? "Guardar endereço" : "Salvar alterações"}
            showDefaultOption={isNew && addresses.length > 0}
            onCancel={() => setEditing({ kind: "none" })}
            onSubmit={async (fields, isDefault) => {
              if (isNew) {
                await addressesApi.create(toAddressRequest(fields, isDefault));
              } else {
                await addressesApi.update(editing.address.id, toAddressRequest(fields));
              }
              await reload();
              setEditing({ kind: "none" });
              setNotice({ kind: "success", text: isNew ? "Endereço guardado." : "Endereço atualizado." });
            }}
          />
        </div>
      </section>
    );
  }

  async function act(action: () => Promise<void>, success: string) {
    setNotice(null);
    try {
      await action();
      await reload();
      setNotice({ kind: "success", text: success });
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      {notice && <FormAlert kind={notice.kind}>{notice.text}</FormAlert>}

      {addresses.length === 0 ? (
        <p className="text-tinta-suave">Você ainda não guardou nenhum endereço. Ele fica pronto para a próxima compra.</p>
      ) : (
        <ul className="divide-y divide-linha border-y border-linha">
          {addresses.map((address) => (
            <AddressItem
              key={address.id}
              address={address}
              onEdit={() => {
                setNotice(null);
                setEditing({ kind: "edit", address });
              }}
              onMakeDefault={() => act(() => addressesApi.setDefault(address.id), "Endereço padrão alterado.")}
              onRemove={() => act(() => addressesApi.remove(address.id), "Endereço apagado.")}
            />
          ))}
        </ul>
      )}

      {addresses.length < MAX_ADDRESSES ? (
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setEditing({ kind: "new" });
          }}
          className={primaryButtonClass}
        >
          Novo endereço
        </button>
      ) : (
        <p className="text-sm text-tinta-suave">Você chegou a {MAX_ADDRESSES} endereços. Apague um para incluir outro.</p>
      )}
    </div>
  );
}

function AddressItem({
  address,
  onEdit,
  onMakeDefault,
  onRemove,
}: {
  address: Address;
  onEdit: () => void;
  onMakeDefault: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const action = "inline-flex min-h-11 items-center text-sm font-medium underline hover:text-tinta-suave disabled:opacity-60";

  async function run(work: () => Promise<void>) {
    setBusy(true);
    try {
      await work();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <li className="py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">{address.recipient}</p>
          <p className="mt-1 text-sm">{formatAddressLine({ ...address, complement: address.complement ?? "" })}</p>
          <p className="text-sm text-tinta-suave">{formatAddressPlace(address)}</p>
        </div>
        {address.isDefault && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em]">
            <span aria-hidden="true" className="size-2 rounded-full bg-folha" />
            Padrão
          </span>
        )}
      </div>

      {confirming ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-5" role="group" aria-label="Confirmar exclusão">
          <span className="text-sm">Apagar este endereço?</span>
          <button type="button" disabled={busy} onClick={() => run(onRemove)} className={action}>
            Sim, apagar
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={action}>
            Não
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-x-5">
          <button type="button" disabled={busy} onClick={onEdit} className={action}>
            Editar
          </button>
          {!address.isDefault && (
            <button type="button" disabled={busy} onClick={() => run(onMakeDefault)} className={action}>
              Tornar padrão
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => setConfirming(true)} className={action}>
            Apagar
          </button>
        </div>
      )}
    </li>
  );
}
