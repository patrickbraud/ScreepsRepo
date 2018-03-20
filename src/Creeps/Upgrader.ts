import { Screep } from "./Screep";
import { CreepStatus } from "Enums/CreepEnums";
import { RoomMgr } from "Mgrs/RoomMgr";

export class Upgrader extends Screep{

    private _collectionTargetID;
    get CollectionTargetID(): string {
        return this._collectionTargetID;
    }
    set CollectionTargetID(collectionID: string) {
        if (collectionID == undefined) {
            collectionID = "0";
        }
        this._collectionTargetID = collectionID;
        this.creep.memory.CollectionTargetID = this._collectionTargetID;
    }

    private _targetController: Controller;

    constructor(creep: Creep, roomManager: RoomMgr) {
        super(creep, roomManager);
        //this.TargetSourceID = creep.memory.TargetSourceID;
        this.Status = creep.memory.Status;
        this._targetController = this.creep.room.controller;
        super.pathColor = "green";
    }

    work() {
        // If we are restocking and we are full
        if (this.Status == CreepStatus.Collecting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.CollectionTargetID = "0";
            this.Status = CreepStatus.Upgrading;
            this.creep.say('⚙️upgrade');
        }
        // If we are Upgrading and we are empty
	    if (this.Status == CreepStatus.Upgrading && this.creep.carry.energy == 0) {
	        this.Status = CreepStatus.Collecting;
            this.creep.say('⚙️Collect');
        }


        // * Upgrade room controller
        if (this.Status == CreepStatus.Upgrading) {
            this.upgradeController();
        }
        // * if our controller DOES have a container
        //   - collect from container if it has energy
        // * Check for dropped energy around the spawn drop position
        // * if our spawn DOES have a container
        //   - collect from container if it has energy
        // * move to spawn area and wait -- TEST: try just waiting
        else if (this.Status == CreepStatus.Collecting) {

            // * if our controller DOES have a container
            let controllerContainer = this.roomMgr.StashMgr.controllerContainer;
            if (controllerContainer != undefined) {
                //   - collect from container
                this.CollectionTargetID = controllerContainer.id;
                this.collectFromContainer(controllerContainer);
            }

            // * Check for dropped energy around the spawn drop position
            let dropPosition: RoomPosition = this.roomMgr.StashMgr.getSpawnContainerPos();
            let energyFound = this.checkForDroppedEnergy(RoomMgr.validPositions(dropPosition, ['wall']));
            if (energyFound != undefined) {
                this.CollectionTargetID = energyFound.id;
                this.pickUpEnergy(energyFound);
                return;
            }

            // * if our spawn DOES have a container
            let spawnContainer = this.roomMgr.StashMgr.spawnContainer;
            if (spawnContainer != undefined) {
                //   - collect from container
                this.CollectionTargetID = spawnContainer.id;
                this.collectFromContainer(spawnContainer);
            }

            // * move to spawn area and wait -- TEST: try just waiting
            if (Game.time % 3 == 0) {
                this.creep.say('⚙️zZz');
            }
        }
    }

    collectFromContainer(container: Container) {
        let withDrawResult = this.creep.withdraw(container, RESOURCE_ENERGY);
        if (withDrawResult == ERR_NOT_IN_RANGE) {
            super.moveTo(container), this.pathColor;
        }
    }

    collectFromCreep(creep: Creep) {
        let transferResult = creep.transfer(this.creep, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(creep);
        }
    }

    upgradeController() {
        let upgradeResult = this.creep.transfer(this._targetController, RESOURCE_ENERGY);
        if (upgradeResult == ERR_NOT_IN_RANGE) {
            super.moveTo(this._targetController, this.pathColor);
        }
    }
}
