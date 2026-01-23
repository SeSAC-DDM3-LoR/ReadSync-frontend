# ReadSync Frontend

This is the frontend application for the ReadSync gamified reading platform.

## Tech Stack
- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4)
- **Icons**: Lucide React

## Project Structure
- `src/components/dashboard`: Components specific to the main dashboard (UserCard, GrowthTree, etc).
- `src/components/ui`: Reusable UI components (Card, Button).
- `src/components/layout`: Layout components (Header, MainLayout).
- `src/pages`: Page components.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Features
- **Dashboard**: User stats, daily quests, growth tree visualization.
- **Responsiveness**: Grid layout adapts to screen size (desktop focused as per design).
- **Theming**: "Forest" color theme configured in `src/index.css`.
