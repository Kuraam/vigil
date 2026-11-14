import type { ProtocolDef, ProtocolId, ProtocolStep, ProtocolSymptom } from '../types'
import { RADIATION_LIMITS } from './radiation'
import { SOURCES } from './sources'

/**
 * GUIDED PROTOCOLS. Content comes only from the VIGIL team brief; no clinical
 * facts are added here. VIGIL never names medications or doses.
 * Every protocol follows CONFIRM -> ASSESS -> ACT -> ESCALATE.
 */
export const PROTOCOL_DISCLAIMER = 'Concept guidance for demonstration. Not medical advice.'
export const MED_KIT_LINE = 'Use the onboard medical kit only as directed by the crew medical officer or flight surgeon.'

const confirm = (id: string, text: string): ProtocolStep => ({ id: `confirm-${id}`, phase: 'confirm', text })
const act = (id: string, text: string): ProtocolStep => ({ id: `act-${id}`, phase: 'act', text })
const redFlag = (id: string, text: string): ProtocolSymptom => ({ id: `rf-${id}`, text, redFlag: true })
const escalateStep: ProtocolStep = { id: 'escalate-done', phase: 'escalate', text: 'Escalation actions for this environment are done.' }

const DEFS: ProtocolDef[] = [
  {
    id: 'fever',
    title: 'Fever / high core temperature',
    trigger: 'Core temperature 38.0 °C or higher, or above the nominal range.',
    measure: ['coreTemperature'],
    howToMeasure: ['Measure at rest, not within 30 minutes of exercise.'],
    notes: [
      {
        text: 'Remember the ~1 °C microgravity rise in resting core temperature; compare with the in-flight baseline.',
        source: SOURCES.stahn2017.label,
      },
    ],
    symptoms: [
      redFlag('confusion', 'Confusion'),
      redFlag('stiff-neck', 'Stiff neck'),
      redFlag('breathing', 'Difficulty breathing'),
      redFlag('rash', 'New rash'),
      redFlag('chest-pain', 'Chest pain'),
    ],
    steps: [
      confirm('remeasure', 'Re-measure core temperature correctly and enter it below.'),
      act('stop-work', 'Stop strenuous work.'),
      act('rest', 'Rest.'),
      act('hydrate', 'Hydrate.'),
      act('recheck', 'Re-check temperature and heart rate in 30 minutes.'),
      act('contact', 'Limit close contact with crew until assessed.'),
      act('med-kit', MED_KIT_LINE),
      escalateStep,
    ],
    risks: [],
    related: ['heartRate'],
  },
  {
    id: 'high-heart-rate',
    title: 'High heart rate',
    trigger: 'Resting heart rate above 120 bpm, or above 100 bpm at rest (watch).',
    measure: ['heartRate'],
    howToMeasure: ['Measure after 5 minutes of seated or anchored rest.'],
    notes: [],
    symptoms: [
      redFlag('chest-pain', 'Chest pain'),
      redFlag('fainting', 'Fainting'),
      redFlag('breath', 'Shortness of breath'),
      redFlag('palpitations', 'Palpitations that don’t settle'),
    ],
    steps: [
      confirm('remeasure', 'Re-measure resting heart rate correctly and enter it below.'),
      act('rest', 'Rest.'),
      act('hydrate', 'Hydrate.'),
      act('recheck', 'Re-check heart rate in 15 minutes.'),
      act('fever', 'Check for fever (core temperature).'),
      escalateStep,
    ],
    risks: [],
    related: ['coreTemperature'],
  },
  {
    id: 'high-blood-pressure',
    title: 'High blood pressure / crisis',
    trigger: 'Blood pressure 120/80 or higher; crisis at 180 or 120 or higher.',
    measure: ['bloodPressure'],
    howToMeasure: [
      'Rest 5 minutes with back supported and feet flat (anchored in microgravity).',
      'Support the arm at heart level.',
      'No caffeine or exercise for 30 minutes before.',
      'Take 2 readings 1 minute apart.',
    ],
    howToSource: SOURCES.ahaMeasureBp.label,
    notes: [
      {
        text: 'Crisis (180 or 120 or higher) with any red-flag symptom is an emergency: escalate now. Without symptoms: rest and re-measure in 5 minutes.',
        source: SOURCES.aha2017.label,
      },
    ],
    symptoms: [
      redFlag('chest-pain', 'Chest pain'),
      redFlag('breath', 'Shortness of breath'),
      redFlag('back-pain', 'Back pain'),
      redFlag('numbness', 'Numbness or weakness'),
      redFlag('vision', 'Change in vision'),
      redFlag('speaking', 'Difficulty speaking'),
    ],
    steps: [
      confirm('remeasure', 'Re-measure blood pressure correctly and enter it below.'),
      act('rest-remeasure', 'If in the crisis range without symptoms: rest and re-measure in 5 minutes.'),
      act('med-kit', MED_KIT_LINE),
      escalateStep,
    ],
    risks: [],
    related: ['heartRate'],
  },
  {
    id: 'low-blood-sugar',
    title: 'Low blood sugar',
    trigger: 'Blood glucose below 70 mg/dL.',
    measure: ['bloodGlucose'],
    howToMeasure: ['Re-measure with the fingerstick meter.'],
    notes: [
      { text: 'Confusion, inability to swallow safely or loss of consciousness mean a crewmate must act and escalate now.', source: SOURCES.ada1515.label },
    ],
    symptoms: [
      redFlag('confusion', 'Confusion'),
      redFlag('swallow', 'Unable to swallow safely'),
      redFlag('consciousness', 'Loss of consciousness'),
    ],
    steps: [
      confirm('remeasure', 'Re-measure blood glucose and enter it below.'),
      act('carbs', 'Take 15 g of fast-acting carbohydrate (15-15 rule).'),
      act('recheck', 'Re-check after 15 minutes.'),
      act('repeat', 'Repeat if still below 70 mg/dL.'),
      escalateStep,
    ],
    risks: [],
    related: [],
  },
  {
    id: 'low-spo2',
    title: 'Low blood oxygen (SpO2)',
    trigger: 'SpO2 below 95%; below 90% is an emergency.',
    measure: ['spo2'],
    howToMeasure: ['Warm the hand.', 'Keep the finger still.', 'Seat the probe correctly.', 'No nail coating on that finger.'],
    howToSource: SOURCES.who2011.label,
    notes: [{ text: 'Below 90% is an emergency: escalate now.', source: SOURCES.who2011.label }],
    symptoms: [redFlag('breathless', 'Breathlessness'), redFlag('confusion', 'Confusion'), redFlag('blue-lips', 'Blue lips')],
    steps: [
      confirm('remeasure', 'Re-measure SpO2 correctly and enter it below.'),
      act('atmosphere', 'Check cabin atmosphere readouts and alarms.'),
      act('med-kit', MED_KIT_LINE),
      escalateStep,
    ],
    risks: ['Hypoxia'],
    related: ['heartRate'],
  },
  {
    id: 'sleep-debt',
    title: 'Sleep debt',
    trigger: 'Sleep rated watch or action.',
    measure: ['sleepHours'],
    howToMeasure: ['Enter last night’s sleep duration.'],
    notes: [],
    symptoms: [],
    steps: [
      confirm('remeasure', 'Confirm last night’s sleep and enter it below.'),
      act('protect', 'Protect the next sleep period.'),
      act('conflicts', 'Flag schedule conflicts to the commander.'),
      act('defer', 'Defer safety-critical tasks where possible.'),
      act('recheck', 'Re-check cognitive readiness after the next sleep.'),
      escalateStep,
    ],
    risks: ['Inadequate Sleep and Irregular Schedules'],
    related: ['cognitiveReadiness'],
  },
  {
    id: 'low-mood',
    title: 'Low mood / cognitive decline',
    trigger: 'Mood or cognitive readiness rated watch or action.',
    measure: ['mood', 'cognitiveReadiness'],
    howToMeasure: ['Self-rate mood (1-5) and repeat the readiness test.'],
    notes: [],
    symptoms: [redFlag('harm', 'Any thought of self-harm or of harming others (means immediate commander and flight surgeon involvement)')],
    steps: [
      confirm('remeasure', 'Repeat the mood and readiness check-in and enter it below.'),
      act('checkin', 'Private crew check-in.'),
      act('rest', 'Protected rest and personal time.'),
      act('call', 'Schedule a private (delayed) call with ground support.'),
      escalateStep,
    ],
    risks: ['Behavioral Changes and Psychiatric Disorders', 'Inadequate Teamwork'],
    related: ['sleepHours'],
  },
  {
    id: 'radiation',
    title: 'Radiation exposure',
    trigger: 'Dose rated watch or action, or a solar particle event warning.',
    howToMeasure: ['Confirm the dose shown on the radiation panel and any event warning.'],
    notes: [
      { text: `Solar particle event limit: ${RADIATION_LIMITS.solarParticleEvent.value} mSv per event.`, source: RADIATION_LIMITS.solarParticleEvent.source },
      { text: `Career limit: ${RADIATION_LIMITS.career.value} mSv.`, source: RADIATION_LIMITS.career.source },
    ],
    symptoms: [],
    steps: [
      confirm('dose', 'Dose and warning confirmed.'),
      act('shelter', 'Move to the most shielded area or storm shelter.'),
      act('mass', 'Add water stores or other mass as shielding where available.'),
      act('log', 'Log time in shelter.'),
      escalateStep,
    ],
    risks: ['Radiation-Induced Cancers'],
    related: [],
  },
]

export const PROTOCOLS = Object.fromEntries(DEFS.map((d) => [d.id, d])) as Record<ProtocolId, ProtocolDef>
