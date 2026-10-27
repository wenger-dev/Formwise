import { z } from 'zod';

const id = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[A-Za-z0-9_-]+$/,
    'Record IDs may contain only letters, digits, underscores, and hyphens.',
  );
const text = z.string().max(2000);
const positive = z.number().finite().positive();
const date = z.string().datetime();
const weekdays = z
  .array(z.number().int().min(0).max(6))
  .max(7)
  .refine((days) => new Set(days).size === days.length, 'Choose each weekday only once.');
export const exerciseSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  muscle: z.string().min(1),
  secondary: z.array(z.string()),
  equipment: z.string().min(1),
  category: z.string(),
  instructions: z.array(text).min(1),
  notes: text,
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(1000),
  rest: z.number().int().min(0).max(1800),
});
export const prescriptionSchema = z.object({
  id,
  exerciseId: id,
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(1000),
  rest: z.number().int().min(0).max(1800),
  weight: z.number().finite().min(0).max(1000).nullable(),
});
export const planSchema = z.object({
  id: id.refine((value) => value !== 'new', 'This plan ID is reserved.'),
  name: z.string().trim().min(1).max(100),
  description: text,
  template: z.boolean(),
  archived: z.boolean(),
  updatedAt: date,
  exercises: z.array(prescriptionSchema).min(1).max(100),
});
export const setSchema = z.object({
  id,
  number: z.number().int().min(1).max(100),
  targetReps: z.number().int().min(1).max(1000),
  reps: z.number().int().min(0).max(1000),
  targetWeight: z.number().finite().min(0).max(1000).nullable(),
  weight: z.number().finite().min(0).max(1000).nullable(),
  completed: z.boolean(),
  notes: text,
});
export const sessionExerciseSchema = z.object({
  id,
  exercise: exerciseSchema,
  rest: z.number().int().min(0).max(1800),
  skipped: z.boolean(),
  effort: z.number().int().min(1).max(10).nullable().default(null),
  sets: z.array(setSchema).min(1).max(20),
});
export const timerSchema = z.object({
  duration: z.number().min(0).max(3600),
  endAt: z.number().nullable(),
  remaining: z.number().min(0).max(3600),
});
export const sessionSchema = z.object({
  id,
  planId: id.nullable(),
  name: z.string().min(1).max(100),
  startedAt: date,
  finishedAt: date.nullable(),
  status: z.enum(['active', 'completed', 'abandoned']),
  activeMs: z.number().finite().min(0),
  runningSince: z.number().nullable(),
  currentExercise: z.number().int().min(0),
  exercises: z.array(sessionExerciseSchema).min(1).max(100),
  timer: timerSchema.nullable(),
  note: text,
  rating: z.number().int().min(1).max(5).nullable(),
});
export const profileSchema = z.object({
  name: z.string().trim().max(60),
  age: z.number().int().min(13).max(120).nullable(),
  heightCm: z.number().min(80).max(260).nullable(),
  goal: z.enum([
    'Build muscle',
    'Lose fat',
    'Get stronger',
    'General fitness',
    'Build consistency',
  ]),
  experience: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  equipment: z.enum(['Full gym', 'Dumbbells', 'Resistance bands', 'Bodyweight', 'Home equipment']),
  days: weekdays,
  duration: z.number().int().min(5).max(240),
  weeklyTarget: z.number().int().min(1).max(7),
  onboarded: z.boolean(),
  preferredPlanId: id.nullable(),
});
export const settingsSchema = z.object({
  exerciseVideos: z
    .record(id, z.string().regex(/^[A-Za-z0-9_-]{11}$/))
    .refine((v) => Object.keys(v).length <= 500, 'Too many exercise videos.')
    .default({}),
  units: z.enum(['metric', 'imperial']),
  rest: z.number().int().min(0).max(1800),
  haptics: z.boolean(),
  bodyweight: z.boolean(),
  reminder: z.object({
    enabled: z.boolean(),
    days: weekdays,
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    ids: z.array(z.string()),
  }),
});
export const weightSchema = z.object({
  id,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kg: positive.max(500),
});
export const goalSchema = z.object({
  id,
  name: z.string().trim().min(1).max(100),
  type: z.enum(['weekly', 'weight', 'exercise', 'consistency']),
  target: positive.max(10000),
  exerciseId: id.nullable(),
});
export const wellnessSchema = z.object({
  waist: z
    .array(
      z.object({
        id,
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        cm: z.number().min(30).max(250),
      }),
    )
    .max(10000)
    .default([]),
  recovery: z
    .array(
      z.object({
        id,
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        minutes: z.number().int().min(1).max(300),
        effort: z.enum(['Easy', 'Moderate']),
        note: text,
      }),
    )
    .max(10000)
    .default([]),
  checks: z.array(z.number().int().min(0).max(4)).max(5).default([]),
});
export const dataSchema = z.object({
  wellness: wellnessSchema.default({ waist: [], recovery: [], checks: [] }),
  profile: profileSchema,
  settings: settingsSchema,
  plans: z.array(planSchema).max(500),
  sessions: z.array(sessionSchema).max(10000),
  weights: z.array(weightSchema).max(10000),
  goals: z.array(goalSchema).max(100),
});
export const backupSchema = z.object({
  format: z.literal('formwise'),
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: date,
  data: dataSchema,
});
export type Exercise = z.infer<typeof exerciseSchema>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export type Plan = z.infer<typeof planSchema>;
export type WorkoutSet = z.infer<typeof setSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type WeightEntry = z.infer<typeof weightSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type AppData = z.infer<typeof dataSchema>;
