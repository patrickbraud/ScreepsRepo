import { RoomMgr } from "./RoomMgr";
import { Screep } from "Creeps/Screep";

export class SourceMgr {

    private _roomManager: RoomMgr;

    public sources: Source[];

    constructor(roomMgr: RoomMgr) {
        this._roomManager = roomMgr;

        // Later, return sources in other rooms around our base as well
        this.sources = this._roomManager.baseRoom.sourcesInRoom;
    }

    spawnNeededHarvesters(): Boolean {
        let spawnRequested: Boolean = false;
        for (let source of this.sources) {
            if (source.harvesterWorkCount < 5 && source.harvesterCount < this.maxCreepCount(source)) {
                spawnRequested = true;
                // let neededWorkParts = 5 - source.harvesterWorkCount;
                // this._roomManager.baseRoomSpawn.spawnHarvester(neededWorkParts, 1, 1, source);
                this._roomManager.baseRoomSpawn.spawnHarvester(5, 1, 1, source);
                break;
            }
        }
        return spawnRequested;
    }

    getSourceByID(sourceID: string): Source {
        let targetSource: Source = null;
        this.sources.forEach(source => {
            if (source.id == sourceID) {
                targetSource = source;
                return;
            }
        });
        return targetSource;
    }

    getBestSource(screep: Screep): Source {
        // Get all of the sources in the same room as the creep
        let sourcesInRoom = this.sources.filter( src => src.room.name == screep.creep.room.name );
        // console.log('Sources in Room');
        // console.log(sourcesInRoom);

        // Keep only the sources that have less creeps targeting them than the source has valid spaces to harvest from
        let openSources: Source[] = sourcesInRoom.filter( src => src.creepsTargeting.length < src.maxCreepCount );
        // console.log('Open Sources');
        // console.log(openSources);

        // Order the sources by linear distance to the creep
        let orderedSources: Source[] = openSources.sort(function (a, b) {return screep.distanceTo(a.pos) - screep.distanceTo(b.pos); });
        // console.log('Ordered Sources');
        // console.log(orderedSources);

        return orderedSources[0];
    }

    maxCreepCount(source: Source): number {
        let validSpaceCount: number = 0;
         /*
            x * *
            * O *
            * * y
            Start at the x, end at the y
        */
        let currentPos = new RoomPosition(source.pos.x - 1, source.pos.y - 1, source.pos.roomName);
        for (let xCount = 0; xCount < 3; xCount++, currentPos.x++) {
            for (let yCount = 0; yCount < 3; yCount++, currentPos.y++) {
                if (currentPos != source.pos) {
                    let isValid = this.positionIsValid(currentPos);
                    validSpaceCount = isValid ? ++validSpaceCount : validSpaceCount;
                }
            }
            currentPos.y -= 3;
        }
        return validSpaceCount;
    }

    positionIsValid(pos: RoomPosition): boolean {
        let lookResult = Game.rooms[pos.roomName].lookForAt(LOOK_TERRAIN, pos);
        //console.log('x: ' + pos.x + ' y: ' + pos.y + ' - ' + lookResult.toString() + ' - ' + (lookResult.toString() != 'wall'));
        return !(lookResult.toString() == 'wall');
    }
}
