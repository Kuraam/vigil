/** One sourced number: every threshold value carries its unit and citation. */
export interface ThresholdValue {
  value: number
  unit: string
  source: string
}

export interface BloodPressureThresholds {
  nominalSystolicBelow: ThresholdValue
  nominalDiastolicBelow: ThresholdValue
  actionSystolicAtLeast: ThresholdValue
  actionDiastolicAtLeast: ThresholdValue
  crisisSystolicAtLeast: ThresholdValue
  crisisDiastolicAtLeast: ThresholdValue
  lowSystolicBelow: ThresholdValue
  lowDiastolicBelow: ThresholdValue
}

export interface HeartRateThresholds {
  nominalMin: ThresholdValue
  nominalMax: ThresholdValue
  actionBelow: ThresholdValue
  actionAbove: ThresholdValue
  note: string
}

export interface HrvThresholds {
  /** Personal baseline = mean of mission days 1..baselineDays. */
  baselineDays: ThresholdValue
  /** Rolling window for the comparison mean. */
  windowDays: ThresholdValue
  watchBelowFraction: ThresholdValue
  actionBelowFraction: ThresholdValue
}

export interface GlucoseThresholds {
  nominalMin: ThresholdValue
  nominalMax: ThresholdValue
  actionBelow: ThresholdValue
  actionAtLeast: ThresholdValue
  note: string
}

export interface TemperatureThresholds {
  nominalMin: ThresholdValue
  nominalMax: ThresholdValue
  watchLowMin: ThresholdValue
  feverAtLeast: ThresholdValue
  hypothermiaBelow: ThresholdValue
  note: string
}

export interface SleepThresholds {
  nominalAtLeast: ThresholdValue
  watchAtLeast: ThresholdValue
  /** Action when this many consecutive nights are below watchAtLeast. */
  actionConsecutiveNights: ThresholdValue
  note: string
}

export interface MoodThresholds {
  nominalAtLeast: ThresholdValue
  actionAtMost: ThresholdValue
  /** Action when this many consecutive daily readings are strictly decreasing. */
  declineDays: ThresholdValue
}

export interface CognitiveThresholds {
  nominalAtLeast: ThresholdValue
  watchAtLeast: ThresholdValue
  note: string
}

export interface ThresholdConfig {
  bloodPressure: BloodPressureThresholds
  heartRate: HeartRateThresholds
  hrv: HrvThresholds
  bloodGlucose: GlucoseThresholds
  coreTemperature: TemperatureThresholds
  sleepHours: SleepThresholds
  mood: MoodThresholds
  cognitiveReadiness: CognitiveThresholds
}
