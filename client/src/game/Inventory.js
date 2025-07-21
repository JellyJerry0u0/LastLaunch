import InventoryItem from './InventoryItem';

export default class Inventory {
  constructor(scene, x = null, y = null) {
    this.scene = scene;
    this.slotSize = 60;
    this.slotSpacing = 10;
    this.slots = [];
    this.items = new Array(5).fill(null); // 5개 슬롯, 초기값은 null
    
    // 화면 하단 중앙에 위치하도록 설정
    this.x = x !== null ? x : this.scene.cameras.main.width / 2;
    this.y = y !== null ? y : this.scene.cameras.main.height - 50;
    
    this.createInventory();
  }

  createInventory() {
    // 인벤토리 배경
    const totalWidth = (this.slotSize * 5) + (this.slotSpacing * 4);
    const background = this.scene.add.graphics();
    background.fillStyle(0x333333, 0.8);
    background.fillRoundedRect(
      this.x - totalWidth / 2 - 10,
      this.y - this.slotSize / 2 - 10,
      totalWidth + 20,
      this.slotSize + 20,
      10
    );
    background.setScrollFactor(0, 0); // 카메라와 독립적으로 고정
    console.log('Inventory create!');

    // 5개의 슬롯 생성
    for (let i = 0; i < 5; i++) {
      const slotX = this.x - totalWidth / 2 + (this.slotSize + this.slotSpacing) * i;
      
      // 슬롯 배경
      const slot = this.scene.add.graphics();
      slot.fillStyle(0x666666, 1);
      slot.fillRoundedRect(slotX, this.y - this.slotSize / 2, this.slotSize, this.slotSize, 5);
      slot.lineStyle(2, 0xffffff, 1);
      slot.strokeRoundedRect(slotX, this.y - this.slotSize / 2, this.slotSize, this.slotSize, 5);
      slot.setScrollFactor(0, 0); // 카메라와 독립적으로 고정
      
      this.slots.push(slot);
    }
  }

  // 같은 name이 있으면 count만 증가, 없으면 새로 추가
  addItem(itemData) {
    const idx = this.items.findIndex(i => i && i.name === itemData.name);
    if (idx !== -1) {
      this.items[idx].count += 1;
      this.updateSlot(idx);
      return true;
    }
    const emptyIdx = this.findEmptySlot();
    if (emptyIdx !== -1) {
      this.items[emptyIdx] = new InventoryItem(itemData);
      this.updateSlot(emptyIdx);
      return true;
    }
    return false;
  }

  removeItem(slotIndex) {
    if (slotIndex < 0 || slotIndex >= 5) return null;
    const item = this.items[slotIndex];
    if (item && item.count > 1) {
      item.count -= 1;
      this.updateSlot(slotIndex);
      return item;
    }
    this.items[slotIndex] = null;
    this.updateSlot(slotIndex);
    return item;
  }

  updateSlot(slotIndex) {
    const item = this.items[slotIndex];
    const slotX = this.x - ((this.slotSize * 5) + (this.slotSpacing * 4)) / 2 + (this.slotSize + this.slotSpacing) * slotIndex;
    const slotY = this.y - this.slotSize / 2;
    if (this.slots[slotIndex].itemGraphic) {
      this.slots[slotIndex].itemGraphic.destroy();
    }
    if (this.slots[slotIndex].itemText) {
      this.slots[slotIndex].itemText.destroy();
    }
    if (this.slots[slotIndex].itemImage) {
      this.slots[slotIndex].itemImage.destroy();
    }
    if (this.slots[slotIndex].itemCountText) {
      this.slots[slotIndex].itemCountText.destroy();
    }
    if (item) {
      // 이미지 표시
      if (item.imageKey) {
        const img = this.scene.add.image(slotX + this.slotSize / 2, slotY + this.slotSize / 2, item.imageKey)
          .setDisplaySize(this.slotSize - 10, this.slotSize - 10)
          .setOrigin(0.5)
          .setScrollFactor(0, 0);
        this.slots[slotIndex].itemImage = img;
      }
      // 이름 표시 (아이콘 아래)
      if (item.name) {
        const text = this.scene.add.text(slotX + this.slotSize / 2, slotY + this.slotSize - 8, item.name, {
          fontSize: '12px',
          color: '#ffffff'
        });
        text.setOrigin(0.5, 1);
        text.setScrollFactor(0, 0);
        this.slots[slotIndex].itemText = text;
      }
      // 개수 표시 (오른쪽 아래)
      if (item.count > 1) {
        const countText = this.scene.add.text(slotX + this.slotSize - 8, slotY + this.slotSize - 8, item.count.toString(), {
          fontSize: '14px',
          color: '#ffff00',
          fontStyle: 'bold'
        });
        countText.setOrigin(1, 1);
        countText.setScrollFactor(0, 0);
        this.slots[slotIndex].itemCountText = countText;
      }
    }
  }

  // 모든 슬롯 업데이트
  updateAllSlots() {
    for (let i = 0; i < 5; i++) {
      this.updateSlot(i);
    }
  }

  // 빈 슬롯 찾기
  findEmptySlot() {
    return this.items.findIndex(item => item === null);
  }

  // 인벤토리 숨기기/보이기
  setVisible(visible) {
    this.slots.forEach(slot => {
      slot.setVisible(visible);
      if (slot.itemGraphic) {
        slot.itemGraphic.setVisible(visible);
      }
      if (slot.itemText) {
        slot.itemText.setVisible(visible);
      }
    });
  }
} 