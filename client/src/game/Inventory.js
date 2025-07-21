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

  // 특정 슬롯에 아이템 추가
  addItem(slotIndex, item) {
    if (slotIndex < 0 || slotIndex >= 5) return false;
    if (this.items[slotIndex] !== null) return false; // 슬롯이 이미 차있음
    
    this.items[slotIndex] = item;
    this.updateSlot(slotIndex);
    return true;
  }

  // 특정 슬롯에서 아이템 제거
  removeItem(slotIndex) {
    if (slotIndex < 0 || slotIndex >= 5) return null;
    
    const item = this.items[slotIndex];
    this.items[slotIndex] = null;
    this.updateSlot(slotIndex);
    return item;
  }

  // 슬롯 업데이트 (아이템 표시)
  updateSlot(slotIndex) {
    const item = this.items[slotIndex];
    const slotX = this.x - ((this.slotSize * 5) + (this.slotSpacing * 4)) / 2 + (this.slotSize + this.slotSpacing) * slotIndex;
    const slotY = this.y - this.slotSize / 2;
    
    // 기존 아이템 그래픽과 텍스트 제거 (있다면)
    if (this.slots[slotIndex].itemGraphic) {
      this.slots[slotIndex].itemGraphic.destroy();
    }
    if (this.slots[slotIndex].itemText) {
      this.slots[slotIndex].itemText.destroy();
    }
    
    if (item) {
      // 아이템 표시 (예시: 색상으로 구분)
      const itemGraphic = this.scene.add.graphics();
      itemGraphic.fillStyle(item.color || 0x00ff00, 1);
      itemGraphic.fillRoundedRect(slotX + 5, slotY + 5, this.slotSize - 10, this.slotSize - 10, 3);
      itemGraphic.setScrollFactor(0, 0); // 카메라와 독립적으로 고정
      
      // 아이템 이름 표시 (옵션)
      if (item.name) {
        const text = this.scene.add.text(slotX + this.slotSize / 2, slotY + this.slotSize / 2, item.name, {
          fontSize: '12px',
          color: '#ffffff'
        });
        text.setOrigin(0.5);
        text.setScrollFactor(0, 0); // 카메라와 독립적으로 고정
        this.slots[slotIndex].itemText = text; // 텍스트를 별도로 저장
      }
      
      this.slots[slotIndex].itemGraphic = itemGraphic;
    } else {
      this.slots[slotIndex].itemGraphic = null;
      this.slots[slotIndex].itemText = null;
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