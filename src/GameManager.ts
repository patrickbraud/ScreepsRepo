import { SpawnManager } from "Globals/SpawnManager";
import { GlobalValues } from "Globals/GlobalValues";
import { Colony } from "Colony";

export namespace GameManager {

    export var colonyCount: number;
    export var colonies: Colony[];

    export function SetGlobals() {
        SpawnManager.loadSpawns();

        console.log('Global Values Loaded');
    }

    export function Start() {
        // Load all of our colonies
        loadColonies();
        console.log('Colonies: ' + colonies.length);

        colonies.forEach(colony => {
            colony.runColony();
        })
    }

    function loadColonies() {
        colonies = [];
        colonyCount = GlobalValues.spawnCount;
        for(let name in GlobalValues.spawns) {
            let spawn = Game.spawns[name];
            colonies.push(new Colony(spawn));
        }
    }
}
