import { Screep } from "./Screep";
import { CreepStatus } from "Enums/CreepEnums";
import { RoomMgr } from "Mgrs/RoomMgr";

export class Upgrader extends Screep{

    private _targetSourceID: string;
    get TargetSourceID(): string {
        return this._targetSourceID;
    }
    set TargetSourceID(targetID: string) {
        if (targetID == undefined) { targetID = "0"; }
        this._targetSourceID = targetID;
        this.creep.memory.TargetSourceID = targetID;
    }

    private _targetController: Controller;
    private _pathColor = "green";

    constructor(creep: Creep, roomManager: RoomMgr) {
        super(creep, roomManager);
        this.TargetSourceID = creep.memory.TargetSourceID;
        this.Status = creep.memory.Status;
        this._targetController = this.creep.room.controller;
    }

    work() {
        // If we are harvesting and we are full
        if(this.Status == CreepStatus.Harvesting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.Status = CreepStatus.Upgrading;
            this.creep.say('⚙️ upgrade');
            this.TargetSourceID = "0";
        }
        // If we are Upgrading and we are empty
	    if(this.Status == CreepStatus.Upgrading && this.creep.carry.energy == 0) {
	        this.Status = CreepStatus.Harvesting;
            this.creep.say('⚒️ harvest');
        }

        let target: Source | Controller = null;
        if (this.Status == CreepStatus.Harvesting)
        {
            //console.log('I should be harvesting');
            let targetSource: Source = null;
            if (this.TargetSourceID == "0") {
                targetSource = this.roomMgr.getBestSource(this.creep);
                this.TargetSourceID = targetSource.id;
            }
            else {
                targetSource = this.roomMgr.getSourceByID(this.TargetSourceID);
            }
            target = targetSource;
        }
        else if (this.Status == CreepStatus.Upgrading) {
            target = this._targetController;
        }

        this.doAction(target);
    }

    doAction(target: Source | Controller) {

        if (this.Status == CreepStatus.Harvesting) {
            this.harvest(target as Source);
        }
        else if (this.Status == CreepStatus.Upgrading) {
            this.upgrade();
        }
    }

    // Get to work!
    harvest(source: Source) {

        let harvestResult = this.creep.harvest(source);
        if (harvestResult == ERR_NOT_IN_RANGE) {
            super.moveTo(source, this._pathColor);
        }
    }

    upgrade() {
        let upgradeResult = this.creep.transfer(this._targetController, RESOURCE_ENERGY);
        if (upgradeResult == ERR_NOT_IN_RANGE) {
            super.moveTo(this._targetController, this._pathColor);
        }
    }
}
