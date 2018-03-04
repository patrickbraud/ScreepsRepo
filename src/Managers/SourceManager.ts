import { RoomManager } from "./RoomManager";
import { CreepManager } from "Example Code/components/creeps/creep-manager";

export namespace SourceManager {

    export var sources: Source[];

    export function loadSources() {
        sources = RoomManager.getFirstRoom().find(FIND_SOURCES);
    }

    export function GetBestSource(creep: Creep): Source {
        let orderedSources: Source[] = sources.sort(function(a, b) {return DistanceTo(creep, a.pos) - DistanceTo(creep, b.pos)});

        orderedSources.forEach(source => {
            if (creepsTargetingSource(source) < maxCreepCount(source)) {
                return source;
            }
        });
        return orderedSources[0];
    }

    export function maxCreepCount(source: Source): number {
        let validSpaceCount: number = 0;
         /*
            * * *
            *   *
            x * *
            Start at the x
        */
        let currentPos = new RoomPosition(source.pos.x, source.pos.y - 1, source.pos.roomName);
        for (let xPos = -1; xPos <= 1; xPos++) {
            for (let yPos = -1; yPos <= 1; yPos++) {
                if (xPos != 0 && yPos != 0) {
                    validSpaceCount = positionIsValid(currentPos) ? ++validSpaceCount : validSpaceCount;
                }
            }
        }

        return validSpaceCount;
    }

    export function creepsTargetingSource(source: Source): number {
        let creepCount: number = 0;

        for (let creepName in CreepManager.creepNames) {
            creepCount = Game.creeps[creepName].memory.MoveID == source.id ? creepCount : ++creepCount;
        }

        return creepCount;
    }

    function positionIsValid(pos: RoomPosition): boolean{
        return RoomManager.getFirstRoom().lookForAt(LOOK_TERRAIN, pos)['terrrain'] != 'wall';
    }

    // Get the linear distance from a creep to a source
    function DistanceTo(creep: Creep, pos: RoomPosition) {
        return Math.sqrt(Math.pow(pos.x - creep.pos.x, 2) + Math.pow(pos.y - creep.pos.y, 2));
    }
}
