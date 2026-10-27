import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exerciseVideo, parseYouTubeId, youtubeSearch } from '../lib/youtube';
import { catalog, freshData } from '../constants/catalog';
import { parseBackup, serializeBackup, validateData } from '../lib/fitness';
test('YouTube links normalize supported formats and reject foreign hosts and unsafe values', () => {
  for (const link of [
    'https://youtu.be/5Y3KW5rWMh4?t=10',
    'https://www.youtube.com/watch?v=5Y3KW5rWMh4&list=foo',
    'https://youtube.com/shorts/5Y3KW5rWMh4',
    'https://www.youtube.com/embed/5Y3KW5rWMh4',
    '5Y3KW5rWMh4',
  ])
    assert.equal(parseYouTubeId(link), '5Y3KW5rWMh4');
  for (const link of [
    'https://youtube.com.evil.test/watch?v=5Y3KW5rWMh4',
    'https://evil.test/5Y3KW5rWMh4',
    'javascript:alert(1)',
    'not a video',
    'https://youtube.com/playlist?list=abc',
  ])
    assert.equal(parseYouTubeId(link), null);
});
test('exercise demos follow the actual alternative, allow overrides, and resolve all catalog exercises', () => {
  const primary = catalog.find((x) => x.id === 'learn-legpress')!;
  const alt = catalog.find((x) => x.id === 'alt-legpress')!;
  assert.equal(exerciseVideo(primary, {}), 'sEM_zo9w2ss');
  assert.equal(exerciseVideo(alt, {}), '5Y3KW5rWMh4');
  assert.equal(exerciseVideo(primary, { [primary.id]: '5Y3KW5rWMh4' }), '5Y3KW5rWMh4');
  // RDL now has a curated video ID (Alan Thrall)
  assert.equal(exerciseVideo(catalog.find((x) => x.id === 'rdl')!, {}), 'hCDzSR6Tgow');
  // All simple catalog exercises should resolve to a valid 11-char video ID
  const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
  for (const exercise of catalog.filter((x) => !x.id.startsWith('learn-') && !x.id.startsWith('alt-'))) {
    const id = exerciseVideo(exercise, {});
    assert.ok(id && videoIdPattern.test(id), `${exercise.id} should have a valid video ID, got: ${String(id)}`);
  }
  // Vimeo entry (cablerow) is now replaced with a valid YouTube ID
  const cablerow = catalog.find((x) => x.id === 'learn-cablerow')!;
  const cableId = exerciseVideo(cablerow, {});
  assert.ok(cableId && videoIdPattern.test(cableId), `cablerow should now resolve a YouTube ID, got: ${String(cableId)}`);
  assert.ok(youtubeSearch(primary).includes('Leg%20press'));
});
test('chosen demos survive validated backup round trip; old settings gain an empty map', () => {
  const data = freshData();
  data.settings.exerciseVideos.squat = '5Y3KW5rWMh4';
  assert.equal(parseBackup(serializeBackup(data)).settings.exerciseVideos.squat, '5Y3KW5rWMh4');
  const old = JSON.parse(JSON.stringify(data));
  delete old.settings.exerciseVideos;
  assert.deepEqual(validateData(old).settings.exerciseVideos, {});
  data.settings.exerciseVideos.squat = 'https://evil.test';
  assert.throws(() => validateData(data));
});
