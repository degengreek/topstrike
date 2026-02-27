/**
 * Formation System
 * Defines player positions for different tactical formations
 */

export type FormationType = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1' | '3-4-3' | '5-3-2' | '5-4-1'

export interface Position {
  id: string
  label: string // ST, CM, CB, etc.
  x: number // Percentage from left (0-100)
  y: number // Percentage from top (0-100)
}

export interface Formation {
  name: FormationType
  label: string
  positions: Position[]
}

// Formation: 4-3-3
const formation_4_3_3: Formation = {
  name: '4-3-3',
  label: '4-3-3 (Attack)',
  positions: [
    // Goalkeeper
    { id: 'gk', label: 'GK', x: 50, y: 90 },
    // Defenders
    { id: 'lb', label: 'LB', x: 20, y: 70 },
    { id: 'cb1', label: 'CB', x: 38, y: 70 },
    { id: 'cb2', label: 'CB', x: 62, y: 70 },
    { id: 'rb', label: 'RB', x: 80, y: 70 },
    // Midfielders
    { id: 'cm1', label: 'CM', x: 30, y: 45 },
    { id: 'cm2', label: 'CM', x: 50, y: 45 },
    { id: 'cm3', label: 'CM', x: 70, y: 45 },
    // Forwards
    { id: 'lw', label: 'LW', x: 20, y: 20 },
    { id: 'st', label: 'ST', x: 50, y: 15 },
    { id: 'rw', label: 'RW', x: 80, y: 20 },
  ]
}

// Formation: 4-4-2
const formation_4_4_2: Formation = {
  name: '4-4-2',
  label: '4-4-2 (Balanced)',
  positions: [
    // Goalkeeper
    { id: 'gk', label: 'GK', x: 50, y: 90 },
    // Defenders
    { id: 'lb', label: 'LB', x: 20, y: 70 },
    { id: 'cb1', label: 'CB', x: 38, y: 70 },
    { id: 'cb2', label: 'CB', x: 62, y: 70 },
    { id: 'rb', label: 'RB', x: 80, y: 70 },
    // Midfielders
    { id: 'lm', label: 'LM', x: 20, y: 45 },
    { id: 'cm1', label: 'CM', x: 38, y: 45 },
    { id: 'cm2', label: 'CM', x: 62, y: 45 },
    { id: 'rm', label: 'RM', x: 80, y: 45 },
    // Forwards
    { id: 'st1', label: 'ST', x: 38, y: 20 },
    { id: 'st2', label: 'ST', x: 62, y: 20 },
  ]
}

// Formation: 3-5-2
const formation_3_5_2: Formation = {
  name: '3-5-2',
  label: '3-5-2 (Wing Play)',
  positions: [
    // Goalkeeper
    { id: 'gk', label: 'GK', x: 50, y: 90 },
    // Defenders
    { id: 'cb1', label: 'CB', x: 30, y: 70 },
    { id: 'cb2', label: 'CB', x: 50, y: 70 },
    { id: 'cb3', label: 'CB', x: 70, y: 70 },
    // Midfielders
    { id: 'lwb', label: 'LWB', x: 15, y: 50 },
    { id: 'cm1', label: 'CM', x: 35, y: 45 },
    { id: 'cm2', label: 'CM', x: 50, y: 45 },
    { id: 'cm3', label: 'CM', x: 65, y: 45 },
    { id: 'rwb', label: 'RWB', x: 85, y: 50 },
    // Forwards
    { id: 'st1', label: 'ST', x: 38, y: 20 },
    { id: 'st2', label: 'ST', x: 62, y: 20 },
  ]
}

