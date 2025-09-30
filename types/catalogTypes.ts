// Types for OpenAI catalog generation
export interface OpenAIResponse {
  object: string;
  data: Array<{
    object: string;
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  }>;
}

export interface OpenAIRun {
  q: string;
  model: string;
  phase: "search" | "normalize";
}

export interface ParsedToyItem {
  title?: string;
  brand?: string;
  category?: string;
  gender?: string;
  price?: number;
  retailer?: string;
  productUrl?: string;
  imageUrl?: string;
  tags?: string[];
}

export type Gender = "boy" | "girl" | "unisex";

export interface DraftRow {
  title: string;
  brand?: string;
  category?: string;
  gender: string;
  price?: number;
  retailer?: string;
  productUrl?: string;
  imageUrl?: string;
  tags: string[];
}