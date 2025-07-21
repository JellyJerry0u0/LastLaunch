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
    console.log('addItem 호출:', itemData);
    console.log('현재 인벤토리:', this.items);
    const idx = this.items.findIndex(i => i && i.name === itemData.name);
    console.log('중복 idx:', idx);
    if (idx !== -1) {
      this.items[idx].count += 1;
      this.updateSlot(idx);
      return true;
    }
    const emptyIdx = this.findEmptySlot();
    console.log('빈 칸 idx:', emptyIdx);
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
          .setScrollFactor(0, 0)
          .setInteractive({ draggable: true });
        // 드래그 시작
        img.on('pointerdown', (pointer, localX, localY, event) => {
          if (event) event.stopPropagation(); // 캐릭터 이동 방지
          this.scene.input.setDraggable(img, true);
          this.scene.draggedInventoryItem = { item, slotIdx: slotIndex, dragImage: img };
        });
        // 드래그 중
        img.on('drag', (pointer, dragX, dragY) => {
          img.x = dragX;
          img.y = dragY;
        });
        // 드래그 종료
        img.on('pointerup', (pointer, localX, localY, event) => {
          if (event) event.stopPropagation();
          // 팝업이 열려 있고, craftingTable/materialSlotBg가 있으면 드롭 판정
          const craftingTable = this.scene.craftingTable;
          if (craftingTable && craftingTable.container.visible) {
            const slotBg = craftingTable.materialSlotBg;
            // materialSlotBg는 Graphics이므로, 직접 좌표와 크기 지정 필요
            // 팝업 컨테이너의 위치를 더해줘야 함
            const containerX = craftingTable.container.x;
            const containerY = craftingTable.container.y;
            const slotX = containerX - 100; // materialSlotBg의 fillRect(-100, -40, 60, 60) 기준
            const slotY = containerY - 40;
            const slotWidth = 60;
            const slotHeight = 60;
            const px = this.scene.input.activePointer.worldX;
            const py = this.scene.input.activePointer.worldY;
            if (
              px >= slotX && px <= slotX + slotWidth &&
              py >= slotY && py <= slotY + slotHeight
            ) {
              craftingTable.setMaterial(item, slotIndex);
            }
          }
          // 드래그 이미지 원위치
          img.x = slotX + this.slotSize / 2;
          img.y = slotY + this.slotSize / 2;
          this.scene.draggedInventoryItem = null;
        });
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