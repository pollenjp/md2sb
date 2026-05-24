# md2sb

Markdown to Scrapbox

note: Scrapbox style is my personal preference, not the official one.

## Usage

- Access to <https://pollenjp.github.io/md2sb> and paste your markdown text at left side textarea.
- Automatically convert to Scrapbox style and display it at right side textarea.
- Copy the text at right side textarea and paste it to Scrapbox.

## Features

### セクション (見出し)

- すべての見出しは `[** ...]` に統一して出力する。
- レベルはリストの階層で表現する (Markdown のレベル差をインデント段差に変換)。
  - 文書内で最も浅い見出しレベルを基準にした相対 depth で計算する。
  - 例: `## A` と `### B` が同居する文書では、`A` が col 0、`B` が 1 スペースインデント。
  - 例: `### A` と `#### B` が同居する文書では、`A` が col 0、`B` が 1 スペースインデント。
  - 見出しレベルのスキャン時、コードフェンス (` ``` `) 内の `#` 行は無視する (シェルコメント等の誤検出防止)。
- セクション名に backquote や `[]` が含まれる場合は取り除く。
  - 取り除きが発生した場合のみ、見出しの直下に元タイトルを保存するためのブロックを出力する:

    ```
    [** stripped title]
     code:txt
      original `title` with `[brackets]`
     -
    ```

  - クリーンなタイトル (`backquote / [ / ]` を含まない) では上記ブロックは出力しない。

### Bold とコードスパン

- 通常の `**bold**` は `[* bold]` に変換する。
- bold の中にインラインコードスパン (`` `...` ``) が含まれる場合は `[* ... ]` の wrapping を外し、コードスパンを優先する (Scrapbox はコードスパンをまたいで bold を適用しないため)。
- 例外: 順序付きリストアイテムの中身が単一の bold だけの場合 (例: `1. **foo `bar` baz**`) は、タイトル相当の見出し的記述とみなして `[* ... ]` で包みつつ、内部の backquote を落として出力する。

### 仕切り線 `---`

- `---` (`***` / `___` も同様) は出力には含めない。
- 前後の空白行も削除する。
- 加えて、セクションのネスト深度をリセットする。`---` の後ろに非見出し段落が続く場合、その段落は文書のトップレベルに戻る。
- `---` の後ろに別の見出しが続く場合は、その見出しが新しい depth を立て直す。

## 開発

### テスト

```sh
cd md2sb
npm test
```

テストデータは `md2sb/src/testdata/<case>/{in.md,out.txt}` 形式。
新しいケースを追加する場合は同じ構成でディレクトリを切る。

### Architecture Decision Records

設計上の意思決定は `docs/adr/<YYYY-MM>/` に Markdown で記録する。
ファイル名は `<ISO8601 タイムスタンプ>_<NN>_<task_title>.md` 形式。
