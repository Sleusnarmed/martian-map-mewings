import { useRouteMission } from "./RouteMissionContext.js";
import useFadingView from "../mission-detail/useFadingView.js";
import PlanPage from "./PlanPage.jsx";
import TraversePage from "./TraversePage.jsx";
import LimitsPage from "./LimitsPage.jsx";
import EventsPage from "./EventsPage.jsx";
import "./route-planner.css";

const pages = ["Plan", "Traverse", "Limits", "Events"];

export default function RoutePlanner() {
  const { state, dispatch, terrain, mission } = useRouteMission();
  const {
    value: page,
    change: changePage,
    ref: pageRef,
  } = useFadingView("Plan");
  return (
    <div className="route-planner">
      <nav className="route-pages" aria-label="Route controls">
        {pages.map((name) => (
          <button
            key={name}
            aria-pressed={page === name}
            onClick={() => changePage(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <div ref={pageRef}>
        {page === "Plan" ? (
          <PlanPage
            state={state}
            dispatch={dispatch}
            ready={Boolean(terrain)}
          />
        ) : page === "Traverse" ? (
          <TraversePage state={state} mission={mission} dispatch={dispatch} />
        ) : page === "Limits" ? (
          <LimitsPage state={state} dispatch={dispatch} />
        ) : (
          <EventsPage state={state} mission={mission} dispatch={dispatch} />
        )}
      </div>
    </div>
  );
}
