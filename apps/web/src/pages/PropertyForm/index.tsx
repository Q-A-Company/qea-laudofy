import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { mapFormToPropertyInsert } from "../../lib/propertyMapper";
import {
  propertyFormSchema,
  STEP_FIELDS,
  STEP_LABELS,
  STEP_ORDER,
  type PropertyFormInput,
  type PropertyFormValues,
  type StepKey,
} from "../../lib/propertySchema";
import { AmenitiesStep } from "./steps/AmenitiesStep";
import { CharacteristicsStep } from "./steps/CharacteristicsStep";
import { CommercialStep } from "./steps/CommercialStep";
import { DescriptionStep } from "./steps/DescriptionStep";
import { LocationStep } from "./steps/LocationStep";
import { LogisticsStep } from "./steps/LogisticsStep";

const STEP_COMPONENTS: Record<StepKey, () => React.JSX.Element> = {
  localizacao: LocationStep,
  logistica: LogisticsStep,
  caracteristicasFisicas: CharacteristicsStep,
  comercial: CommercialStep,
  amenidades: AmenitiesStep,
  descricao: DescriptionStep,
};

const defaultValues: Partial<PropertyFormInput> = {
  tipoComercialSubtipos: [],
  posicao: [],
  sol: [],
  cantoDePedra: false,
  chaveDisponivel: false,
  placaInstalada: false,
  subsolo: false,
  permutaAceita: false,
  finalidade: [],
  caracteristicasImovel: {},
  caracteristicasCondominio: {},
};

export function PropertyForm() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<PropertyFormInput, unknown, PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const stepKey = STEP_ORDER[stepIndex];
  const StepComponent = STEP_COMPONENTS[stepKey];
  const isLastStep = stepIndex === STEP_ORDER.length - 1;

  async function handleNext() {
    const fields = STEP_FIELDS[stepKey];
    const valid = await methods.trigger(fields);
    if (valid) setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  }

  function handleBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function onSubmit(values: PropertyFormValues) {
    if (!profile) return;
    setSubmitError(null);
    const row = mapFormToPropertyInsert(values, profile.id);
    const { data, error } = await supabase
      .from("properties")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      setSubmitError(error.message);
      return;
    }
    navigate(`/properties/${data.id}`, { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Novo imóvel</h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <ol className="mb-6 flex flex-wrap gap-2 text-xs">
          {STEP_ORDER.map((key, idx) => (
            <li
              key={key}
              className={`rounded-full px-3 py-1 ${
                idx === stepIndex
                  ? "bg-slate-900 text-white"
                  : idx < stepIndex
                    ? "bg-slate-200 text-slate-700"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {idx + 1}. {STEP_LABELS[key]}
            </li>
          ))}
        </ol>

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <StepComponent />

            {submitError && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={stepIndex === 0}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
              >
                Voltar
              </button>

              {isLastStep ? (
                <button
                  type="submit"
                  disabled={methods.formState.isSubmitting}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {methods.formState.isSubmitting
                    ? "Salvando..."
                    : "Concluir cadastro"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Próximo
                </button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
