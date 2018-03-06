import { HarvesterStatus } from "Enums/HarvesterEnums";
import { IHarvester } from "Interfaces/IHarvester";
import { Screep } from "./Screep";
import { SourceManager } from "Managers/SourceManager";
import { RoomManager } from "Managers/RoomManager";

export class Harvester extends Screep implements IHarvester{

    // Status property
    private _status: HarvesterStatus = null;
    get Status() {
        return this._status;
    }
    set Status(currentStatus: HarvesterStatus) {
        this._status = currentStatus;
        this.creep.memory.Status = currentStatus;
    }

    // TargetSourceID Property
    private _targetSourceID: string;
    get TargetSourceID(): string {
        return this._targetSourceID;
    }
    set TargetSourceID(targetID: string) {
        this._targetSourceID = targetID;
        this.creep.memory.TargetSourceID = targetID;
    }

    // TargetDumpID Property
    private _targetDumpID: string;
    get TargetDumpID(): string {
        return this._targetDumpID;
    }
    set TargetDumpID(targetID: string) {
        this._targetDumpID = targetID;
        this.creep.memory.TargetDumpID = targetID;
    }

    private _pathColor = "yellow";

    constructor(creep: Creep) {
        super(creep);
        this.TargetSourceID = creep.memory.TargetSourceID;
        this.TargetDumpID = creep.memory.TargetDumpID;
        this.Status = creep.memory.Status;
    }

    work() {
        // If we are harvesting and we are full
        if(this.Status == HarvesterStatus.Harvesting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.Status = HarvesterStatus.Dumping;
            this.creep.say('🔄 deposit');
            this.TargetSourceID = "0";
        }
        // If w are dumping and we are empty
	    if(this.Status == HarvesterStatus.Dumping && this.creep.carry.energy == 0) {
	        this.Status = HarvesterStatus.Harvesting;
            this.creep.say('⚒️ harvest');
            this.TargetDumpID = "0";
        }

        let target: Source | Structure = null;
        if (this.Status == HarvesterStatus.Harvesting)
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
        else if (this.Status == HarvesterStatus.Dumping) {

            //console.log('I should be dumping');
            let targetDeposit: any = null;
            if (this.TargetDumpID == "0") {
                targetDeposit = RoomManager.getBestDeposit(this);
                this.TargetDumpID = targetDeposit.id;
            }
            else {
                targetDeposit = Game.getObjectById(this.TargetDumpID);
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

        if (this.Status == HarvesterStatus.Harvesting) {
            this.harvest(target as Source);
        }
        else if (this.Status == HarvesterStatus.Dumping) {
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
