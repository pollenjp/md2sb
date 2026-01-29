# md2sb

Markdown to Scrapbox

note: Scrapbox style is my personal preference, not the official one.

## Usage

- Access to <https://pollenjp.github.io/md2sb> and paste your markdown text at left side textarea.
- Automatically convert to Scrapbox style and display it at right side textarea.
- Copy the text at right side textarea and paste it to Scrapbox.

## Features

- section は一律で `[** ]`
  - レベルはリストの階層で分ける
  - section 名に backquote や `[]` が含まれている場合は取り除く
  - すぐ下に text code block でオリジナルのセクション名を記載する
- `---` (仕切り線) は無視して良い
  - この仕切りの前後の空白行は削除する
