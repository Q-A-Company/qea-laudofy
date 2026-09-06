import {
  CARACTERISTICAS_CONDOMINIO_LABELS,
  CARACTERISTICAS_CONDOMINIO_OPTIONS,
  CARACTERISTICAS_IMOVEL_LABELS,
  CARACTERISTICAS_IMOVEL_OPTIONS,
} from "@qea-laudofy/shared";
import { RecordCheckboxField } from "../../../components/form/fields";

export function AmenitiesStep() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text">
          Características do imóvel
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {CARACTERISTICAS_IMOVEL_OPTIONS.map((key) => (
            <RecordCheckboxField
              key={key}
              name="caracteristicasImovel"
              optionKey={key}
              label={CARACTERISTICAS_IMOVEL_LABELS[key]}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text">
          Características do condomínio
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {CARACTERISTICAS_CONDOMINIO_OPTIONS.map((key) => (
            <RecordCheckboxField
              key={key}
              name="caracteristicasCondominio"
              optionKey={key}
              label={CARACTERISTICAS_CONDOMINIO_LABELS[key]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
