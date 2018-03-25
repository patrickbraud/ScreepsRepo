import { CreepStatus } from "Enums/CreepEnums";
import { Screep } from "../Creeps/Screep";
import { RoomMgr } from "Mgrs/RoomMgr";

export class Miner extends Screep {

    private _targetSourceID: string;
    get TargetSourceID(): string {
        return this._targetSourceID;
    }
    set TargetSourceID(targetID: string) {
        this._targetSourceID = targetID;
        this.creep.memory.TargetSourceID = targetID;
    }

    private _ticksFromSourceToSpawn: number;
    get TicksFromSourceToSpawn(): number {
        return this._ticksFromSourceToSpawn;
    }
    set TicksFromSourceToSpawn(tick: number) {
        if (this.creep.memory.TicksFromSourceToSpawn == undefined) {
            this.creep.memory.TicksFromSourceToSpawn = 0;
        }
        this._ticksFromSourceToSpawn += tick;
        this.creep.memory.TicksFromSourceToSpawn += tick;
    }

    private _targetSource: Source;
    private _container: Container;

    constructor(creep: Creep, roomMgr: RoomMgr) {
        super(creep, roomMgr);
        this.TargetSourceID = creep.memory.TargetSourceID;
        this.Status = creep.memory.Status;
        super.pathColor = "#4af900"

        this._targetSource = Game.getObjectById(this.TargetSourceID);
        this._container = this.roomMgr.StashMgr.getContainerForSource(this._targetSource)
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

        if (this.Status == CreepStatus.Harvesting) {
            this.mine(this._targetSource);
        }
        else if (this.Status == CreepStatus.Depositing) {

            // If we have a container
            if (this._container != undefined) {

                // Repair container if needed
                if (this._container.hits < this._container.hitsMax) {
                    this.repairContainer(this._container);
                    return;
                }

                // Deposit into container if not full
                if (this._container.store.energy < this._container.store.carryCapacity) {
                    this.depositIntoStructure(this._container);
                    return;
                }
            }

            // Drop energy otherwise
            this.creep.drop(RESOURCE_ENERGY);
        }
    }

    mine(source: Source) {

        let harvestResult = this.creep.harvest(source);
        if (harvestResult == ERR_NOT_IN_RANGE) {
            let movePos: RoomPosition = this._targetSource.containerPos;
            let lookAtPos = this.roomMgr.baseRoom.lookForAt(LOOK_CREEPS, movePos);
            // If no creep are standing on the container pos, move to it
            if (lookAtPos.length == 0) {
                this.creep.moveTo(this._container.pos, {reusePath: 10});
            }
            else {
                // Move to one of the open spaces
                this.creep.moveTo(this._targetSource, {ignoreCreeps: false, reusePath: 10})
            }
            this.TicksFromSourceToSpawn += 1;
        }
    }

    repairContainer(container: Container) {
        let repairResult = this.creep.repair(container);
        if (repairResult == ERR_NOT_IN_RANGE) {
            super.moveTo(container);
        }
    }

    depositIntoStructure(target: Structure) {

        let transferResult = this.creep.transfer(target, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(target, this.pathColor);
        }
    }
}
