import { RoomManager } from "./RoomManager";
import { CreepManager } from "./CreepManager";

export namespace SourceManager {

    export var sources: Source[];

    export function loadSources() {
        sources = RoomManager.getFirstRoom().find(FIND_SOURCES);
    }

    export function  getBestSource(creep: Creep): Source {
        // Get all of the sources in the same room as the creep
        let sourcesInRoom = SourceManager.sources.filter( src => src.room.name == creep.room.name );
        // Keep only the sources that have less creeps targeting them than the source has valid spaces to harvest from
        let filteredSources: Source[] = sourcesInRoom.filter( src => creepsTargetingSource(src) < maxCreepCount(src) );
        // Order the sources by linear distance to the creep
        let orderedSources: Source[] = filteredSources.sort(function (a, b) { return DistanceTo(creep, a.pos) - DistanceTo(creep, b.pos); });

        return orderedSources[0];
    }

    export function getSourceByID(sourceID: string): Source {
        let targetSource: Source = null;
        sources.forEach(source => {
            if (source.id == sourceID) {
                targetSource = source;
                return;
            }
        });
        return targetSource;
    }

    export function maxCreepCount(source: Source): number {
        let validSpaceCount: number = 0;
         /*
            x * *
            * s *
            * * y
            Start at the x, end at the y
        */
        let currentPos = new RoomPosition(source.pos.x - 1, source.pos.y - 1, source.pos.roomName);
        for (let xCount = 0; xCount < 3; xCount++, currentPos.x++) {
            for (let yCount = 0; yCount < 3; yCount++, currentPos.y++) {
                if (currentPos != source.pos) {
                    let isValid = positionIsValid(currentPos);
                    validSpaceCount = isValid ? ++validSpaceCount : validSpaceCount;
                }
            }
            currentPos.y -= 3;
        }

        return validSpaceCount;
    }

    export function creepsTargetingSource(source: Source): number {
        let creepCount: number = 0;

        for (let creepName in CreepManager.creeps) {
            creepCount = Game.creeps[creepName].memory.MoveID == source.id ? creepCount : ++creepCount;
        }

        return creepCount;
    }

    function positionIsValid(pos: RoomPosition): boolean{
        let lookResult = Game.rooms[pos.roomName].lookForAt(LOOK_TERRAIN, pos);
        //console.log('x: ' + pos.x + ' y: ' + pos.y + ' - ' + lookResult.toString() + ' - ' + (lookResult.toString() != 'wall'));
        return !(lookResult.toString() == 'wall');
    }

    // Get the linear distance from a creep to a source
    function DistanceTo(creep: Creep, pos: RoomPosition) {
        return Math.sqrt(Math.pow(pos.x - creep.pos.x, 2) + Math.pow(pos.y - creep.pos.y, 2));
    }
}
