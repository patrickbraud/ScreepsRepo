import { HarvesterStatus } from "Enums/HarvesterEnums";
import { IHarvester } from "Interfaces/IHarvester";
import { Screep } from "./Screep";
import { SourceManager } from "Managers/SourceManager";
import { RoomManager } from "Managers/RoomManager";

export class Harvester extends Screep implements IHarvester{

    // Status property
    private _status: HarvesterStatus;
    get Status() {
        return this._status;
    }
    set Status(currentStatus: HarvesterStatus) {
        this._status = currentStatus;
        this.creep.memory.Status = currentStatus.toString();
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
    }

    work() {
        // If we ran out of energy while dumping
        if (this.Status == null || this.Status == HarvesterStatus.Dumping && this.creep.carry.energy == 0)
        {
            this.Status = HarvesterStatus.Harvesting;
            let bestSource = SourceManager.GetBestSource(this.creep);
            this.harvest(bestSource);
        }
        // If we reached max energy while harvesting
        else if (this.Status == HarvesterStatus.Harvesting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.Status = HarvesterStatus.Dumping;

            let bestDeposit: Structure = RoomManager.getBestDeposit(this);
            this.deposit(bestDeposit);
        }
    }

    // Get to work!
    harvest(source: Source) {
        this.TargetSourceID = source.id;

        let harvestResult = this.creep.harvest(source);
        if (harvestResult == ERR_NOT_IN_RANGE) {
            super.moveTo(source, this._pathColor);
        }
    }

    deposit(target: Structure) {
        this.TargetDumpID = target.id;

        let transferResult = this.creep.transfer(target, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(target, this._pathColor);
        }
    }
}
