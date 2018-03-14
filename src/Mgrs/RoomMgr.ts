import { Colony } from "Colony";
import { SourceMgr } from "./SourceMgr";
import { Screep } from "Creeps/Screep";
import { StashMgr } from "./StashMgr";

// Manages the rooms for a colony
export class RoomMgr {

    public colony: Colony;
    public baseRoom: Room;
    public baseRoomSpawn: Spawn;
    public baseRoomController: Controller;
    public baseRoomStructures: Structure[];

    public extensions: Extension[];
    public constructionSites: ConstructionSite[];

    public sourceMgr: SourceMgr;
    public StashMgr: StashMgr;

    constructor(colony: Colony) {
        this.colony = colony;
        this.baseRoom = colony.spawn.room;
        this.baseRoomSpawn = colony.spawn;
        this.baseRoomController = colony.spawn.room.controller;
        this.loadStructures();

        this.sourceMgr = new SourceMgr(this);
        this.StashMgr = new StashMgr(this);
    }

    runRooms() {
        let spawnRequested: Boolean = false;
        spawnRequested = this.sourceMgr.spawnNeededHarvesters();

        if (!spawnRequested) {
            console.log('Create containers in the best spot for source');
            console.log('Spawn Haulers for containers that will build container construction sites');
        }

        if (this.baseRoomController.level >= 2) {
            this.StashMgr.createNeededStashes();
        }
    }

    getBestDeposit(screep: Screep): Structure {

        let targetStructures: Structure[] = [];

        // Add our containers that need energy
        let sortedContainers = this.StashMgr.containers.sort((a: Structure, b: Structure): number => {
            return (screep.distanceTo(a.pos) - screep.distanceTo(b.pos))
        });
        sortedContainers = sortedContainers.filter(container => {
            return container.store[RESOURCE_ENERGY] < container.storeCapacity;
        });
        targetStructures = targetStructures.concat(sortedContainers);

        // Add our extensions that need energy
        let sortedExtensions = this.extensions.sort((a: Structure, b: Structure): number => {
            return (screep.distanceTo(a.pos) - screep.distanceTo(b.pos))
        });
        sortedExtensions = sortedExtensions.filter(extension => {
            return extension.energy < extension.energyCapacity;
        });
        targetStructures = targetStructures.concat(sortedExtensions);

        // Add the spawn to the list if it needs energy
        if (this.baseRoomSpawn.energy < this.baseRoomSpawn.energyCapacity) {
            targetStructures.push(this.baseRoomSpawn);
        }

        return targetStructures[0];
    }

    loadStructures() {
        // Get all structures
        this.baseRoomStructures = this.baseRoom.find(FIND_STRUCTURES);
        // Get all construction sites
        this.constructionSites = this.baseRoom.find(FIND_CONSTRUCTION_SITES);
        // Get extensions
        this.extensions = this.getStructuresOfType(STRUCTURE_EXTENSION) as Extension[];
    }

    distanceTo(creep: Creep, pos: RoomPosition): number {
        return Math.sqrt(Math.pow(pos.x - creep.pos.x, 2) + Math.pow(pos.y - creep.pos.y, 2));
    }

    getStructuresOfType(type: string): Structure[] {
        return this.baseRoomStructures.filter(struct => {
            return struct.structureType == type;
        });
    }

    getConstructionSitesOfType(type: string): ConstructionSite[] {
        return this.constructionSites.filter(site => {
            return site.structureType == type;
        })
    }
}
