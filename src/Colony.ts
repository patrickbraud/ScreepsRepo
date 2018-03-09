import { GameManager } from "GameManager";
import { RoomMgr } from "Mgrs/RoomMgr";
import { CreepMgr } from "Mgrs/CreepMgr";
import { Harvester } from "Creeps/Harvester";
import { Upgrader } from "Creeps/Upgrader";

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
        this._spawn.memory.ColonyID = cID;
    }

    private _controller: Controller;
    private _spawn: Spawn;

    private _roomManager: RoomMgr;
    private _creepManager: CreepMgr;

    constructor(colonySpawn: Spawn) {
        this._spawn = colonySpawn;
        this.ColonyID = colonySpawn.memory.ColonyID
        this._controller = colonySpawn.room.controller;
        this._roomManager = new RoomMgr(colonySpawn);
        this._creepManager = new CreepMgr(this._roomManager)

    }

    public runColony() {
        //console.log('Colony ' + this._colonyID + ' should be running');
        switch(this._controller.level) {
            case 1: {
                this.levelOneColony();
                break;
            }
        }
    }

    private levelOneColony() {
        let harvesters: Harvester[] = [];
        let upgraders: Upgrader[] = [];
        for(let name in this._creepManager.creepNames) {
            let creep = this._creepManager.creeps[name];
            if (creep.memory.Role == 'harvester') {
                harvesters.push(new Harvester(creep, this._roomManager));
            }
            else if (creep.memory.Role == 'upgrader') {
                upgraders.push(new Upgrader(creep, this._roomManager));
            }
        }

        if (harvesters.length < 2) {
            this._creepManager.spawnCreep('harvester', [WORK, CARRY, MOVE]);
        }
        else if (upgraders.length < 2) {
            this._creepManager.spawnCreep('upgrader', [WORK, CARRY, MOVE]);
        }

        harvesters.forEach(harvester => {
            harvester.work();
        });
        upgraders.forEach(upgrader =>  {
            upgrader.work();
        })
    }
}
