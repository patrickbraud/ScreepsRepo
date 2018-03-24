import { CreepStatus } from "Enums/CreepEnums";
import { Screep } from "./Screep";
import { RoomMgr } from "Mgrs/RoomMgr";

export class Harvester extends Screep {

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

    constructor(creep: Creep, roomMgr: RoomMgr) {
        super(creep, roomMgr);
        this.TargetSourceID = creep.memory.TargetSourceID;
        this.Status = creep.memory.Status;
        super.pathColor = "#4af900"
    }

    work() {
        // If we are harvesting and we are full
        if (this.Status == CreepStatus.Harvesting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.Status = CreepStatus.Depositing;
            this.creep.say('⛏️ deposit');
        }
        // If w are Depositing and we are empty
        if (this.Status == CreepStatus.Depositing && this.creep.carry.energy == 0) {
            this.Status = CreepStatus.Harvesting;
            this.creep.say('⛏️ harvest');
        }

        // Harvest from our designated source
        if (this.Status == CreepStatus.Harvesting) {
            let targetSource = this.roomMgr.sourceMgr.getSourceByID(this.TargetSourceID);
            this.harvest(targetSource);
        }
        // * if we have a container
        //   - deposit into container (repair if necessary and not empty)
        //   - if the container is full, drop the energy on the ground/container
        // * if we don't have a container
        //   - if we DO have transporters, drop energy on ground
        //   - if we DO NOT have transporters, deposit into extensions/spawn that need energy
        //   - if no structures need energy, drop energy on ground
        else if (this.Status == CreepStatus.Depositing) {

            let mySource = this.roomMgr.sourceMgr.getSourceByID(this.TargetSourceID);
            let sourceContainer = this.roomMgr.StashMgr.getContainerForSource(mySource);
            //   - if we DO have transporters, drop energy on ground
            let transportersForSource = this.roomMgr.transporters.filter(transporter => {
                let transporterSource = this.roomMgr.sourceMgr.getSourceByID(transporter.memory.TargetSourceID);
                return transporterSource == mySource;
            })
            // * if we have a container
            if (sourceContainer != undefined && transportersForSource.length > 0) {
                //   - (repair if necessary and not empty)
                if (sourceContainer.hits < sourceContainer.hitsMax) {
                    this.creep.say('🔨repair')
                    this.repairContainer(sourceContainer);
                    return;
                }

                //   - if the container is full, drop the energy on the ground/container
                if (sourceContainer.store[RESOURCE_ENERGY] == sourceContainer.storeCapacity) {
                    this.creep.say('🔻drop');
                    this.creep.drop(RESOURCE_ENERGY);
                    return;
                }

                //   - deposit into container
                this.depositIntoStructure(sourceContainer);
                return;
            }
            // * if we don't have a container
            else {
                //   - if we DO have transporters, drop energy on ground
                // let transportersForSource = this.roomMgr.transporters.filter(transporter => {
                //     let transporterSource = this.roomMgr.sourceMgr.getSourceByID(transporter.memory.TargetSourceID);
                //     return transporterSource == mySource;
                // })
                if (transportersForSource.length > 0) {
                    this.creep.drop(RESOURCE_ENERGY);
                    return;
                }

                //   - if we DO NOT have transporters, deposit into extensions/spawn that need energy
                let extensionsAndSpawnNeedEnergy = this.roomMgr.extensions.filter(ext => {
                    return ext.energy < ext.energyCapacity;
                })
                if (this.roomMgr.baseRoomSpawn.energy < this.roomMgr.baseRoomSpawn.energyCapacity) {
                    extensionsAndSpawnNeedEnergy.push(this.roomMgr.baseRoomSpawn);
                }
                if (extensionsAndSpawnNeedEnergy.length > 0) {
                    extensionsAndSpawnNeedEnergy.sort((a: Structure, b: Structure): number => { return (this.distanceTo(a.pos) - this.distanceTo(b.pos))});
                    this.depositIntoStructure(extensionsAndSpawnNeedEnergy[0]);
                    return;
                }

                //   - if no structures need energy, drop energy on ground
                this.creep.drop(RESOURCE_ENERGY);
            }
        }
    }

    repairContainer(container: Container) {
        let repairResult = this.creep.repair(container);
        if (repairResult == ERR_NOT_IN_RANGE) {
            super.moveTo(container);
        }
    }

    transferToTransporter(transporter: Creep) {
        let transferResult = this.creep.transfer(transporter, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(transporter, this.pathColor);
        }
    }

    // Get to work!
    harvest(source: Source) {

        let harvestResult = this.creep.harvest(source);
        if (harvestResult == ERR_NOT_IN_RANGE) {
            super.moveTo(source, this.pathColor);
        }
    }

    depositIntoStructure(target: Structure) {

        let transferResult = this.creep.transfer(target, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(target, this.pathColor);
        }
    }

    upgradeController() {
        let targetController = this.roomMgr.baseRoomController;
        let upgradeResult = this.creep.transfer(targetController, RESOURCE_ENERGY);
        if (upgradeResult == ERR_NOT_IN_RANGE) {
            super.moveTo(targetController, this.pathColor);
        }
    }
}
