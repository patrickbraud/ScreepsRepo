import { Screep } from "./Screep";
import { RoomMgr } from "Mgrs/RoomMgr";
import { CreepStatus } from "Enums/CreepEnums";

export class Distributor extends Screep {

    constructor(creep: Creep, roomMgr: RoomMgr) {
        super(creep, roomMgr);
        this.Status = creep.memory.Status;
        super.pathColor = "purple";
    }

    work() {
        // If we are collecting and we are full
        if (this.Status == CreepStatus.Collecting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.Status = CreepStatus.Depositing;
            this.creep.say('⛏️ distribute');
        }
        // If we are Depositing and we are empty
        if (this.Status == CreepStatus.Depositing && this.creep.carry.energy == 0) {
            this.Status = CreepStatus.Collecting;
            this.creep.say('⛏️ collect');
        }

        if (this.Status == CreepStatus.Collecting) {

            let spawnLink = this.roomMgr.StashMgr.spawnLink;
            if (spawnLink != undefined && spawnLink.energy > 0) {
                this.collectFromStructure(spawnLink);
                return;
            }

            let sourceEnergy = this.checkForDroppedEnergy(this.roomMgr.StashMgr.getSpawnContainerPos());
            if (sourceEnergy != undefined) {
                this.pickUpEnergy(sourceEnergy);
                return;
            }

            let spawnContainer = this.roomMgr.StashMgr.spawnContainer;
            if (spawnContainer != undefined && spawnContainer.store.energy > 0) {
                this.collectFromStructure(spawnContainer);
                return;
            }
        }
        else if (this.Status == CreepStatus.Depositing) {

            // * depsoit into extensions/spawn that need energy
            let structuresNeedEnergy = this.roomMgr.extensions.filter(ext => {
                return ext.energy < ext.energyCapacity
            }).sort((a: Structure, b: Structure): number => { return (this.distanceTo(a.pos) - this.distanceTo(b.pos))});
            if (this.roomMgr.baseRoomSpawn.energy < this.roomMgr.baseRoomSpawn.energyCapacity) {
                structuresNeedEnergy.push(this.roomMgr.baseRoomSpawn);
            }
            if (structuresNeedEnergy.length > 0) {
                this.depositIntoStructure(structuresNeedEnergy[0]);
                return;
            }

            // Fill towers if they have less than 80% capacity
            let lowTowers = this.roomMgr.towers.filter(tower => { return tower.energy < (0.80 * tower.energyCapacity) });
            if (lowTowers.length > 0) {
                let closestTowers = lowTowers.sort((a: StructureTower, b: StructureTower): number => { return (this.distanceTo(a.pos) - this.distanceTo(b.pos))});
                this.fillTower(closestTowers[0]);
                return;
            }


            let controllerContainer = this.roomMgr.StashMgr.controllerContainer;
            if (controllerContainer != undefined && controllerContainer.store.energy < controllerContainer.storeCapacity) {
                this.depositIntoContainer(controllerContainer);
                return;
            }
        }

        if (Game.time % 2 == 0) {
            this.creep.say('zZz');
        }
    }

    depositIntoStructure(structure: Structure) {
        let transferResult = this.creep.transfer(structure, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(structure, this.pathColor);
        }
    }

    collectFromStructure(structure: Structure) {
        let withdrawResult = this.creep.withdraw(structure, RESOURCE_ENERGY);
        if (withdrawResult == ERR_NOT_IN_RANGE) {
            super.moveTo(structure, this.pathColor);
        }
    }

    fillTower(tower: StructureTower) {
        let transferResult = this.creep.transfer(tower, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(tower, this.pathColor)
        }
    }

    depositIntoContainer(container: Container) {
        let transferResult = this.creep.transfer(container, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(container, this.pathColor);
        }
    }
}
