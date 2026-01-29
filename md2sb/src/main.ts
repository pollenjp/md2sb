import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>md2sb</h1>
    <p class="description">Markdown to Scrapbox Converter</p>
    <div class="container">
      <div class="panel">
        <div class="label">
            Markdown Input
            <button id="clear-btn" class="action-btn">Clear</button>
        </div>
        <textarea id="input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Paste your Markdown text here..."></textarea>
      </div>
      <div class="panel">
        <div class="label">
            Scrapbox Output
            <button id="copy-btn" class="action-btn">Copy</button>
        </div>
        <textarea id="output" readonly autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Result will appear here..."></textarea>
      </div>
    </div>
  </div>
`

const inputEl = document.querySelector<HTMLTextAreaElement>('#input')!
const outputEl = document.querySelector<HTMLTextAreaElement>('#output')!
const copyBtn = document.querySelector<HTMLButtonElement>('#copy-btn')!
const clearBtn = document.querySelector<HTMLButtonElement>('#clear-btn')!

// Event Listeners
inputEl.addEventListener('input', () => {
    convert();
})

copyBtn.addEventListener('click', async () => {
    if (!outputEl.value) return;
    try {
        await navigator.clipboard.writeText(outputEl.value);
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        setTimeout(() => copyBtn.innerText = originalText, 2000);
    } catch (err) {
        console.error('Failed to copy!', err);
    }
})

clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
})

// Conversion Logic
function convert() {
    const markdown = inputEl.value
    outputEl.value = convertToScrapbox(markdown)
}

function convertToScrapbox(text: string): string {
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
          if (i + 1 < rawLines.length && rawLines[i+1].trim() === '') {
              i++;
          }
          continue;
      }
      lines.push(l);
  }

  const result: string[] = [];
  let inCodeBlock = false;
  
  // State for indentation level based on headers
  let currentSectionBaseIndentLevel = 0; // Default to 0 (equivalent to H2 level start)

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Calculate the base content indent string for the current section state
    const contentBaseIndentString = ' '.repeat(currentSectionBaseIndentLevel + 1);

    // Code Block Handling: ```lang
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        const lang = line.trim().slice(3).trim();
        result.push(`code:${lang || 'snippet'}`);
      } else {
        inCodeBlock = false;
        // Scrapbox code blocks don't have an explicit end token like ```
        // So we just don't output anything for the closing ```
      }
      continue;
    }

    if (inCodeBlock) {
      result.push(' ' + line); // Indent code content with one space
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
        result.push('');
        continue;
    }

    // Headers
    const headerMatch = line.match(/^(#+)\s+(.*)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const rawContent = headerMatch[2]; // Original content for code block
      
      // For display: parse inline styles, then remove backticks and brackets per requirement
      const displayContent = parseInline(rawContent).replace(/[`\[\]]/g, '');
      
      // Calculate base indent for the header itself (H2 -> 0, H3 -> 1, etc.)
      const headerIndentLevel = Math.max(0, level - 2);
      const headerIndentString = ' '.repeat(headerIndentLevel);
      
      // Update the current section's base indent level
      currentSectionBaseIndentLevel = headerIndentLevel;

      // Output the header line with cleaned content
      result.push(`${headerIndentString}[** ${displayContent}]`);
      // Output the code:txt block for the header title with ORIGINAL content
      result.push(`${headerIndentString} code:txt`); 
      result.push(`${headerIndentString}  ${rawContent}`); 
      result.push(''); // Add an empty line after the header's code:txt block for separation
      continue;
    }

    // Lists (Unordered)
    // Matches "- ", "* ", "+ " at start of line
    const listMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (listMatch) {
      const indentation = listMatch[1]; // spaces from markdown
      const content = listMatch[2];
      
      // Calculate markdown list depth (2 spaces = 1 level)
      const markdownListDepth = Math.floor(indentation.length / 2);
      
      // Total indentation for the list item:
      // currentSectionBaseIndentLevel (from header) + 1 (for content) + markdownListDepth
      const totalIndentString = ' '.repeat(currentSectionBaseIndentLevel + 1 + markdownListDepth);
      
      result.push(`${totalIndentString}${parseInline(content)}`);
      continue;
    }
    
    // Lists (Ordered) - treated as unordered lists in Scrapbox usually, or just text
    // Matches "1. "
    const orderedListMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (orderedListMatch) {
        const indentation = orderedListMatch[1];
        const content = orderedListMatch[2];
        const markdownListDepth = Math.floor(indentation.length / 2);
        
        const totalIndentString = ' '.repeat(currentSectionBaseIndentLevel + 1 + markdownListDepth);
        // Prefix with "1. " to keep context, then parse inline
        result.push(`${totalIndentString}${parseInline("1. " + content)}`);
        continue;
    }

    // Blockquotes
    if (line.trim().startsWith('>')) {
       // Support nested blockquotes? > > text
       // Count >
       const quoteMatch = line.match(/^(\s*>+)\s*(.*)/);
       if (quoteMatch) {
         const quotes = quoteMatch[1].replace(/\s/g, ''); // Count actual '>' characters
         const content = quoteMatch[2];
         const quoteDepth = quotes.length;
         
         // Blockquote content is indented based on section content base, plus its own depth
         const totalIndentString = ' '.repeat(currentSectionBaseIndentLevel + 1);
         const quotePrefix = '>'.repeat(quoteDepth); // Scrapbox uses '>' for blockquotes
         
         result.push(`${totalIndentString}${quotePrefix} ${parseInline(content)}`);
       }
       continue;
    }

    // Tables - rough conversion or skip?
    // Markdown tables are complex. Simple support:
    if (line.trim().startsWith('|')) {
        // Just strip pipes and tabs? 
        // Scrapbox has table syntax: table:table_name
        // For now, treat as plain text or simple tab sep.
        // Let's just dump it as tabs, indented by contentBaseIndentString
        const cells = line.split('|').filter(c => c.trim() !== '').map(c => parseInline(c.trim()));
        result.push(contentBaseIndentString + '\t' + cells.join('\t'));
        continue;
    }

    // Regular text
    // Any regular text line is indented one level deeper than the current section's header
    // If it starts with spaces, preserve indentation relative to the contentBaseIndentString
    const indentMatch = line.match(/^(\s+)(.*)/);
    if (indentMatch) {
        const markdownLeadingSpaces = indentMatch[1];
        const content = indentMatch[2];
        // Calculate additional indent from markdown leading spaces (2 spaces = 1 level)
        const additionalIndentLevel = Math.floor(markdownLeadingSpaces.length / 2);
        const totalIndentString = contentBaseIndentString + ' '.repeat(additionalIndentLevel);
        result.push(`${totalIndentString}${parseInline(content)}`);
    } else {
        result.push(contentBaseIndentString + parseInline(line));
    }
  }

  return result.join('\n');
}

function parseInline(text: string): string {
  let res = text;

  // Images: ![alt](url) -> [url] (Scrapbox displays image if it's a direct link)
  // or [url] if just link
  res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[$2]');

  // Links: [text](url) -> [url text]
  // Beware of conflict with image regex if not careful.
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$2 $1]');

  // Bold: **text** -> [* text]
  res = res.replace(/\*\*([^*]+)\*\*/g, '[* $1]');

  // Italic: *text* -> [/ text]
  res = res.replace(/\*([^*]+)\*/g, '[/ $1]');
  
  // Strike: ~~text~~ -> [- text]
  res = res.replace(/~~([^~]+)~~/g, '[- $1]');
  
  // Code (inline): `text` -> `text` (Scrapbox adheres to same backtick syntax for inline code)

  return res;
}
