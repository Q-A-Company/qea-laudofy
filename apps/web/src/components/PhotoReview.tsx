import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Database } from "@qea-laudofy/shared";
import { List } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Badge, Button } from "./ui";

type Photo = Database["public"]["Tables"]["property_photos"]["Row"];
type Category = Database["public"]["Tables"]["photo_categories"]["Row"];

const DEFAULT_THRESHOLD = 0.6;
const PENDING_GROUP_KEY = "__pendente__";

function effectiveCategory(photo: Photo): string | null {
  return photo.final_category ?? photo.ai_suggested_category;
}

export function PhotoReview({
  photos,
  categories,
  onChanged,
}: {
  photos: Photo[];
  categories: Category[];
  onChanged: () => void;
}) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        photos.map(async (p) => {
          const { data } = await supabase.storage
            .from("property-files")
            .createSignedUrl(p.storage_path, 3600);
          return [p.id, data?.signedUrl ?? ""] as const;
        }),
      );
      if (!cancelled) setSignedUrls(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [photos]);

  const categoryLabel = (key: string | null) =>
    categories.find((c) => c.key === key)?.label ?? key ?? "";
  const categorySortOrder = (key: string | null) =>
    categories.find((c) => c.key === key)?.sort_order ?? Number.MAX_SAFE_INTEGER;

  // Agrupa por categoria efetiva (final_category se já editado, senão a
  // sugestão da IA), ordenado pela ordem de exibição configurável da
  // categoria; fotos ainda sem categoria (processando/erro) vão num grupo à parte.
  const groups = useMemo(() => {
    const byKey = new Map<string, Photo[]>();
    for (const photo of photos) {
      const key = effectiveCategory(photo) ?? PENDING_GROUP_KEY;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(photo);
    }
    for (const list of byKey.values()) {
      list.sort((a, b) => (a.display_order ?? a.upload_order) - (b.display_order ?? b.upload_order));
    }
    const keys = [...byKey.keys()].sort((a, b) => {
      if (a === PENDING_GROUP_KEY) return -1;
      if (b === PENDING_GROUP_KEY) return 1;
      return categorySortOrder(a) - categorySortOrder(b);
    });
    return keys.map((key) => ({ key, photos: byKey.get(key)! }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, categories]);

  // Numeração contínua no imóvel inteiro (1, 2, 3...), não reinicia a cada
  // categoria: "1 - Sala, 2 - Sala, 3 - Fachada", nunca "1 - Sala, 1 - Fachada".
  // Fotos sem categoria (processando/erro) não entram na contagem.
  const globalNumbers = useMemo(() => {
    const map = new Map<string, number>();
    let n = 1;
    for (const group of groups) {
      if (group.key === PENDING_GROUP_KEY) continue;
      for (const photo of group.photos) {
        map.set(photo.id, n++);
      }
    }
    return map;
  }, [groups]);

  const pendingSuggestions = photos.filter(
    (p) => p.review_status === "pendente" && p.ai_suggested_category && p.processing_status === "concluido",
  );

  async function acceptAllSuggestions() {
    if (pendingSuggestions.length === 0) return;
    setSaving(true);
    await Promise.all(
      pendingSuggestions.map((p) =>
        supabase
          .from("property_photos")
          .update({ final_category: p.ai_suggested_category, review_status: "aceito" })
          .eq("id", p.id),
      ),
    );
    setSaving(false);
    onChanged();
  }

  async function changeCategory(photo: Photo, newCategory: string) {
    setSaving(true);
    await supabase
      .from("property_photos")
      .update({ final_category: newCategory, review_status: "editado" })
      .eq("id", photo.id);
    setSaving(false);
    onChanged();
  }

  async function handleDragEnd(groupPhotos: Photo[], event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groupPhotos.findIndex((p) => p.id === active.id);
    const newIndex = groupPhotos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(groupPhotos, oldIndex, newIndex);
    setSaving(true);
    await Promise.all(
      reordered.map((p, idx) =>
        supabase.from("property_photos").update({ display_order: idx }).eq("id", p.id),
      ),
    );
    setSaving(false);
    onChanged();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="text-sm font-semibold text-text">Fotos</h2>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-text-muted">
            Limiar de confiança
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-16 rounded-md border border-border bg-bg-inset px-2 py-1 text-text outline-none focus:border-accent-500"
            />
          </label>
          <Button
            size="sm"
            variant="secondary"
            onClick={acceptAllSuggestions}
            disabled={pendingSuggestions.length === 0 || saving}
          >
            Aceitar todas as sugestões ({pendingSuggestions.length})
          </Button>
        </div>
      </div>

      {photos.length === 0 && <p className="text-sm text-text-muted">Nenhuma foto enviada ainda.</p>}

      <div className="flex flex-col gap-7">
        {groups.map(({ key, photos: groupPhotos }) => (
          <div key={key}>
            <h3 className="mb-2.5 text-[13px] font-semibold text-text">
              {key === PENDING_GROUP_KEY ? "Sem categoria / processando" : categoryLabel(key)}
              <span className="ml-1.5 font-normal text-text-faint">({groupPhotos.length})</span>
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(groupPhotos, e)}
            >
              <SortableContext
                items={groupPhotos.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {groupPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      label={
                        key === PENDING_GROUP_KEY
                          ? null
                          : `${globalNumbers.get(photo.id)} - ${categoryLabel(key)}`
                      }
                      imageUrl={signedUrls[photo.id]}
                      categories={categories}
                      threshold={threshold}
                      onChangeCategory={(newCat) => changeCategory(photo, newCat)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoCard({
  photo,
  label,
  imageUrl,
  categories,
  threshold,
  onChangeCategory,
}: {
  photo: Photo;
  label: string | null;
  imageUrl: string | undefined;
  categories: Category[];
  threshold: number;
  onChangeCategory: (newCategory: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  const currentValue = photo.final_category ?? photo.ai_suggested_category ?? "";
  const isKnownCategory = categories.some((c) => c.key === currentValue);
  const [customMode, setCustomMode] = useState(!isKnownCategory && currentValue !== "");
  const [customText, setCustomText] = useState(!isKnownCategory ? currentValue : "");

  const lowConfidence =
    photo.ai_confidence !== null && photo.ai_confidence < threshold && photo.review_status === "pendente";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden rounded-lg border bg-surface-raised ${
        lowConfidence ? "border-warning/50 ring-1 ring-warning/30" : "border-border"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="aspect-square cursor-grab touch-none bg-bg-inset active:cursor-grabbing"
      >
        {imageUrl && (
          <img src={imageUrl} alt={photo.original_filename ?? ""} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-2.5">
        {label && <p className="truncate text-xs font-semibold text-text">{label}</p>}

        {photo.processing_status !== "concluido" ? (
          <p className="mt-1 text-xs text-text-faint">
            {photo.processing_status === "erro" ? "Erro na classificação" : "Processando..."}
          </p>
        ) : (
          <>
            {customMode ? (
              <div className="mt-1.5 flex gap-1">
                <input
                  type="text"
                  autoFocus
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onBlur={() => {
                    const trimmed = customText.trim();
                    if (trimmed && trimmed !== currentValue) onChangeCategory(trimmed);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  placeholder="Nome do ambiente"
                  className="w-full rounded-md border border-border bg-bg-inset px-1.5 py-1 text-xs text-text outline-none focus:border-accent-500"
                />
                <button
                  type="button"
                  title="Escolher da lista"
                  onClick={() => setCustomMode(false)}
                  className="flex shrink-0 items-center justify-center rounded-md border border-border px-1.5 text-text-muted hover:bg-surface-hover"
                >
                  <List className="size-3.5" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <select
                value={currentValue}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setCustomText("");
                    setCustomMode(true);
                  } else {
                    onChangeCategory(e.target.value);
                  }
                }}
                className="mt-1.5 w-full rounded-md border border-border bg-bg-inset px-1.5 py-1 text-xs text-text outline-none focus:border-accent-500"
              >
                <option value="" disabled>
                  Categoria...
                </option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
                <option value="__custom__">Outro (digitar)...</option>
              </select>
            )}
            {photo.ai_confidence !== null && (
              <div className="mt-1.5">
                {lowConfidence ? (
                  <Badge tone="warning" className="px-1.5 py-0.5 text-[11px]">
                    {Math.round(photo.ai_confidence * 100)}% · revisar
                  </Badge>
                ) : (
                  <p className="text-[11px] text-text-faint">
                    Confiança: {Math.round(photo.ai_confidence * 100)}%
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
