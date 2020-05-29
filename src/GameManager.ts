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

        // Find all game objects
        colonies.forEach(colony => colony.initialize());

        // Objects update their requests (source/spawn/dropped resource)
        colonies.forEach(colony => colony.updateRequests());
        // Creeps update their tasks and the respective request
        colonies.forEach(colony => colony.updateTasks());
        // Update requests to account for what is planned to be spawned
        colonies.forEach(colony => colony.updateSpawnRequests());

        // Clean up requests/spawns that are no longer valid
        colonies.forEach(colony => colony.requestCleanup());

        // Put creeps to work
        colonies.forEach(colony => colony.runTasks());

        // Start spawn for remaining requests
        colonies.forEach(colony => colony.spawnIfNecessary());
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
