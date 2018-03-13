import { Colony } from "Colony";
import { SourceMgr } from "./SourceMgr";
import { Screep } from "Creeps/Screep";

// Manages the rooms for a colony
export class RoomMgr {

    public colony: Colony;
    public baseRoom: Room;
    public baseRoomSpawn: Spawn;
    public baseRoomController: Controller;
    public baseRoomStructures: Structure[];

    public extensions: Extension[];
    public containers: Container[];

    public sourceMgr: SourceMgr;

    constructor(colony: Colony) {
        this.colony = colony;
        this.baseRoom = colony.spawn.room;
        this.baseRoomSpawn = colony.spawn;
        this.baseRoomController = colony.spawn.room.controller;
        // Later, return sources in other rooms around our base as well
        this.sourceMgr = new SourceMgr(this);

        this.loadStructures();
    }

    runRooms() {
        let spawnRequested: Boolean = false;
        spawnRequested = this.sourceMgr.spawnNeededHarvesters();

        if (!spawnRequested) {
            console.log('I should spawn something else');
        }
    }

    getBestDeposit(screep: Screep): Structure {
        // Find all containers or structures of type spawn or extension that isn't full
        // Sort by linear distance from this creep
        let sortedStructures: any = screep.creep.room.find(FIND_STRUCTURES, {
            filter: function(structure) {
                return (((structure.structureType == STRUCTURE_SPAWN
                    || structure.structureType == STRUCTURE_EXTENSION)
                    && structure.energy < structure.energyCapacity)
                    || (structure.structureType == STRUCTURE_CONTAINER
                    && structure.store < structure.storeCapacity));
            }
        }).sort((a: Structure, b: Structure): number => {return (screep.distanceTo(a.pos) - screep.distanceTo(b.pos))});
        return sortedStructures[0];
    }

    loadStructures() {
        // Get all structures and set the variables for reach structure type
        this.baseRoomStructures = this.baseRoom.find(FIND_STRUCTURES);
        // Get extensions
        this.extensions = this.getStructureOfType(STRUCTURE_EXTENSION) as Extension[];
        // Gt containers
        this.containers = this.getStructureOfType(STRUCTURE_CONTAINER) as Container[];
    }

    distanceTo(creep: Creep, pos: RoomPosition): number {
        return Math.sqrt(Math.pow(pos.x - creep.pos.x, 2) + Math.pow(pos.y - creep.pos.y, 2));
    }

    getStructureOfType(type: string): Structure[] {
        return this.baseRoomStructures.filter(struct => {
            struct.structureType == type;
        })
    }
}
