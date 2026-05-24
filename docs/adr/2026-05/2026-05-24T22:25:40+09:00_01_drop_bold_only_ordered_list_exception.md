# 2026-05-24 — Bold-over-code unwrap ルールから ordered-list の例外を撤廃

- ステータス: Accepted
- 日付: 2026-05-24T22:25:40+09:00
- 関連: `docs/adr/2026-05/2026-05-24T17:17:15+09:00_01_converter_conversion_rules.md` (決定 3)
- 範囲: `md2sb/src/converter.ts`, `md2sb/src/testdata/wip_commit/out.txt`, `README.md`

## 背景

前回の ADR (決定 3) では、`**bold**` がコードスパンを含む場合は `[* ... ]` の wrapping を外す、というルールを定めた一方で、順序付きリストアイテムの中身が単一の bold だけの場合 (例: `1. **foo `bar` baz**`) はタイトル相当の見出し的記述とみなし、`[* ... ]` で包みつつ内部の backquote を落として出力する、という例外を保持していた。これは `wip_commit` テストの当初の期待値に合わせたもの。

利用者からは、この例外が不要であり、bold-over-code のルールを一律に適用すべき、というフィードバックを受けた。

## 決定

順序付きリスト用の特別扱い (boldOnly 分岐) を converter から削除し、`**...**` の処理は段落・順序なしリスト・順序付きリストを問わず統一ルール (Step 1 で `[* ... ]` に変換 → Step 2 で内部にコードスパンを含むなら wrapping を外す) で行う。

具体的な動作変更:

- `1. **独自 type として `wip:` を使う**` → 旧: `1. [* 独自 type として wip: を使う]` (backquote 除去 + `[* ]` 維持)
  → 新: ``1. 独自 type として `wip:` を使う`` (wrapping 撤去、backquote 保持)
- 他の wip_commit 内同種パターンも同様。
- bold 内にコードスパンがないケース (`1. **列の数:**` 等) は引き続き `[* ]` に変換される (既存挙動)。

## 理由

- ルールの一貫性: 「bold が code span を含む場合は code を優先して bold を外す」というポリシーに、リスト構造による例外を作ると、文書の同型なフラグメント (段落の途中の bold-over-code と、リストアイテムの bold-over-code) で出力が分岐し説明しづらい。
- バックティック保持: 例外側では「タイトル相当だから」という理由で内部の backquote を落としていたが、これは情報の損失。本文では普通に backquote を残せる以上、リストでも残す方が自然。
- 実装の単純化: `boldOnly` 分岐と inner.replace 処理が不要になり、ordered list ハンドラが unordered list ハンドラと対称になる。

## 影響

- `wip_commit/out.txt` の 3 行 (L3, L7, L10) を新挙動に更新。
- `converter.ts` の ordered-list ブランチから boldOnly 分岐を削除。
- `README.md` の Bold セクションから例外の箇条書きを除去し、「位置や文脈を問わず一律」という補強を加えた。
- 既存の他テスト (`bash_array`, `cloud_run`, `column_spec`, `gcp_logs_filter`) は影響なし (該当パターンを含まないため)。

## 代替案

- **例外を維持し、`wip_commit` のような「リストアイテム全体が単一 bold」を見出し風に保つ。** 却下: 一貫性が優先。タイトル風に見せたいなら作者は Markdown 側で見出しを使えばよい。
- **例外を維持しつつ、内部 backquote だけ残す。** 却下: 出力に `[* ... `code` ... ]` が混ざるが、Scrapbox では bold がコードスパンをまたいで適用されない以上、`[* ]` のラベルとしての効果は限定的。

## 関連 ADR

- 2026-05-24T17:17:15+09:00_01_converter_conversion_rules.md: 決定 3 で導入した bold-over-code unwrap ルールおよびその例外。本 ADR はその例外部分を撤回する。
