# xorlab-discover

Development helper for exploring XorLAB segment trees.

Use it while building layouts to see which segments sit on each axis, their nesting, and a snapshot of attrs, `cardFactories`, and style. It is useful for XorLAB users in development; it does not make sense in production.

## How it works

Mount a `scrollableSystemFactory` with your real content segments on one axis and `discoveryTreePlaceSeg()` on the other. Pass `segDiscovery()` as `widgetCard`. Discovery uses `createTree` with `renderCondition` always true, so every place is `placeActive`: a `SegDiscoveryCard` appears on every node, nested child tables are seeded wherever the segment has children, and TreeSeg deepens whenever a child has further places (all active). Tree/CardVi stay domain-agnostic — tree cards use omit-until-painted shells and CardVi keeps DOM once a painted main appears. Each node is labeled with its `typeName`. Click `"..."` on a leaf to open a detail dialog.

```typescript
import { scrollableSystemFactory } from "xorlab";
import { discoveryTreePlaceSeg, segDiscovery } from "xorlab-discover";

scrollableSystemFactory({
  horizontalContentSeg: /* your layout segments */,
  verticalContentSeg: discoveryTreePlaceSeg(),
  widgetCard: segDiscovery(),
});
```

Swap axes to discover vertical content instead: put `discoveryTreePlaceSeg()` on `horizontalContentSeg` and your layout on `verticalContentSeg`.

## API

| Export | Role |
|--------|------|
| `segDiscovery()` | Discovery widget card for `scrollableSystemFactory` |
| `discoveryTreePlaceSeg()` | Orthogonal discovery rail (put this on the axis you want to inspect against) |
| `SegDiscoveryRenderer` | Leaf card renderer (normally used via `segDiscovery`) |

## Example

See the calendar discover page: [`examples/calendar/discover/`](../examples/calendar/discover/).
