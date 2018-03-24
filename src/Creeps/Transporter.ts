import { Screep } from "./Screep";
import { CreepStatus } from "Enums/CreepEnums";
import { RoomMgr } from "Mgrs/RoomMgr";
import { RoomUtils } from "Mgrs/RoomUtils";

export class Transporter extends Screep{

    private _targetSourceID: string;
    get TargetSourceID(): string {
        return this._targetSourceID;
    }
    set TargetSourceID(targetID: string) {
        //if (targetID == undefined) { targetID = "0"; }
        this._targetSourceID = targetID;
        this.creep.memory.TargetSourceID = targetID;
    }

    private _targetContainerID: string;
    get TargetContainerID(): string {
        return this._targetContainerID;
    }
    set TargetContainerID(targetID: string) {
        this._targetContainerID = targetID;
        this.creep.memory.TargetContainerID = targetID;
    }

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

    private _targetSource: Source;
    private _targetContainer: Container;

    constructor(creep: Creep, roomManager: RoomMgr) {
        super(creep, roomManager);
        this.Status = creep.memory.Status;
        this.TargetSourceID = creep.memory.TargetSourceID;
        super.pathColor = "#00FFFF";

        this._targetSource = this.roomMgr.sourceMgr.getSourceByID(this.TargetSourceID);

        // If this source has a container, store its info
        if (this.TargetContainerID == undefined) {
            this._targetContainer = this.roomMgr.StashMgr.getContainerForSource(this._targetSource);
            if (this._targetContainer != undefined) {
                this.TargetContainerID = this._targetContainer.id;
            }
        }
    }

    work() {
        // If we are Collecting and we are full
        if(this.Status == CreepStatus.Collecting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.CollectionTargetID = "0";
            this.Status = CreepStatus.Transporting;
            this.creep.say('🚚');
        }
        // If we are Transporting and we are empty
	    if(this.Status == CreepStatus.Transporting && this.creep.carry.energy == 0) {
	        this.Status = CreepStatus.Collecting;
            this.creep.say('🚚Collect');
        }

        // * depsoit into extensions/spawn that need energy
        // * if the room spawn DOES have a container
        //   - deposit into container if not full
        // * if the room controller DOES have a container
        //   - deposit into container if not full
        // * move to spawn and drop energy
        if (this.Status == CreepStatus.Transporting) {
            // * depsoit into extensions/spawn that need energy
            let structuresNeedEnergy = this.roomMgr.extensions.filter(ext => {
                return ext.energy < ext.energyCapacity
            }).sort((a: Structure, b: Structure): number => { return (this.distanceTo(a.pos) - this.distanceTo(b.pos))});
            if (this.roomMgr.baseRoomSpawn.energy < this.roomMgr.baseRoomSpawn.energyCapacity) {
                structuresNeedEnergy.push(this.roomMgr.baseRoomSpawn);
            }
            if (structuresNeedEnergy.length > 0) {
                this.deposit(structuresNeedEnergy[0]);
                return;
            }

            // * if the room spawn DOES have a container
            //   - deposit into container if not full
            let spawnContainer = this.roomMgr.StashMgr.spawnContainer;
            if (spawnContainer != undefined && spawnContainer.store[RESOURCE_ENERGY] < spawnContainer.storeCapacity) {
                this.deposit(spawnContainer);
                return;
            }

            // * if the room controller DOES have a container
            //   - deposit into container if not full
            let controllerContainer = this.roomMgr.StashMgr.controllerContainer;
            if (controllerContainer != undefined && controllerContainer.store[RESOURCE_ENERGY] < controllerContainer.storeCapacity) {
                this.deposit(controllerContainer);
                return;
            }

            // * move to spawn and drop energy
            let dropPosition = this.roomMgr.StashMgr.getSpawnContainerPos();
            if (!this.creep.pos.isEqualTo(dropPosition)) {
                this.creep.moveTo(dropPosition, {reusePath: 15, visualizePathStyle: {stroke: this.pathColor, lineStyle: undefined}});
            }
            else {
                this.creep.drop(RESOURCE_ENERGY);
            }
        }
        // * check for dropped energy around source
        // * if our source DOES has a container
        //   - withdraw from container
        // * if our source DOES NOT have a container
        //   - withdraw from our source's harvesters
        else if (this.Status == CreepStatus.Collecting) {
            // * check for dropped energy around source
            let foundEnergy = super.checkForDroppedEnergy(this._targetSource.pos);
            if (foundEnergy != undefined) {
                this.CollectionTargetID = foundEnergy.id;
                super.pickUpEnergy(foundEnergy);
                return;
            }

            // * if our source DOES has a container
            //   - withdraw from container
            if (this._targetContainer != undefined) {
                this.CollectionTargetID = this._targetContainer.id;
                this.collectFromContainer(this._targetContainer);
                return;
            }
            // * if our source DOES NOT have a container
            //   - withdraw from our source's harvesters
            // else {
            //     let harvestersWithEnergy = this.roomMgr.harvesters.filter(harvester => {
            //         return harvester.carry.energy > 0
            //                 && harvester.memory.TargetSourceID == this.TargetSourceID;
            //     })
            //     if (harvestersWithEnergy.length > 0) {
            //         this.CollectionTargetID = harvestersWithEnergy[0].id;
            //         this.collectFromHarvester(harvestersWithEnergy[0]);
            //         return;
            //     }
            // }

            if (Game.time % 3 == 0) {
                this.creep.say('🚚zZz');
            }
        }
    }

    blockingHarvesterSpot(source: Source): Boolean {
        let validSourcePositions = RoomUtils.validPositions(source, ['wall']);
        for (let pos of validSourcePositions) {
            if (pos.isEqualTo(this.creep.pos)) {
                this.creep.say('Blocking');
                // Move in a random direction until we aren't blocking a harvester
                this.creep.move(Math.random() * Math.floor(9 - 1) + 1);
                return true;
            }
        }
        return false;
    }



    deposit(structure: Structure) {
        let transferResult = this.creep.transfer(structure, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(structure, this.pathColor);
        }
    }

    // depositToContainer(container: Container) {
    //     if (container.hits < container.hitsMax) {
    //         this.creep.say('🔨repair')
    //         this.repairContainer(container);
    //     }
    //     else {
    //         this.deposit(container);
    //     }
    // }

    transferToCreep(creep: Creep) {
        let transferResult = this.creep.transfer(creep, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(creep, this.pathColor);
        }
    }

    collectFromContainer(target: Container) {
        //if (target.store[RESOURCE_ENERGY] >= this.creep.carryCapacity) {
            let withdrawResult = this.creep.withdraw(target, RESOURCE_ENERGY);
            if (withdrawResult == ERR_NOT_IN_RANGE) {
                super.moveTo(target, this.pathColor);
            }
        //}
    }

    collectFromHarvester(target: Creep) {
        let transferResult = target.transfer(this.creep, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(target, this.pathColor);
        }
    }

    buildContainer(conSite: ConstructionSite) {
        let buildResult = this.creep.build(conSite);
        if (buildResult == ERR_NOT_IN_RANGE) {
            super.moveTo(conSite, this.pathColor);
        }
    }

    upgradeController() {
        let upgradeResult = this.creep.upgradeController(this.roomMgr.baseRoomController);
        if (upgradeResult == ERR_NOT_IN_RANGE) {
            super.moveTo(this.roomMgr.baseRoomController, this.pathColor);
        }
    }
}
