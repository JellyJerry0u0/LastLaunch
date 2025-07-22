export const GAME_WIDTH = 2500;
export const GAME_HEIGHT = 2500;
export const TILE_SIZE = 80;

export const MAIN_MAP_WIDTH = 2500;
export const MAIN_MAP_HEIGHT = 2500;

export const INITIAL_POSITION = {
    "StartingPoint": {
        "x": 100,
        "y": 100
    },
    "MainMapSceneToFarmScene": {
        "x": 200,
        "y": 100
    },
    "MainMapSceneToHouseScene": {
        "x": 200,
        "y": 100
    },
    "FarmSceneToMainMapScene": {
        "x": 200,
        "y": 100
    },
    "HouseSceneToMainMapScene": {
        "x": 200,
        "y": 100
    }
}

// 오브젝트 크기
export const HOUSE_SIZE = 120;
export const MINE_SIZE = 200;

// 색상 등 기타 상수
export const HOUSE_COLOR = 0xffa500;
export const MINE_COLOR = 0x888888;

export const MAIN_MAP_PORTAL_POSITION = {
    "FarmPortal": {
        "x": 400,
        "y": 400
    },
    "HousePortal": {
        "x": 725,
        "y": 75
    }
}
export const HOUSE_PORTAL_POSITION = {
    "MainMapPortal": {
        "x": 400,
        "y": 400
    }
}
export const FARM_PORTAL_POSITION = {
    "MainMapPortal": {
        "x": 725,
        "y": 75
    }
}
export const DEFAULT_PORTAL_SIZE = 40;

// 포탈 아이디 목록 (관리 편의)
export const PORTAL_IDS = ['FarmPortal_1', 'HousePortal_1'];
