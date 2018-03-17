import { Screep } from "./Screep";
import { CreepStatus } from "Enums/CreepEnums";
import { RoomMgr } from "Mgrs/RoomMgr";

export class Transporter extends Screep{

    private _targetContainerID: string;
    get TargetContainerID(): string {
        return this._targetContainerID;
    }
    set TargetContainerID(targetID: string) {
        if (targetID == undefined) { targetID = "0"; }
        this._targetContainerID = targetID;
        this.creep.memory.TargetSourceID = targetID;
    }

    // private _targetController: Controller;
    private _pathColor = "#00FFFF";

    constructor(creep: Creep, roomManager: RoomMgr) {
        super(creep, roomManager);
        this.Status = creep.memory.Status;
        this.TargetContainerID = creep.memory.TargetContainerID;

    }

    work() {
        // If we are Collecting and we are full
        if(this.Status == CreepStatus.Collecting && this.creep.carry.energy == this.creep.carryCapacity) {
            this.Status = CreepStatus.Transporting;
            this.creep.say('🚚');
        }
        // If we are Transporting and we are empty
	    if(this.Status == CreepStatus.Transporting && this.creep.carry.energy == 0) {
	        this.Status = CreepStatus.Collecting;
            this.creep.say('📀 Collect');
        }

        let targetConSite: ConstructionSite = this.roomMgr.StashMgr.getContainerConSiteByID(this.TargetContainerID);
        let targetContainer: Container = this.roomMgr.StashMgr.getContainerByID(this.TargetContainerID);
        let connectedSource: Source;
        if (targetConSite != undefined) {
            connectedSource = this.roomMgr.StashMgr.getSourceForContainerConSite(targetConSite);
        }
        else if (targetContainer != undefined) {
            connectedSource = this.roomMgr.StashMgr.getSourceForContainer(targetContainer);
        }

        this.checkIfBlockingHarvesters(connectedSource);


        // When transporting you want to DUMP energy, and you can do 2 things
        // - Transport energy to extensions/spawn
        // - Transport energy to build container construction site
        // * fallback upgrade controller
        if (this.Status == CreepStatus.Transporting)
        {
            // if our TargetContainerID is actually a container, then we don't want don't want to build
            // deposit into an extension/spawn/controller storage
            if (targetContainer != undefined) {
                let structuresNeedEnergy = this.roomMgr.extensions.filter(ext => {
                    return ext.energy < ext.energyCapacity
                })
                if (this.roomMgr.baseRoomSpawn.energy < this.roomMgr.baseRoomSpawn.energyCapacity) {
                    structuresNeedEnergy.push(this.roomMgr.baseRoomSpawn);
                }
                if (structuresNeedEnergy.length > 0) {
                    this.deposit(structuresNeedEnergy[0]);
                    return;
                }

            }
            // if our TargetContainerID is a construction site for a container,
            // Then build the construction site
            else if (targetConSite != undefined)
            {
                this.buildContainer(targetConSite);
                return;
            }

            // If we made it this far, just upgrade the controllre
            this.upgradeController();
        }
        // When Collecting, you want to GET energy, and you can do 2 things
        // - collect energy from a container
        // - collect energy from the harvesters/extensions to build the container
        // * Fallback zZz
        else if (this.Status == CreepStatus.Collecting) {
            // if our TargetContainerID is a construction site for a container,
            // Then collect from the harvesters located at the conSite we want to build
            if (targetConSite != undefined)
            {

                // if there aren't any structures w/ energy, take energy from the harvesters directly
                let creepsHarvesting = this.roomMgr.harvesters.filter(creep => {
                    return creep.memory.TargetSourceID == connectedSource.id
                            && creep.memory.Status == CreepStatus.Harvesting
                            && creep.carry.energy > 0;
                });

                if (creepsHarvesting.length > 0) {
                    let collectionTarget = creepsHarvesting[0];
                    this.collectFromHarvester(collectionTarget);
                    return;
                }
                else {
                    // // Get all extensions
                    // let validStructures: (Extension | Spawn)[] = this.roomMgr.extensions;
                    // //validStructures.push(this.roomMgr.baseRoomSpawn);
                    // // Keep only the ones that have energy
                    // let structuresWithEnergy: (Extension | Spawn)[] = validStructures.filter(struct => {
                    //     return struct.energy > 0;
                    // })
                    // if (structuresWithEnergy.length > 0) {
                    //     let collectionTarget = structuresWithEnergy.pop();
                    //     this.collectFromStructure(collectionTarget);
                    //     return;
                    // }
                    if (Game.time % 2 == 0) {
                        this.creep.say('📀zZz');
                    }
                }
            }
            // if our TargetContainerID is a container, then collect from it
            else {
                this.collectFromStructure(targetContainer)
            }
        }
    }

    checkIfBlockingHarvesters(source: Source) {
        let validSourcePositions = RoomMgr.validPositions(source, ['wall']);
        for (let pos of validSourcePositions) {
            if (pos.isEqualTo(this.creep.pos)) {
                this.creep.say('Blocking');
                // Move in a random direction until we aren't blocking a harvester
                this.creep.move(Math.random() * Math.floor(9 - 1) + 1);
                return;
            }
        }
    }

    deposit(structure: Extension | Spawn) {
        let transferResult = this.creep.transfer(structure, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(structure, this._pathColor);
        }
    }

    collectFromStructure(target: Container | Extension | Spawn) {
        let withdrawResult = this.creep.withdraw(target, RESOURCE_ENERGY);
        if (withdrawResult == ERR_NOT_IN_RANGE) {
            super.moveTo(target, this._pathColor);
        }
    }

    collectFromHarvester(target: Creep) {
        let transferResult = target.transfer(this.creep, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            super.moveTo(target, this._pathColor);
        }
    }

    buildContainer(conSite: ConstructionSite) {
        let buildResult = this.creep.build(conSite);
        if (buildResult == ERR_NOT_IN_RANGE) {
            super.moveTo(conSite, this._pathColor);
        }
    }

    upgradeController() {
        let upgradeResult = this.creep.upgradeController(this.roomMgr.baseRoomController);
        if (upgradeResult == ERR_NOT_IN_RANGE) {
            super.moveTo(this.roomMgr.baseRoomController, this._pathColor);
        }
    }
}
