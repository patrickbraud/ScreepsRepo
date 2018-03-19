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
    public upgraders: Creep[];
    public builders: Creep[];

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
        // Create structures
        this.StashMgr.createNeededStashes();

        // Create creeps
        this.spawnNeededBuilders();
        this.spawnNeededUpgraders();
        this.sourceMgr.spawnNeededTransporters();
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
        this.upgraders = [];
        this.builders = [];

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
                else if (role == 'upgrader') {
                    this.upgraders.push(creep);
                }
                else if (role == 'builder') {
                    this.builders.push(creep);
                }
            }
        }
    }

    spawnNeededUpgraders() {
        if (/*this.extensions.length >= 5 &&*/ this.upgraders.length < 3) {
            let body: string[];
            // If we have no transporters, prioritize move
            if (this.transporters.length == 0) {
                body = this.baseRoomSpawn.createWorkerBody(1, 2, 3, [CARRY, MOVE], false)
            }
            else {
                body = this.baseRoomSpawn.createWorkerBody(2, 4, 6, [CARRY, MOVE, WORK], false)
            }

            this.baseRoomSpawn.spawnUpgrader(body);
        }
    }

    spawnNeededBuilders() {
        let generalBuilders = this.builders.filter(builder => {
            return builder.memory.PrioritySiteID == "0";
        })
        let priorityBuilders = this.builders.filter(builder => {
            return builder.memory.PrioritySiteID != "0";
        })
        // console.log('general builders: ' + generalBuilders.length);
        // console.log('priority builders: ' + priorityBuilders.length);
        // console.log('total builders: ' + this.builders.length);
        if (this.constructionSites.length > 0) {
            for (let conSite of this.StashMgr.containerConstructionSites) {

                let buildersTargetingSite = this.builders.filter(builder => {
                    return builder.memory.PrioritySiteID == conSite.id;
                })
                if (buildersTargetingSite.length < 2) {
                    this.baseRoomSpawn.spawnBuilder(conSite.id);
                    return;
                }
            }

            if (priorityBuilders.length < 6 && generalBuilders.length < 3) {
                this.baseRoomSpawn.spawnBuilder("0");
                return;
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

    static validPositions(centerObject: any, invalidTerrain: string[]): RoomPosition[] {
        let validPositions: RoomPosition[] = [];
         /*
            x * *
            * O *
            * * y
            Start at the x, end at the y
        */
        let currentPos: RoomPosition;
        if (centerObject.hasOwnProperty('pos')) {
            currentPos = new RoomPosition(centerObject.pos.x - 1, centerObject.pos.y - 1, centerObject.pos.roomName);
        }
        else {
            currentPos = new RoomPosition(centerObject.x - 1, centerObject.y - 1, centerObject.roomName);
        }
        for (let xCount = 0; xCount < 3; xCount++, currentPos.x++) {
            for (let yCount = 0; yCount < 3; yCount++, currentPos.y++) {
                if (currentPos != centerObject.pos) {

                    let invalid = false;
                    for (let terrain of invalidTerrain) {
                        invalid = RoomMgr.positionIsTerrainType(currentPos, terrain);
                        if (invalid) { break; }
                    }
                    if (!invalid) {
                        validPositions.push(new RoomPosition(currentPos.x, currentPos.y, currentPos.roomName));;
                    }
                }
            }
            currentPos.y -= 3;
        }
        return validPositions;
    }

    static positionIsTerrainType(pos: RoomPosition, terrain: string): boolean {
        let lookResult = Game.rooms[pos.roomName].lookForAt(LOOK_TERRAIN, pos);
        //console.log('x: ' + pos.x + ' y: ' + pos.y + ' - ' + lookResult.toString() + ' - ' + (lookResult.toString() != 'wall'));
        return lookResult.toString() == terrain;
    }

    static getBoxPositions(radiusFromCenter: number, centerPosition: RoomPosition): RoomPosition[] {
        let edgeLength = radiusFromCenter * 2 + 1;

        let topLeftStart = new RoomPosition(centerPosition.x - radiusFromCenter,
                                        centerPosition.y - radiusFromCenter,
                                        centerPosition.roomName);
        let topRightStart = new RoomPosition(centerPosition.x + radiusFromCenter,
                                        centerPosition.y - radiusFromCenter,
                                        centerPosition.roomName);
        let bottomLeftStart = new RoomPosition(centerPosition.x - radiusFromCenter,
                                        centerPosition.y + radiusFromCenter,
                                        centerPosition.roomName);
        let bottomRightStart = new RoomPosition(centerPosition.x + radiusFromCenter,
                                        centerPosition.y + radiusFromCenter,
                                        centerPosition.roomName);

        let boxPositions: RoomPosition[] = [];
        for(let edgeCount = 0; edgeCount < edgeLength - 1; edgeCount++) {
            boxPositions.push(topLeftStart);
            boxPositions.push(topRightStart);
            boxPositions.push(bottomLeftStart);
            boxPositions.push(bottomRightStart);

            topLeftStart.x += 1;
            topRightStart.y += 1;
            bottomLeftStart.y -= 1;
            bottomRightStart.x -= 1;
        }

        return boxPositions;
    }
}
