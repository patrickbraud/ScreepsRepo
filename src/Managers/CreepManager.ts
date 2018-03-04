import { Harvester } from "Creeps/Harvester";
import { SpawnManager } from "./SpawnManager";

export namespace CreepManager {

    export var creeps: { [creepName: string]: Creep };
    export var harvesters: Harvester[] = [];

    export function loadCreeps() {
        creeps = Game.creeps;

        for (let creepName in creeps) {
            if (creeps[creepName].memory.Role == 'harvester') {
                harvesters.push(new Harvester(creeps[creepName]));
            }
        }
    }

    export function loop() {
        if (harvesters.length < 1) {
            SpawnHarvester([WORK, CARRY, MOVE]);
        }

        harvesters.forEach(harvester => {
            harvester.work();
        });
    }

    export function SpawnHarvester(bodyParts: string[]) {

        let mySpawn: Spawn = SpawnManager.getFirstSpawn();
        if (mySpawn.canCreateCreep(bodyParts) == OK) {
            mySpawn.createCreep(bodyParts, undefined, {
                Role: 'harvester',
                TargetSourceID: 0,
                TargetDumpID: 0,
                MovePath: 0,
                MoveID: 0,
            });
        }
    }
}
