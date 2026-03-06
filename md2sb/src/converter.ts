export function convertToScrapbox(text: string): string {
  const rawLines = text.split('\n');
  const lines: string[] = [];

  // Preprocess to remove separators and surrounding empty lines
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i];
    if (l.trim() === '---' || l.trim() === '***' || l.trim() === '___') {
      // Remove preceding empty line
      if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
      }
      // Skip next empty line
      if (i + 1 < rawLines.length && rawLines[i + 1].trim() === '') {
        i++;
      }
      continue;
    }
    lines.push(l);
  }

  const result: string[] = [];
  let inCodeBlock = false;
  let inTable = false;

  // -1 means no header encountered yet (no indentation for content)
  let currentSectionBaseIndentLevel = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Calculate the base content indent string for the current section state
    const contentBaseIndentString =
      currentSectionBaseIndentLevel >= 0
        ? ' '.repeat(currentSectionBaseIndentLevel + 1)
        : '';

    // Code Block Handling: ```lang
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        const lang = line.trim().slice(3).trim();
        result.push(
          `${contentBaseIndentString}code:${lang || 'snippet'}`,
        );
      } else {
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      if (line.trim() !== '') {
        result.push(`${contentBaseIndentString} ${line}`);
      }
      continue;
    }

    // Empty lines - skip (Scrapbox doesn't use blank lines for separation)
    if (line.trim() === '') {
      inTable = false;
      continue;
    }

    // Reset table state for non-table lines
    if (!line.trim().startsWith('|')) {
      inTable = false;
    }

    // Headers
    const headerMatch = line.match(/^(#+)\s+(.*)/);
    if (headerMatch) {
      const rawContent = headerMatch[2]; // Original content for code block

      // For display: parse inline styles, then remove backticks and brackets
      const displayContent = parseInline(rawContent).replace(/[`\[\]]/g, '');

      // All headers use indent level 0
      currentSectionBaseIndentLevel = 0;

      // Output the header line
      result.push(`[** ${displayContent}]`);
      // Output the code:txt block for the header title with ORIGINAL content
      result.push(` code:txt`);
      result.push(`  ${rawContent}`);
      result.push(` -`);
      continue;
    }

    // Lists (Unordered)
    const listMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (listMatch) {
      const indentation = listMatch[1];
      const content = listMatch[2];
      const markdownListDepth = Math.floor(indentation.length / 2);
      const totalIndent =
        Math.max(0, currentSectionBaseIndentLevel + 1) + markdownListDepth;
      result.push(`${' '.repeat(totalIndent)}${parseInline(content)}`);
      continue;
    }

    // Lists (Ordered)
    const orderedListMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (orderedListMatch) {
      const indentation = orderedListMatch[1];
      const content = orderedListMatch[2];
      const markdownListDepth = Math.floor(indentation.length / 2);
      const totalIndent =
        Math.max(0, currentSectionBaseIndentLevel + 1) + markdownListDepth;
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
        const totalIndent = Math.max(0, currentSectionBaseIndentLevel + 1);
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
  // Split text into code spans and non-code segments
  // Inline code: `...` should be preserved as-is
  const parts = text.split(/(`[^`]+`)/);

  const processed = parts.map((part) => {
    // If this part is an inline code span, preserve it
    // Add trailing space before closing backtick if content ends with *
    // to prevent Scrapbox from interpreting it as formatting
    if (part.startsWith('`') && part.endsWith('`')) {
      const inner = part.slice(1, -1);
      if (inner.endsWith('*')) {
        return `\`${inner} \``;
      }
      return part;
    }

    let res = part;

    // Images: ![alt](url) -> [url]
    res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[$2]');

    // Links: [text](url) -> [url text]
    res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$2 $1]');

    // Bold: **text** -> [* text]
    res = res.replace(/\*\*([^*]+)\*\*/g, '[* $1]');

    // Italic: *text* -> [/ text]
    // Negative lookbehind prevents matching [* from bold notation
    res = res.replace(/(?<!\[)\*([^*]+)\*/g, '[/ $1]');

    // Strike: ~~text~~ -> [- text]
    res = res.replace(/~~([^~]+)~~/g, '[- $1]');

    return res;
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
