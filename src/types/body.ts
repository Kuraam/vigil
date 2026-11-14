/** Coarse anatomical zones for the Body Map (Phase 2) and imaging log entries. */
export type BodyZone =
  | 'head-eyes'
  | 'neck'
  | 'chest-heart'
  | 'abdomen'
  | 'spine-back'
  | 'upper-limbs'
  | 'lower-limbs'
  | 'skin'

export const BODY_ZONE_LABEL: Record<BodyZone, string> = {
  'head-eyes': 'Head & eyes',
  neck: 'Neck',
  'chest-heart': 'Chest & heart',
  abdomen: 'Abdomen',
  'spine-back': 'Spine & back',
  'upper-limbs': 'Upper limbs',
  'lower-limbs': 'Lower limbs',
  skin: 'Skin',
}
