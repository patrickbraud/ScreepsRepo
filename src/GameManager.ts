//import { GlobalValues } from "Globals/GlobalValues";
import { Colony } from "Colony";
//import { Global } from "Global";

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

        // console.log('SOURCE_GOAL_OWNED: ' + Global.SOURCE_GOAL_OWNED);
        // console.log('SOURCE_GOAL_NEUTRAL: ' + Global.SOURCE_GOAL_NEUTRAL);
        // console.log('SOURCE_GOAL_KEEPER: ' + Global.SOURCE_GOAL_KEEPER);

        // console.log('SOURCE_HARVEST_PARTS: ' + Global.SOURCE_HARVEST_PARTS);
        // console.log('SOURCE_HARVEST_PARTS_NEUTRAL: ' + Global.SOURCE_HARVEST_PARTS_NEUTRAL);
        // console.log('SOURCE_HARVEST_PARTS_KEEPER: ' + Global.SOURCE_HARVEST_PARTS_KEEPER);

        // console.log('SOURCE_CARRY_PARTS_PER_DISTANCE_OWNED: ' + Global.SOURCE_CARRY_PARTS_PER_DISTANCE_OWNED);
        // console.log('SOURCE_CARRY_PARTS_PER_DISTANCE_NEUTRAL: ' + Global.SOURCE_CARRY_PARTS_PER_DISTANCE_NEUTRAL);
        // console.log('SOURCE_CARRY_PARTS_PER_DISTANCE_KEEPER: ' + Global.SOURCE_CARRY_PARTS_PER_DISTANCE_KEEPER);

        // console.log('RAMPART_UPKEEP: ' + Global.RAMPART_UPKEEP);
        // console.log('ROAD_UPKEEP: ' + Global.ROAD_UPKEEP);
        // console.log('ROAD_UPKEEP_SWAMP: ' + Global.ROAD_UPKEEP_SWAMP);
        // console.log('CONTAINER_UPKEEP: ' + Global.CONTAINER_UPKEEP);
        // console.log('REMOTE_CONTAINER_UPKEEP: ' + Global.REMOTE_CONTAINER_UPKEEP);

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
