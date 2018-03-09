import { RoomMgr } from "./RoomMgr";

export class CreepMgr {

    private _baseSpawn: Spawn;
    private _roomMgr: RoomMgr;
    public creeps: Creep[] = [];
    public creepNames: string[] = [];


    private _spawnHarvesterOpts = {
        Role: 'harvester',
        TargetSourceID: 0,
        TargetDepositID: 0,
        MovePath: "",
        MoveID: 0,
        PreviousPos: undefined,
        PreviousMoveResult: undefined,
        Status: 0,
        ColonyID: 0
    }

    private _spawnUpgraderOpts = {
        Role: 'upgrader',
        TargetSourceID: 0,
        MovePath: "",
        MoveID: 0,
        PreviousPos: undefined,
        PreviousMoveResult: undefined,
        Status: 0,
        ColonyID: 0
    }

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;
        this._baseSpawn = this._roomMgr.baseRoomSpawn;

        this.loadCreeps();
    }

    public spawnCreep(creepRole: string, bodyParts: string[]) {

        let creepOpts: any;
        switch(creepRole) {
            case "harvester": {
                creepOpts = this._spawnHarvesterOpts;
                break;
            }
            case 'upgrader': {
                creepOpts = this._spawnUpgraderOpts;
                break;
            }
        }

        let creepName: string;
        let creepIndex: number = 1;
        for(let name in Game.creeps) {
            let creep = Game.creeps[name];
            if (creep.memory.Role == creepRole) {
                creepIndex++;
            }
        }
        creepName = creepRole + creepIndex.toString();
        creepOpts.ColonyID = this._baseSpawn.memory.ColonyID;

        let canSpawn = this._baseSpawn.spawnCreep(bodyParts, creepName, { dryRun: true })
        //console.log(canSpawn);
        if (canSpawn == OK) {
            this._baseSpawn.spawnCreep(bodyParts, creepName, { memory: creepOpts});
        }
    }

    loadCreeps() {
        for (let creepName in Game.creeps) {
            let creep = Game.creeps[creepName];
            if (creep.memory.ColonyID == this._baseSpawn.memory.ColonyID) {
                this.creepNames.push(creepName);
                this.creeps.push(creep);
            }
        }
    }
}
