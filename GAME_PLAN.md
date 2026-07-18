# Times Table Pac-Man — Game Design and Implementation Plan

## Summary

Times Table Pac-Man is a single-page educational maze game designed for GitHub Pages. It uses vanilla HTML, CSS, and JavaScript with no build step.

Pac-Man moves through a classic-inspired toroidal maze while a multiplication question is shown in the left sidebar. One correct answer and several plausible distractors are scattered through the maze lanes. Pac-Man immediately activates a target when he runs over it, so players can steer into the desired answer or use another lane to avoid a number.

## Gameplay Rules

- Questions use configurable factors and alternate between `A × B = ?` and `A × ? = C`.
- Each question places one correct answer and nearby distractors on walkable maze tiles.
- Every new question regenerates a validated random maze layout.
- Answer targets are bucketed across the maze so they are spread through different regions.
- Targets are kept off the same row and column, with minimum spacing, so they do not form an unavoidable line across a corridor.
- Number targets are floating yellow labels without surrounding circles; feedback changes their glow color.
- Number targets activate immediately when Pac-Man runs over them.
- A correct completed equation turns green, increases score and combo, and causes a new question and target layout.
- A wrong completed equation turns red, then the corrected equation appears in white, reduces score and resets combo, and then causes a new question and target layout.
- While the next question is pending, all maze numbers turn white, number activation is locked, and a circular countdown appears under the question.
- Normal dots are removed.
- Power pellets remain as optional targets and trigger frightened-ghost mode.
- Ghost collisions reset Pac-Man and combo, but endless practice continues.
- After a normal ghost collision, Pac-Man jiggles briefly before respawning at the start tile.
- After capture, ghosts return to the central rectangle and release one by one on staggered timers.
- The session is endless until the player pauses or restarts.

## Technical Design

- `index.html` contains the semantic shell, question display, settings panel, score/status area, controls, and canvas.
- `styles.css` provides the responsive layout, classic-inspired presentation, focus states, reduced-motion behavior, and feedback styling.
- `game.js` owns the game loop, maze, entities, questions, targets, scoring, ghost state machine, input, and local persistence.
- The maze and entities are rendered on one canvas. Question, feedback, settings, and status text remain semantic HTML.
- Settings persisted in `localStorage`: factor minimum, factor maximum, feedback duration, and reduced-motion preference.
- Players can configure the number of incorrect/confounding numbers shown alongside the correct answer.

## Maze and Ghosts

- Use a tile grid with horizontal tunnel wrapping.
- Include a two-cell-wide vertical tunnel with its portals centered on the top and bottom edges; route it around the ghost house.
- Reserve a central rectangular ghost house with a two-cell gate for ghost origin and respawn.
- Ghosts use an explicit release route that carries them beyond the house gate before normal targeting begins.
- Ghosts use Scatter, Chase, Frightened, and Eyes/Respawn states.
- Blinky targets Pac-Man directly; Pinky targets ahead of Pac-Man; Inky uses a vector based on Blinky and Pac-Man; Clyde alternates between chase and scatter based on distance.
- Artwork is drawn locally with canvas/CSS and has no external runtime dependencies or copied game assets.

## Testing and Acceptance

- Validate question generation, answer validity, unique target placement, immediate target activation, correct/wrong feedback, score/combo changes, respawn, frightened mode, wrapping, settings persistence, keyboard input, swipe input, responsive layout, and reduced motion.
- The site must load directly from a static GitHub Pages branch without a build command.

## Defaults

- Factor range: 2–12.
- Feedback duration: 2 seconds.
- Number targets per question: one correct plus a configurable number of distractors, defaulting to four.
- Score and combo are session-only; settings persist locally.
