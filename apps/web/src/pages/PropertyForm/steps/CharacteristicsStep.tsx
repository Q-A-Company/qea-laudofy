import { HIDROMETRO_LABELS, HIDROMETRO_OPTIONS } from "@qea-laudofy/shared";
import { useFormContext, useWatch } from "react-hook-form";
import { CheckboxField, NumberField, SelectField, TextField } from "../../../components/form/fields";
import type { PropertyFormInput } from "../../../lib/propertySchema";

export function CharacteristicsStep() {
  const { control } = useFormContext<PropertyFormInput>();
  // register() entrega string durante a digitação (a conversão pra número só
  // acontece no submit, via zod); Number(...) evita comparar tipos incompatíveis.
  const suites = Number(useWatch({ control, name: "suites" }) || 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <NumberField name="quartosPlantaOriginal" label="Quartos (planta original)" />
        <NumberField name="suitesPlantaOriginal" label="Suítes (planta original)" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField name="quartos" label="Quartos (atual)" />
        <NumberField name="suites" label="Suítes (atual)" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <NumberField name="banheiros" label="Banheiros" />
        <NumberField name="vagas" label="Vagas" />
      </div>

      {!!suites && suites > 0 && (
        <NumberField
          name="suiteMasterIndex"
          label={`Qual suíte é a master? (1 a ${suites})`}
        />
      )}

      <CheckboxField name="subsolo" label="Subsolo" />

      <div className="grid grid-cols-2 gap-4">
        <NumberField name="anoConstrucao" label="Ano de construção" />
        <NumberField name="elevadores" label="Elevadores" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField name="andar" label="Nº/Pav." placeholder="uso livre" />
        <NumberField name="unidadesPorAndar" label="Unid./Andar" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField name="areaTerreno" label="Área do terreno (m²)" step="0.01" />
        <NumberField name="areaConstruida" label="Área construída (m²)" step="0.01" />
      </div>

      <SelectField
        name="hidrometro"
        label="Hidrômetro"
        options={HIDROMETRO_OPTIONS.map((v) => ({
          value: v,
          label: HIDROMETRO_LABELS[v],
        }))}
      />
    </div>
  );
}
