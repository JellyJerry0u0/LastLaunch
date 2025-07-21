import InventoryItem from './InventoryItem';

export default class CraftingTable {
  constructor(scene, x, y, inventory) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.inventory = inventory;
    this.selectedItem = null; // 드래그된 아이템 정보
    this.selectedCount = 1; // 입력된 개수
    this.createPopup();
  }

  createPopup() {
    this.container = this.scene.add.container(this.x, this.y).setVisible(false);
    // 배경
    const popupBg = this.scene.add.graphics();
    popupBg.fillStyle(0x222222, 0.95);
    popupBg.fillRoundedRect(-140, -100, 280, 200, 16);
    popupBg.lineStyle(3, 0xffd700, 1);
    popupBg.strokeRoundedRect(-140, -100, 280, 200, 16);
    // 타이틀
    this.popupText = this.scene.add.text(0, -80, '제작대', { fontSize: '18px', color: '#fff', align: 'center' }).setOrigin(0.5);
    // 재료 슬롯 (드래그&드롭)
    this.materialSlotBg = this.scene.add.graphics();
    this.materialSlotBg.lineStyle(2, 0xffffff, 1);
    this.materialSlotBg.strokeRect(-100, -40, 60, 60);
    this.materialSlotBg.fillStyle(0x333333, 1);
    this.materialSlotBg.fillRect(-100, -40, 60, 60);
    this.materialSlotBg.setInteractive(new Phaser.Geom.Rectangle(-100, -40, 60, 60), Phaser.Geom.Rectangle.Contains);
    // 결과물 슬롯
    this.resultSlotBg = this.scene.add.graphics();
    this.resultSlotBg.lineStyle(2, 0xffffff, 1);
    this.resultSlotBg.strokeRect(40, -40, 60, 60);
    this.resultSlotBg.fillStyle(0x333333, 1);
    this.resultSlotBg.fillRect(40, -40, 60, 60);
    // 입력창 (DOMElement)
    this.inputHtml = document.createElement('input');
    this.inputHtml.type = 'number';
    this.inputHtml.min = '1';
    this.inputHtml.value = '1';
    this.inputHtml.style.width = '40px';
    this.inputHtml.style.fontSize = '16px';
    this.inputHtml.style.textAlign = 'center';
    this.inputHtml.addEventListener('input', () => {
      this.selectedCount = parseInt(this.inputHtml.value) || 1;
      this.updateResultPreview();
    });
    this.inputBox = this.scene.add.dom(-20, 0, this.inputHtml);
    // 상태 텍스트
    this.statusText = this.scene.add.text(0, 50, '', { fontSize: '14px', color: '#fff', align: 'center' }).setOrigin(0.5);
    // 제작 버튼
    const craftBtn = this.scene.add.text(0, 80, '[제작하기]', { fontSize: '16px', color: '#fff', backgroundColor: '#333', padding: { left: 8, right: 8, top: 4, bottom: 4 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.tryCraft());
    // 닫기 버튼
    const closeBtn = this.scene.add.text(120, -85, '[X]', { fontSize: '16px', color: '#ffd700', backgroundColor: '#333', padding: { left: 6, right: 6, top: 2, bottom: 2 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.hide());
    // 컨테이너에 추가
    this.container.add([
      popupBg, this.popupText,
      this.materialSlotBg, this.resultSlotBg, this.inputBox,
      this.statusText, craftBtn, closeBtn
    ]);
    // 드래그&드롭 이벤트 연결 (인벤토리에서 드래그 시작/종료는 Inventory.js에서 연결 필요)
    this.materialSlotBg.on('pointerup', (pointer) => {
      if (this.scene.draggedInventoryItem) {
        this.setMaterial(this.scene.draggedInventoryItem.item, this.scene.draggedInventoryItem.slotIdx);
        this.scene.clearDraggedInventoryItem();
      }
    });
    // 결과물 미리보기용 이미지/텍스트
    this.resultImage = null;
    this.resultCountText = null;
    this.materialImage = null;
    this.materialCountText = null;
  }

  show() {
    this.statusText.setText('');
    this.selectedItem = null;
    this.selectedCount = 1;
    this.inputHtml.value = '1';
    this.clearMaterialSlot();
    this.clearResultSlot();
    // 팝업을 항상 화면 중앙에 위치
    this.container.x = this.scene.cameras.main.centerX;
    this.container.y = this.scene.cameras.main.centerY;
    this.container.setVisible(true);
    console.log(this.inventory.items);
  }
  hide() {
    this.container.setVisible(false);
  }

  setMaterial(item, slotIdx) {
    this.selectedItem = { ...item, slotIdx };
    this.updateMaterialSlot();
    this.updateResultPreview();
  }
  clearMaterialSlot() {
    if (this.materialImage) {
      this.container.remove(this.materialImage, true);
      this.materialImage = null;
    }
    if (this.materialCountText) {
      this.container.remove(this.materialCountText, true);
      this.materialCountText = null;
    }
  }
  updateMaterialSlot() {
    this.clearMaterialSlot();
    if (this.selectedItem) {
      this.materialImage = this.scene.add.image(-100 + 30, -40 + 30, this.selectedItem.imageKey)
        .setDisplaySize(40, 40).setOrigin(0.5);
      this.container.add(this.materialImage);
      this.materialCountText = this.scene.add.text(-100 + 54, -40 + 54, this.selectedItem.count + '', {
        fontSize: '14px', color: '#ffff00', fontStyle: 'bold'
      }).setOrigin(1, 1);
      this.container.add(this.materialCountText);
    }
  }
  clearResultSlot() {
    if (this.resultImage) {
      this.container.remove(this.resultImage, true);
      this.resultImage = null;
    }
    if (this.resultCountText) {
      this.container.remove(this.resultCountText, true);
      this.resultCountText = null;
    }
  }
  updateResultPreview() {
    this.clearResultSlot();
    // 예시: iron 3개 → ironstick 1개
    if (this.selectedItem && this.selectedItem.name === 'iron') {
      const craftableCount = Math.floor(this.selectedItem.count / 3);
      const wantCount = Math.min(this.selectedCount, craftableCount);
      if (wantCount > 0) {
        this.resultImage = this.scene.add.image(40 + 30, -40 + 30, 'ironstick')
          .setDisplaySize(40, 40).setOrigin(0.5);
        this.container.add(this.resultImage);
        this.resultCountText = this.scene.add.text(40 + 54, -40 + 54, wantCount + '', {
          fontSize: '14px', color: '#ffff00', fontStyle: 'bold'
        }).setOrigin(1, 1);
        this.container.add(this.resultCountText);
      }
    }
  }

  tryCraft() {
    // iron 3개 → ironstick 1개
    if (!this.selectedItem || this.selectedItem.name !== 'iron') {
      this.statusText.setText('재료를 올려주세요!');
      return;
    }
    const craftableCount = Math.floor(this.selectedItem.count / 3);
    const wantCount = Math.min(this.selectedCount, craftableCount);
    if (wantCount < 1) {
      this.statusText.setText('재료가 부족합니다!');
      return;
    }
    // 인벤토리에서 iron 차감
    let toRemove = wantCount * 3;
    const idx = this.selectedItem.slotIdx;
    const item = this.inventory.items[idx];
    if (!item || item.name !== 'iron' || item.count < toRemove) {
      this.statusText.setText('인벤토리 정보가 일치하지 않습니다!');
      console.log(item);
      console.log(item.name);
      return;
    }
    item.count -= toRemove;
    if (item.count === 0) this.inventory.items[idx] = null;
    this.inventory.updateSlot(idx);
    // ironstick 추가
    for (let i = 0; i < wantCount; i++) {
      this.inventory.addItem({ type: 'ironstick', name: 'ironstick', imageKey: 'ironstick' });
    }
    this.statusText.setText('ironstick ' + wantCount + '개 제작 완료!');
    this.clearMaterialSlot();
    this.clearResultSlot();
    setTimeout(() => this.hide(), 1000);
  }
} 