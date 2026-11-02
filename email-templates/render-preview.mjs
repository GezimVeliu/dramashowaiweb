import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const previewUrl = 'https://preview.invalid/auth/confirm?token=PREVIEW-NOT-REAL';
const banner = '<div style="padding:10px;background:#fff3cd;color:#503d00;text-align:center;font:700 13px Arial">LOCAL PREVIEW — LINKS AND CODE ARE NOT REAL</div>';
const outputDir = join(root, 'preview');
await mkdir(outputDir, { recursive: true });

for (const file of ['confirm-signup.html', 'reset-password.html']) {
  const source = await readFile(join(root, file), 'utf8');
  const preview = source
    .replaceAll('{{ .ConfirmationURL }}', previewUrl)
    .replaceAll('{{ .TokenHash }}', 'PREVIEW-TOKEN-HASH-NOT-REAL')
    .replaceAll('{{ .Token }}', 'PREVIEW');
  const output = preview.replace(/<body([^>]*)>/, `<body$1>${banner}`);
  await writeFile(join(outputDir, file), output);
  console.log(`Wrote email-templates/preview/${file}`);
}
