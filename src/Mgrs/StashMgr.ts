import { RoomMgr } from "./RoomMgr";
import { SourceMgr } from "./SourceMgr";

export class StashMgr {

    containers: Container[];
    containerConstructionSites: ConstructionSite[];

    //storages: Storage[];

    private _roomMgr: RoomMgr;

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;

        this._loadStashes();
    }

    private _loadStashes() {
        this.containers = this._roomMgr.getStructuresOfType(STRUCTURE_CONTAINER) as Container[];
        this.containerConstructionSites = this._roomMgr.getConstructionSitesOfType(STRUCTURE_CONTAINER);
    }

    createNeededStashes() {

        for (let source of this._roomMgr.sourceMgr.sources) {

            let containerFound: Boolean = false;
            let containerConstructionFound: Boolean = false;
            let validPositions = SourceMgr.validPositions(source);

            if (validPositions.length > 0) {
                for (let pos of validPositions) {

                    // Check if we have any containers that match this position
                    containerFound = this.containers.filter(container => {
                        return container.pos.isEqualTo(pos);
                    }).length > 0;

                    // Check if we have any container construction sites that match this position
                    containerConstructionFound = this.containerConstructionSites.filter(site => {
                        return site.pos.isEqualTo(pos);
                    }).length > 0;

                    if (containerFound || containerConstructionFound) {
                        break;
                    }
                }
                if (!containerFound && !containerConstructionFound) {
                    //let conSitePos: RoomPosition = this._getBestContainerPos(validPositions);
                    let conSitePos = validPositions[0];
                    source.room.createConstructionSite(conSitePos, STRUCTURE_CONTAINER);
                }
            }
        }
    }

    // private _getBestContainerPos(validPositions: RoomPosition[]) {
    //     let bestPos = null;
    //     for(let pos of validPositions) {
    //         let maxValidPositions = this.validPositionCount(pos);
    //         if (bestPos == null || maxValidPositions > bestPos[1]) {
    //             bestPos = [pos, maxValidPositions];
    //         }
    //     }
    //     return bestPos;
    // }

    // private validPositionCount(centerPos: RoomPosition) {
    //     let validPositionCount: number = 0;
    //      /*
    //         x * *
    //         * O *
    //         * * y
    //         Start at the x, end at the y
    //     */
    //     let currentPos = new RoomPosition(centerPos.x - 1, centerPos.y - 1, centerPos.roomName);
    //     for (let xCount = 0; xCount < 3; xCount++, currentPos.x++) {
    //         for (let yCount = 0; yCount < 3; yCount++, currentPos.y++) {
    //             if (currentPos != centerPos) {
    //                 let isWall = SourceMgr.positionIsTerrainType(currentPos, 'wall');
    //                 if (!isWall) {
    //                     validPositionCount++
    //                 }
    //             }
    //         }
    //         currentPos.y -= 3;
    //     }
    //     return validPositionCount;
    // }
}

