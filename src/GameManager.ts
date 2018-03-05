import { CreepManager } from "Managers/CreepManager";
import { SpawnManager } from "Managers/SpawnManager";
import { SourceManager } from "Managers/SourceManager";
import { RoomManager } from "Managers/RoomManager";

export namespace GameManager {



    export function SetGlobals() {
        RoomManager.loadRooms();
        SpawnManager.loadSpawns();
        SourceManager.loadSources();

        console.log('Global Values Loaded');
    }

    export function Start() {
        CreepManager.loadCreeps();

        CreepManager.loop();
    }
}
