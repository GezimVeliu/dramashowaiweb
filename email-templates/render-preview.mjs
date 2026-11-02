import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const source = await readFile(join(root, 'confirm-signup.html'), 'utf8');
const previewUrl = 'https://preview.invalid/auth/confirm?token=PREVIEW-NOT-REAL';
const preview = source
  .replaceAll('{{ .ConfirmationURL }}', previewUrl)
  .replaceAll('{{ .Token }}', 'PREVIEW');

const banner = '<div style="padding:10px;background:#fff3cd;color:#503d00;text-align:center;font:700 13px Arial">LOCAL PREVIEW — LINKS AND CODE ARE NOT REAL</div>';
const output = preview.replace(/<body([^>]*)>/, `<body$1>${banner}`);
const outputDir = join(root, 'preview');
await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'confirm-signup.html'), output);
console.log('Wrote email-templates/preview/confirm-signup.html');
