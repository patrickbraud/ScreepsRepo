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

    private _ticksFromSpawnToSource: number;
    get TicksFromSpawnToSource(): number {
        return this._ticksFromSpawnToSource;
    }
    set TicksFromSpawnToSource(tick: number) {
        if (tick == undefined || tick == null) {
            tick = 0;
        }
        this._ticksFromSpawnToSource = tick;
        this.creep.memory.TicksFromSpawnToSource = tick;
    }

    private _targetSource: Source;
    private _container: Container;
    private _link: Link;
    private _spawnLink: Link;

    constructor(creep: Creep, roomMgr: RoomMgr) {
        super(creep, roomMgr);
        this.TargetSourceID = creep.memory.TargetSourceID;
        this.Status = creep.memory.Status;
        this.TicksFromSpawnToSource = creep.memory.TicksFromSpawnToSource;
        super.pathColor = "#4af900"

        this._targetSource = this.roomMgr.sourceMgr.getSourceByID(this.TargetSourceID);
        this._container = this.roomMgr.stashMgr.getContainerForSource(this._targetSource);
        this._link = this.roomMgr.stashMgr.getLinkForSource(this._targetSource);
        this._spawnLink = this.roomMgr.stashMgr.spawnLink;

        if (this._link != undefined) {
            // If the source link is full, not on cooldown, and the spawn link exists
            // then transfer energy to the spawn link
            let linkFull = this._link.energy ==  this._link.energyCapacity;
            if (linkFull &&
                this._link.cooldown == 0 &&
                this._spawnLink != undefined &&
                this._spawnLink.energy == 0) {
                this._link.transferEnergy(this._spawnLink);
            }
        }
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
        // * if we have a link
        //   - deposit into link (if not full)
        //   - if the link is full (and not on cooldown), transfer to spawn link and drop into container
        // * if we have a container
        //   - deposit into container (repair if necessary and not empty)
        //   - if the container is full, drop the energy on the ground/container
        // * if we don't have a container
        //   - if we DO have transporters, drop energy on ground
        //   - if we DO NOT have transporters, deposit into extensions/spawn that need energy
        //   - if no structures need energy, drop energy on ground
        else if (this.Status == CreepStatus.Depositing) {

            //   - if we DO have transporters, drop energy on ground
            let transportersForSource = this.roomMgr.transporters.filter(transporter => {
                let transporterSource = this.roomMgr.sourceMgr.getSourceByID(transporter.memory.TargetSourceID);
                return transporterSource == this._targetSource;
            })
            // * if we have a link
            if (this._link != undefined) {

                // If the source link is full, not on cooldown, and the spawn link exists
                // then transfer energy to the spawn link
                let linkFull = this._link.energy ==  this._link.energyCapacity;
                if (linkFull &&
                    this._link.cooldown == 0 &&
                    this._spawnLink != undefined &&
                    this._spawnLink.energy == 0) {
                    this._link.transferEnergy(this._spawnLink);
                }

                //  - Link is not full
                if (!linkFull) {
                    this.depositIntoStructure(this._link)
                    return;
                }
                else {
                    // - If there is stil energy to deposit, continue with deposit logic
                    if (this.creep.carry.energy ==  0) return;
                }
            }

            // * if we have a container
            if (this._container != undefined && transportersForSource.length > 0) {
                //   - (repair if necessary and not empty)
                if (this.repairContainerIfNeeded(this._container)){
                    return;
                }

                //   - if the container is full, drop the energy on the ground/container
                if (this._container.store[RESOURCE_ENERGY] == this._container.storeCapacity) {
                    this.creep.say('🔻drop');
                    this.creep.drop(RESOURCE_ENERGY);
                    return;
                }

                //   - deposit into container
                this.depositIntoStructure(this._container);
                return;
            }
            // * if we don't have a container
            else {
                //   - if we DO have transporters, drop energy on ground
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

    repairContainerIfNeeded(container: Container): Boolean {
        if (container.hits < container.hitsMax) {
            this.creep.say('🔨repair')
            this.repairContainer(container);
            return true;
        }
        return false
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

    harvest(source: Source) {

        let harvestResult = this.creep.harvest(source);
        if (harvestResult == ERR_NOT_IN_RANGE) {
            let movePos: RoomPosition = this._targetSource.containerPos;
            let lookAtPos = this.roomMgr.baseRoom.lookForAt(LOOK_CREEPS, movePos.x, movePos.y);
            // If no creeps are standing on the container pos, move to it
            if (lookAtPos.length == 0) {
                this.creep.moveTo(movePos.x, movePos.y, {reusePath: 10});
            }
            else {
                // Move to one of the open spaces
                this.creep.moveTo(this._targetSource, {ignoreCreeps: false, reusePath: 10})
            }

            if (this.creep.memory.DistanceMeasured == undefined) {
                this.TicksFromSpawnToSource += 1;
            }
        }
        else if (harvestResult == OK) {
            if (this.creep.memory.DistanceMeasured == undefined) {
                this.creep.memory.DistanceMeasured = true;
            }

            if (this._targetSource.harvesters.length == 1
                && (!this.creep.pos.isEqualTo(this._targetSource.containerPos))) {
                    this.creep.moveTo(this._targetSource.containerPos);
            }
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
