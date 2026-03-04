import './style.css'
import { convertToScrapbox } from './converter'

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
