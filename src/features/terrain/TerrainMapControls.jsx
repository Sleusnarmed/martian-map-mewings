export default function TerrainMapControls({ navigation, ready }) {
  const { mode, chooseMode } = navigation;

  const modes = [
    ["map", "2D", "2D overhead view"],
    ["auto", "2.5D", "2.5D oblique orbital view"],
    ["walk", "3D", "3D immersive surface view"],
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
