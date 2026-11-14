/** Body systems on the Body Map. Imaging entries attach to one of these. */
export type BodyZone =
  | 'brain-behaviour'
  | 'eyes'
  | 'heart-circulation'
  | 'lungs'
  | 'gut-nutrition'
  | 'bones-muscles'
  | 'immune-blood'
  | 'skin-temperature'

export const BODY_ZONE_LABEL: Record<BodyZone, string> = {
  'brain-behaviour': 'Brain and behaviour',
  eyes: 'Eyes',
  'heart-circulation': 'Heart and circulation',
  lungs: 'Lungs',
  'gut-nutrition': 'Gut and nutrition',
  'bones-muscles': 'Bones and muscles',
  'immune-blood': 'Immune system and blood',
  'skin-temperature': 'Skin and temperature regulation',
}
