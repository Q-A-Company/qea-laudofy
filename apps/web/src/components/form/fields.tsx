import { ChevronDown } from "lucide-react";
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
  return <p className="mt-1.5 text-xs text-danger">{message}</p>;
}

function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-medium text-text-muted">{children}</label>;
}

export const inputClass =
  "w-full rounded-lg border border-border bg-bg-inset px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent-500";

const selectClass = `${inputClass} appearance-none pr-9`;

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
      <input type={type} className={inputClass} placeholder={placeholder} {...register(name)} />
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
      <input type="number" step={step ?? "1"} className={inputClass} {...register(name)} />
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
      <textarea rows={rows} className={`${inputClass} resize-y`} {...register(name)} />
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
      <div className="relative">
        <select className={selectClass} defaultValue="" {...register(name)}>
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-faint"
          strokeWidth={2}
        />
      </div>
      <ErrorText name={name} />
    </div>
  );
}

export function CheckboxField({ name, label }: { name: FieldName; label: string }) {
  const { register } = useFormContext<PropertyFormInput>();
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
      <input
        type="checkbox"
        className="size-4 accent-accent-500"
        {...register(name)}
      />
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
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {options.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    className="size-4 accent-accent-500"
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
export function PhoneField({ name, label }: { name: FieldName; label: string }) {
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
export function CurrencyField({ name, label }: { name: FieldName; label: string }) {
  const { control } = useFormContext<PropertyFormInput>();
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-faint">
          R$
        </span>
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const numericValue = typeof field.value === "number" ? field.value : undefined;
            const cents = numericValue ? Math.round(numericValue * 100) : 0;
            const display = cents ? formatCentsToBRL(cents) : "";
            return (
              <input
                type="text"
                inputMode="numeric"
                className={`${inputClass} pl-9`}
                placeholder="0,00"
                value={display}
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
      </div>
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
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
            <input
              type="checkbox"
              className="size-4 accent-accent-500"
              checked={!!value[optionKey]}
              onChange={(e) => field.onChange({ ...value, [optionKey]: e.target.checked })}
            />
            {label}
          </label>
        );
      }}
    />
  );
}