// Formation: 4-2-3-1
const formation_4_2_3_1: Formation = {
  name: '4-2-3-1',
  label: '4-2-3-1 (Modern)',
  positions: [
    // Goalkeeper
    { id: 'gk', label: 'GK', x: 50, y: 90 },
    // Defenders
    { id: 'lb', label: 'LB', x: 20, y: 70 },
    { id: 'cb1', label: 'CB', x: 38, y: 70 },
    { id: 'cb2', label: 'CB', x: 62, y: 70 },
    { id: 'rb', label: 'RB', x: 80, y: 70 },
    // Defensive Midfielders
    { id: 'cdm1', label: 'CDM', x: 38, y: 55 },
    { id: 'cdm2', label: 'CDM', x: 62, y: 55 },
    // Attacking Midfielders
    { id: 'lm', label: 'LM', x: 20, y: 35 },
    { id: 'cam', label: 'CAM', x: 50, y: 35 },
    { id: 'rm', label: 'RM', x: 80, y: 35 },
    // Forward
    { id: 'st', label: 'ST', x: 50, y: 15 },
  ]
}

// Formation: 3-4-3
const formation_3_4_3: Formation = {
  name: '3-4-3',
  label: '3-4-3 (Attack)',
  positions: [
    // Goalkeeper
    { id: 'gk', label: 'GK', x: 50, y: 90 },
    // Defenders
    { id: 'cb1', label: 'CB', x: 30, y: 70 },
    { id: 'cb2', label: 'CB', x: 50, y: 70 },
    { id: 'cb3', label: 'CB', x: 70, y: 70 },
    // Midfielders
    { id: 'cm1', label: 'CM', x: 25, y: 45 },
    { id: 'cm2', label: 'CM', x: 42, y: 45 },
    { id: 'cm3', label: 'CM', x: 58, y: 45 },
    { id: 'cm4', label: 'CM', x: 75, y: 45 },
    // Forwards
    { id: 'lw', label: 'LW', x: 20, y: 20 },
    { id: 'st', label: 'ST', x: 50, y: 15 },
    { id: 'rw', label: 'RW', x: 80, y: 20 },
  ]
}

// Formation: 5-3-2
const formation_5_3_2: Formation = {
  name: '5-3-2',
  label: '5-3-2 (Defensive)',
  positions: [
    // Goalkeeper
    { id: 'gk', label: 'GK', x: 50, y: 90 },
    // Defenders
    { id: 'cb1', label: 'CB', x: 20, y: 70 },
    { id: 'cb2', label: 'CB', x: 35, y: 70 },
    { id: 'cb3', label: 'CB', x: 50, y: 70 },
    { id: 'cb4', label: 'CB', x: 65, y: 70 },
    { id: 'cb5', label: 'CB', x: 80, y: 70 },
    // Midfielders
    { id: 'cm1', label: 'CM', x: 30, y: 45 },
    { id: 'cm2', label: 'CM', x: 50, y: 45 },
    { id: 'cm3', label: 'CM', x: 70, y: 45 },
    // Forwards
    { id: 'st1', label: 'ST', x: 38, y: 20 },
    { id: 'st2', label: 'ST', x: 62, y: 20 },
  ]
}

// Formation: 5-4-1
const formation_5_4_1: Formation = {
  name: '5-4-1',
  label: '5-4-1 (Ultra Defensive)',
  positions: [
    // Goalkeeper
    { id: 'gk', label: 'GK', x: 50, y: 90 },
    // Defenders
    { id: 'cb1', label: 'CB', x: 20, y: 70 },
    { id: 'cb2', label: 'CB', x: 35, y: 70 },
    { id: 'cb3', label: 'CB', x: 50, y: 70 },
    { id: 'cb4', label: 'CB', x: 65, y: 70 },
    { id: 'cb5', label: 'CB', x: 80, y: 70 },
    // Midfielders
    { id: 'cm1', label: 'CM', x: 25, y: 45 },
    { id: 'cm2', label: 'CM', x: 42, y: 45 },
    { id: 'cm3', label: 'CM', x: 58, y: 45 },
    { id: 'cm4', label: 'CM', x: 75, y: 45 },
    // Forward
    { id: 'st', label: 'ST', x: 50, y: 15 },
  ]
}

// Export formations map
export const formations: Record<FormationType, Formation> = {
  '4-3-3': formation_4_3_3,
  '4-4-2': formation_4_4_2,
  '3-5-2': formation_3_5_2,
  '4-2-3-1': formation_4_2_3_1,
  '3-4-3': formation_3_4_3,
  '5-3-2': formation_5_3_2,
  '5-4-1': formation_5_4_1,
}
