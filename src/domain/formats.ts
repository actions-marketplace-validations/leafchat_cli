import {
  PDF_MAX_BYTES,
  PPTX_MAX_BYTES,
  RICH_MAX_BYTES,
  TEXT_MAX_BYTES,
  XLSX_MAX_BYTES,
} from "./limits.ts";

// leafchat のサーバーの knowledge-format.ts の 9 形式の写し。

export type TextMime = "text/plain" | "text/markdown" | "application/json";

export type KnowledgeMime =
  | TextMime
  | "text/html"
  | "text/csv"
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const FORMATS: readonly Readonly<{
  mime: KnowledgeMime;
  ext: readonly string[];
}>[] = [
  { mime: "text/plain", ext: ["txt", "text", "log"] },
  { mime: "text/markdown", ext: ["md", "markdown"] },
  { mime: "application/json", ext: ["json"] },
  { mime: "text/html", ext: ["html", "htm"] },
  { mime: "text/csv", ext: ["csv"] },
  { mime: "application/pdf", ext: ["pdf"] },
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: ["docx"],
  },
  {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: ["xlsx"],
  },
  {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ext: ["pptx"],
  },
];

const extensionOf = (filename: string) => {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
};

export function mimeOfFilename(filename: string): KnowledgeMime | null {
  const ext = extensionOf(filename);
  return FORMATS.find((format) => format.ext.includes(ext))?.mime ?? null;
}

export const isTextMime = (mime: KnowledgeMime): mime is TextMime =>
  mime === "text/plain" ||
  mime === "text/markdown" ||
  mime === "application/json";

// Why テキストを絞るか: サーバーはテキストの本文をそのまま索引し、原本の数倍のメモリを使う（knowledge-format.ts）。
// Why xlsx を絞るか: サーバーは取り込みの中で xlsx を展開して読み、重さは展開後の大きさで決まる。
// Why PDF と pptx が大きいか: サーバーは PDF の原本を 1 つだけ持って読み、pptx は画像を展開せずに XML だけを読む。docx・html・csv は変換の前に原本の数倍を使う。
export const maxBytesOf = (mime: KnowledgeMime): number => {
  if (isTextMime(mime)) return TEXT_MAX_BYTES;
  if (mime === "application/pdf") return PDF_MAX_BYTES;
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return XLSX_MAX_BYTES;
  }
  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return PPTX_MAX_BYTES;
  }
  return RICH_MAX_BYTES;
};
