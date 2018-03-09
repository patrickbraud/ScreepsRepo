//import { CreepManager } from "Globals/CreepManager";
import { SpawnManager } from "Globals/SpawnManager";
import { SourceManager } from "Globals/SourceManager";
import { RoomManager } from "Globals/RoomManager";
import { GlobalValues } from "Globals/GlobalValues";
import { Colony } from "Colony";

export namespace GameManager {

    export var colonyCount: number;
    export var colonies: Colony[];

    export function SetGlobals() {
        RoomManager.loadRooms();
        SpawnManager.loadSpawns();
        SourceManager.loadSources();

        console.log('Global Values Loaded');
    }

    export function Start() {
        // Load all of our colonies
        loadColonies();
        console.log('Colonies: ' + colonies.length);

        colonies.forEach(colony => {
            colony.runColony();
        })

        // CreepManager.loadCreeps();

        // CreepManager.loop();
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
