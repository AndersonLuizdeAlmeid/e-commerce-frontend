"use client";

import { useRef, useState } from "react";
import { maskPostalCode } from "@/features/shipping/api";
import { ApiError } from "@/shared/api/client";
import { errorMessage, fieldErrors } from "@/shared/api/problem";
import { FormAlert, SelectField, SubmitButton, TextField } from "@/shared/ui/form";
import { BRAZILIAN_STATES, type AddressFields, validateAddress } from "../address-fields";
import { addressesApi } from "../api";

type Errors = Partial<Record<keyof AddressFields | "form", string>>;

interface AddressFormProps {
  initial: AddressFields;
  submitLabel: string;
  /** Mostra "Usar como endereço padrão"; quem guarda o primeiro endereço não precisa ver: ele já nasce padrão. */
  showDefaultOption?: boolean;
  onSubmit: (fields: AddressFields, isDefault: boolean) => Promise<void>;
  onCancel?: () => void;
}

/**
 * Formulário de endereço (RF-007), da conta e do checkout. O CEP preenche rua, bairro, cidade e UF pelo ViaCEP (CA2);
 * se a consulta falhar, o cliente segue à mão: salvar não depende dela.
 */
export function AddressForm({ initial, submitLabel, showDefaultOption = false, onSubmit, onCancel }: AddressFormProps) {
  const [fields, setFields] = useState<AddressFields>({ ...initial, postalCode: maskPostalCode(initial.postalCode) });
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [lookup, setLookup] = useState<{ state: "idle" | "pending" | "unavailable" }>({ state: "idle" });
  const [pending, setPending] = useState(false);
  const lastLookup = useRef(initial.postalCode.replace(/\D/g, ""));
  const numberRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof AddressFields>(key: K, value: AddressFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function onPostalCodeChange(value: string) {
    const masked = maskPostalCode(value);
    set("postalCode", masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8 || digits === lastLookup.current) {
      return;
    }

    lastLookup.current = digits;
    setLookup({ state: "pending" });
    try {
      const found = await addressesApi.lookupPostalCode(digits);
      if (lastLookup.current !== digits) {
        return;
      }
      setFields((current) => ({
        ...current,
        street: found.street || current.street,
        district: found.district || current.district,
        city: found.city,
        state: found.state,
      }));
      setErrors((current) => ({ ...current, street: undefined, district: undefined, city: undefined, state: undefined }));
      setLookup({ state: "idle" });
      // CEP de cidade pequena vem sem rua: o cursor vai para onde falta.
      if (found.street) {
        numberRef.current?.focus();
      }
    } catch (err) {
      if (lastLookup.current !== digits) {
        return;
      }
      if (err instanceof ApiError && err.status === 404) {
        setErrors((current) => ({ ...current, postalCode: "Não encontramos este CEP. Confira os números." }));
        setLookup({ state: "idle" });
      } else {
        setLookup({ state: "unavailable" });
      }
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateAddress(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setPending(true);
    try {
      await onSubmit(fields, isDefault);
    } catch (err) {
      setErrors({ ...fieldErrors(err), form: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {errors.form && <FormAlert kind="error">{errors.form}</FormAlert>}

      <TextField
        label="Quem vai receber"
        name="recipient"
        autoComplete="shipping name"
        value={fields.recipient}
        onChange={(event) => set("recipient", event.target.value)}
        error={errors.recipient}
      />

      <TextField
        label="CEP"
        name="postalCode"
        inputMode="numeric"
        autoComplete="shipping postal-code"
        value={fields.postalCode}
        onChange={(event) => void onPostalCodeChange(event.target.value)}
        hint={lookup.state === "pending" ? "Buscando o endereço…" : undefined}
        error={errors.postalCode}
        className="max-w-48"
      />
      {lookup.state === "unavailable" && (
        <p role="status" className="text-sm text-tinta-suave">
          Não conseguimos buscar o endereço agora. Preencha os campos abaixo.
        </p>
      )}

      <TextField
        label="Rua"
        name="street"
        autoComplete="shipping address-line1"
        value={fields.street}
        onChange={(event) => set("street", event.target.value)}
        error={errors.street}
      />

      <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-4 gap-y-5">
        <TextField
          ref={numberRef}
          label="Número"
          name="number"
          autoComplete="off"
          value={fields.number}
          onChange={(event) => set("number", event.target.value)}
          error={errors.number}
        />
        <TextField
          label="Complemento"
          name="complement"
          autoComplete="shipping address-line2"
          value={fields.complement}
          onChange={(event) => set("complement", event.target.value)}
          hint="Opcional"
          error={errors.complement}
        />
      </div>

      <TextField
        label="Bairro"
        name="district"
        autoComplete="shipping address-level3"
        value={fields.district}
        onChange={(event) => set("district", event.target.value)}
        error={errors.district}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,6rem)] gap-x-4 gap-y-5">
        <TextField
          label="Cidade"
          name="city"
          autoComplete="shipping address-level2"
          value={fields.city}
          onChange={(event) => set("city", event.target.value)}
          error={errors.city}
        />
        <SelectField
          label="UF"
          name="state"
          autoComplete="shipping address-level1"
          value={fields.state}
          onChange={(event) => set("state", event.target.value)}
          error={errors.state}
        >
          <option value="">—</option>
          {BRAZILIAN_STATES.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </SelectField>
      </div>

      {showDefaultOption && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} className="size-4" />
          Usar como endereço padrão
        </label>
      )}

      <div className="space-y-3">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 w-full items-center justify-center text-sm font-medium text-tinta-suave underline hover:text-tinta"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
