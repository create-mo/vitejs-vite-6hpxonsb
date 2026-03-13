# UI Testing Instructions for StackBlitz Preview

## Environment
Open the StackBlitz preview in the main window at: https://stackblitz.com/github/create-mo/vitejs-vite-6hpxonsb

---

## Test Cases

### 1. **Horizontal Scrolling & Pan**
- **Keyboard**: Press `← →` arrow keys repeatedly
  - Should smoothly scroll left/right without jumps
  - Composers should stay in their positions
  - Observe any stuttering or "catching" behavior

- **Mouse Drag**: Click and drag on empty space (not on composers)
  - Drag left/right
  - Drag up/down
  - Should pan smoothly without snapping back
  - Release mouse and observe if position holds

### 2. **Zoom Controls**
- **Buttons**: Click `-` button in bottom-right to zoom out (several times)
  - Watch if content drifts downward or sideways
  - Composers should stay roughly in same visual position
  - Check if the map becomes unreadable or goes off-screen

- **Keyboard**: Press `-` key to zoom out, `+` key to zoom in
  - Same behavior as buttons

### 3. **Composer Connections**
- **Visual**: Look at the "roads" (staff lines) connecting composers
  - Every composer circle should have at least one road connecting to another composer
  - There should be NO isolated composers (circles with no connections)
  - Roads should flow chronologically left→right

- **Check specific composers**:
  - Baroque composers (left side): should form a backbone
  - Classical, Romantic, 20th Century, Contemporary: each should connect

### 4. **Composer Selection & Cards**
- Click on a composer circle
  - Should center on that composer
  - Floating piece cards should appear around the circle
  - Click again to deselect

### 5. **Combined Interaction**
- Navigate with arrow keys while a composer is selected
- Zoom while dragging
- Switch between drag-pan and keyboard navigation
- Check for smooth transitions

---

## What to Report Back

When testing is complete, describe:

1. **Smoothness**:
   - [ ] Horizontal pan smooth or jumpy?
   - [ ] Vertical pan smooth or jumpy?
   - [ ] Any frame stuttering during interactions?

2. **Zoom behavior**:
   - [ ] Does content drift when zooming out?
   - [ ] Are composers centered correctly at all zoom levels?
   - [ ] Can you zoom to see detail and zoom out to see the whole map?

3. **Connectivity**:
   - [ ] Are ALL composers connected (no isolated nodes)?
   - [ ] Do roads form a logical tree structure?

4. **Edge cases**:
   - [ ] Can you pan all the way to the edges without the map disappearing?
   - [ ] Can you drag from bottom-right and it still works?
   - [ ] If you click very fast, does anything break?

5. **Keyboard controls**:
   - [ ] Do arrow keys work smoothly?
   - [ ] Do +/- keys zoom correctly?

---

## Expected Behavior (Ideal State)

- Map is a **horizontal tree** (time L→R, contemporaries at similar Y)
- All interactions are **smooth** (no frame drops)
- **Zoom** keeps content centered
- **Drag** is fluid and responsive
- All **composers are connected** (no floating islands)
- **Arrow keys** provide precise control
- Switching between interactions doesn't cause glitches

---

## If Something Fails

Note down:
- What action triggered the issue
- What the expected behavior was
- What actually happened (with any visual description)
- Example: "Dragging right causes map to jump left; zoom level shows 0.6 but content appears at 0.4"
