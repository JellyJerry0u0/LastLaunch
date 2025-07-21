
export class SkillBar {
    constructor(scene, x = 20, y = null) {
      this.scene = scene;
      this.slotSize = 60;
      this.slotSpacing = 10;
      this.cols = 3;
      this.rows = 2;
      this.slots = [];
      this.skills = new Array(6).fill(null); // 6개 슬롯
      // 화면 왼쪽 아래에 고정
      this.x = x;
      this.y = y !== null ? y : this.scene.cameras.main.height - 150;
      this.createSkillBar();
    }
  
    createSkillBar() {
      // 스킬바 배경
      const totalWidth = (this.slotSize * this.cols) + (this.slotSpacing * (this.cols - 1));
      const totalHeight = (this.slotSize * this.rows) + (this.slotSpacing * (this.rows - 1));
      const background = this.scene.add.graphics();
      background.fillStyle(0x222244, 0.8);
      background.fillRoundedRect(
        this.x - 10,
        this.y - 10,
        totalWidth + 20,
        totalHeight + 20,
        10
      );
      background.setScrollFactor(0, 0);
  
      // 6개의 슬롯 생성 (3x2)
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const idx = row * this.cols + col;
          const slotX = this.x + col * (this.slotSize + this.slotSpacing);
          const slotY = this.y + row * (this.slotSize + this.slotSpacing);
          const slot = this.scene.add.graphics();
          slot.fillStyle(0x444466, 1);
          slot.fillRoundedRect(slotX, slotY, this.slotSize, this.slotSize, 5);
          slot.lineStyle(2, 0xffffff, 1);
          slot.strokeRoundedRect(slotX, slotY, this.slotSize, this.slotSize, 5);
          slot.setScrollFactor(0, 0);
          this.slots.push(slot);
          // 키 라벨 추가
          const keyLabels = ['Q', 'W', 'E', 'A', 'S', 'D'];
          const label = this.scene.add.text(
            slotX + 6,
            slotY + this.slotSize - 24,
            keyLabels[idx],
            {
              fontSize: '16px',
              color: '#ffffff',
              fontStyle: 'bold',
              fontFamily: 'Arial',
              stroke: '#000',
              strokeThickness: 2
            }
          );
          label.setOrigin(0, 0); // 좌측 아래 고정
          label.setScrollFactor(0, 0);
          slot.keyLabel = label;
        }
      }
    }
  
    // 특정 슬롯에 스킬 장착
    setSkill(slotIndex, skill) {
      if (slotIndex < 0 || slotIndex >= 6) return false;
      this.skills[slotIndex] = skill;
      this.updateSlot(slotIndex);
      return true;
    }
  
    // 슬롯 UI 업데이트 (스킬 아이콘 등)
    updateSlot(slotIndex) {
      const skill = this.skills[slotIndex];
      const col = slotIndex % this.cols;
      const row = Math.floor(slotIndex / this.cols);
      const slotX = this.x + col * (this.slotSize + this.slotSpacing);
      const slotY = this.y + row * (this.slotSize + this.slotSpacing);
      // 기존 스킬 아이콘 제거
      if (this.slots[slotIndex].skillIcon) {
        this.slots[slotIndex].skillIcon.destroy();
      }
      if (skill) {
        // 예시: 사각형 아이콘
        const icon = this.scene.add.graphics();
        icon.fillStyle(skill.color || 0xff8800, 1);
        icon.fillRoundedRect(slotX + 8, slotY + 8, this.slotSize - 16, this.slotSize - 16, 4);
        icon.setScrollFactor(0, 0);
        this.slots[slotIndex].skillIcon = icon;
      } else {
        this.slots[slotIndex].skillIcon = null;
      }
    }
  
    // 전체 슬롯 UI 업데이트
    updateAllSlots() {
      for (let i = 0; i < 6; i++) {
        this.updateSlot(i);
      }
    }
  
    // 스킬바 숨기기/보이기
    setVisible(visible) {
      this.slots.forEach(slot => {
        slot.setVisible(visible);
        if (slot.skillIcon) {
          slot.skillIcon.setVisible(visible);
        }
      });
    }
    
  } 