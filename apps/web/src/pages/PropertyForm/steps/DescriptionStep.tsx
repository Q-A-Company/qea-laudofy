import { TextAreaField } from "../../../components/form/fields";

export function DescriptionStep() {
  return (
    <div className="flex flex-col gap-4">
      <TextAreaField name="descricao" label="Descrição" rows={8} />
      <p className="text-xs text-slate-500">
        Revise os dados nas etapas anteriores antes de concluir o cadastro.
      </p>
    </div>
  );
}
