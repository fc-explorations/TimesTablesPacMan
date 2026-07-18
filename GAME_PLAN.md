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
- Number targets are floating orange labels without surrounding circles; feedback changes their glow color.
- Number targets activate immediately when Pac-Man runs over them.
- A correct completed equation turns green, increases score and combo, and causes a new question and target layout.
- A wrong completed equation turns red, then the corrected equation appears in white, reduces score and resets combo, and then causes a new question and target layout.
- While the next question is pending, all maze numbers turn white, number activation is locked, and a circular countdown appears under the question.
- Normal dots are removed.
- Level 1 includes rotating blue orbs that trigger frightened-ghost mode.
- Level 2 unlocks paired teleporters that send Pac-Man to the other portal.
- Level 3 unlocks a temporary super-strength star that lets Pac-Man erase wall blocks, including wrapped boundary blocks.
- Level 4 unlocks Radar, which briefly points toward the correct answer with a green glowing arrow.
- Level 5 unlocks Shield, which absorbs one ghost collision before being consumed.
- Level 6 unlocks Ghost Freeze, which temporarily stops the ghosts.
- Level 7 unlocks Decoy Pac-Man, which sends a short-lived duplicate along the maze to distract ghosts.
- All non-portal power-ups, including orbs and the super-strength star, are consumed when activated; paired teleporters remain reusable.
- Levels advance after a configurable number of correct answers; wrong answers and penalties never reduce the current level.
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
- Settings also persist the number of correct answers required to advance each level.
- Game speed is persisted as a shared multiplier for Pac-Man and every ghost state.
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
- Correct answers per level: 3.
- Game speed: 1×.
- Number targets per question: one correct plus a configurable number of distractors, defaulting to eight.
- Score and combo are session-only; settings persist locally.
