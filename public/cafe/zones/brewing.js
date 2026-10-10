// Zone `brewing` (level 1) — sideboard + brewing tools. Owner: the brewing agent.
// Coords are storey-local (x, z world; y = 0 on this floor). Box + walkways: ../zones.js, ../README.md.
export async function populate({ group, zone, model, place }) {
  void zone;
  const side = await model("sideboard", { width: 130 });
  group.add(place(side, { x: -135, y: 0, z: 24 }));
  const press = await model("french-press");
  group.add(place(press, { x: -150, y: 90, z: 24 }));
}
