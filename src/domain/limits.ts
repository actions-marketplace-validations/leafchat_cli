/*
  leafchat のサーバーの上限の写し。
  Why 写すか: 送る前に止めて、直す場所を手元で示すため。サーバーが最終の判定をするので、ずれても止まる場所が変わるだけで壊れはしない。
*/

export const SYNC_PATH_MAX_BYTES = 512;

export const SYNC_MAX_FILES = 500;

const SYNC_MAX_BODY_BYTES = 8 * 1024 * 1024;

// Why 1 MiB 残すか: 本文の JSON の枠・参照の項目・確認した削除・送り手の情報の分。
export const INLINE_BUDGET_BYTES = SYNC_MAX_BODY_BYTES - 1024 * 1024;

export const FILENAME_MAX_CHARS = 40;

export const FOLDER_NAME_MAX_CHARS = 60;

export const TEXT_MAX_BYTES = 4 * 1024 * 1024;

// docx・html・csv。サーバーは変換の前に原本を base64 と JSON の文字列にするため、PDF より小さい（leafchat の knowledge-format.ts）。
export const RICH_MAX_BYTES = 15 * 1024 * 1024;

// PDF はサーバーが原本を 1 つだけ持って読むため、ほかの形式より大きい（leafchat の knowledge-format.ts）。
export const PDF_MAX_BYTES = 20 * 1024 * 1024;

// xlsx はサーバーの取り込みの中で読むため、ほかの形式より小さい（leafchat の plans/xlsx-knowledge.md の D4）。
export const XLSX_MAX_BYTES = 5 * 1024 * 1024;

// pptx はサーバーが画像を展開せずに XML だけを読むため、PDF と同じ（leafchat の plans/pptx-knowledge.md の D5）。
export const PPTX_MAX_BYTES = 20 * 1024 * 1024;

// どの形式でも確実に超過と言える上界（形式が決まる前に読むかどうかを決めるときに使う）。
export const LARGEST_MAX_BYTES = Math.max(
  TEXT_MAX_BYTES,
  RICH_MAX_BYTES,
  PDF_MAX_BYTES,
  XLSX_MAX_BYTES,
  PPTX_MAX_BYTES,
);
