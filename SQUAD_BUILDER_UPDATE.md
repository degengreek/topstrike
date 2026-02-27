# 🎯 Squad Builder Update - Implementation Guide

## What We're Building

An interactive squad builder where users can:
1. Choose a formation (4-3-3, 4-4-2, etc.)
2. See all their players in a list
3. Click positions on the pitch to select them
4. Click players to assign them to positions
5. Position validation (FWD only in attack, etc.)

## Files Created

✅ `FormationSelector.tsx` - Dropdown to choose formations
✅ `PlayerPool.tsx` - Sidebar showing available players

## Changes Needed in Dashboard.tsx

### 1. Update the Main Layout

Replace the current pitch rendering with a two-column layout:

**LEFT COLUMN:** Player Pool (PlayerPool component)
**RIGHT COLUMN:** Pitch with clickable positions

### 2. Add Formation Selector

Add this right after the search bar:

```tsx
{/* FORMATION SELECTOR */}
{searched && players.length > 0 && (
  <div className="mb-6">
    <FormationSelector
      currentFormation={selectedFormation}
      onFormationChange={handleFormationChange}
    />
  </div>
)}
```

### 3. Replace Pitch Rendering

Instead of auto-assigning players to positions, render empty slots that can be clicked:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  {/* LEFT: Player Pool */}
  <div className="lg:col-span-1">
    <PlayerPool
      players={players}
      assignedPlayerIds={assignedPlayerIds}
      onPlayerSelect={(player) => handlePlayerSelect(player, getPositionType(selectedPosition!))}
      selectedPosition={selectedPosition}
    />
  </div>

  {/* RIGHT: Pitch */}
  <div className="lg:col-span-2">
    {/* Pitch component with interactive cards */}
  </div>
</div>
```

### 4. Render Dynamic Formations

For each formation, render positions using the `InteractivePlayerCard` component we created:

```tsx
{/* FORWARDS */}
<div className="flex justify-around mb-16">
  {formationStructure.forwards.map((posId) => (
    <InteractivePlayerCard
      key={posId}
      player={assignedPlayers.get(posId) || null}
      positionId={posId}
      positionLabel={posId}
      positionType="FWD"
      isSelected={selectedPosition === posId}
      onClick={() => handlePositionClick(posId)}
      onRemove={() => handleRemovePlayer(posId)}
    />
  ))}
</div>
```

## Helper Function Needed

Add this to get position type from position ID:

```tsx
const getPositionType = (posId: string): 'FWD' | 'MID' | 'DEF' | 'GK' => {
  if (posId === 'GK') return 'GK'
  if (['LW', 'RW', 'ST', 'LST', 'RST', 'CF'].includes(posId)) return 'FWD'
  if (['LM', 'RM', 'CM', 'LCM', 'RCM', 'CAM', 'CDM'].includes(posId)) return 'MID'
  return 'DEF'
}
```

## How It Works

1. **User searches wallet** → Players load into pool
2. **User selects formation** → Pitch updates with slots
3. **User clicks a position** → Position highlights (blue)
4. **User clicks a player** → Player assigned to position
5. **Validation** → Only compatible positions allowed

## Position Types

- **FWD**: LW, RW, ST, LST, RST, CF
- **MID**: LM, RM, CM, LCM, RCM, CAM, CDM
- **DEF**: LB, RB, CB, LCB, RCB
- **GK**: GK

## Current Status

✅ Components created
✅ State management added
✅ Handlers implemented
⏳ Need to update main render section

## Next Step

Would you like me to:
1. **Complete the full render section replacement** (big change)
2. **Create a working minimal example** first
3. **Update section by section** with your review

Let me know which approach you prefer!
