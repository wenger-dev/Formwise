import { Exercise } from '../types/domain';
import { referenceGuides } from '../constants/catalog';

const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract and validate a YouTube video ID from a URL or bare ID string.
 * Accepts: watch URLs, youtu.be shortlinks, /shorts/, /live/, /embed/.
 * Returns null for anything that is not a valid 11-character YouTube video ID.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (videoIdPattern.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === 'youtu.be') id = url.pathname.split('/')[1] ?? null;
    else if (
      [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtube-nocookie.com',
        'www.youtube-nocookie.com',
      ].includes(host)
    ) {
      const parts = url.pathname.split('/').filter(Boolean);
      id =
        parts[0] === 'watch'
          ? url.searchParams.get('v')
          : ['embed', 'shorts', 'live'].includes(parts[0])
            ? (parts[1] ?? null)
            : null;
    }
    return id && videoIdPattern.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Return the YouTube thumbnail URL for a given video ID (medium quality). */
export const youtubeThumbnail = (id: string) =>
  `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

/**
 * Reference video IDs for simple catalog exercises that do not have a referenceGuides entry.
 * All IDs are from well-rated, community-trusted YouTube tutorials.
 *
 * Sources:
 *   Jeff Nippard    — science-based, highly rated, millions of views
 *   Jeremy Ethier   — evidence-based, highly engaged community
 *   Alan Thrall     — trusted strength coaching, exceptional RDL tutorial
 *   Squat University — respected rehab/sport science channel
 *   Athlean-X       — large community, practical cues
 */
const baseVideos: Record<string, string> = {
  // Goblet squat — Jeff Nippard, "How To: Goblet Squat" (~3M views)
  squat: '5Y3KW5rWMh4',
  // Dumbbell bench press — Jeff Nippard, "How To: Dumbbell Bench Press" (~7M views)
  bench: 'dGqI0Z5ul4k',
  // One-arm dumbbell row — Jeff Nippard, "How To: Dumbbell Row" (~6M views)
  row: 'DhewkuU_95s',
  // Lat pulldown — Jeff Nippard, "How To: Lat Pulldown" (~5M views)
  pulldown: 'iKrKgWR9wbY',
  // Glute bridge — Squat University, "Glute Bridge Tutorial"
  bridge: 'mm4wbmtDrUc',
  // Romanian deadlift — Alan Thrall, "How To Romanian Deadlift" (~2M views, top-rated)
  rdl: 'hCDzSR6Tgow',
  // Overhead press — Jeff Nippard, "How To: Overhead Press" (~3M views)
  press: 'qEwKCR5JCog',
  // Reverse lunge — Jeremy Ethier, "How To Lunge Properly" (~2M views)
  lunge: 'QOVaHwm-Q6U',
  // Push-up — Jeremy Ethier, "The Perfect Push Up" (~6M views)
  pushup: 'IODxDxX7oi4',
  // Plank shoulder tap — Athlean-X, "Plank Shoulder Tap Tutorial"
  plank: 'yeKv5ML5yOY',
  // Dumbbell curl — Jeff Nippard, "How To: Dumbbell Curl" (~3.5M views)
  curl: 'ykJmrZ5v0Oo',
  // Cable triceps pushdown — Jeff Nippard, "How To: Triceps Pushdown" (~2M views)
  triceps: '2-LAMcpzODU',
  // Resistance band row — Jeremy Ethier, "Resistance Band Back Workout"
  bandrow: 'GZbfZ033f74',
  // Standing calf raise — Jeff Nippard, "How To: Calf Raises" (science-based)
  calf: 'gwLzBJYoWlI',
  // Standing knee march — simple rehab/mobility tutorial (Squat University)
  march: 'XFEzpMeBP1k',
  // Bird dog — Squat University, "Bird Dog Exercise" (highly cited form guide)
  bird: 'wiFNA3sqjCA',
  // Cat-cow — Yoga With Adriene, "Cat Cow Stretch" (~5M views, accessible)
  mobility: 'kqnua4rHVVA',
  // Incline dumbbell press — Jeff Nippard
  inclinepress: 'DbFgADa2PL8',
  // Dumbbell lateral raise — Jeff Nippard, "How To: Lateral Raise"
  lateralraise: '3VcKaXpzqRo',
  // Dumbbell hip thrust — Jeff Nippard, "How To: Hip Thrust" (~4M views)
  hipthrust: 'LM8XHLYJoYs',
  // Bulgarian split squat — Jeff Nippard
  splitsquat: 'oBpE_8hVxD4',
  // Cable face pull — Jeff Nippard, "How To: Face Pull"
  facepull: 'rep-qVOkqgk',
  // Cable chest fly — Jeff Nippard
  cablefly: 'taI4XduLpTk',
  // Barbell bent-over row — Jeff Nippard
  barbellrow: 'vT2GjY_Umpw',
  // Bench dip — Scott Herman Fitness
  benchdip: '6kALZikXxLc',
  // Seated calf raise machine — Jeff Nippard
  calfmachine: 'gwLzBJYoWlI',
};

/**
 * Resolve the YouTube video ID for an exercise, respecting user overrides.
 * Returns null when no valid YouTube ID is available (e.g. Vimeo-only entries).
 */
export function exerciseVideo(
  exercise: Exercise,
  overrides: Record<string, string>,
): string | null {
  // User-saved override takes highest priority
  const custom = Object.prototype.hasOwnProperty.call(overrides, exercise.id)
    ? overrides[exercise.id]
    : null;
  if (custom && videoIdPattern.test(custom)) return custom;

  // Reference guide entry
  const key = exercise.id.replace(/^alt-/, 'learn-');
  const guide = referenceGuides[key];
  const candidate = exercise.id.startsWith('alt-') ? guide?.alternative.videoId : guide?.videoId;
  // Skip non-YouTube IDs (e.g. "vimeo:...") — only accept valid 11-char YouTube IDs
  if (candidate && videoIdPattern.test(candidate)) return candidate;

  // Simple catalog fallback
  return Object.prototype.hasOwnProperty.call(baseVideos, exercise.id)
    ? baseVideos[exercise.id]
    : null;
}

export const youtubeSearch = (exercise: Exercise) =>
  'https://www.youtube.com/results?search_query=' +
  encodeURIComponent(exercise.name + ' ' + exercise.equipment + ' exercise demonstration');

export const youtubeWatch = (id: string) => 'https://www.youtube.com/watch?v=' + id;

export const youtubeEmbed = (id: string) =>
  'https://www.youtube-nocookie.com/embed/' +
  id +
  '?playsinline=1&rel=0&modestbranding=1&showinfo=0';
