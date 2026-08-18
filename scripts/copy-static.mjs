import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');

await mkdir(resolve(output, 'assets'), { recursive: true });
await cp(resolve(root, 'assets'), resolve(output, 'assets'), { recursive: true });
// GSAP is bundled and tree-shaken by Vite. Do not ship the legacy standalone
// copies that remain in the source archive for the pre-remaster checkpoint.
await rm(resolve(output, 'assets', 'vendor'), { recursive: true, force: true });
