import { demoScenarios } from "./demoMission.js";

export default function readPreviewLocation() {
  const query = new URLSearchParams(window.location.search);
  const scenarioId = demoScenarios.some(
    (scenario) => scenario.id === query.get("scenario"),
  )
    ? query.get("scenario")
    : "normal";
  const fallbackTab = scenarioId === "arrival" ? "science" : "route";
  const activeTab = ["route", "telemetry", "science"].includes(query.get("tab"))
    ? query.get("tab")
    : fallbackTab;
  const lastPage = activeTab === "science" ? 2 : 0;
  const requestedPage = Number(query.get("page") || 0);
  const page = Number.isInteger(requestedPage)
    ? Math.max(0, Math.min(lastPage, requestedPage))
    : 0;

  const initialPanel =
    query.get("panel") === "information"
      ? "information"
      : query.get("tab") === "alerts" ||
          query.get("panel") === "alerts" ||
          scenarioId.includes("delay")
        ? "alerts"
        : null;

  return {
    scenarioId,
    activeTab,
    page,
    panel: initialPanel,
  };
}

