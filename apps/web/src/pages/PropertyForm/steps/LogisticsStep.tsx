import { IMOVEL_OCUPACAO_LABELS, IMOVEL_OCUPACAO_OPTIONS } from "@qea-laudofy/shared";
import { useFormContext, useWatch } from "react-hook-form";
import { CheckboxField, PhoneField, SelectField, TextField } from "../../../components/form/fields";
import type { PropertyFormInput } from "../../../lib/propertySchema";

export function LogisticsStep() {
  const { control } = useFormContext<PropertyFormInput>();
  const chaveDisponivel = useWatch({ control, name: "chaveDisponivel" });
  const placaInstalada = useWatch({ control, name: "placaInstalada" });

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        name="imovelOcupacao"
        label="Situação do imóvel"
        options={IMOVEL_OCUPACAO_OPTIONS.map((v) => ({
          value: v,
          label: IMOVEL_OCUPACAO_LABELS[v],
        }))}
      />
      <CheckboxField name="agendamentoNecessario" label="Precisa agendar visita" />
      <TextField name="agendamentoObs" label="Observações para agendamento" />

      <div className="grid grid-cols-2 gap-4">
        <CheckboxField name="chaveDisponivel" label="Chave disponível" />
        {chaveDisponivel && <TextField name="chaveNumero" label="Número da chave" />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CheckboxField name="placaInstalada" label="Placa instalada" />
        {placaInstalada && <TextField name="placaNumero" label="Número da placa" />}
      </div>

      <hr className="border-border" />
      <h3 className="text-sm font-semibold text-text">Proprietário</h3>
      <TextField name="proprietarioNome" label="Nome" />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          name="proprietarioTelefones"
          label="Telefone(s)"
          placeholder="separe por vírgula se tiver mais de um"
        />
        <TextField name="proprietarioEmail" label="E-mail" />
      </div>

      <h3 className="text-sm font-semibold text-text">Cônjuge (opcional)</h3>
      <TextField name="conjugeNome" label="Nome" />
      <div className="grid grid-cols-2 gap-4">
        <PhoneField name="conjugeTelefone" label="Telefone" />
        <TextField name="conjugeEmail" label="E-mail" />
      </div>
    </div>
  );
}
