// client/src/game/InventoryItem.js

export default class InventoryItem {
    constructor({ type, name, imageKey, count = 1 }) {
      this.type = type;         // 예: 'iron'
      this.name = name;         // 예: 'iron'
      this.imageKey = imageKey; // 예: 'iron'
      this.count = count;       // 기본값 1
    }
  }