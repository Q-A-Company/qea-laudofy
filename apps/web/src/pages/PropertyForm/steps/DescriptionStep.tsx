import { useFormContext, useWatch } from "react-hook-form";
import { TextAreaField, TextField } from "../../../components/form/fields";
import type { PropertyFormInput } from "../../../lib/propertySchema";

// Qualquer linha que comece com "Rótulo curto:" vira negrito automaticamente
// na prévia e no laudo gerado (ex: "1º Pavimento: Hall de entrada...").
const LABEL_LINE = /^([^:\n]{1,40}):\s*(.*)$/;

function PreviewLine({ line }: { line: string }) {
  const match = line.match(LABEL_LINE);
  if (!match) return <p className="text-sm leading-relaxed text-text-muted">{line}</p>;
  return (
    <p className="text-sm leading-relaxed text-text-muted">
      <strong className="font-semibold text-text">{match[1]}:</strong> {match[2]}
    </p>
  );
}

function DescriptionPreview() {
  const { control } = useFormContext<PropertyFormInput>();
  const titulo = useWatch({ control, name: "descricaoTitulo" }) as string | undefined;
  const corpo = useWatch({ control, name: "descricao" }) as string | undefined;

  if (!titulo && !corpo) return null;

  const linhas = (corpo ?? "").split("\n").filter((l) => l.trim() !== "");

  return (
    <div className="rounded-xl border border-border bg-bg-inset p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
        Prévia de como sai no laudo
      </p>
      {titulo && (
        <p className="mb-3 text-sm font-bold uppercase leading-relaxed text-text">{titulo}</p>
      )}
      <p className="mb-3 text-sm italic text-text-muted underline underline-offset-2">
        O imóvel vem descrito da seguinte forma:
      </p>
      <div className="flex flex-col gap-2.5">
        {linhas.map((linha, i) => (
          <PreviewLine key={i} line={linha} />
        ))}
      </div>
    </div>
  );
}

export function DescriptionStep() {
  return (
    <div className="flex flex-col gap-5">
      <TextField
        name="descricaoTitulo"
        label="Título do laudo"
        placeholder="Casa duplex com 5 suítes, subsolo, recém reformada..."
      />
      <TextAreaField name="descricao" label="Descrição detalhada" rows={10} />
      <p className="-mt-3 text-xs text-text-faint">
        Uma linha por parágrafo. Comece uma linha com um rótulo curto seguido de dois-pontos (ex:
        "1º Pavimento:", "Subsolo:", "Área de lazer:") para que esse trecho saia em negrito no
        laudo, igual ao modelo de vocês.
      </p>

      <DescriptionPreview />
    </div>
  );
}
