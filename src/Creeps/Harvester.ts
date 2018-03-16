import { CreepStatus } from "Enums/CreepEnums";
import { IHarvester } from "Interfaces/IHarvester";
import { Screep } from "./Screep";
import { RoomMgr } from "Mgrs/RoomMgr";

export class Harvester extends Screep implements IHarvester{

    // TargetSourceID Property
    private _targetSourceID: string;
    get TargetSourceID(): string {
        return this._targetSourceID;
    }
    set TargetSourceID(targetID: string) {
        if (targetID == undefined) { targetID == "0"; }
        this._targetSourceID = targetID;
        this.creep.memory.TargetSourceID = targetID;
    }

    // TargetDepositID Property
    private _TargetDepositID: string;
    get TargetDepositID(): string {
        return this._TargetDepositID;
    }
    set TargetDepositID(targetID: string) {
        if (targetID == undefined) { targetID = "0"; }
        this._TargetDepositID = targetID;
        this.creep.memory.TargetDepositID = targetID;
    }

    private _pathColor = "yellow";

    constructor(creep: Creep, roomMgr: RoomMgr) {
        super(creep, roomMgr);
        this.TargetSourceID = creep.memory.TargetSourceID;
        this.TargetDepositID = creep.memory.TargetDepositID;
        this.Status = creep.memory.Status;
    }

    work() {
        // If we are harvesting and we are full
        if(this.Status == CreepStatus.Harvesting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.Status = CreepStatus.Depositing;
            this.creep.say('🔄 deposit');
        }
        // If w are Depositing and we are empty
	    if(this.Status == CreepStatus.Depositing && this.creep.carry.energy == 0) {
	        this.Status = CreepStatus.Harvesting;
            this.creep.say('⚒️ harvest');
            this.TargetDepositID = "0";
        }

        let target: Source | Structure = null;
        if (this.Status == CreepStatus.Harvesting)
        {
            //console.log('I should be harvesting');
            let targetSource: Source = null;
            if (this.TargetSourceID == "0") {
                targetSource = this.roomMgr.sourceMgr.getBestSource(this);
                this.TargetSourceID = targetSource.id;
            }
            else {
                targetSource = this.roomMgr.sourceMgr.getSourceByID(this.TargetSourceID);
            }
            target = targetSource;
        }
        else if (this.Status == CreepStatus.Depositing) {

            //console.log('I should be Depositing');
            let targetDeposit: any = null;
            if (this.TargetDepositID == "0") {
                targetDeposit = this.roomMgr.getBestDeposit(this);
                if (targetDeposit != null && targetDeposit != undefined) {
                    this.TargetDepositID =targetDeposit.id;
                }
            }
            else {
                targetDeposit = Game.getObjectById(this.TargetDepositID);
                if (targetDeposit.energy == targetDeposit.energyCapacity) {
                    targetDeposit = this.roomMgr.getBestDeposit(this);
                }
            }
            target = targetDeposit;
        }

        if (target != null && target != undefined) {
            this.doAction(target);
        }
        else {
            this.upgrade();
            // if (Game.time % 2 == 0) {
            //     this.creep.say('zZz');
            // }
            // this.creep.memory.MoveID = "0";
            // this.creep.memory.MovePath = "";
        }
    }

    doAction(target: Source | Structure) {

        if (this.Status == CreepStatus.Harvesting) {
            this.harvest(target as Source);
        }
        else if (this.Status == CreepStatus.Depositing) {
            this.deposit(target as Structure);
        }
    }

    // Get to work!
    harvest(source: Source) {

        let harvestResult = this.creep.harvest(source);
        if (harvestResult == ERR_NOT_IN_RANGE) {
            super.moveTo(source, this._pathColor);
        }
    }

    deposit(target: Structure) {

        let transferResult = this.creep.transfer(target, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(target, this._pathColor);
        }
    }

    upgrade() {
        let targetController = this.roomMgr.baseRoomController;
        let upgradeResult = this.creep.transfer(targetController, RESOURCE_ENERGY);
        if (upgradeResult == ERR_NOT_IN_RANGE) {
            super.moveTo(targetController, this._pathColor);
        }
    }
}
