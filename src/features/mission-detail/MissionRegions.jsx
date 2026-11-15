export default function MissionRegions({ selectedRegionId, selectRegion }) {
  return (
    <nav className="field-regions" aria-label="Mission region">
      <button
        aria-current={
          selectedRegionId === "syrtis-major" ? "location" : undefined
        }
        onClick={() => selectRegion("syrtis-major")}
      >
        Syrtis Major
      </button>
      <span aria-hidden="true">/</span>
      <button
        aria-current={selectedRegionId === "jezero" ? "location" : undefined}
        onClick={() => selectRegion("jezero")}
      >
        Jezero
      </button>
      <span aria-hidden="true">/</span>
      <button
        aria-current={
          selectedRegionId === "wildcat-ridge" ? "location" : undefined
        }
        onClick={() => selectRegion("wildcat-ridge")}
      >
        Wildcat Ridge
      </button>
    </nav>
  );
}
