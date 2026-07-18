# Times Table Pac-Man

An arcade-style multiplication game for practicing times tables. Read the question, steer through the maze, and collect the number that completes the equation before the ghosts catch you.

The game is a lightweight static site built with vanilla HTML, CSS, and JavaScript. It has no build step, framework, or external runtime dependency, so it can be hosted directly on GitHub Pages.

## How to play

1. Read the multiplication question in the left panel.
2. Use Pac-Man to run over the matching orange number.
3. Avoid distractors, ghosts, and walls while choosing your route.
4. Correct answers increase your score and combo. Wrong answers reveal the correct equation and reset the combo.
5. Run over a rotating blue orb to frighten the ghosts temporarily.

The session is endless. A new validated maze and a new set of number targets are generated for every question, while Pac-Man continues from his current position whenever the new layout allows it.

## Levels and power-ups

Correct answers advance the level after the configured correct-answer threshold. Wrong answers and score penalties do not lower the current level.

- **Level 1:** rotating blue orbs frighten ghosts and make them eatable.
- **Level 2:** paired teleporters send Pac-Man to the other portal.
- **Level 3:** a temporary super-strength star lets Pac-Man erase maze walls, including the wrapped boundary walls.
- **Level 4:** Radar briefly shows a green glowing arrow pointing toward the correct number.
- **Level 5:** Shield absorbs one ghost collision.
- **Level 6:** Ghost Freeze stops the ghosts temporarily.
- **Level 7:** Decoy Pac-Man creates a short-lived duplicate that distracts the ghosts.
- **Level 8:** Time Warp slows the ghosts temporarily.
- **Level 9:** Second Chance preserves the current combo after one wrong answer.

All non-portal power-ups disappear after they are consumed, including the blue orbs and super-strength star. Teleporters are the exception and can be used repeatedly.

## Controls

| Action | Control |
| --- | --- |
| Move | Arrow keys or `WASD` |
| Pause / resume | `P` |
| Move on mobile | Swipe on the maze |
| New session | **New session** button |
| Help and settings | Header buttons |

Opening **How to play** or **Settings** pauses the game automatically.

## Customise practice

The Settings dialog lets you choose:

- Minimum and maximum multiplication factors
- Number of distractors, from 1 to 8
- Correct answers required to advance a level
- Shared Pac-Man and ghost game speed, from 0.5× to 2×
- Feedback duration
- Reduced-motion mode

Settings are saved in the browser with `localStorage`. Score, combo, and best score belong to the current browser session.

## Ghost behaviour

The four ghosts use distinct classic-inspired strategies:

- **Blinky** targets Pac-Man directly.
- **Pinky** targets the space ahead of Pac-Man.
- **Inky** uses Pac-Man’s position and Blinky’s position to calculate a vector target.
- **Clyde** chases when far away and retreats toward his scatter corner when close.

When Pac-Man is captured, the ghosts return to the central house and leave one at a time. The maze wraps at its edges, including centered top and bottom portals.

## Run locally

Clone the repository and serve the project directory with any static web server. For example:

```bash
git clone git@github.com:fc-explorations/TimesTablesPacMan.git
cd TimesTablesPacMan
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

Serving the files locally is recommended because the game references its local SVG icon sprite.

## Deploy with GitHub Pages

1. Open the repository’s **Settings → Pages**.
2. Select **Deploy from a branch**.
3. Choose the `main` branch and the `/ (root)` folder.
4. Save the configuration and open the Pages URL supplied by GitHub.

Every push to `main` will update the static site after GitHub Pages finishes deploying.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Accessible page shell, dialogs, controls, score panels, and canvas |
| `styles.css` | Responsive layout, visual styling, focus states, and reduced-motion rules |
| `game.js` | Game loop, maze generation, questions, targets, ghosts, scoring, input, and persistence |
| `icons.svg` | Local SVG icon sprite used by the header controls |
| `GAME_PLAN.md` | Product and implementation specification |

## Development checks

This project intentionally has no dependency installation step. Useful checks are:

```bash
node --check game.js
git diff --check
```

Artwork is rendered from scratch with canvas and CSS; the project does not include or depend on external game assets.
