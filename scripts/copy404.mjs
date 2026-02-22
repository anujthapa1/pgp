import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve(process.cwd(), 'dist');
const source = resolve(distDir, 'index.html');
const target = resolve(distDir, '404.html');

copyFileSync(source, target);
console.log('Created dist/404.html for GitHub Pages SPA fallback.');
