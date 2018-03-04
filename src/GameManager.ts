import { CreepManager } from "Managers/CreepManager";
import { SpawnManager } from "Managers/SpawnManager";
import { SourceManager } from "Managers/SourceManager";
import { RoomManager } from "Managers/RoomManager";

export namespace GameManager {



    export function SetValues() {
        RoomManager.loadRooms();
        SpawnManager.loadSpawns();
        SourceManager.loadSources();
        CreepManager.loadCreeps();

        console.log('Managers Loaded');
    }

    export function Start() {
        CreepManager.loop();
    }
}
