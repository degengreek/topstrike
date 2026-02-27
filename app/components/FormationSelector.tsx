/**
 * Formation Selector Component
 * Allows user to choose different tactical formations
 */

interface FormationOption {
  name: string
  label: string
  positions: {
    forwards: number
    midfielders: number
    defenders: number
  }
}

export const formations: FormationOption[] = [
  { name: '4-3-3', label: '4-3-3 (Attack)', positions: { forwards: 3, midfielders: 3, defenders: 4 } },
  { name: '4-4-2', label: '4-4-2 (Balanced)', positions: { forwards: 2, midfielders: 4, defenders: 4 } },
  { name: '4-5-1', label: '4-5-1 (Defensive)', positions: { forwards: 1, midfielders: 5, defenders: 4 } },
  { name: '3-5-2', label: '3-5-2 (Wing Play)', positions: { forwards: 2, midfielders: 5, defenders: 3 } },
  { name: '3-4-3', label: '3-4-3 (Attack)', positions: { forwards: 3, midfielders: 4, defenders: 3 } },
]

export const getFormationPositions = (formationName: string) => {
  const formation = formations.find(f => f.name === formationName)
  if (!formation) return formations[0].positions
  return formation.positions
}

interface FormationSelectorProps {
  currentFormation: string
  onFormationChange: (formation: string) => void
}

export default function FormationSelector({ currentFormation, onFormationChange }: FormationSelectorProps) {
  return (
    <div className="flex items-center gap-2 justify-center flex-wrap">
      <span className="text-sm text-gray-400 font-semibold">Formation:</span>
      {formations.map((formation) => (
        <button
          key={formation.name}
          onClick={() => onFormationChange(formation.name)}
          className={`
            px-4 py-2 rounded-lg font-semibold text-sm transition-all
            ${currentFormation === formation.name
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          {formation.label}
        </button>
      ))}
    </div>
  )
}
