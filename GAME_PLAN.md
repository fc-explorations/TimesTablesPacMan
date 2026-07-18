# Times Table Pac-Man — Game Design and Implementation Plan

## Summary

Times Table Pac-Man is a single-page educational maze game designed for GitHub Pages. It uses vanilla HTML, CSS, and JavaScript with no build step.

Pac-Man moves through a classic-inspired toroidal maze while a multiplication question is shown at the top of the screen. One correct answer and several plausible distractors are scattered through the maze. Pac-Man only activates a target after reaching its tile center and remaining stopped for a configurable countdown.

## Gameplay Rules

- Questions use configurable factors and alternate between `A × B = ?` and `A × ? = C`.
- Each question places one correct answer and nearby distractors on walkable maze tiles.
- Pressing Space or the Stop button makes Pac-Man brake at the next tile center.
- While stopped on a target, the dwell countdown fills.
- A correct answer glows green, increases score and combo, and causes a new question and target layout.
- A wrong answer glows red, briefly reveals the correct answer in white, reduces score and resets combo, and then causes a new question and target layout.
- Normal dots are removed.
- Power pellets remain as optional targets and trigger frightened-ghost mode.
- Ghost collisions reset Pac-Man and combo, but endless practice continues.
- The session is endless until the player pauses or restarts.

## Technical Design

- `index.html` contains the semantic shell, question display, settings panel, score/status area, controls, and canvas.
- `styles.css` provides the responsive layout, classic-inspired presentation, focus states, reduced-motion behavior, and feedback styling.
- `game.js` owns the game loop, maze, entities, questions, targets, scoring, ghost state machine, input, and local persistence.
- The maze and entities are rendered on one canvas. Question, feedback, settings, and status text remain semantic HTML.
- Settings persisted in `localStorage`: factor minimum, factor maximum, dwell duration, feedback duration, and reduced-motion preference.

## Maze and Ghosts

- Use a tile grid with horizontal tunnel wrapping.
- Ghosts use Scatter, Chase, Frightened, and Eyes/Respawn states.
- Blinky targets Pac-Man directly; Pinky targets ahead of Pac-Man; Inky uses a vector based on Blinky and Pac-Man; Clyde alternates between chase and scatter based on distance.
- Artwork is drawn locally with canvas/CSS and has no external runtime dependencies or copied game assets.

## Testing and Acceptance

- Validate question generation, answer validity, unique target placement, dwell cancellation, correct/wrong feedback, score/combo changes, respawn, frightened mode, wrapping, settings persistence, keyboard input, swipe input, responsive layout, and reduced motion.
- The site must load directly from a static GitHub Pages branch without a build command.

## Defaults

- Factor range: 2–12.
- Dwell duration: 3 seconds.
- Feedback duration: 3 seconds.
- Five number targets per question: one correct plus four distractors.
- Score and combo are session-only; settings persist locally.
