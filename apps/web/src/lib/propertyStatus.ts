import type { Database } from "@qea-laudofy/shared";

export type PropertyStatus = Database["public"]["Enums"]["property_status"];

export const PROPERTY_STATUS_OPTIONS: PropertyStatus[] = ["pendente", "finalizado", "publicado"];

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  pendente: "Pendente",
  finalizado: "Finalizado",
  publicado: "Publicado",
};

export const PROPERTY_STATUS_TONE: Record<PropertyStatus, "neutral" | "success" | "accent"> = {
  pendente: "neutral",
  finalizado: "accent",
  publicado: "success",
};
