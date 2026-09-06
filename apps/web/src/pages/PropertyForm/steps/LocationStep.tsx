import {
  BAIRRO_LABELS,
  BAIRRO_OPTIONS,
  PLANTA_TIPO_LABELS,
  PLANTA_TIPO_OPTIONS,
  POSICAO_LABELS,
  POSICAO_OPTIONS,
  SOL_LABELS,
  SOL_OPTIONS,
} from "@qea-laudofy/shared";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  CheckboxField,
  CheckboxGroupField,
  SelectField,
  TextField,
} from "../../../components/form/fields";
import {
  CATEGORIA_LABELS,
  CATEGORIA_OPTIONS,
} from "../../../lib/propertySchema";
import type { PropertyFormInput } from "../../../lib/propertySchema";

const TIPO_COMERCIAL_OPTIONS = [
  { value: "comercial", label: "Comercial" },
  { value: "loja", label: "Loja" },
  { value: "sala", label: "Sala" },
];

const KNOWN_BAIRROS: Record<string, "barra_da_tijuca" | "recreio"> = {
  "barra da tijuca": "barra_da_tijuca",
  "recreio dos bandeirantes": "recreio",
  recreio: "recreio",
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export function LocationStep() {
  const { control, setValue, getValues } = useFormContext<PropertyFormInput>();
  const categoria = useWatch({ control, name: "categoria" });
  const bairro = useWatch({ control, name: "bairro" });
  // register() entrega string durante a digitação; a validação/conversão real
  // do zod só roda no submit.
  const cep = useWatch({ control, name: "cep" }) as string | undefined;
  const [cepStatus, setCepStatus] = useState<
    "idle" | "buscando" | "encontrado" | "nao_encontrado" | "erro"
  >("idle");

  useEffect(() => {
    const digits = (cep ?? "").replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepStatus("idle");
      return;
    }

    let cancelled = false;
    setCepStatus("buscando");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data: ViaCepResponse = await res.json();
        if (cancelled) return;

        if (data.erro) {
          setCepStatus("nao_encontrado");
          return;
        }

        if (!getValues("endereco") && data.logradouro) {
          setValue("endereco", data.logradouro);
        }
        const normalizado = (data.bairro ?? "").trim().toLowerCase();
        const bairroConhecido = KNOWN_BAIRROS[normalizado];
        if (bairroConhecido) {
          setValue("bairro", bairroConhecido);
        } else if (data.bairro) {
          setValue("bairro", "outros");
          setValue("bairroOutro", data.bairro);
        }
        setCepStatus("encontrado");
      } catch {
        if (!cancelled) setCepStatus("erro");
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cep, setValue, getValues]);

  return (
    <div className="flex flex-col gap-4">
      <CheckboxField name="cantoDePedra" label="Canto de pedra" />

      <SelectField
        name="categoria"
        label="Tipo do imóvel"
        options={CATEGORIA_OPTIONS.map((c) => ({
          value: c,
          label: CATEGORIA_LABELS[c],
        }))}
      />

      {categoria === "comercial" && (
        <CheckboxGroupField
          name="tipoComercialSubtipos"
          label="Selecione um ou mais"
          options={TIPO_COMERCIAL_OPTIONS}
        />
      )}

      <SelectField
        name="plantaTipo"
        label="Tipo de planta (opcional)"
        options={PLANTA_TIPO_OPTIONS.map((v) => ({
          value: v,
          label: PLANTA_TIPO_LABELS[v],
        }))}
      />

      <div>
        <TextField name="cep" label="CEP" placeholder="22640-100" />
        {cepStatus === "buscando" && (
          <p className="mt-1 text-xs text-text-faint">Buscando endereço...</p>
        )}
        {cepStatus === "nao_encontrado" && (
          <p className="mt-1 text-xs text-warning">CEP não encontrado.</p>
        )}
        {cepStatus === "erro" && (
          <p className="mt-1 text-xs text-warning">
            Não foi possível consultar o CEP agora. Preencha manualmente.
          </p>
        )}
      </div>

      <SelectField
        name="bairro"
        label="Bairro"
        options={BAIRRO_OPTIONS.map((v) => ({
          value: v,
          label: BAIRRO_LABELS[v],
        }))}
      />
      {bairro === "outros" && (
        <TextField name="bairroOutro" label="Qual bairro?" />
      )}

      <TextField name="endereco" label="Endereço" />
      <TextField name="localizacao" label="Localização" />
      <div className="grid grid-cols-2 gap-4">
        <TextField name="condominioNome" label="Condomínio" />
        <TextField name="edificio" label="Edifício" />
      </div>

      <CheckboxGroupField
        name="posicao"
        label="Posição"
        options={POSICAO_OPTIONS.map((v) => ({
          value: v,
          label: POSICAO_LABELS[v],
        }))}
      />
      <CheckboxGroupField
        name="sol"
        label="Sol"
        options={SOL_OPTIONS.map((v) => ({ value: v, label: SOL_LABELS[v] }))}
      />
    </div>
  );
}
