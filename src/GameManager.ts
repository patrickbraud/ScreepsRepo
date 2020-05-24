import { Colony } from "./Colony";

export namespace GameManager {

    export var colonyCount: number;
    export var colonies: Colony[];

    export var spawns: {[spawnName: string]: StructureSpawn};
    export var spawnNames: string[];
    export var spawnCount: number;

    export function Start() {

        geatSpawns();

        // Create the colonies
        initializeColonies();

        // initialize all objects for each colony
        // Find operations only
        colonies.forEach(colony => colony.initialize())
        colonies.forEach(colony => colony.checkJobStatus())
        colonies.forEach(colony => colony.assignWorkers())
        colonies.forEach(colony => colony.performJobs())
        colonies.forEach(colony => colony.satisfyWorkRequests())
    }

    function initializeColonies() {
        colonyCount = 0;
        colonies = [];
        for(let name in spawns) {
            let spawn = Game.spawns[name];
            colonyCount += 1;
            colonies.push(new Colony(spawn));
        }
    }

    function geatSpawns() {
        spawns = Game.spawns;

        getSpawnNames();
    }

    function getSpawnNames() {
        spawnNames = [];
        for (let spawnName in spawns) {
            if (spawns.hasOwnProperty(spawnName)) {
                spawnNames.push(spawnName);
            }
        }
    }
}
