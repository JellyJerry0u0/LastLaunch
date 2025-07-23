import { PORTAL_IDS } from './constants';
import socket from '../services/socket';

export class SkillBar {
    constructor(scene, x = 20, y = null) {
      this.scene = scene;
      this.slotSize = 60;
      this.slotSpacing = 10;
      this.cols = 1; // 1열
      this.rows = 1; // 1행
      this.slots = [];
      this.skills = new Array(1).fill(null); // 1개 슬롯
      // 화면 왼쪽 아래에 고정
      this.x = x;
      this.y = y !== null ? y : this.scene.cameras.main.height - 150;
      this.createSkillBar();
      // 모달 관련
      this.skillTargetModal = null;
      this.handleKeyInput();
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

      // 1개의 슬롯 생성 (1x1)
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
          const keyLabels = ['A'];
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
      if (slotIndex < 0 || slotIndex >= 1) return false;
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
      for (let i = 0; i < 1; i++) {
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

    handleKeyInput() {
      this._gloveSkillCooldown = false;
      this.scene.input.keyboard.on('keydown-Q', () => {
        this.showSkillTargetModal();
      });
      this.scene.input.keyboard.on('keydown-W', () => {
        this.showPortalDisableModal();
      });
      this.scene.input.keyboard.on('keydown-E', () => {
        this.useSpeedUpSkill();
      });
      this.scene.input.keyboard.on('keydown-A', () => {
        if (this._gloveSkillCooldown) return; // 쿨타임 중이면 무시
        this._gloveSkillCooldown = true;
        window.dispatchEvent(new CustomEvent('glove-cooldown', { detail: { duration: 1000 } }));
        console.log("A key pressed + glove skill effect");
        // 내 플레이어와 전체 플레이어 목록이 필요
        const myPlayer = this.scene.myPlayer;
        const players = Object.values(this.scene.players);
        if (myPlayer && players) {
          myPlayer.useGloveSkill(players);
        }
        setTimeout(() => {
          this._gloveSkillCooldown = false;
        }, 1000);
      });
    }

    useSpeedUpSkill() {
      // 쿨타임 및 중복 방지
      if (this._speedSkillActive || this._speedSkillCooldown) return;
      const player = this.scene.myPlayer;
      if (!player) return;
      this._speedSkillActive = true;
      player.speedMultiplier = 2;
      // 5초 후 원래 속도로 복구
      this.scene.time.delayedCall(5000, () => {
        player.speedMultiplier = 1;
        this._speedSkillActive = false;
      });
      // 쿨타임 10초
      this._speedSkillCooldown = true;
      this.scene.time.delayedCall(10000, () => {
        this._speedSkillCooldown = false;
      });
      // (선택) UI로 효과/쿨타임 표시 가능
    }

    showSkillTargetModal() {
      if (this.skillTargetModal) return; // 이미 열려있으면 중복 방지
      // 임시 플레이어 목록 (실제론 외부에서 받아와야 함)
      const playerList = [
        { id: '1', name: 'Player 1' },
        { id: '2', name: 'Player 2' },
        { id: '3', name: 'Player 3' },
        { id: '4', name: 'Player 4' },
      ];
      // 화면 고정 중심 계산 (카메라 스크롤 무시)
      const cam = this.scene.cameras.main;
      const centerX = cam.width / 2;
      const centerY = cam.height / 2;
      // === 오버레이 추가 (모달 외부 클릭 차단) ===
      const overlay = this.scene.add.rectangle(centerX, centerY, cam.width, cam.height, 0x000000, 0.001)
        .setDepth(999)
        .setInteractive();
      overlay.setScrollFactor(0, 0);
      overlay.on('pointerdown', () => {}); // 아무 동작도 하지 않음
      // === 모달 배경 ===
      const modalWidth = 480;
      const modalHeight = 320;
      const bg = this.scene.add.rectangle(centerX, centerY, modalWidth, modalHeight, 0x222244, 0.95).setDepth(1000);
      bg.setScrollFactor(0, 0);
      // 상단 문구
      const title = this.scene.add.text(centerX, centerY - modalHeight/2 + 32, '스킬 적용대상', {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(1001);
      title.setScrollFactor(0, 0);
      // 플레이어 선택 가로 배치
      const playerAreaY = centerY - 30;
      const playerAreaWidth = 80;
      const playerAreaHeight = 140;
      const playerSpacing = 24;
      const totalPlayersWidth = playerList.length * playerAreaWidth + (playerList.length - 1) * playerSpacing;
      const startX = centerX - totalPlayersWidth / 2 + playerAreaWidth / 2;
      const playerRects = [];
      const playerTexts = [];
      let selectedIdx = null;
      playerList.forEach((player, idx) => {
        const px = startX + idx * (playerAreaWidth + playerSpacing);
        // 이미지 자리(회색 직사각형)
        const rect = this.scene.add.rectangle(px, playerAreaY, playerAreaWidth, playerAreaHeight, 0x888888, 1).setDepth(1001);
        rect.setScrollFactor(0, 0);
        rect.setStrokeStyle(3, 0xffffff, 1);
        // 플레이어 아이디 텍스트
        const text = this.scene.add.text(px, playerAreaY + playerAreaHeight/2 + 18, player.name, {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(1002);
        text.setScrollFactor(0, 0);
        playerRects.push(rect);
        playerTexts.push(text);
      });
      // 확인 버튼
      const confirmBtnY = centerY + modalHeight/2 - 36;
      const confirmBtn = this.scene.add.rectangle(centerX, confirmBtnY, 120, 38, 0x00bb88, 1).setDepth(1002).setInteractive({ useHandCursor: true });
      confirmBtn.setScrollFactor(0, 0);
      const confirmText = this.scene.add.text(centerX, confirmBtnY, '확인', {
        fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(1003);
      confirmText.setScrollFactor(0, 0);
      // 확인 버튼 클릭
      confirmBtn.on('pointerdown', () => {
        if (selectedIdx !== null) {
          this.onSkillTargetSelected(playerList[selectedIdx]);
        }
      });
      // 닫기 버튼
      const closeBtn = this.scene.add.text(centerX + modalWidth/2 - 32, centerY - modalHeight/2 + 16, 'X', {
        fontSize: '20px', color: '#ff8888', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(1002).setInteractive({ useHandCursor: true });
      closeBtn.setScrollFactor(0, 0);
      closeBtn.on('pointerdown', () => this.closeSkillTargetModal());
      // 키보드 입력 핸들러
      this._skillModalKeyHandler = (event) => {
        if (event.repeat) return;
        if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4') {
          const idx = parseInt(event.key, 10) - 1;
          if (idx >= 0 && idx < playerRects.length) {
            playerRects.forEach((r, i) => r.setStrokeStyle(3, i === idx ? 0x00ffcc : 0xffffff, 1));
            selectedIdx = idx;
          }
        } else if (event.key === 'Enter') {
          if (selectedIdx !== null) {
            this.onSkillTargetSelected(playerList[selectedIdx]);
          }
        }
      };
      window.addEventListener('keydown', this._skillModalKeyHandler);
      // 모달 요소 저장
      this.skillTargetModal = [overlay, bg, title, ...playerRects, ...playerTexts, confirmBtn, confirmText, closeBtn];
    }

    closeSkillTargetModal() {
      if (!this.skillTargetModal) return;
      this.skillTargetModal.forEach(obj => obj.destroy());
      this.skillTargetModal = null;
      if (this._skillModalKeyHandler) {
        window.removeEventListener('keydown', this._skillModalKeyHandler);
        this._skillModalKeyHandler = null;
      }
    }

    onSkillTargetSelected(player) {
      // TODO: 실제 스킬 효과 적용 로직 (player.id)
      this.closeSkillTargetModal();
      // 예시: 콘솔 출력
      console.log('Q스킬 대상 선택:', player);
    }

    showPortalDisableModal() {
      if (this.skillTargetModal) return;
      // 포탈 아이디 목록 (constants에서)
      const portalIds = PORTAL_IDS;
      // 화면 고정 중심 계산
      const cam = this.scene.cameras.main;
      const centerX = cam.width / 2;
      const centerY = cam.height / 2;
      // 오버레이
      const overlay = this.scene.add.rectangle(centerX, centerY, cam.width, cam.height, 0x000000, 0.001)
        .setDepth(999)
        .setInteractive();
      overlay.setScrollFactor(0, 0);
      overlay.on('pointerdown', () => {});
      // 모달 배경
      const modalWidth = 480;
      const modalHeight = 220;
      const bg = this.scene.add.rectangle(centerX, centerY, modalWidth, modalHeight, 0x222244, 0.95).setDepth(1000);
      bg.setScrollFactor(0, 0);
      // 상단 문구
      const title = this.scene.add.text(centerX, centerY - modalHeight/2 + 32, '비활성화할 포탈 선택', {
        fontSize: '22px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(1001);
      title.setScrollFactor(0, 0);
      // 포탈 선택 가로 배치
      const areaY = centerY + 10;
      const areaWidth = 120;
      const areaHeight = 60;
      const spacing = 32;
      const totalWidth = portalIds.length * areaWidth + (portalIds.length - 1) * spacing;
      const startX = centerX - totalWidth / 2 + areaWidth / 2;
      const portalRects = [];
      const portalTexts = [];
      let selectedIdx = null;
      portalIds.forEach((portalId, idx) => {
        const px = startX + idx * (areaWidth + spacing);
        const rect = this.scene.add.rectangle(px, areaY, areaWidth, areaHeight, 0x888888, 1).setDepth(1001);
        rect.setScrollFactor(0, 0);
        rect.setStrokeStyle(3, 0xffffff, 1);
        const text = this.scene.add.text(px, areaY, portalId, {
          fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(1002);
        text.setScrollFactor(0, 0);
        portalRects.push(rect);
        portalTexts.push(text);
      });
      // 확인 버튼
      const confirmBtnY = centerY + modalHeight/2 - 36;
      const confirmBtn = this.scene.add.rectangle(centerX, confirmBtnY, 120, 38, 0x00bb88, 1).setDepth(1002).setInteractive({ useHandCursor: true });
      confirmBtn.setScrollFactor(0, 0);
      const confirmText = this.scene.add.text(centerX, confirmBtnY, '확인', {
        fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(1003);
      confirmText.setScrollFactor(0, 0);
      confirmBtn.on('pointerdown', () => {
        if (selectedIdx !== null) {
          this.emitDisablePortal(portalIds[selectedIdx]);
          this.closeSkillTargetModal();
        }
      });
      // 닫기 버튼
      const closeBtn = this.scene.add.text(centerX + modalWidth/2 - 32, centerY - modalHeight/2 + 16, 'X', {
        fontSize: '20px', color: '#ff8888', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(1002).setInteractive({ useHandCursor: true });
      closeBtn.setScrollFactor(0, 0);
      closeBtn.on('pointerdown', () => this.closeSkillTargetModal());
      // 키보드 입력 핸들러
      this._skillModalKeyHandler = (event) => {
        if (event.repeat) return;
        if (event.key >= '1' && event.key <= String(portalIds.length)) {
          const idx = parseInt(event.key, 10) - 1;
          if (idx >= 0 && idx < portalRects.length) {
            portalRects.forEach((r, i) => r.setStrokeStyle(3, i === idx ? 0x00ffcc : 0xffffff, 1));
            selectedIdx = idx;
          }
        } else if (event.key === 'Enter') {
          if (selectedIdx !== null) {
            this.emitDisablePortal(portalIds[selectedIdx]);
            this.closeSkillTargetModal();
          }
        }
      };
      window.addEventListener('keydown', this._skillModalKeyHandler);
      // 모달 요소 저장
      this.skillTargetModal = [overlay, bg, title, ...portalRects, ...portalTexts, confirmBtn, confirmText, closeBtn];
    }

    emitDisablePortal(portalId) {
      if (!portalId) return;
      socket.emit('disablePortal', { roomId: this.scene.roomId, portalId, scene: this.scene.scene.key });
    }
    
  } 