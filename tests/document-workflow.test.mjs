import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientPdfFilename, documentPlaceholders, fillDocumentPlaceholders } from '../src/lib/documentWorkflow.js';
import { applyAction, emptyWorkspace, normalise } from '../src/lib/workspace.js';

test('fill only known client and project tokens, leaving other details for review', () => {
  const body = '[Client name] / [Project name] / [Kickoff date] / [Kickoff date] / [constructor]';
  const filled = fillDocumentPlaceholders(body, { name: 'Client $&' }, { name: 'Website' });
  assert.equal(filled, 'Client $& / Website / [Kickoff date] / [Kickoff date] / [constructor]');
  assert.deepEqual(documentPlaceholders({ body: filled }, ['title', 'body']), ['[Kickoff date]', '[constructor]']);
  assert.equal(clientPdfFilename('Occusmart', 'Welcome / Pack'), 'Occusmart-Welcome-Pack.pdf');
});

test('update and restore a document while preserving its links and status', () => {
  const state = applyAction(emptyWorkspace(), { type: 'ADD_PROPOSAL', payload: {
    title: 'Welcome Pack', status: 'Sent', projectId: 'project-1', clientId: 'client-1',
  } });
  const [document] = state.proposals;
  const update = (source, archivedAt) => applyAction(source, {
    type: 'UPDATE_PROPOSAL', id: document.id, payload: { archivedAt },
  });
  const archived = normalise(JSON.parse(JSON.stringify(update(state, '2026-11-18T10:00:00Z'))));
  assert.ok(archived.proposals[0].archivedAt);
  assert.deepEqual(update(archived, '').proposals[0], { ...document, archivedAt: '' });
});
