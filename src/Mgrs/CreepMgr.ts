import { Harvester } from "Creeps/Harvester";
import { Upgrader } from "Creeps/Upgrader";
import { RoomMgr } from "./RoomMgr";

export class CreepMgr {

    private _baseSpawn: Spawn;
    private _roomMgr: RoomMgr;

    // Creeps that belong to this colony
    public creeps: Creep[] = [];
    public creepNames: string[] = [];

    // private _spawnUpgraderOpts = {
    //     Role: 'upgrader',
    //     TargetSourceID: 0,
    //     MovePath: "",
    //     MoveID: 0,
    //     PreviousPos: undefined,
    //     PreviousMoveResult: undefined,
    //     Status: 0,
    //     ColonyID: 0
    // }

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;
        this._baseSpawn = this._roomMgr.baseRoomSpawn;
        this.loadCreeps();
    }

    runCreeps() {
        let harvesters: Harvester[] = [];
        let upgraders: Upgrader[] = [];
        for(let name in this.creepNames) {
            let creep = this.creeps[name];
            if (creep.memory.Role == 'harvester') {
                harvesters.push(new Harvester(creep, this._roomMgr));
            }
            else if (creep.memory.Role == 'upgrader') {
                upgraders.push(new Upgrader(creep, this._roomMgr));
            }
        }

        harvesters.forEach(harvester => {
            harvester.work();
        });
        upgraders.forEach(upgrader =>  {
            upgrader.work();
        })
    }

    loadCreeps() {
        for (let creepName in Game.creeps) {
            let creep = Game.creeps[creepName];
            if (!creep.spawning) {
                if (creep.memory.ColonyID == this._baseSpawn.memory.ColonyID) {
                    this.creepNames.push(creepName);
                    this.creeps.push(creep);
                }
            }
        }
    }
}
