export function convertToScrapbox(text: string): string {
  const lines = text.split('\n');

  // Determine the shallowest heading level so nesting can be expressed
  // relative to it (per README: section headings collapse to [** ...] and
  // level differences are encoded as list-style indentation). Skip lines
  // inside fenced code blocks so that shell comments etc. don't pollute it.
  let minHeadingLevel = Infinity;
  {
    let inFence = false;
    for (const l of lines) {
      if (l.trim().startsWith('```')) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      const m = l.match(/^(#+)\s/);
      if (m) minHeadingLevel = Math.min(minHeadingLevel, m[1].length);
    }
  }

  const result: string[] = [];
  let inCodeBlock = false;
  let inTable = false;
  let codeBlockIndentString = '';
  let codeBlockFencePrefix = '';

  // 0 = outside any section; 1 = top-level section, 2 = nested, ...
  let sectionDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const contentBaseIndentString =
      sectionDepth > 0 ? ' '.repeat(sectionDepth) : '';

    // Code Block Handling: ```lang
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        const fencePrefix = line.match(/^(\s*)/)![1];
        const extraLevel = Math.floor(fencePrefix.length / 2);
        codeBlockFencePrefix = fencePrefix;
        codeBlockIndentString =
          contentBaseIndentString + ' '.repeat(extraLevel);
        const lang = line.trim().slice(3).trim();
        result.push(`${codeBlockIndentString}code:${lang || 'snippet'}`);
      } else {
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      if (line.trim() !== '') {
        const stripped = line.startsWith(codeBlockFencePrefix)
          ? line.slice(codeBlockFencePrefix.length)
          : line;
        result.push(`${codeBlockIndentString} ${stripped}`);
      } else {
        const nextNonEmpty = lines.slice(i + 1).find((l) => l.trim() !== '');
        if (nextNonEmpty && !nextNonEmpty.trim().startsWith('```')) {
          result.push(`${codeBlockIndentString} `);
        }
      }
      continue;
    }

    if (line.trim() === '') {
      inTable = false;
      continue;
    }

    // Horizontal rule: drop the line itself and reset section nesting so
    // any trailing closing paragraph returns to the document top level.
    if (
      line.trim() === '---' ||
      line.trim() === '***' ||
      line.trim() === '___'
    ) {
      sectionDepth = 0;
      inTable = false;
      continue;
    }

    if (!line.trim().startsWith('|')) {
      inTable = false;
    }

    // Headers
    const headerMatch = line.match(/^(#+)\s+(.*)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const rawContent = headerMatch[2];

      const displayContent = stripInlineFormatting(rawContent).replace(
        /[`\[\]]/g,
        '',
      );

      const depth = Math.max(1, level - minHeadingLevel + 1);
      sectionDepth = depth;

      const headingIndent = ' '.repeat(depth - 1);

      result.push(`${headingIndent}[** ${displayContent}]`);

      // Only emit the original-title preservation block when characters had
      // to be stripped (backquotes or square brackets) from the title.
      if (/[`\[\]]/.test(rawContent)) {
        result.push(`${headingIndent} code:txt`);
        result.push(`${headingIndent}  ${rawContent}`);
        result.push(`${headingIndent} -`);
      }
      continue;
    }

    // Lists (Unordered)
    const listMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (listMatch) {
      const indentation = listMatch[1];
      const content = listMatch[2];
      const markdownListDepth = Math.floor(indentation.length / 2);
      const totalIndent = sectionDepth + markdownListDepth;
      result.push(`${' '.repeat(totalIndent)}${parseInline(content)}`);
      continue;
    }

    // Lists (Ordered)
    const orderedListMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (orderedListMatch) {
      const indentation = orderedListMatch[1];
      const content = orderedListMatch[2];
      const markdownListDepth = Math.floor(indentation.length / 2);
      const totalIndent = sectionDepth + markdownListDepth;

      result.push(
        `${' '.repeat(totalIndent)}${parseInline('1. ' + content)}`,
      );
      continue;
    }

    // Blockquotes
    if (line.trim().startsWith('>')) {
      const quoteMatch = line.match(/^(\s*>+)\s*(.*)/);
      if (quoteMatch) {
        const quotes = quoteMatch[1].replace(/\s/g, '');
        const content = quoteMatch[2];
        const quoteDepth = quotes.length;
        const totalIndent = sectionDepth;
        const quotePrefix = '>'.repeat(quoteDepth);
        result.push(
          `${' '.repeat(totalIndent)}${quotePrefix} ${parseInline(content)}`,
        );
      }
      continue;
    }

    // Tables
    if (line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        result.push(`${contentBaseIndentString}table:x`);
      }
      const cells = line
        .split('|')
        .filter((c) => c.trim() !== '')
        .map((c) => stripInlineFormatting(c.trim()));
      result.push(`${contentBaseIndentString}\t${cells.join('\t')}`);
      continue;
    }

    // Regular text
    const indentMatch = line.match(/^(\s+)(.*)/);
    if (indentMatch) {
      const markdownLeadingSpaces = indentMatch[1];
      const content = indentMatch[2];
      const additionalIndentLevel = Math.floor(
        markdownLeadingSpaces.length / 2,
      );
      const totalIndentString =
        contentBaseIndentString + ' '.repeat(additionalIndentLevel);
      result.push(`${totalIndentString}${parseInline(content)}`);
    } else {
      result.push(`${contentBaseIndentString}${parseInline(line)}`);
    }
  }

  return result.join('\n');
}

export function parseInline(text: string): string {
  let res = text;

  // Step 1: Convert standard bold (no * inside content) to Scrapbox bold
  res = res.replace(/\*\*([^*]+)\*\*/g, '[* $1]');

  // Step 2: Drop [* ...] wrapping when the inner text contains a code span.
  // Scrapbox doesn't bold across code spans anyway, so the code span wins.
  res = res.replace(/\[\*\s+([^[\]]*`[^`]+`[^[\]]*)\]/g, '$1');

  // Step 3: Strip remaining bold that contains * (couldn't match step 1)
  res = res.replace(/\*\*((?:[^*]|\*(?!\*))+)\*\*/g, '$1');

  // Now split by code spans for remaining inline processing
  const parts = res.split(/(`[^`]+`)/);

  const processed = parts.map((part) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const inner = part.slice(1, -1);
      // Escape [* inside code spans to prevent Scrapbox bold interpretation
      const escaped = inner.replace(/\[\*/g, '[]');
      // Add trailing space if content ends with * (but not for single-char *)
      if (escaped.endsWith('*') && escaped.length > 1) {
        return `\`${escaped} \``;
      }
      return `\`${escaped}\``;
    }

    let r = part;

    // Images: ![alt](url) -> [url]
    r = r.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[$2]');

    // Links: [text](url) -> [url text]
    r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$2 $1]');

    // Italic: *text* -> [/ text]
    // Negative lookbehind prevents matching [* from bold notation
    r = r.replace(/(?<!\[)\*([^*]+)\*/g, '[/ $1]');

    // Strike: ~~text~~ -> [- text]
    r = r.replace(/~~([^~]+)~~/g, '[- $1]');

    return r;
  });

  return processed.join('');
}

function stripInlineFormatting(text: string): string {
  let res = text;
  res = res.replace(/\*\*([^*]+)\*\*/g, '$1');
  res = res.replace(/\*([^*]+)\*/g, '$1');
  res = res.replace(/~~([^~]+)~~/g, '$1');
  return res;
}
