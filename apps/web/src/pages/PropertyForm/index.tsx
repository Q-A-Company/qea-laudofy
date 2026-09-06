import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/AppShell";
import { Button, Card } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
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
import { supabase } from "../../lib/supabaseClient";
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

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-1.5 overflow-x-auto pb-1">
      {STEP_ORDER.map((key, idx) => {
        const state = idx < current ? "done" : idx === current ? "active" : "upcoming";
        return (
          <li key={key} className="flex shrink-0 items-center gap-1.5">
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                state === "done"
                  ? "bg-accent-500 text-[#0a0a0f]"
                  : state === "active"
                    ? "border-2 border-accent-500 text-accent-300"
                    : "border border-border text-text-faint"
              }`}
            >
              {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : idx + 1}
            </div>
            <span
              className={`whitespace-nowrap text-xs font-medium ${
                state === "upcoming" ? "text-text-faint" : "text-text"
              }`}
            >
              {STEP_LABELS[key]}
            </span>
            {idx < STEP_ORDER.length - 1 && <div className="mx-1 h-px w-4 shrink-0 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

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
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-xl font-semibold tracking-tight text-text">Novo imóvel</h1>

        <Stepper current={stepIndex} />

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Card className="p-6">
              <StepComponent />
            </Card>

            {submitError && (
              <p className="mt-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">
                {submitError}
              </p>
            )}

            <div className="mt-6 flex justify-between">
              <Button type="button" variant="secondary" onClick={handleBack} disabled={stepIndex === 0}>
                Voltar
              </Button>

              {isLastStep ? (
                <Button type="submit" loading={methods.formState.isSubmitting}>
                  {!methods.formState.isSubmitting && "Concluir cadastro"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Próximo
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}
