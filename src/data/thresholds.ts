import type { ThresholdConfig, ThresholdValue, VitalType } from '../types'
import { SOURCES } from './sources'

/**
 * STATUS THRESHOLDS (Phase 2).
 *
 * Every number below was supplied by the VIGIL team with its source and is
 * copied verbatim. Tiers marked with SOURCES.team are VIGIL triage rules:
 * team-defined and NOT clinically validated.
 *
 * Do not change a number here without changing its source.
 */
const v = (value: number, unit: string, source: { label: string }): ThresholdValue => ({
  value,
  unit,
  source: source.label,
})

const { aha2017, ahaLowBp, ahaHeartRate, ada, cdcFever, hypothermia, aasm2015, team, who2011 } = SOURCES

export const THRESHOLDS: ThresholdConfig = {
  // Rated on the worse of systolic and diastolic.
  bloodPressure: {
    nominalSystolicBelow: v(120, 'mmHg', aha2017),
    nominalDiastolicBelow: v(80, 'mmHg', aha2017),
    actionSystolicAtLeast: v(140, 'mmHg', aha2017),
    actionDiastolicAtLeast: v(90, 'mmHg', aha2017),
    crisisSystolicAtLeast: v(180, 'mmHg', aha2017),
    crisisDiastolicAtLeast: v(120, 'mmHg', aha2017),
    lowSystolicBelow: v(90, 'mmHg', ahaLowBp),
    lowDiastolicBelow: v(60, 'mmHg', ahaLowBp),
  },
  heartRate: {
    nominalMin: v(60, 'bpm', ahaHeartRate),
    nominalMax: v(100, 'bpm', ahaHeartRate),
    actionBelow: v(40, 'bpm', team),
    actionAbove: v(120, 'bpm', team),
    note: 'Trained crew often run lower; compare with personal baseline.',
  },
  hrv: {
    baselineDays: v(14, 'mission days', team),
    windowDays: v(7, 'days', team),
    watchBelowFraction: v(0.85, 'of baseline', team),
    actionBelowFraction: v(0.7, 'of baseline', team),
  },
  bloodGlucose: {
    nominalMin: v(70, 'mg/dL', ada),
    nominalMax: v(99, 'mg/dL', ada),
    actionBelow: v(54, 'mg/dL', ada),
    actionAtLeast: v(126, 'mg/dL', ada),
    note: 'Fasting. 54-69 mg/dL is level 1 hypoglycaemia; below 54 is level 2. At 126 or above, confirm and consult ground.',
  },
  coreTemperature: {
    nominalMin: v(36.1, '°C', team),
    nominalMax: v(37.5, '°C', team),
    watchLowMin: v(35.0, '°C', team),
    feverAtLeast: v(38.0, '°C', cdcFever),
    hypothermiaBelow: v(35.0, '°C', hypothermia),
    note: 'In microgravity, resting core temperature rises by about 1 C over ~2.5 months (Stahn et al., 2017, Scientific Reports). Compare with this crew member’s in-flight baseline before acting.',
  },
  sleepHours: {
    nominalAtLeast: v(7, 'h', aasm2015),
    watchAtLeast: v(6, 'h', aasm2015),
    actionConsecutiveNights: v(3, 'nights', team),
    note: 'ISS crew averaged about 6 hours of sleep per night (Barger et al., 2014, Lancet Neurology).',
  },
  mood: {
    nominalAtLeast: v(4, 'score 1-5', team),
    actionAtMost: v(2, 'score 1-5', team),
    declineDays: v(3, 'days', team),
  },
  cognitiveReadiness: {
    nominalAtLeast: v(80, 'score 0-100', team),
    watchAtLeast: v(60, 'score 0-100', team),
    note: 'Modelled on NASA’s Cognition test battery (Basner et al., 2015).',
  },
  spo2: {
    nominalAtLeast: v(95, '%', who2011),
    watchAtLeast: v(90, '%', who2011),
  },
  visionCheck: {
    changeIsWatch: v(1, 'yes answer', team),
    note: 'Linked to the NASA HRP risk Spaceflight Associated Neuro-ocular Syndrome (SANS). If you notice a change, log an ocular ultrasound.',
  },
  exerciseAdherence: {
    windowDays: v(7, 'days', team),
    nominalAtLeast: v(6, 'sessions', team),
    watchAtLeast: v(4, 'sessions', team),
    note: 'Linked to the NASA HRP risks Spaceflight-Induced Bone Changes and Reduced Cardiorespiratory and Musculoskeletal Fitness.',
  },
}

/** Context notes shown on a vital's card, next to its rating. */
export const VITAL_NOTES: Partial<Record<VitalType, string>> = {
  heartRate: THRESHOLDS.heartRate.note,
  bloodGlucose: THRESHOLDS.bloodGlucose.note,
  coreTemperature: THRESHOLDS.coreTemperature.note,
  sleepHours: THRESHOLDS.sleepHours.note,
  cognitiveReadiness: THRESHOLDS.cognitiveReadiness.note,
  visionCheck: THRESHOLDS.visionCheck.note,
}
