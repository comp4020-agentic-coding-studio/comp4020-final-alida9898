// Summer decor for the café: six seasonal items, only built / listed / placeable in
// summer (see ../../README.md, "Seasons"). Each entry populates into an existing zone
// (`level` = storey number or "yard"); every tag gets `season: "summer"` added for it.
// Ids: `<l0|l1|yard>-summer-<thing>`.

const L = (zh, en) => ({ zh, en });

export const decor = [
  {
    level: 0, zone: "bar",
    // iced coffee on the counter, in the gap between the grinder (x 204…220) and the
    // pour-over (x 254…270); TOP = counter top (95), CZ − 10 matches the machine/grinder row
    async populate({ group, model, place }) {
      // scaled 1.1x (the gap here is only ~34cm wide between the grinder and pour-over, so a
      // bigger multiplier would clip neighbours); glasses nudged out 1-2cm (225→223, 249→251)
      const TOP = 95, Z = 140;
      const g1 = place(await model("iced-coffee-glass", { name: "l0-summer-iced-glass-1" }), { x: 223, y: TOP, z: Z, turn: 10, scale: 1.1 });
      g1.userData.item = { id: "l0-summer-iced-glass-1", parent: "l0-bar-counter", layer: 2, label: L("冰咖啡杯 1", "Iced coffee glass 1") };
      const jug = place(await model("iced-coffee-jug", { name: "l0-summer-iced-jug" }), { x: 237, y: TOP, z: Z, scale: 1.1 });
      jug.userData.item = { id: "l0-summer-iced-jug", parent: "l0-bar-counter", layer: 2, label: L("冰咖啡壶", "Iced coffee jug") };
      const g2 = place(await model("iced-coffee-glass", { name: "l0-summer-iced-glass-2" }), { x: 251, y: TOP, z: Z, turn: -8, scale: 1.1 });
      g2.userData.item = { id: "l0-summer-iced-glass-2", parent: "l0-bar-counter", layer: 2, label: L("冰咖啡杯 2", "Iced coffee glass 2") };
      group.add(jug, g1, g2);
    },
  },
  {
    level: 0, zone: "window",
    // paper fan on the booth's long table (x −155…−95, z 195…345, top 72), clear of the
    // cake/cup cluster near z 222…240 and the book/cup cluster near z 296…310
    async populate({ group, model, place }) {
      const o = place(await model("paper-fan", { name: "l0-summer-paper-fan" }), { x: -113, y: 72, z: 258, turn: 15, scale: 1.3 });
      o.userData.item = { id: "l0-summer-paper-fan", parent: "l0-window-table", layer: 2, label: L("一把纸扇", "Paper fan") };
      group.add(o);
    },
  },
  {
    level: 1, zone: "brewing",
    // small electric fan at the left end of the sideboard, beside the bean bags (top 90)
    async populate({ group, model, place }) {
      // scaled 1.3x; nudged right a touch (-197→-190) so the wider base stays on the
      // sideboard (left edge -200) and clear of bean bag 1 (-180)
      const o = place(await model("electric-fan", { name: "l1-summer-electric-fan" }), { x: -190, y: 90, z: 12, turn: 10, scale: 1.3 });
      o.userData.item = { id: "l1-summer-electric-fan", parent: "l1-brewing-sideboard", layer: 2, label: L("小电扇", "Electric fan") };
      group.add(o);
    },
  },
  {
    level: "yard", zone: "garden",
    async populate({ group, model, place }) {
      // striped parasol planted just behind the bench (bench back ≈ z 52, fence at z 8),
      // canopy radius 70 arcs forward over the seat
      // kept at radius 70 (not enlarged): the canopy already reads clearly at full-room scale,
      // and a bigger radius would reach past the fence (z 8) behind the bench
      const parasol = place(await model("parasol", { name: "yard-summer-parasol", radius: 70 }), { x: 420, y: 0, z: 38 });
      parasol.userData.item = { id: "yard-summer-parasol", parent: null, layer: 1, label: L("条纹遮阳伞", "Striped parasol") };
      // watermelon slice on a plate, set on the bench seat (top y = 44) away from the armrests
      const melon = place(await model("watermelon-plate", { name: "yard-summer-watermelon" }), { x: 400, y: 44, z: 78, turn: 10, scale: 1.3 });
      melon.userData.item = { id: "yard-summer-watermelon", parent: "yard-garden-bench", layer: 2, label: L("西瓜切片", "Watermelon slice") };
      // garden hose coiled on the grass beside the planter box (x 566…606, z 245…355)
      const hose = place(await model("garden-hose", { name: "yard-summer-hose" }), { x: 552, y: 0, z: 260, turn: 20, scale: 1.3 });
      hose.userData.item = { id: "yard-summer-hose", parent: null, layer: 1, label: L("卷起的水管", "Coiled garden hose") };
      group.add(parasol, melon, hose);
    },
  },
];
