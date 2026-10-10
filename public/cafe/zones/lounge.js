// Zone `lounge` (level 1) — reading nook. Owner: the lounge agent.
// Coords are storey-local (x, z world; y = 0 on this floor). Box + walkways: ../zones.js, ../README.md.
export async function populate({ group, zone, model, place }) {
  void zone;
  const chair = await model("armchair");
  group.add(place(chair, { x: 190, y: 0, z: 140, turn: -30 }));
  const books = await model("books", { count: 12 });
  group.add(place(books, { x: 230, y: 30, z: 4 }));
}
