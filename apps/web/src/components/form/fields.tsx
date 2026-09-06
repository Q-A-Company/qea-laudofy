import { AsYouType } from "libphonenumber-js";
import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { PropertyFormInput } from "../../lib/propertySchema";

type FieldName = keyof PropertyFormInput;

function ErrorText({ name }: { name: FieldName }) {
  const {
    formState: { errors },
  } = useFormContext<PropertyFormInput>();
  const message = errors[name]?.message as string | undefined;
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";

export function TextField({
  name,
  label,
  placeholder,
  type = "text",
}: {
  name: FieldName;
  label: string;
  placeholder?: string;
  type?: "text" | "date";
}) {
  const { register } = useFormContext<PropertyFormInput>();
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        className={inputClass}
        placeholder={placeholder}
        {...register(name)}
      />
      <ErrorText name={name} />
    </div>
  );
}

export function NumberField({
  name,
  label,
  step,
}: {
  name: FieldName;
  label: string;
  step?: string;
}) {
  const { register } = useFormContext<PropertyFormInput>();
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        step={step ?? "1"}
        className={inputClass}
        {...register(name)}
      />
      <ErrorText name={name} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  rows = 4,
}: {
  name: FieldName;
  label: string;
  rows?: number;
}) {
  const { register } = useFormContext<PropertyFormInput>();
  return (
    <div>
      <Label>{label}</Label>
      <textarea rows={rows} className={inputClass} {...register(name)} />
      <ErrorText name={name} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  options,
  placeholder = "Selecione...",
}: {
  name: FieldName;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const { register } = useFormContext<PropertyFormInput>();
  return (
    <div>
      <Label>{label}</Label>
      <select className={inputClass} defaultValue="" {...register(name)}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ErrorText name={name} />
    </div>
  );
}

export function CheckboxField({
  name,
  label,
}: {
  name: FieldName;
  label: string;
}) {
  const { register } = useFormContext<PropertyFormInput>();
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" className="h-4 w-4" {...register(name)} />
      {label}
    </label>
  );
}

/** Grupo de checkboxes que mantém um array de strings no form state (ex: posicao, sol). */
export function CheckboxGroupField({
  name,
  label,
  options,
}: {
  name: FieldName;
  label: string;
  options: { value: string; label: string }[];
}) {
  const { control } = useFormContext<PropertyFormInput>();
  return (
    <div>
      <Label>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const value = (field.value as string[]) ?? [];
          function toggle(v: string) {
            if (value.includes(v)) {
              field.onChange(value.filter((x) => x !== v));
            } else {
              field.onChange([...value, v]);
            }
          }
          return (
            <div className="flex flex-wrap gap-3">
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={value.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          );
        }}
      />
      <ErrorText name={name} />
    </div>
  );
}

/** Telefone com formatação automática conforme o usuário digita: assume Brasil
 * por padrão, mas se adapta a qualquer país quando o número começa com "+"
 * (ex: "+1 555 123 4567"). Nunca bloqueia o envio - é só formatação, sem
 * validação de formato específico, porque números estrangeiros variam demais
 * pra valer a pena travar o campo. */
export function PhoneField({
  name,
  label,
}: {
  name: FieldName;
  label: string;
}) {
  const { control } = useFormContext<PropertyFormInput>();
  return (
    <div>
      <Label>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <input
            type="tel"
            className={inputClass}
            placeholder="(21) 99999-0000 ou +1 555 123 4567"
            value={(field.value as string) ?? ""}
            onChange={(e) => {
              const formatted = new AsYouType("BR").input(e.target.value);
              field.onChange(formatted);
            }}
            onBlur={field.onBlur}
          />
        )}
      />
      <ErrorText name={name} />
    </div>
  );
}

function formatCentsToBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Input monetário mascarado (dígitos preenchem da direita pra esquerda, com
 * centavos), no padrão "R$ 1.500.000,00". Guarda um número (reais) no form. */
export function CurrencyField({
  name,
  label,
}: {
  name: FieldName;
  label: string;
}) {
  const { control } = useFormContext<PropertyFormInput>();
  return (
    <div>
      <Label>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const numericValue =
            typeof field.value === "number" ? field.value : undefined;
          const cents = numericValue ? Math.round(numericValue * 100) : 0;
          const display = cents ? formatCentsToBRL(cents) : "";
          return (
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              placeholder="R$ 0,00"
              value={display ? `R$ ${display}` : ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const newCents = digits ? Number.parseInt(digits, 10) : 0;
                field.onChange(newCents ? newCents / 100 : undefined);
              }}
              onBlur={field.onBlur}
            />
          );
        }}
      />
      <ErrorText name={name} />
    </div>
  );
}

/** Checkbox de um mapa {chave: boolean} (ex: caracteristicasImovel). */
export function RecordCheckboxField({
  name,
  optionKey,
  label,
}: {
  name: FieldName;
  optionKey: string;
  label: string;
}) {
  const { control } = useFormContext<PropertyFormInput>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = (field.value as Record<string, boolean>) ?? {};
        return (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!value[optionKey]}
              onChange={(e) =>
                field.onChange({ ...value, [optionKey]: e.target.checked })
              }
            />
            {label}
          </label>
        );
      }}
    />
  );
}
