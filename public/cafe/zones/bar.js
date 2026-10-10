// Zone `bar` (level 0) — counter, back bar, menu board, entrance. Owner: the bar agent.
// Coords are storey-local (x, z world; y = 0 on this floor). Box + walkways: ../zones.js, ../README.md.
export async function populate({ group, zone, model, place }) {
  void zone;
  const counter = await model("counter", { width: 200 });
  group.add(place(counter, { x: 170, y: 0, z: 175 }));
  const machine = await model("coffee-machine");
  group.add(place(machine, { x: 200, y: 95, z: 168, turn: 180 }));
}
