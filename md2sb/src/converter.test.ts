import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { convertToScrapbox } from './converter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testdataDir = join(__dirname, 'testdata');

const testCases = readdirSync(testdataDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

describe('convertToScrapbox', () => {
  it.each(testCases)('%s', (name) => {
    const dir = join(testdataDir, name);
    const input = readFileSync(join(dir, 'in.md'), 'utf-8');
    const expected = readFileSync(join(dir, 'out.txt'), 'utf-8');

    const actual = convertToScrapbox(input);
    const actualLines = actual.split('\n');
    const expectedLines = expected.split('\n');

    // Compare line by line for clear error messages
    for (
      let i = 0;
      i < Math.max(actualLines.length, expectedLines.length);
      i++
    ) {
      expect(actualLines[i], `Line ${i + 1}`).toBe(expectedLines[i]);
    }

    expect(actual).toBe(expected);
  });
});
