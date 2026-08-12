import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { build } from 'astro';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('production build preserves the page and its styles', async () => {
  const output = await mkdtemp(join(tmpdir(), 'inkling-build-'));

  try {
    await build({ root: pathToFileURL(root), outDir: output });

    const html = await readFile(join(output, 'index.html'), 'utf8');
    assert.match(html, /<source src="\/video\/inkling\.mp4" type="video\/mp4">/);

    const stylesheet = html.match(/href="([^"?]+\.css)"/);
    assert.ok(stylesheet, 'the page should link to its generated stylesheet');

    const css = await readFile(join(output, stylesheet[1].replace(/^\/+/, '')), 'utf8');
    assert.match(css, /\.bg-zinc-900/);
    assert.match(css, /\.sm\\:mr-0/);

    const sourceVideo = await readFile(join(root, 'public/video/inkling.mp4'));
    const builtVideo = await readFile(join(output, 'video/inkling.mp4'));
    assert.equal(hash(builtVideo), hash(sourceVideo));
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

function hash(contents) {
  return createHash('sha256').update(contents).digest('hex');
}
