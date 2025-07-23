export const GAME_WIDTH = 2500;
export const GAME_HEIGHT = 2500;
export const TILE_SIZE = 32;

export const MAIN_MAP_WIDTH = 2500;
export const MAIN_MAP_HEIGHT = 2500;




export const INITIAL_POSITION = {
    "StartingPoint": {
        "x": 100,
        "y": 200
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


export const STARTING_POINT = {
    "FOX": {
        "x": 5*TILE_SIZE + 16,
        "y": 6*TILE_SIZE + 16
    },
    "CAT": {
        "x": 5*TILE_SIZE + 16,
        "y": 32*TILE_SIZE + 16
    },
    "BIRD": {
        "x": 29*TILE_SIZE + 16,
        "y": 5*TILE_SIZE + 16
    },
    "RACCOON": {
        "x": 36*TILE_SIZE + 16,
        "y": 32*TILE_SIZE + 16
    }
}
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
    },
    "3to2Portal": {
        "x": 10 * TILE_SIZE + 16,
        "y": 2 * TILE_SIZE + 16
    },
    "1to2Portal": {
        "x": 1 * TILE_SIZE + 16,
        "y": 14 * TILE_SIZE + 16
    },
    "2to1Portal": {
        "x": 23 * TILE_SIZE + 16,
        "y": 16 * TILE_SIZE + 16
    },
}

export const PORTAL_DEST_POSITION = {
    "3to2Portal": {
        "x": 27 * TILE_SIZE + 16,
        "y": 13 * TILE_SIZE + 16
    },
    "1to2Portal": {
        "x": 1 * TILE_SIZE + 16,
        "y": 5 * TILE_SIZE + 16
    },
    "2to1Portal": {
        "x": 15 * TILE_SIZE + 16,
        "y": 18 * TILE_SIZE + 16
    },
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
