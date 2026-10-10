import { existsSync, readFileSync } from 'node:fs';
import { parseDocument } from 'yaml';

const workflowPaths = ['.github/workflows/ci.yml', '.github/workflows/release.yml'];
const workflows = new Map();

for (const workflowPath of workflowPaths) {
  if (!existsSync(workflowPath)) throw new Error(`Missing workflow: ${workflowPath}`);
  const document = parseDocument(readFileSync(workflowPath, 'utf8'));
  if (document.errors.length > 0) throw new Error(`${workflowPath}: ${document.errors.map((error) => error.message).join('; ')}`);
  const value = document.toJS();
  if (!value || typeof value !== 'object') throw new Error(`${workflowPath} must contain a YAML object.`);
  workflows.set(workflowPath, value);
}

const ci = workflows.get('.github/workflows/ci.yml');
const ciTriggers = ci.on;
if (!ciTriggers?.push?.branches?.includes('main') || !('pull_request' in ciTriggers) || !('workflow_dispatch' in ciTriggers)) {
  throw new Error('CI must trigger on main pushes, pull requests, and workflow_dispatch.');
}
if (ci.permissions?.contents !== 'read') throw new Error('CI must have read-only contents permission.');

const release = workflows.get('.github/workflows/release.yml');
if (!release.on?.push?.tags?.includes('v*.*.*')) throw new Error('Release must trigger on v*.*.* tags.');
if (release.permissions?.contents !== 'read') throw new Error('Release workflow must default to read-only contents permission.');
if (release.jobs?.release?.permissions?.contents !== 'write') throw new Error('Release job must be the only job with contents: write.');

console.log('GitHub Actions workflow YAML and required safety structure are valid.');
