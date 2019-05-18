import { Screep } from "./Screep";
import { CreepStatus } from "Enums/CreepEnums";
import { RoomMgr } from "Mgrs/RoomMgr";

export class Builder extends Screep {

    private _prioritySiteID: string;
    get PrioritySiteID(): string {
        return this._prioritySiteID;
    }
    set PrioritySiteID(siteID: string) {
        this._prioritySiteID = siteID;
        this.creep.memory.PrioritySiteID = this._prioritySiteID;
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

    pathColor = "white";

    constructor(creep: Creep, roomManager: RoomMgr) {
        super(creep, roomManager);
        this.Status = creep.memory.Status;
        this.PrioritySiteID = creep.memory.PrioritySiteID;
        super.pathColor = "white";
    }

    work() {
        // If we are Restocking and we are full
        if (this.Status == CreepStatus.Collecting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.CollectionTargetID = "0";
            this.Status = CreepStatus.Building;
            this.creep.say('🛠️Build');
        }
        // If we are Building and we are empty
	    if (this.Status == CreepStatus.Building && this.creep.carry.energy == 0) {
	        this.Status = CreepStatus.Collecting;
            this.creep.say('🛠️Collect');
        }

        // * if we have a priority construction site
        // 	 - Build the priority construction site if it exists
        // * if construction sites exist
        // 	 - build the closest construction site
        // * if no construction sites exist
        // 	 - upgrade the controller
        if (this.Status == CreepStatus.Building) {

            // * if we have a priority construction site
            let prioritySite = this.roomMgr.constructionSites.find(conSite => {
                return conSite.id == this.PrioritySiteID;
            });
            // 	 - Build the priority construction site if it exists
            if (prioritySite != undefined) {
                this.buildConstructionSite(prioritySite);
                return;
            }
            else {
                this.PrioritySiteID = "0";
            }

            // * if construction sites exist
            if (this.roomMgr.constructionSites.length > 0) {
                // 	 - build the closest construction site
                let closestConSite = this.roomMgr.constructionSites.sort((a: ConstructionSite, b: ConstructionSite): number => {
                    return (this.distanceTo(a.pos) - this.distanceTo(b.pos))
                })[0];
                this.buildConstructionSite(closestConSite);
                return;
            }

            // * if no construction sites exist
            // 	 - upgrade the controller
            this.upgradeController();

        }
        // * Check for dropped energy around the spawn drop position
        // * if the room spawn DOES have a container
        // 	 - collect from spawn container if it has energy
        // * move to spawn area and wait
        else if (this.Status == CreepStatus.Collecting) {

            // * Check for dropped energy around the spawn drop position
            let dropPosition = this.roomMgr.StashMgr.getSpawnContainerPos();
            let spawnDropEnergy = this.checkForDroppedEnergy(dropPosition);
            if (spawnDropEnergy != undefined) {
                this.CollectionTargetID = spawnDropEnergy.id;
                this.pickUpEnergy(spawnDropEnergy);
                return;
            }

            // * if the room spawn DOES have a container
            let spawnContainer = this.roomMgr.StashMgr.spawnContainer;
            if (spawnContainer != undefined && spawnContainer.store[RESOURCE_ENERGY] > 0) {
                // 	 - collect from spawn container if it has energy
                this.CollectionTargetID = spawnContainer.id;
                this.collectFromStructure(spawnContainer);
                return;
            }

            let spawnlink = this.roomMgr.StashMgr.spawnLink;
            if (spawnlink != undefined && spawnlink.energy > 0) {
                this.CollectionTargetID = spawnlink.id;
                this.collectFromStructure(spawnlink);
                return;
            }

            // * move to spawn area and wait
            // let spawnDropPosition: RoomPosition = this.roomMgr.StashMgr.getSpawnContainerPos();
            // this.moveToSpawnDropArea(spawnDropPosition);
            if (Game.time % 2 == 0) {
                this.creep.say('🛠️zZz');
            }
        }
    }

    checkForClosestDroppedEnergy(): Resource {
        let droppedEnergy: Resource[] = [];

        let dropPosition = this.roomMgr.StashMgr.getSpawnContainerPos();
        let spawnDropEnergy = this.checkForDroppedEnergy(dropPosition);
        if (spawnDropEnergy != undefined) {
            droppedEnergy.push(spawnDropEnergy);
        }

        for (let source of this.roomMgr.sourceMgr.sources) {
            let foundEnergy = this.checkForDroppedEnergy(source.pos);
            if (foundEnergy != undefined) {
                droppedEnergy.push(foundEnergy);
            }
        }

        let closestDroppedEnergy = droppedEnergy.sort((a: Resource, b: Resource): number => { return (this.distanceTo(a.pos) - this.distanceTo(b.pos))});
        if (closestDroppedEnergy.length > 0) {
            return closestDroppedEnergy[0];
        }

        return undefined;
    }

    moveToSpawnDropArea(spawnDropPoint: RoomPosition) {

        let currentPathIndex = this.MovePath.findIndex(step => {
            return (step.x == this.creep.pos.x && step.y == this.creep.pos.y);
        })
        let stepsLeft = this.MovePath.length - currentPathIndex;
        if (stepsLeft < 5) {
            //console.log('steps left: ' + stepsLeft);
            if (Game.time % 3 == 0) {
                this.creep.say('🛠️zZz');
            }
            return;
        }
        else {
            this.creep.moveTo(spawnDropPoint, {reusePath: 10});
        }
    }

    buildConstructionSite(conSite: ConstructionSite) {
        let buildResult = this.creep.build(conSite);
        if (buildResult == ERR_NOT_IN_RANGE) {
            super.moveTo(conSite, this.pathColor);
        }
    }

    collectFromStructure(target: Container | Extension | Spawn) {
        let withdrawResult = this.creep.withdraw(target, RESOURCE_ENERGY);
        if (withdrawResult == ERR_NOT_IN_RANGE) {
            super.moveTo(target, this.pathColor);
        }
    }

    collectFromHarvester(target: Creep) {
        let transferResult = target.transfer(this.creep, RESOURCE_ENERGY);
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
