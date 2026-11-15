import MissionIcon from "./MissionIcon.jsx";
import VoiceControls from "./VoiceControls.jsx";
import EvaVoiceControls from "../local-ai/EvaVoiceControls.jsx";

export default function MissionControlRail({ openPanel, togglePanel, mission, assistantActive, integrated, planned, setAssistantActive }) {
  return (
    <div
      className="field-control-rail"
      role="group"
      aria-label="Mission panels and audio"
    >
      <button
        className="field-rail-button"
        aria-expanded={openPanel === "information"}
        aria-controls="mission-information"
        onClick={() => togglePanel("information")}
      >
        <MissionIcon
          name={openPanel === "information" ? "panel-close" : "panel-open"}
        />
        <span>Information</span>
      </button>

      <button
        className={`field-rail-button ${mission.notice?.level === "warning" ? "has-warning" : ""}`}
        aria-expanded={openPanel === "alerts"}
        aria-controls="mission-alerts"
        onClick={() => togglePanel("alerts")}
      >
        <MissionIcon name="alert" />
        <span>Alerts</span>
        {mission.notice?.level === "warning" && (
          <span className="mt-alert-count" aria-label="1 mission alert">
            1
          </span>
        )}
      </button>

      <VoiceControls
        suspended={assistantActive}
        noticeId={mission.notice?.id}
        text={mission.notice?.text}
      />

      {integrated && (
        <button
          className="field-rail-button"
          aria-expanded={openPanel === "map"}
          aria-controls="mission-map-view"
          onClick={() => togglePanel("map")}
        >
          <MissionIcon name="layers" />
          <span>Map view</span>
        </button>
      )}
      {planned && <EvaVoiceControls onActiveChange={setAssistantActive} />}
    </div>
  );
}
