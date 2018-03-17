import { GameManager } from "GameManager";
import { RoomMgr } from "Mgrs/RoomMgr";
import { CreepMgr } from "Mgrs/CreepMgr";
//import { Harvester } from "Creeps/Harvester";
//import { Upgrader } from "Creeps/Upgrader";

export class Colony {

    private _colonyID: number;
    get ColonyID() {
        return this._colonyID;
    }
    set ColonyID(cID: number) {
        // We found a spawn that doesn't belong to a colony yet
        if (cID == undefined) {
            cID = GameManager.colonyCount;
        }
        this._colonyID = cID;
        this.spawn.memory.ColonyID = cID;
    }

    public controller: Controller;
    public spawn: Spawn;

    private _roomManager: RoomMgr;
    public creepManager: CreepMgr;

    constructor(colonySpawn: Spawn) {
        this.spawn = colonySpawn;
        this.ColonyID = colonySpawn.memory.ColonyID
        this.controller = colonySpawn.room.controller;

        this._roomManager = new RoomMgr(this);
        this.creepManager = new CreepMgr(this._roomManager)

    }

    public runColony() {
        this._roomManager.runRooms();
        this.creepManager.runCreeps();

    }
}
