# Times Table Pac-Man

An arcade-style multiplication game for practicing times tables. Read the question, steer through the maze, and collect the number that completes the equation before the ghosts catch you.

The game is a lightweight static site built with vanilla HTML, CSS, and JavaScript. It has no build step, framework, or external runtime dependency, so it can be hosted directly on GitHub Pages.

## How to play

1. Read the multiplication question in the left panel.
2. Use Pac-Man to run over the matching orange number.
3. Avoid distractors, ghosts, and walls while choosing your route.
4. Correct answers increase your score and combo. Wrong answers reveal the correct equation and reset the combo.
5. Run over a rotating blue orb to frighten the ghosts temporarily.

Each new question gives you five seconds by default to study the maze and answer targets while Pac-Man fades in and the ghosts remain hidden. The study time is configurable in Settings.

The session is endless. A new validated maze and a new set of number targets are generated for every question, while Pac-Man continues from his current position whenever the new layout allows it.

## Levels and power-ups

Correct answers advance the level after the configured correct-answer threshold. Wrong answers and score penalties do not lower the current level.

- **Level 1:** rotating blue orbs frighten ghosts and make them eatable.
- **Level 2:** paired teleporters send Pac-Man to the other portal with a one-second flashing travel animation.
- **Level 3:** a temporary super-strength star lets Pac-Man erase maze walls, including the wrapped boundary walls.
- **Level 4:** Radar briefly shows a green glowing arrow pointing toward the correct number.
- **Level 5:** Shield absorbs one ghost collision.
- **Level 6:** Ghost Freeze stops the ghosts temporarily.
- **Level 7:** Decoy Pac-Man creates a short-lived duplicate that moves randomly through valid maze lanes and distracts the ghosts.
- **Level 8:** Time Warp slows the ghosts temporarily.
- **Level 9:** Second Chance marks one wrong target red, keeps the question active without revealing the answer, and preserves the combo for another attempt.
- **Level 10:** Pac-Man Dash temporarily increases Pac-Man's movement speed.
- **Level 11:** Ghost Bomb explodes every ghost, then sends them back to the central house and releases them one by one.
- **Level 12:** Ghost Mode lets Pac-Man pass through walls while keeping normal ghost, number, and power-up interactions.
- **Level 13:** Magnet pulls all ghosts to the pickup position for the configured effect duration and emits fast-fading circular waves while active.
- **Level 14:** Repulsion pushes all ghosts away from Pac-Man temporarily.
- **Level 15:** Sorter reorders number positions so the answer is closest to the power-up and the most different distractor is furthest away.

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

The Settings dialog also includes a Factory reset action that clears saved settings, session scores, best score, level, and combo.

## Customise practice

The Settings dialog lets you choose:

- Minimum and maximum multiplication factors
- Selected times table from 2 to 9, plus an option to include lower tables
- Orientation study time before Pac-Man starts, from 0 to 10 seconds
- Power-up appearance delay, from 0 to 6 seconds, defaulting to 1 second
- Number of distractors, from 1 to 8
- Correct answers required to advance a level
- Shared Pac-Man and ghost game speed, from 0.5× to 2×
- Feedback duration
- Shared timed power-up effect duration, from 1 to 20 seconds
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
