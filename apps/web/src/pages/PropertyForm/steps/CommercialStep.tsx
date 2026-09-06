import {
  DATA_ENTREGA_TIPO_LABELS,
  DATA_ENTREGA_TIPO_OPTIONS,
  FINALIDADE_LABELS,
  FINALIDADE_OPTIONS,
} from "@qea-laudofy/shared";
import { useFormContext, useWatch } from "react-hook-form";
import {
  CheckboxField,
  CheckboxGroupField,
  CurrencyField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "../../../components/form/fields";
import type { PropertyFormInput } from "../../../lib/propertySchema";

export function CommercialStep() {
  const { control } = useFormContext<PropertyFormInput>();
  const permutaAceita = useWatch({ control, name: "permutaAceita" });
  const finalidade = useWatch({ control, name: "finalidade" }) ?? [];
  const dataEntregaTipo = useWatch({ control, name: "dataEntregaTipo" });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <CurrencyField name="condominioValor" label="Condomínio" />
        <CurrencyField name="iptuValor" label="IPTU" />
      </div>
      <TextField name="inscricaoIptu" label="Inscrição IPTU" />

      <CheckboxGroupField
        name="finalidade"
        label="Finalidade"
        options={FINALIDADE_OPTIONS.map((v) => ({
          value: v,
          label: FINALIDADE_LABELS[v],
        }))}
      />
      <CurrencyField name="valor" label="Valor do imóvel" />
      {finalidade.includes("locacao") && (
        <CurrencyField name="valorLocacao" label="Valor de locação" />
      )}

      <div>
        <SelectField
          name="dataEntregaTipo"
          label="Data de entrega"
          options={DATA_ENTREGA_TIPO_OPTIONS.map((v) => ({
            value: v,
            label: DATA_ENTREGA_TIPO_LABELS[v],
          }))}
        />
        {dataEntregaTipo === "data" && (
          <div className="mt-2 grid grid-cols-2 gap-4">
            <NumberField name="dataEntregaMes" label="Mês (opcional)" />
            <NumberField name="dataEntregaAno" label="Ano" />
          </div>
        )}
      </div>

      <CheckboxField name="permutaAceita" label="Aceita permuta" />
      {permutaAceita && <TextField name="permutaTipoLocal" label="Tipo/local da permuta" />}

      <TextAreaField name="motivoVenda" label="Motivo da venda" rows={2} />
      <TextAreaField name="condicoesObs" label="Condições / observações" rows={3} />
    </div>
  );
}
