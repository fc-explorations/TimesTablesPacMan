# Times Table Pac-Man — Game Design and Implementation Plan

## Summary

Times Table Pac-Man is a single-page educational maze game designed for GitHub Pages. It uses vanilla HTML, CSS, and JavaScript with no build step.

Pac-Man moves through a classic-inspired toroidal maze while a multiplication question is shown in the left sidebar. One correct answer and several plausible distractors are scattered through the maze lanes. Pac-Man immediately activates a target when he runs over it, so players can steer into the desired answer or use another lane to avoid a number.

## Gameplay Rules

- Questions use configurable factors and alternate between `A × B = ?` and `A × ? = C`.
- Each question places one correct answer and nearby distractors on walkable maze tiles.
- Every new question regenerates a validated random maze layout.
- When a question changes, Pac-Man keeps moving from his current position and direction; if the new maze blocks that tile, he is placed on the nearest safe lane.
- Answer targets are bucketed across the maze so they are spread through different regions.
- Targets are kept off the same row and column, with minimum spacing, so they do not form an unavoidable line across a corridor.
- Number targets are glowing circular amber medallions with bright numerals and small drifting sparkles; feedback changes the full target effect to green, red, or black.
- Number targets activate immediately when Pac-Man runs over them.
- For the configurable orientation period (five seconds by default) after each new question, the maze, question, targets, and Pac-Man are shown while the ghosts remain hidden. A circular countdown shows when play begins.
- A correct completed equation turns green, increases score and combo, and causes a new question and target layout.
- When a correct answer advances the level, only walls removed from the old maze fade to black during feedback; walls present in both layouts stay solid. New walls and all power-up pickups in the regenerated level maze fade from black to their colors over the same duration.
- A wrong completed equation turns red, then the corrected equation appears in white, reduces score and resets combo, and then causes a new question and target layout.
- During answer feedback, the non-selected maze numbers fade from orange to black over the configured feedback duration while the selected result remains red or green. The next question's numbers then fade from black back to orange over the same duration.
- Collectibles in each regenerated maze appear one at a time in a shared reveal sequence, with a configurable delay between appearances (3 seconds by default) and a short fade-in; a pickup cannot activate before it appears.
- Normal dots are removed.
- Level 1 includes rotating blue orbs that trigger frightened-ghost mode.
- Level 2 unlocks paired teleporters that send Pac-Man to the other portal with a one-second flashing travel animation.
- Level 3 unlocks a temporary super-strength star that lets Pac-Man erase wall blocks, including wrapped boundary blocks; broken blocks dissolve into drifting pixels before disappearing.
- Level 4 unlocks Radar, which briefly points toward the correct answer with a green glowing arrow.
- Level 5 unlocks Shield, which absorbs one ghost collision before being consumed.
- Level 6 unlocks Ghost Freeze, which temporarily stops the ghosts.
- Level 7 unlocks Decoy Pac-Man, which sends a short-lived duplicate along random valid maze lanes to distract ghosts.
- Level 8 unlocks Time Warp, which temporarily slows ghost movement.
- Level 9 unlocks Second Chance, which marks one wrong target red, keeps the current question active, and preserves the combo for another attempt.
- Level 10 unlocks Pac-Man Dash, which temporarily increases Pac-Man's movement speed without changing ghost speed.
- Level 11 unlocks Ghost Bomb, which explodes every ghost visually, then returns them to the central house and releases them one by one on staggered timers.
- All non-portal power-ups, including orbs and the super-strength star, are consumed when activated; paired teleporters remain reusable.
- Levels advance after a configurable number of correct answers; wrong answers and penalties never reduce the current level.
- Ghost collisions reset Pac-Man and combo, but endless practice continues.
- After a normal ghost collision, Pac-Man jiggles briefly before respawning at the start tile.
- After capture, ghosts return to the central rectangle and release one by one on staggered timers.
- The session is endless until the player pauses or restarts.

## Power-up Icon Legend

| Icon | Power-up | Effect |
| --- | --- | --- |
| Rotating blue orb with a moving surface dot | Frightened orb | Makes ghosts frightened and eatable temporarily. |
| Glowing isosceles triangle pointing toward its paired triangle | Teleporter | Sends Pac-Man to another portal with a one-second flashing travel animation; portals remain reusable. |
| Rotating pink star | Super Strength | Lets Pac-Man erase wall blocks temporarily, including boundary walls. |
| Green diamond with a right-pointing arrow | Radar | Shows a short green glowing arrow toward the correct answer. |
| Cyan circle with a cross | Shield | Absorbs one ghost collision. |
| Pale-blue snowflake | Ghost Freeze | Stops ghost movement temporarily. |
| Light-blue Pac-Man silhouette | Decoy Pac-Man | Sends a short-lived duplicate through random valid maze lanes to distract ghosts. |
| Gold clock | Time Warp | Slows ghost movement temporarily. |
| Pink heart | Second Chance | Marks one wrong target red, keeps the question active without revealing the answer, and preserves the combo for another attempt. |
| Gold arrow with speed lines | Pac-Man Dash | Increases Pac-Man's movement speed temporarily. |
| Red bomb with a lit fuse | Ghost Bomb | Explodes every ghost, then respawns them in the central house and releases them one by one. |

## Technical Design

- `index.html` contains the semantic shell, question display, settings panel, score/status area, controls, and canvas.
- `styles.css` provides the responsive layout, classic-inspired presentation, focus states, reduced-motion behavior, and feedback styling.
- `game.js` owns the game loop, maze, entities, questions, targets, scoring, ghost state machine, input, and local persistence.
- The maze and entities are rendered on one canvas. Question, feedback, settings, and status text remain semantic HTML.
- Settings persisted in `localStorage`: selected times table, table-range mode, orientation study time, power-up reveal delay, factor minimum, factor maximum, feedback duration, and reduced-motion preference.
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
- Times-table selection: 4 by default, with table-range mode enabled so lower tables are included; disabling it focuses on the selected table only. The selector ranges from 2–9.
- Orientation study time: 5 seconds by default, shown as a countdown before Pac-Man starts after each new question.
- Power-up reveal delay: 3 seconds by default between staggered power-up appearances.
- Feedback duration: 2 seconds.
- Correct answers per level: 3.
- Game speed: 1×.
- Number targets per question: one correct plus a configurable number of distractors, defaulting to five.
- Score and combo are session-only; settings persist locally.
