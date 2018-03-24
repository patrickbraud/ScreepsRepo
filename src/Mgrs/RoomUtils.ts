export class RoomUtils {
    static getBoxPositions(spacesFromCenter: number, centerPosition: RoomPosition): RoomPosition[] {
        let edgeLength = spacesFromCenter * 2 + 1;

        let topLeftStart = new RoomPosition(centerPosition.x - spacesFromCenter,
                                        centerPosition.y - spacesFromCenter,
                                        centerPosition.roomName);
        let topRightStart = new RoomPosition(centerPosition.x + spacesFromCenter,
                                        centerPosition.y - spacesFromCenter,
                                        centerPosition.roomName);
        let bottomLeftStart = new RoomPosition(centerPosition.x - spacesFromCenter,
                                        centerPosition.y + spacesFromCenter,
                                        centerPosition.roomName);
        let bottomRightStart = new RoomPosition(centerPosition.x + spacesFromCenter,
                                        centerPosition.y + spacesFromCenter,
                                        centerPosition.roomName);

        let boxPositions: RoomPosition[] = [];
        for(let edgeCount = 0; edgeCount < edgeLength - 1; edgeCount++) {
            boxPositions.push(topLeftStart);
            boxPositions.push(topRightStart);
            boxPositions.push(bottomLeftStart);
            boxPositions.push(bottomRightStart);

            topLeftStart = new RoomPosition(topLeftStart.x += 1, topLeftStart.y, topLeftStart.roomName);
            topRightStart = new RoomPosition(topRightStart.x, topRightStart.y += 1, topRightStart.roomName);
            bottomLeftStart = new RoomPosition(bottomLeftStart.x, bottomLeftStart.y -= 1, bottomLeftStart.roomName);
            bottomRightStart = new RoomPosition(bottomRightStart.x -= 1, bottomRightStart.y, bottomRightStart.roomName);
        }

        return boxPositions;
    }

    static validPositions(centerObject: any, invalidTerrain: string[]): RoomPosition[] {
        let validPositions: RoomPosition[] = [];
         /*
            x * *
            * O *
            * * y
            Start at the x, end at the y
        */
        let currentPos: RoomPosition;
        if (centerObject.hasOwnProperty('pos')) {
            currentPos = new RoomPosition(centerObject.pos.x - 1, centerObject.pos.y - 1, centerObject.pos.roomName);
        }
        else {
            currentPos = new RoomPosition(centerObject.x - 1, centerObject.y - 1, centerObject.roomName);
        }
        for (let xCount = 0; xCount < 3; xCount++, currentPos.x++) {
            for (let yCount = 0; yCount < 3; yCount++, currentPos.y++) {
                if (currentPos != centerObject.pos) {

                    let invalid = false;
                    for (let terrain of invalidTerrain) {
                        invalid = RoomUtils.positionIsTerrainType(currentPos, terrain);
                        if (invalid) { break; }
                    }
                    if (!invalid) {
                        validPositions.push(new RoomPosition(currentPos.x, currentPos.y, currentPos.roomName));;
                    }
                }
            }
            currentPos.y -= 3;
        }
        return validPositions;
    }

    static positionIsTerrainType(pos: RoomPosition, terrain: string): boolean {
        let lookResult = Game.rooms[pos.roomName].lookForAt(LOOK_TERRAIN, pos);
        //console.log('x: ' + pos.x + ' y: ' + pos.y + ' - ' + lookResult.toString() + ' - ' + (lookResult.toString() != 'wall'));
        return lookResult.toString() == terrain;
    }

    static distanceTo(pos1: any, pos2: any): number {
        let x1: number;
        let x2: number;
        let y1: number;
        let y2: number;
        if (pos1.hasOwnProperty('pos')) {
            x1 = pos1.pos.x;
            y1 = pos1.pos.y;
        }
        else {
            x1 = pos1.x;
            y1 = pos1.y;
        }

        if (pos2.hasOwnProperty('pos')) {
            x2 = pos2.pos.x;
            y2 = pos2.pos.y;
        }
        else {
            x2 = pos2.x;
            y2 = pos2.y;
        }

        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    static midPoint(pos1: any, pos2: any): RoomPosition {
        let x1: number;
        let x2: number;
        let y1: number;
        let y2: number;
        let roomName: string;
        if (pos1.hasOwnProperty('pos')) {
            RoomPosition
            x1 = pos1.pos.x;
            y1 = pos1.pos.y;
            roomName = pos1.pos.roomName;
        }
        else {
            x1 = pos1.x;
            y1 = pos1.y;
            roomName = pos1.roomName;
        }

        if (pos2.hasOwnProperty('pos')) {
            x2 = pos2.pos.x;
            y2 = pos2.pos.y;
        }
        else {
            x2 = pos2.x;
            y2 = pos2.y;
        }

        return new RoomPosition(((x1 + x2) / 2), ((y1 + y2) / 2), roomName);
    }
}
