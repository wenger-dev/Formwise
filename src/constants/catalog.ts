import reference from './referenceExercises.json';
import { AppData, Exercise, Plan } from '../types/domain';
const rows: [string, string, string, string, string[], string][] = [
  [
    'squat',
    'Goblet squat',
    'Legs',
    'Dumbbells',
    [
      'Hold a dumbbell close to your chest and stand with feet about shoulder-width apart.',
      'Sit down between your hips, keeping your whole foot grounded.',
      'Stand tall, driving through your feet.',
    ],
    'Start light and use a comfortable depth.',
  ],
  [
    'bench',
    'Dumbbell bench press',
    'Chest',
    'Dumbbells',
    [
      'Lie on a bench with feet planted and dumbbells beside your chest.',
      'Press upward with wrists over elbows.',
      'Lower slowly, keeping shoulders supported.',
    ],
    'Use a manageable load; ask for help getting into position if needed.',
  ],
  [
    'row',
    'One-arm dumbbell row',
    'Back',
    'Dumbbells',
    [
      'Support one hand on a stable bench and hinge at the hips.',
      'Pull the dumbbell toward your hip without rotating your trunk.',
      'Lower with control and repeat on both sides.',
    ],
    'Repetitions are per side.',
  ],
  [
    'rdl',
    'Romanian deadlift',
    'Glutes',
    'Dumbbells',
    [
      'Stand tall with soft knees and dumbbells in front of your thighs.',
      'Push your hips back while keeping the weights close.',
      'Return to standing when you feel a comfortable hamstring stretch.',
    ],
    'Keep your back comfortable and stop before your position changes.',
  ],
  [
    'press',
    'Overhead press',
    'Shoulders',
    'Dumbbells',
    [
      'Hold dumbbells near shoulder height with elbows underneath.',
      'Brace your trunk and press overhead.',
      'Lower steadily without arching your lower back.',
    ],
    'Use a pain-free range of motion.',
  ],
  [
    'pulldown',
    'Lat pulldown',
    'Back',
    'Full gym',
    [
      'Sit with thighs secured and take a comfortable grip.',
      'Pull the bar toward your upper chest with elbows down.',
      'Return slowly without swinging.',
    ],
    'Avoid pulling the bar behind your neck.',
  ],
  [
    'lunge',
    'Reverse lunge',
    'Legs',
    'Bodyweight',
    [
      'Stand tall and step one foot backward.',
      'Bend both knees and lower within a comfortable range.',
      'Push through the front foot to return. Alternate sides.',
    ],
    'Use support for balance; count repetitions per side.',
  ],
  [
    'pushup',
    'Push-up',
    'Chest',
    'Bodyweight',
    [
      'Place hands slightly wider than shoulders on a floor or stable raised surface.',
      'Keep a straight line from shoulders through hips.',
      'Lower your chest, then push away from the surface.',
    ],
    'Raise your hands on a bench to reduce difficulty.',
  ],
  [
    'plank',
    'Plank shoulder tap',
    'Core',
    'Bodyweight',
    [
      'Start in a high plank with feet comfortably wide.',
      'Lift one hand and tap the opposite shoulder.',
      'Alternate with minimal hip movement.',
    ],
    'Count each tap as one repetition.',
  ],
  [
    'curl',
    'Dumbbell curl',
    'Arms',
    'Dumbbells',
    [
      'Stand with arms at your sides and palms forward.',
      'Bend your elbows without swinging.',
      'Lower the weights slowly.',
    ],
    'Keep elbows near your sides.',
  ],
  [
    'triceps',
    'Cable triceps pushdown',
    'Arms',
    'Full gym',
    [
      'Stand at a cable station with elbows by your sides.',
      'Extend your elbows and press the handle down.',
      'Return under control without moving your upper arms.',
    ],
    'Keep wrists comfortable.',
  ],
  [
    'bridge',
    'Glute bridge',
    'Glutes',
    'Bodyweight',
    [
      'Lie on your back with knees bent and feet flat.',
      'Press through your feet and lift your hips.',
      'Pause, then lower slowly.',
    ],
    'Avoid overextending your lower back.',
  ],
  [
    'bandrow',
    'Resistance band row',
    'Back',
    'Resistance bands',
    [
      'Secure a band to a suitable anchor at chest height.',
      'Pull your elbows back while standing tall.',
      'Return slowly while keeping tension.',
    ],
    'Inspect the band and anchor before starting.',
  ],
  [
    'calf',
    'Standing calf raise',
    'Legs',
    'Bodyweight',
    [
      'Stand beside support with feet hip-width apart.',
      'Rise onto the balls of your feet.',
      'Lower slowly to the floor.',
    ],
    'Use support for balance.',
  ],
  [
    'march',
    'Standing knee march',
    'Cardio',
    'Bodyweight',
    [
      'Stand tall with arms relaxed.',
      'Lift one knee toward waist height, then lower.',
      'Alternate at a comfortable, steady pace.',
    ],
    'Count each knee lift as one repetition.',
  ],
  [
    'bird',
    'Bird dog',
    'Core',
    'Bodyweight',
    [
      'Start on hands and knees with a steady spine.',
      'Extend the opposite arm and leg.',
      'Return slowly and alternate sides.',
    ],
    'Keep your hips level; count each extension.',
  ],
  [
    'mobility',
    'Cat-cow',
    'Mobility',
    'Bodyweight',
    [
      'Start on hands and knees.',
      'Gently round your back while exhaling.',
      'Reverse the movement comfortably while inhaling.',
    ],
    'Move slowly within a comfortable range.',
  ],
  [
    'inclinepress',
    'Incline dumbbell press',
    'Chest',
    'Dumbbells',
    [
      'Set a bench to 30–45 degrees and place a dumbbell on each knee.',
      'Press upward with wrists stacked over elbows.',
      'Lower slowly until you feel a comfortable stretch.',
    ],
    'Think "press up and slightly back" to hit the upper chest.',
  ],
  [
    'lateralraise',
    'Dumbbell lateral raise',
    'Shoulders',
    'Dumbbells',
    [
      'Stand tall with light dumbbells at your sides.',
      'Raise both arms out to shoulder height with a soft elbow bend.',
      'Lower slowly — the lowering phase builds the muscle.',
    ],
    'Lead with your elbows, not your wrists. Keep it light.',
  ],
  [
    'hipthrust',
    'Dumbbell hip thrust',
    'Glutes',
    'Dumbbells',
    [
      'Sit on the floor with upper back against a bench and a dumbbell across your hips.',
      'Drive through your heels and squeeze glutes to lift your hips.',
      'Lower slowly without overarching your lower back.',
    ],
    'Squeeze at the top for a full second.',
  ],
  [
    'splitsquat',
    'Bulgarian split squat',
    'Legs',
    'Dumbbells',
    [
      'Stand in front of a bench and place your rear foot on it.',
      'Lower your back knee toward the floor with control.',
      'Drive through your front heel to stand; keep knees tracking over toes.',
    ],
    'Practice bodyweight first before adding load.',
  ],
  [
    'facepull',
    'Cable face pull',
    'Shoulders',
    'Full gym',
    [
      'Set the cable to eye height with a rope attachment.',
      'Pull the rope toward your face, driving elbows out and back.',
      'Return slowly with controlled tension.',
    ],
    'Drive elbows back and apart — great for shoulder health.',
  ],
  [
    'cablefly',
    'Cable chest fly',
    'Chest',
    'Full gym',
    [
      'Set cables to chest height and step forward holding one handle in each hand.',
      'Bring handles together in a wide arc in front of your chest.',
      'Return slowly without letting the cable jerk you back.',
    ],
    'Imagine hugging a big tree — round arms, not bent elbows.',
  ],
  [
    'barbellrow',
    'Barbell bent-over row',
    'Back',
    'Full gym',
    [
      'Hinge at the hips, grip the barbell just outside your legs.',
      'Pull the bar toward your lower chest, leading with your elbows.',
      'Lower with control; keep a flat back throughout.',
    ],
    'Brace your core before every rep.',
  ],
  [
    'benchdip',
    'Bench dip',
    'Arms',
    'Bodyweight',
    [
      'Place hands on the edge of a sturdy bench, fingers forward.',
      'Bend elbows to lower your body through a comfortable range.',
      'Push back up without fully locking the elbows.',
    ],
    'Keep elbows pointed straight back, not flaring out.',
  ],
  [
    'calfmachine',
    'Seated calf raise',
    'Legs',
    'Full gym',
    [
      'Sit with the machine pad just above your knees.',
      'Rise onto the balls of your feet as high as comfortable.',
      'Lower slowly until you feel a full calf stretch.',
    ],
    'Pause at the top and bottom for full range of motion.',
  ],
];
export const catalog: Exercise[] = rows.map(
  ([id, name, muscle, equipment, instructions, notes]) => ({
    id,
    name,
    muscle,
    equipment,
    instructions,
    notes,
    secondary: [],
    category: muscle,
    sets: 3,
    reps: muscle === 'Core' ? 12 : 10,
    rest: 60,
  }),
);
// Reference content is data only; keep its personal defaults out of native state.
export const referenceGuides = Object.fromEntries(
  Object.entries(reference).map(([key, value]) => ['learn-' + key, value]),
);
const BODYWEIGHT_KEYS = new Set([
  'deadbug', 'chairsquat', 'wallpushup', 'glutebridge', 'calfraise',
  'tricepdip',
]);
const DUMBBELL_KEYS = new Set([
  'gobletsquat', 'inclinebench', 'hipthrust', 'splitsquat', 'dumbbellshoulder',
]);
const CABLE_KEYS = new Set(['cablerow', 'cablefly', 'facepull']);
for (const [key, value] of Object.entries(reference)) {
  const refMuscles: string = (value as any).muscles ?? '';
  const muscle = refMuscles.includes('Back')
    ? 'Back'
    : refMuscles.includes('Chest')
      ? 'Chest'
      : refMuscles.includes('Shoulder') || refMuscles.includes('shoulder')
        ? 'Shoulders'
        : refMuscles.includes('Core') || refMuscles.includes('core')
          ? 'Core'
          : refMuscles.includes('Glute') || refMuscles.includes('glute')
            ? 'Glutes'
            : refMuscles.includes('Calve') || key === 'calfraise' || key === 'calfmachine'
              ? 'Legs'
              : refMuscles.includes('Cardio') || key === 'treadmill'
                ? 'Cardio'
                : 'Legs';
  const equipment = BODYWEIGHT_KEYS.has(key)
    ? 'Bodyweight'
    : DUMBBELL_KEYS.has(key)
      ? 'Dumbbells'
      : CABLE_KEYS.has(key)
        ? 'Full gym'
        : 'Full gym';
  catalog.push({
    id: 'learn-' + key,
    name: value.name,
    muscle,
    secondary: [],
    equipment,
    category: 'Beginner',
    instructions: value.how,
    notes: value.cue,
    sets: 1,
    reps: 10,
    rest: 90,
  });
  const altEquip: string = (value as any).alternative?.equipment ?? '';
  catalog.push({
    id: 'alt-' + key,
    name: value.alternative.name,
    muscle,
    secondary: [],
    equipment: altEquip.includes('Dumbbell')
      ? 'Dumbbells'
      : altEquip.includes('band') || altEquip.includes('Band')
        ? 'Resistance bands'
        : altEquip.includes('Cable') || altEquip.includes('cable')
          ? 'Full gym'
          : 'Bodyweight',
    category: 'Alternative',
    instructions: value.alternative.steps.split(/\d+\.\s*/).filter(Boolean),
    notes: 'Alternative from the beginner guide. Choose a comfortable load and range.',
    sets: 1,
    reps: 10,
    rest: 90,
  });
}
export const beginnerPlanIds = ['beginner-a', 'beginner-b', 'beginner-home'];
export const beginnerPlans = (): Plan[] =>
  [
    [
      'beginner-a',
      'Beginner A · Gym',
      ['legpress', 'latpulldown', 'chestpress', 'legcurl', 'cablerow'],
    ],
    [
      'beginner-b',
      'Beginner B · Gym',
      ['gobletsquat', 'chestrow', 'shoulderpress', 'legextension', 'deadbug'],
    ],
    [
      'beginner-home',
      'Beginner · Home',
      ['chairsquat', 'wallpushup', 'glutebridge', 'calfraise', 'deadbug'],
    ],
  ].map(([id, name, ids]) => ({
    ...makePlan(
      id as string,
      name as string,
      '12-week beginner program · start with one controlled set.',
      (ids as string[]).map((x) => 'learn-' + x),
    ),
    exercises: (ids as string[]).map((x, i) => ({
      id: String(id) + '-' + i,
      exerciseId: 'learn-' + x,
      sets: 1,
      reps: 10,
      rest: 90,
      weight: null,
    })),
  }));
