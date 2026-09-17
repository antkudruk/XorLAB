import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { groupListSeg } from "./domain/Group";
import { teacherListSeg } from "./domain/Teacher";
import { mountWidget, type MountedWidget } from "./view/mountWidget";

function App() {
  const timeHeaderWidgetHostRef = useRef<HTMLDivElement | null>(null);
  const compositeWidgetHostRef = useRef<HTMLDivElement | null>(null);
  const [groupListCollapsed, setGroupListCollapsed] = useState(false);
  const [teacherListCollapsed, setTeacherListCollapsed] = useState(false);
  const mountedRef = useRef<MountedWidget | undefined>(undefined);

  useEffect(() => {
    const timeHeaderHost = timeHeaderWidgetHostRef.current;
    if (!timeHeaderHost) {
      return;
    }

    timeHeaderHost.replaceChildren();

    return () => {
      timeHeaderHost.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const compositeHost = compositeWidgetHostRef.current;
    if (!compositeHost) {
      return;
    }

    const mounted = mountWidget({ host: compositeHost });
    mountedRef.current = mounted;

    return () => {
      mountedRef.current = undefined;
      mounted.destroy();
    };
  }, []);

  const onGroupListCollapsedChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const collapsed = event.target.checked;
    setGroupListCollapsed(collapsed);
    const widget = mountedRef.current?.widget;
    if (!widget) {
      return;
    }
    const groupListVi = groupListSeg.vis[widget.treeUuids.vertical];
    if (!groupListVi) {
      return;
    }
    if (collapsed) {
      groupListVi.collapse();
    } else {
      groupListVi.expand();
    }
  };

  const onTeacherListCollapsedChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const collapsed = event.target.checked;
    setTeacherListCollapsed(collapsed);
    const widget = mountedRef.current?.widget;
    if (!widget) {
      return;
    }
    const teacherListVi = teacherListSeg.vis[widget.treeUuids.vertical];
    if (!teacherListVi) {
      return;
    }
    if (collapsed) {
      teacherListVi.collapse();
    } else {
      teacherListVi.expand();
    }
  };

  return (
    <main className="App">
      <section className="App-panel">
        <h1>Timetable example</h1>
        <p className="App-intro">
          Drag a lesson card horizontally to reschedule weekday and hour. Group
          and teacher grids use separate drag-and-drop controllers over the same
          shared lesson data.
        </p>
        <div className="App-widget-stack">
          <div className="App-widget-section">
            <h2 className="App-widget-title">Time header</h2>
            <div
              ref={timeHeaderWidgetHostRef}
              className="App-widget-host App-widget-host-time-header"
              aria-label="Time header layout"
              role="region"
            />
          </div>
          <div className="App-widget-section">
            <h2 className="App-widget-title">Composite timetable</h2>
            <div className="App-control-row">
              <label className="App-control-label" htmlFor="collapse-group-list">
                <input
                  id="collapse-group-list"
                  type="checkbox"
                  checked={groupListCollapsed}
                  onChange={onGroupListCollapsedChange}
                />
                Collapse GroupListSeg
              </label>
              <label className="App-control-label" htmlFor="collapse-teacher-list">
                <input
                  id="collapse-teacher-list"
                  type="checkbox"
                  checked={teacherListCollapsed}
                  onChange={onTeacherListCollapsedChange}
                />
                Collapse TeacherListSeg
              </label>
            </div>
            <div
              ref={compositeWidgetHostRef}
              className="App-widget-host App-widget-host-composite"
              aria-label="Composite timetable layout"
              role="region"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
