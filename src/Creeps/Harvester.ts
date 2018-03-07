import { CreepStatus } from "Enums/CreepEnums";
import { IHarvester } from "Interfaces/IHarvester";
import { Screep } from "./Screep";
import { RoomManager } from "Managers/RoomManager";
import { SourceManager } from "Managers/SourceManager";

export class Harvester extends Screep implements IHarvester{

    // TargetSourceID Property
    private _targetSourceID: string;
    get TargetSourceID(): string {
        return this._targetSourceID;
    }
    set TargetSourceID(targetID: string) {
        this._targetSourceID = targetID;
        this.creep.memory.TargetSourceID = targetID;
    }

    // TargetDepositID Property
    private _TargetDepositID: string;
    get TargetDepositID(): string {
        return this._TargetDepositID;
    }
    set TargetDepositID(targetID: string) {
        this._TargetDepositID = targetID;
        this.creep.memory.TargetDepositID = targetID;
    }

    private _pathColor = "yellow";

    constructor(creep: Creep) {
        super(creep);
        this.TargetSourceID = creep.memory.TargetSourceID;
        this.TargetDepositID = creep.memory.TargetDepositID;
        this.Status = creep.memory.Status;
    }

    work() {
        // If we are harvesting and we are full
        if(this.Status == CreepStatus.Harvesting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.Status = CreepStatus.Depositing;
            this.creep.say('🔄 deposit');
            this.TargetSourceID = "0";
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
                console.log('Getting new source');
                targetSource = SourceManager.getBestSource(this.creep);
                this.TargetSourceID = targetSource.id;
            }
            else {
                targetSource = SourceManager.getSourceByID(this.TargetSourceID);
            }
            target = targetSource;
        }
        else if (this.Status == CreepStatus.Depositing) {

            //console.log('I should be Depositing');
            let targetDeposit: any = null;
            if (this.TargetDepositID == "0") {
                targetDeposit = RoomManager.getBestDeposit(this);
                if (targetDeposit != null && targetDeposit != undefined) {
                    this.TargetDepositID =targetDeposit.id;
                }
            }
            else {
                targetDeposit = Game.getObjectById(this.TargetDepositID);
                if (targetDeposit.energy == targetDeposit.energyCapacity) {
                    targetDeposit = RoomManager.getBestDeposit(this);
                }
            }
            target = targetDeposit;
        }

        if (target != null && target != undefined) {
            this.doAction(target);
        }
        else {
            this.creep.say('zZz');
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
}