const makePlan = (id: string, name: string, description: string, ids: string[]): Plan => ({
  id,
  name,
  description,
  template: true,
  archived: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
  exercises: ids.map((exerciseId, i) => ({
    id: `${id}-${i}`,
    exerciseId,
    sets: 3,
    reps: 10,
    rest: 60,
    weight: null,
  })),
});
export const starterPlans: Plan[] = [
  makePlan(
    'full-body',
    'Full body foundations',
    'A balanced beginning. Build confidence, one good rep at a time.',
    ['squat', 'bench', 'row', 'rdl', 'plank'],
  ),
  makePlan('upper', 'Upper body strength', 'Push, pull, and find your strength.', [
    'bench',
    'row',
    'press',
    'pulldown',
    'curl',
  ]),
  makePlan('lower', 'Lower body essentials', 'A strong foundation for everything you do.', [
    'squat',
    'rdl',
    'lunge',
    'bridge',
    'calf',
  ]),
  makePlan('push', 'Push day', 'Chest, shoulders, and triceps.', [
    'bench',
    'inclinepress',
    'press',
    'pushup',
    'triceps',
  ]),
  makePlan('pull', 'Pull day', 'Back and arms, with control.', [
    'row',
    'pulldown',
    'curl',
    'bandrow',
    'facepull',
  ]),
  makePlan(
    'bodyweight',
    'Anywhere, anytime',
    'No equipment. Just you and a little momentum.',
    ['pushup', 'lunge', 'bridge', 'bird', 'benchdip'],
  ),
  makePlan('quick', 'The 15-minute reset', 'A short bodyweight session for busy days.', [
    'march',
    'pushup',
    'bridge',
    'mobility',
  ]),
  makePlan(
    'glutes-hypertrophy',
    'Glute builder',
    'Focused posterior chain work — hips, hamstrings, and glutes.',
    ['hipthrust', 'rdl', 'splitsquat', 'bridge', 'calfmachine'],
  ),
  makePlan(
    'chest-shoulders',
    'Chest & shoulders',
    'Upper body push strength and shoulder health.',
    ['bench', 'inclinepress', 'cablefly', 'lateralraise', 'facepull'],
  ),
  makePlan(
    'back-biceps',
    'Back & biceps',
    'Pull strength from every angle.',
    ['barbellrow', 'pulldown', 'row', 'facepull', 'curl'],
  ),
];
starterPlans
  .find((p) => p.id === 'quick')!
  .exercises.forEach((e) => {
    e.sets = 2;
    e.rest = 30;
  });
export const freshData = (): AppData => ({
  profile: {
    name: '',
    age: null,
    heightCm: null,
    goal: 'Build consistency',
    experience: 'Beginner',
    equipment: 'Full gym',
    days: [1, 3, 5],
    duration: 45,
    weeklyTarget: 3,
    onboarded: false,
    preferredPlanId: null,
  },
  settings: {
    exerciseVideos: {},
    units: 'metric',
    rest: 60,
    haptics: true,
    bodyweight: true,
    reminder: { enabled: false, days: [1, 3, 5], hour: 18, minute: 0, ids: [] },
  },
  plans: JSON.parse(JSON.stringify(starterPlans)),
  wellness: { waist: [], recovery: [], checks: [] },
  sessions: [],
  weights: [],
  goals: [],
});
