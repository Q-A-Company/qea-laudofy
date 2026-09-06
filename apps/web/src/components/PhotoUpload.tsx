import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { uploadPropertyPhotos } from "../lib/uploadPhotos";

export function PhotoUpload({
  propertyId,
  onUploaded,
}: {
  propertyId: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ uploaded: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      setError("Selecione apenas arquivos de imagem.");
      return;
    }

    setError(null);
    setProgress({ uploaded: 0, total: files.length });
    try {
      await uploadPropertyPhotos(propertyId, files, setProgress);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
          dragOver
            ? "border-accent-500 bg-accent-500/[0.06]"
            : "border-border hover:border-border-strong hover:bg-surface-raised"
        }`}
      >
        <ImagePlus className="size-6 text-text-faint" strokeWidth={1.5} />
        <p className="text-sm font-medium text-text">Arraste as fotos aqui ou clique para selecionar</p>
        <p className="text-xs text-text-faint">Pode selecionar todas de uma vez</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {progress && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-accent-500 transition-all"
              style={{ width: `${(progress.uploaded / progress.total) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-text-muted">
            Enviando {progress.uploaded} de {progress.total}...
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
