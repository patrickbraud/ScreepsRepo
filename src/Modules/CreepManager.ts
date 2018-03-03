import { RoomManager } from "./RoomManager";
import { Harvester } from "Creeps/Harvester";

export namespace CreepManager {

    export var creeps: { [creepName: string]: Creep };
    export var harvesters: Harvester[];

    export function loadCreeps() {
        creeps = Game.creeps;

        for (let creepName in creeps) {
            if (creeps[creepName].memory.Role == 'harvester') {
                harvesters.push(new Harvester(Game.creeps[creepName]));
            }
            else if (creeps[creepName].memory.Role == 'builder') {

            }
        }
    }

    export function SpawnHarvester(bodyParts: string[]) {

        let mySpawn = Game.spawns[0];
        if (mySpawn.createCreep(bodyParts, undefined, {dryRun: true})) {
            mySpawn.createCreep(bodyParts, undefined, {
                Role: 'harvester',
                TargetSourceID: 0,
                TargetDumpID: 0,
                MovePath: [],
                MoveID: 0,
            });
        }
    }
}
