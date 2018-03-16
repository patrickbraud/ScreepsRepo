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

    public creeps: Creep[];
    public creepNames: string[];
    public transporters: Creep[];
    public harvesters: Creep[];

    public extensions: Extension[];
    public constructionSites: ConstructionSite[];

    public sourceMgr: SourceMgr;
    public StashMgr: StashMgr;

    constructor(colony: Colony) {
        this.colony = colony;
        this.baseRoom = colony.spawn.room;
        this.baseRoomSpawn = colony.spawn;
        this.baseRoomController = colony.spawn.room.controller;
        this.loadCreeps();
        this.loadStructures();

        this.sourceMgr = new SourceMgr(this);
        this.StashMgr = new StashMgr(this);
    }

    runRooms() {
        this.StashMgr.createNeededStashes();
        this.StashMgr.spawnNeededTransporters();
        this.sourceMgr.spawnNeededHarvesters();
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

    loadCreeps() {
        this.creepNames = [];
        this.creeps = [];
        this.transporters = [];
        this.harvesters = [];

        for (let creepName in Game.creeps) {
            if (!Game.creeps[creepName]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', creepName);
            }
            let creep = Game.creeps[creepName];
            // Get all creeps in our colony AND our room ***Expansion point to cover multiple rooms
            if (creep.memory.ColonyID == this.colony.ColonyID
                && creep.room.name == this.baseRoom.name) {
                this.creepNames.push(creepName);
                this.creeps.push(creep);

                let role = creep.memory.Role;
                if (role == 'transporter') {
                    this.transporters.push(creep);
                }
                else if (role == 'harvester') {
                    this.harvesters.push(creep);
                }
            }
        }
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
