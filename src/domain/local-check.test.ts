import { describe, expect, test } from "vitest";
import { localEntry } from "../test/mother.ts";
import { checkLocalEntries } from "./local-check.ts";

const LFS_HEAD = new TextEncoder().encode(
  "version https://git-lfs.github.com/spec/v1\noid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\nsize 12345\n",
);

/** 外部 ID `資料/0001.md`〜の n 件の Markdown。 */
const manyEntries = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    localEntry({ path: `資料/${String(i + 1).padStart(4, "0")}.md` }),
  );

describe("送る前の検査", () => {
  test.each([
    {
      label: "3 階層のファイル",
      entry: localEntry({ path: "渋谷店/メニュー/ランチ.pdf" }),
      finding: { code: "path_depth", severity: "error", detail: "渋谷店" },
    },
    {
      label: "空のファイル",
      entry: localEntry({ size: 0 }),
      finding: { code: "empty_file", severity: "error", detail: null },
    },
    {
      label: "テキストの上限（4 MiB）を 1 バイト超えるファイル",
      entry: localEntry({ size: 4_194_305 }),
      finding: { code: "too_large", severity: "error", detail: "4194304" },
    },
    {
      label: "PDF の上限（20 MiB）を 1 バイト超えるファイル",
      entry: localEntry({ path: "共通/料金表.pdf", size: 20_971_521 }),
      finding: { code: "too_large", severity: "error", detail: "20971520" },
    },
    {
      label: "Word の上限（15 MiB）を 1 バイト超えるファイル",
      entry: localEntry({ path: "共通/案内.docx", size: 15_728_641 }),
      finding: { code: "too_large", severity: "error", detail: "15728640" },
    },
    {
      label: "Git LFS のポインタファイル",
      entry: localEntry({ path: "共通/料金表.pdf", size: 132, head: LFS_HEAD }),
      finding: { code: "lfs_pointer", severity: "error", detail: null },
    },
    {
      label: "シンボリックリンク",
      entry: localEntry({ kind: "symlink", size: 0 }),
      finding: { code: "symlink", severity: "error", detail: null },
    },
    {
      label: "深すぎて読まなかったフォルダ",
      entry: localEntry({
        path: "a/b/c/d/e/f/g/h",
        kind: "directory",
        size: 0,
      }),
      finding: { code: "path_depth", severity: "error", detail: "a" },
    },
    {
      label: "対応しない拡張子（.key）",
      entry: localEntry({ path: "共通/料金表.key" }),
      finding: {
        code: "unsupported_format",
        severity: "warning",
        detail: "key",
      },
    },
    {
      label: "区切りの前後に空白がある名前",
      entry: localEntry({ path: "共通 /料金表.pdf" }),
      finding: {
        code: "path_invalid",
        severity: "error",
        detail: "segment_whitespace",
      },
    },
  ])(
    "$label は $finding.code を返し、送る対象から外す",
    ({ entry, finding }) => {
      const result = checkLocalEntries([entry]);

      expect(result).toEqual({
        files: [],
        findings: [{ ...finding, path: entry.path }],
      });
    },
  );

  test("問題の無いファイルは、形式つきで送る対象に入る", () => {
    const result = checkLocalEntries([
      localEntry({ path: "共通/料金表.pdf" }),
      localEntry({ path: "よくある質問.md" }),
    ]);

    expect(result).toEqual({
      files: [
        { ...localEntry({ path: "よくある質問.md" }), mime: "text/markdown" },
        {
          ...localEntry({ path: "共通/料金表.pdf" }),
          mime: "application/pdf",
        },
      ],
      findings: [],
    });
  });

  test("xlsx は、xlsx の形式で送る対象に入る", () => {
    const result = checkLocalEntries([
      localEntry({ path: "共通/料金表.xlsx" }),
    ]);

    expect(result).toEqual({
      files: [
        {
          ...localEntry({ path: "共通/料金表.xlsx" }),
          mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
      findings: [],
    });
  });

  test("xlsx の上限（5 MiB）を 1 バイト超えるファイルは too_large", () => {
    const result = checkLocalEntries([
      localEntry({ path: "共通/料金表.xlsx", size: 5_242_881 }),
    ]);

    expect(result.findings).toEqual([
      {
        code: "too_large",
        severity: "error",
        path: "共通/料金表.xlsx",
        detail: "5242880",
      },
    ]);
  });

  test("pptx は、pptx の形式で送る対象に入る", () => {
    const result = checkLocalEntries([
      localEntry({ path: "共通/説明資料.pptx" }),
    ]);

    expect(result).toEqual({
      files: [
        {
          ...localEntry({ path: "共通/説明資料.pptx" }),
          mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        },
      ],
      findings: [],
    });
  });

  test("pptx の上限（20 MiB）を 1 バイト超えるファイルは too_large", () => {
    const result = checkLocalEntries([
      localEntry({ path: "共通/説明資料.pptx", size: 20_971_521 }),
    ]);

    expect(result.findings).toEqual([
      {
        code: "too_large",
        severity: "error",
        path: "共通/説明資料.pptx",
        detail: "20971520",
      },
    ]);
  });

  test("「料金表 2026.pdf」と「料金表_2026.pdf」が同じフォルダにあると duplicate になる", () => {
    const result = checkLocalEntries([
      localEntry({ path: "共通/料金表 2026.pdf" }),
      localEntry({ path: "共通/料金表_2026.pdf" }),
    ]);

    expect(result.findings).toEqual([
      {
        code: "duplicate",
        severity: "error",
        path: "共通/料金表 2026.pdf",
        detail: "共通/料金表_2026.pdf",
      },
      {
        code: "duplicate",
        severity: "error",
        path: "共通/料金表_2026.pdf",
        detail: "共通/料金表_2026.pdf",
      },
    ]);
  });

  test("「料金表 2026.pdf」と「料金表_2026.pdf」が別のフォルダにあれば通る", () => {
    const result = checkLocalEntries([
      localEntry({ path: "新宿店/料金表 2026.pdf" }),
      localEntry({ path: "渋谷店/料金表_2026.pdf" }),
    ]);

    expect(result.findings).toEqual([]);
  });

  test.each([
    { count: 500, findings: [] },
    {
      count: 501,
      findings: [
        {
          code: "too_many_files",
          severity: "error",
          path: null,
          detail: "501",
        },
      ],
    },
  ])(
    "送るファイルが $count 件なら、件数の検査は表のとおり",
    ({ count, findings }) => {
      const result = checkLocalEntries(manyEntries(count));

      expect(result.findings).toEqual(findings);
    },
  );

  test("走査を途中で打ち切ったら too_many_files を返す", () => {
    const result = checkLocalEntries([localEntry()], { truncated: true });

    expect(result.findings).toEqual([
      { code: "too_many_files", severity: "error", path: null, detail: null },
    ]);
  });

  test("検査の結果は、パスの昇順に並ぶ", () => {
    const result = checkLocalEntries([
      localEntry({ path: "b/x.key" }),
      localEntry({ path: "a/1/2.md" }),
    ]);

    expect(result.findings.map((f) => f.path)).toEqual(["a/1/2.md", "b/x.key"]);
  });
});
