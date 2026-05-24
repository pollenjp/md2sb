# 2026-05-24 — Converter conversion rules for Markdown → Scrapbox

- Status: Accepted
- Date: 2026-05-24T17:17:15+09:00
- Scope: `md2sb/src/converter.ts`, `md2sb/src/testdata/**`

## Context

`md2sb` converts Markdown to a Scrapbox-flavored text style preferred by the author. The README sketches a few rules ("section は一律で `[** ]`、レベルはリストの階層で分ける" / "section 名に backquote や `[]` が含まれている場合は取り除く - すぐ下に text code block でオリジナルのセクション名を記載する" / "`---` (仕切り線) は無視して良い") but several edge cases were not pinned down:

1. How to encode heading depth differences (e.g. `### + ####`, or `## + ###`) when every section collapses to `[** ]`.
2. Whether the `code:txt` echo of the original heading title is unconditional or only when characters had to be stripped.
3. How to render bold (`**...**`) when the bold range contains an inline code span.
4. What `---` means for section state when a non-heading paragraph follows it (where does the paragraph belong?).
5. How to keep heading-level detection robust when source code blocks contain `# ...` lines (shell comments etc.).

This ADR captures the decisions we made while turning the GCP Logging filter cheat-sheet (`gcp_logs_filter`) into a TDD test case and aligning the existing test cases (`bash_array`, `cloud_run`, `column_spec`, `wip_commit`) with the same set of rules.

## Decisions

### 1. Section nesting is derived from the shallowest heading

- For each document we scan all headings and record `minHeadingLevel` (smallest `#` count). Code fence contents are skipped to avoid sinking the baseline on shell comments.
- Each heading is assigned `depth = max(1, level - minHeadingLevel + 1)`.
- A heading at depth `d` is emitted with `(d - 1)` leading spaces, and its content is indented by `d` spaces. Code fences nested under the heading add one further level (`d + 1` spaces).
- Practical outcome:
  - `gcp_logs_filter` (`## ...` + `### ...`) — `##` at col 0, `###` at 1 space.
  - `cloud_run` / `column_spec` / `bash_array` (`### ...` + `#### ...`) — `###` at col 0, `####` at 1 space.
  - `wip_commit` (no `#` headings) — `sectionDepth` stays 0, behavior unchanged.

### 2. The original-title `code:txt` echo is conditional

Only emit the ` code:txt\n  <raw title>\n -` block immediately after a heading when the raw title contains characters that the display form drops — currently backquote `` ` `` or square brackets `[` / `]`. Clean titles render as `[** title]` alone.

Rationale: the echo exists to preserve information that the display title cannot show. For a title like `### ポイント解説` the echo is pure duplication and clutters the output.

### 3. Bold containing a code span is unwrapped (code span wins)

If `**...**` content contains an inline code span (`` `...` ``), the surrounding bold markers are dropped and the inner text is emitted plain (with code spans preserved). This is implemented by extending the existing "starts-with-code-span" unwrap rule to "code span anywhere inside the `[* ...]` range" in `parseInline`.

Rationale: Scrapbox does not apply bold across a code span anyway, so wrapping with `[* ... ]` is misleading and visually noisy. Prefer the code span.

Exception (kept from existing behavior): for an ordered-list item whose **entire** content is a single bold expression (`1. **foo `bar` baz**`), the bold is treated as a title-style entry. We keep the `[* ... ]` wrapping and strip the inner backquotes so the title reads cleanly. This is the wip_commit pattern.

### 4. `---` resets the section depth

A horizontal-rule line (`---` / `***` / `___`) is dropped from the output (per the README), and additionally resets `sectionDepth` to 0. Any non-heading paragraph that follows therefore renders at the document top level.

Rationale: a `---` followed by a closing paragraph is the author's signal that the paragraph belongs to the whole document, not to the most recent heading. Resetting on `---` makes that intent explicit and is symmetric with the README's "仕切り" wording. When `---` is followed by another heading, the heading re-establishes the new depth, so existing behavior is preserved.

Side effect: `bash_array`'s closing question paragraph, which previously rendered at one-space indent inside the last section, is now at column 0. The test data was updated accordingly.

### 5. Heading-level scan skips fenced code blocks

The `minHeadingLevel` pre-scan tracks an in-fence flag and ignores `#`-prefixed lines inside fenced code blocks. Without this, a bash code block containing a comment like `# サンプル配列…` would set `minHeadingLevel = 1`, sinking every real `###` heading two levels deeper than intended.

## Consequences

- All five test cases now pass under the unified rule set.
- `bash_array/out.txt` was updated in three places:
  - Two inline `[* ... `code` ...]` ranges in paragraph text are now emitted without the bold wrapping.
  - The closing question paragraph is at column 0 (consequence of decision #4).
- `cloud_run/out.txt`, `column_spec/out.txt`, and `gcp_logs_filter/out.txt` were updated to apply decisions #1 and #2 (nesting + conditional echo).
- The conversion is now more sensitive to the *shape* of the document (relative heading depths, code-block-aware heading scan). Authors writing markdown for this tool should be aware that the shallowest heading defines the document's top level.

## Alternatives considered

- **Bold-with-code: only strip when code span is at the start.** Rejected because gcp_logs_filter item 2 has a mid-line code span and the author confirmed it should also be unwrapped. The rule needed to be uniform.
- **`---` does not reset section depth.** Rejected because the gcp_logs_filter closing summary `**運用ヒント**:` would have rendered at 2-space indent under `### 特定 VM` — clearly not the intent.
- **Absolute heading-level mapping (h1 → 0 indent, h2 → 1, ...).** Rejected: documents that start at `###` (very common in pasted chat replies) would render every heading two spaces deep. Relative mapping keeps the output compact.

## Follow-ups

- The README's wording ("section は一律で `[** ]`、レベルはリストの階層で分ける") still does not explicitly mention the conditional echo, the bold-over-code rule, or the `---` reset. Consider folding the decisions into the README so future contributors don't rediscover them via tests.
- The test harness compares full strings; trailing whitespace inside code blocks (e.g. the `  ` blank line representation) is significant. If we ever auto-format the test fixtures we'll need a rule that preserves these.
