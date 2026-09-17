# Timetable example

Xorlab scrollable composite widget demonstrating the [Table Pattern](../../README.md#table-pattern), [Layer Anchor Pattern](../../README.md#layer-anchor-pattern), [Coordinate Placement Pattern](../../README.md#coordinate-placement-pattern), and [DragController](../../README.md#dragcontroller).

## Layout

The widget is built in [`src/view/TimetableCompositeView.ts`](src/view/TimetableCompositeView.ts) via `scrollableSystemFactory`:

- **Horizontal content** — teacher column headers + week grid (`WeekSeg` → `WeekdaySeg` → `HourSeg`)
- **Vertical content** — time labels, group list, teacher list
- **Widget card** — corner header tables, group/teacher grids, and lesson overlays anchored with `selfPos`

Domain segments and cards live under [`src/domain/`](src/domain/). View helpers live under [`src/view/`](src/view/).

## Widget configuration

[`src/view/mountWidget.ts`](src/view/mountWidget.ts) owns mount-time wiring beside `new Widget()`: `timetableScrollableSystemFactory`, region `LessonListCard` resolution, drag controllers, style sheet, and `callbackTable`. `App.tsx` only passes the host element.

- [`src/view/styleSheet.ts`](src/view/styleSheet.ts) — segment `window` sizes keyed by segment `typeName`
- [`src/view/callbackTable.ts`](src/view/callbackTable.ts) — `LessonListCard` drag handlers

Domain factories under `src/domain/` describe structure only; they do not set inline `style` or mouse handlers.

## Lesson overlay

[`src/domain/Lesson.ts`](src/domain/Lesson.ts) places each `LessonCard` into the week grid via `selfPos` (`lessonCardFactory` lists both row axes). Two `LessonListCard` instances from `lessonListCardFactory` are wrapped in [Layer Anchor](../../README.md#layer-anchor-pattern) cards in `TimetableCompositeView.ts` (`GroupTimetableCard`, `TeacherTimetableCard`). Parent layer anchors choose which row axis applies at runtime.

## Drag and drop

Drag a `LessonCard` horizontally to change `weekday` / `hour`. Each region has its own [`DragController`](../../README.md#dragcontroller):

- Group grid — `LessonListCard` under `GroupTimetableCard`
- Teacher grid — `LessonListCard` under `TeacherTimetableCard`

Wiring: [`timetableLessonDrag.ts`](src/view/timetableLessonDrag.ts), [`callbackTable.ts`](src/view/callbackTable.ts). Handlers live on `LessonListCard` so `event.local` is WeekSeg-aligned; `callbackTable` fans to both region controllers and foreign regions no-op via `containsCard`. Slot resolve uses `CoordHelper.fold` on `WeekSeg`. `updateAttrs` mutates plain attrs fields, then `card.fire()` rebinds `selfPos`. `.LessonCard` uses `user-select: none` so native text selection does not fight the gesture.

---

# Create React App scripts

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See [the testing documentation](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out [the React documentation](https://reactjs.org/).
