export default function TerrainMapControls({ navigation, ready }) {
  const { mode, chooseMode } = navigation;

  const modes = [
    ["map", "2D", "Vista cenital 2D"],
    ["auto", "2.5D", "Vista orbital inclinada 2.5D"],
    ["walk", "3D", "Vista inmersiva 3D en superficie"],
  ];

  return (
    <nav className="field-map-perspective" aria-label="Map perspective">
      {modes.map(([id, name, description]) => (
        <button
          key={id}
          type="button"
          disabled={!ready}
          aria-pressed={mode === id}
          title={description}
          onClick={() => chooseMode(id)}
        >
          {name}
        </button>
      ))}
    </nav>
  );
}
