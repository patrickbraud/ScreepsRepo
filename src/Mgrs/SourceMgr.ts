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

    spawnNeededHarvesters() {
        for (let source of this.sources) {
            if (source.harvesterWorkCount < 5 && source.harvesterCount < source.maxCreepCount) {
                // let neededWorkParts = 5 - source.harvesterWorkCount;
                this._roomManager.baseRoomSpawn.spawnHarvester(source);
                break;
            }
        }
    }

    spawnNeededTransporters() {
        for (let source of this.sources) {
            if (source.harvesterCount > 0) {
                let sourceTransporters = this._roomManager.transporters.filter(transporter => {
                    return transporter.memory.TargetSourceID == source.id;
                })

                if (sourceTransporters.length < 3 && !this._roomManager.baseRoomSpawn.spawning) {
                    this._roomManager.baseRoomSpawn.spawnTransporter(source);
                }
            }
        }
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
}
