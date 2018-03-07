import { Harvester } from "Creeps/Harvester";
import { SpawnManager } from "./SpawnManager";
import { Upgrader } from "Creeps/Upgrader";

export namespace CreepManager {

    export var creeps: { [creepName: string]: Creep };

    export function loadCreeps() {
        creeps = Game.creeps;
    }

    export function loop() {

        let harvesters: Harvester[] = [];
        let upgraders: Upgrader[] = [];
        for (let creepName in creeps) {
            if (creeps[creepName].memory.Role == 'harvester') {
                harvesters.push(new Harvester(creeps[creepName]));
            }
            else if (creeps[creepName].memory.Role == 'upgrader') {
                upgraders.push(new Upgrader(creeps[creepName]));
            }
        }

        if (harvesters.length < 1) {
            SpawnHarvester([WORK, CARRY, MOVE]);
        }
        if (upgraders.length < 1) {
            SpawnUpgrader([WORK, CARRY, MOVE]);
        }

        harvesters.forEach(harvester => {
            harvester.work();
        });
        upgraders.forEach(upgrader =>  {
            upgrader.work();
        })
    }

    export function SpawnHarvester(bodyParts: string[]) {

        let mySpawn: Spawn = SpawnManager.getFirstSpawn();
        if (mySpawn.canCreateCreep(bodyParts) == OK) {
            mySpawn.createCreep(bodyParts, undefined, {
                Role: 'harvester',
                TargetSourceID: 0,
                TargetDepositID: 0,
                MovePath: "",
                MoveID: 0,
                Status: 0
            });
        }
    }

    export function SpawnUpgrader(bodyParts: string[]) {

        let mySpawn: Spawn = SpawnManager.getFirstSpawn();
        if (mySpawn.canCreateCreep(bodyParts) == OK) {
            mySpawn.createCreep(bodyParts, undefined, {
                Role: 'upgrader',
                TargetSourceID: 0,
                MovePath: "",
                MoveID: 0,
                Status: 0
            });
        }
    }
}
