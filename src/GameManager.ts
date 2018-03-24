//import { GlobalValues } from "Globals/GlobalValues";
import { Colony } from "Colony";

export namespace GameManager {

    export var colonyCount: number;
    export var colonies: Colony[];

    export var spawns: {[spawnName: string]: StructureSpawn};
    export var spawnNames: string[];
    export var spawnCount: number;

    export function Start() {
        loadSpawns();
        // Load all of our colonies
        loadColonies();
        console.log('Colonies: ' + colonies.length);

        colonies.forEach(colony => {
            colony.runColony();
        })
    }

    function loadColonies() {
        colonies = [];
        colonyCount = spawnCount;
        for(let name in spawns) {
            let spawn = Game.spawns[name];
            colonies.push(new Colony(spawn));
        }
    }

    function loadSpawns() {
        spawns = Game.spawns;
        spawnCount = _.size(spawns);

        loadSpawnNames();
    }

    function loadSpawnNames() {
        spawnNames = [];
        for (let spawnName in spawns) {
            if (spawns.hasOwnProperty(spawnName)) {
                spawnNames.push(spawnName);
            }
        }
    }
}
