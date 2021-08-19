import { Colony } from "../Colony";
import { SourceMgr } from "./SourceMgr";
import { Screep } from "../Creeps/Screep";
import { StashMgr } from "./StashMgr";
import { CreepMgr } from "./CreepMgr";
import { CreepStatus } from "../Enums/CreepEnums";
import { DefenseMeasures } from "../Defenses/DefenseMeasures";
import { MineMgr } from "./MineMgr";

// Manages the rooms for a colony
export class RoomMgr {

    public colony: Colony;
    public baseRoom: Room;

    public exits: {[direction: string]: string};

    public baseRoomSpawn: Spawn;
    public baseRoomController: Controller;
    public baseRoomStructures: Structure[];

    public defenseMeasures: DefenseMeasures;

    public creeps: Creep[];
    public creepNames: string[];
    public transporters: Creep[];
    public harvesters: Creep[];
    public upgraders: Creep[];
    public builders: Creep[];
    public distributors: Creep[];

    public extensions: Extension[];
    public constructionSites: ConstructionSite[];

    public towers: StructureTower[];

    public sourceMgr: SourceMgr;
    public stashMgr: StashMgr;
    public mineMgr: MineMgr;

    constructor(colony: Colony) {
        this.colony = colony;
        this.baseRoom = colony.spawn.room;
        this.exits = this.baseRoom.exits;
        this.baseRoomSpawn = colony.spawn;
        this.baseRoomController = colony.spawn.room.controller;
        this.loadCreeps();
        this.loadStructures();

        this.sourceMgr = new SourceMgr(this);
        this.stashMgr = new StashMgr(this);
        this.mineMgr = new MineMgr(this);

        this.defenseMeasures = new DefenseMeasures(this);
    }

    runRooms() {
        // Create structures
        this.stashMgr.createNeededStashes();

        // Create creeps
        if (this.sourceMgr.spawnNeededHarvesters()) { return;}
        if (this.sourceMgr.spawnNeededTransporters()) { return; }

        this.defenseMeasures.manageDefenses();

        if (this.spawnNeededBuilders()) { return };
        if (this.spawnNeededDistributors()) { return;}
        if (this.spawnNeededUpgraders()) { return };
    }

    getBestDeposit(screep: Screep): Structure {

        let targetStructures: Structure[] = [];

        // Add our containers that need energy
        let sortedContainers = this.stashMgr.containers.sort((a: Structure, b: Structure): number => {
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
        // Get towers
        this.towers = this.getStructuresOfType(STRUCTURE_TOWER) as StructureTower[];
    }

    loadCreeps() {
        this.creepNames = [];
        this.creeps = [];
        this.transporters = [];
        this.harvesters = [];
        this.upgraders = [];
        this.builders = [];
        this.distributors = [];

        for (let creepName in Game.creeps) {
            if (!Game.creeps[creepName]) {
                delete Memory.creeps[creepName];
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
                else if (role == 'distributor') {
                    this.distributors.push(creep);
                }
            }
        }
    }

    spawnNeededUpgraders(): Boolean {
        if (this.transporters.length > 0 && this.upgraders.length < 4) {

            let totalLeftoverEnergy: number = 0;
            if (this.stashMgr.controllerContainer != undefined) {
                let leftoverControllerEnergy = this.getLeftoverControllerEnergy();
                totalLeftoverEnergy = leftoverControllerEnergy;
                //console.log('Leftover Controller Energy: ' + leftoverControllerEnergy);
            }
            else {
                let leftoverSpawnEnergy = this.getLeftoverSpawnEnergy();
                totalLeftoverEnergy = leftoverSpawnEnergy;
                //console.log('Leftover Spawn Energy: ' + leftoverSpawnEnergy);
            }
            //let totalLeftoverEnergy = leftoverControllerEnergy + leftoverSpawnEnergy;


            let body: string[] = this.baseRoomSpawn.createWorkerBody(2, 6, 8, [CARRY, MOVE, WORK], false)

            let newCreepCarryCapacity: number = 0;
            for (let part of body) {
                if (part == CARRY) {
                    newCreepCarryCapacity += 50;
                }
            }
            totalLeftoverEnergy -= CreepMgr.bodyCost(body)
            //console.log('New Upgrader Capacity: ' + newCreepCarryCapacity);
            if (totalLeftoverEnergy >= newCreepCarryCapacity) {
                console.log('Total Leftover Energy: ' + totalLeftoverEnergy);
                this.baseRoomSpawn.spawnUpgrader(body);
                return true;
            }
        }
        return false;
    }

    spawnNeededBuilders(): Boolean {
        let generalBuilders = this.builders.filter(builder => {
            return builder.memory.PrioritySiteID == "0";
        })
        let priorityBuilders = this.builders.filter(builder => {
            return builder.memory.PrioritySiteID != "0";
        })
        let totalBuilders = priorityBuilders.length + generalBuilders.length;

        if (this.constructionSites.length > 0 && totalBuilders < 4) {

            // console.log('General Builders: ' + generalBuilders.length);
            // console.log('Priority Builders: ' + priorityBuilders.length);
            // console.log('Total Builders: ' + totalBuilders);

            let leftoverSpawnEnergy = this.getLeftoverSpawnEnergy();

            let body: string[] = this.baseRoomSpawn.createWorkerBody(2, 3, 5, [CARRY, MOVE, WORK], false);

            let newCreepCarryCapacity: number = 0;
            for (let part of body) {
                if (part == CARRY) {
                    newCreepCarryCapacity += 50;
                }
            }

            leftoverSpawnEnergy -= CreepMgr.bodyCost(body);
            // If we have enough leftover energy to justify a new builder and we are under our builder limit
            if (leftoverSpawnEnergy >= newCreepCarryCapacity) {
                for (let conSite of this.stashMgr.containerConstructionSites) {

                    let buildersTargetingSite = this.builders.filter(builder => {
                        return builder.memory.PrioritySiteID == conSite.id;
                    })
                    if (buildersTargetingSite.length < 2) {
                        console.log('Total Leftover Energy: ' + leftoverSpawnEnergy);
                        this.baseRoomSpawn.spawnBuilder(conSite.id);
                        return true;
                    }
                }

                console.log('Total Leftover Energy: ' + leftoverSpawnEnergy);
                this.baseRoomSpawn.spawnBuilder("0");
                return true;
            }
        }
        return false;
    }

    spawnNeededDistributors(): Boolean {
        if (this.distributors.length < 1) {
            this._spawnDistributor();
            return true;
        }

        if (this.baseRoomController.level >= 5) {
            if (this.distributors.length < 2 && this.stashMgr.sourceLinks.length >= 2) {
                this._spawnDistributor();
                return true;
            }
        }
        return false;
    }

    private _spawnDistributor() {
        let body = this.baseRoomSpawn.createBalancedBody([CARRY, MOVE], 15, false);

        while (CreepMgr.bodyCost(body) > this.baseRoom.energyCapacityAvailable) {
            body.pop();
            body.pop();
        }

        let spawnDistributorOpts = {
            Role: 'distributor',
            MovePath: "",
            MoveID: 0,
            PreviousPos: undefined,
            PreviousMoveResult: undefined,
            Status: CreepStatus.Collecting,
            ColonyID: this.colony.ColonyID
        }

        let name = this.baseRoomSpawn.generateCreepName('distro', this.colony.ColonyID.toString());
        this.baseRoomSpawn.spawnCreep(body, name, { memory: spawnDistributorOpts });
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

    getLeftoverSpawnEnergy() {

        let leftoverSpawnContainerEnergy: number = 0;
        // Get the amount of energy available in the spawn container
        let spawnContainer: Container = this.stashMgr.spawnContainer;
        if (spawnContainer != undefined) {
            let spawnContainerEnergy: number = 0;
            spawnContainerEnergy = spawnContainer.store[RESOURCE_ENERGY];
            if (this.stashMgr.spawnLink != undefined) {
                spawnContainerEnergy += this.stashMgr.spawnLink.energy;
            }

            if (spawnContainerEnergy > 0) {
                // Get all creeps who want to collect from the spawn container
                let spawnContainerCollectors: Creep[] = [];
                for (let creep of this.creeps) {
                    if (creep.memory.CollectionTargetID == spawnContainer.id) {
                        spawnContainerCollectors.push(creep);
                    }
                }

                let collectorCapacity: number = 0;
                for (let creep of spawnContainerCollectors) {
                    collectorCapacity += creep.carryCapacity;
                }

                leftoverSpawnContainerEnergy = spawnContainerEnergy - collectorCapacity;
            }
        }

        let leftoverDroppedSpawnEnergy: number = 0;
        // Get the amount of dropped energy at the spawn container location
        let dropPosition = this.stashMgr.getSpawnContainerPos();
        let energyFound: Resource[] = this.baseRoom.lookForAt(RESOURCE_ENERGY, dropPosition);
        if (energyFound.length > 0) {
            let droppedSpawnEnergy: number = energyFound[0].amount;

            // Get all creeps who want to collect this dropped energy
            let droppedEnergyCollectors: Creep[] = [];
            for (let creep of this.creeps) {
                if (creep.memory.CollectionTargetID == energyFound[0].id) {
                    droppedEnergyCollectors.push(creep);
                }
            }

            let collectorCapacity: number = 0;
            for (let creep of droppedEnergyCollectors) {
                collectorCapacity += creep.carryCapacity;
            }

            leftoverDroppedSpawnEnergy = droppedSpawnEnergy - collectorCapacity;
        }

        let totalLeftoverSpawnEnergy = leftoverSpawnContainerEnergy + leftoverDroppedSpawnEnergy;
        return totalLeftoverSpawnEnergy;
    }

    getLeftoverControllerEnergy() {

        let leftoverControllerContainer: number = 0;
        // Get the amount of energy available in the controller container
        let controllerContainer: Container = this.stashMgr.controllerContainer;
        if (controllerContainer != undefined) {
            let controllerContainerEnergy: number = 0;
            controllerContainerEnergy = controllerContainer.store[RESOURCE_ENERGY];

            if (controllerContainerEnergy > 0) {
                // Get all upgraders who want to collect from the spawn container
                let controllerContainerCollectors: Creep[] = [];
                for (let creep of this.upgraders) {
                    if (creep.memory.CollectionTargetID == controllerContainer.id) {
                        controllerContainerCollectors.push(creep);
                    }
                }

                let collectorCapacity: number = 0;
                for (let creep of controllerContainerCollectors) {
                    collectorCapacity += creep.carryCapacity;
                }

                leftoverControllerContainer = controllerContainerEnergy - collectorCapacity;
            }
        }

        let leftoverDroppedControllerEnergy: number = 0;
        // Get the amount of dropped energy at the spawn container location
        let dropPosition = this.stashMgr.getControllerContainerPos();
        let [energyFound] = this.baseRoom.lookForAt(RESOURCE_ENERGY, dropPosition);
        if (energyFound != undefined) {
            let droppedControllerEnergy: number = energyFound.amount;

            // Get all upgraders who want to collect this dropped energy
            let droppedEnergyCollectors: Creep[] = [];
            for (let creep of this.upgraders) {
                if (creep.memory.CollectionTargetID == energyFound.id) {
                    droppedEnergyCollectors.push(creep);
                }
            }

            let collectorCapacity: number = 0;
            for (let creep of droppedEnergyCollectors) {
                collectorCapacity += creep.carryCapacity;
            }

            leftoverDroppedControllerEnergy = droppedControllerEnergy - collectorCapacity;
        }

        let totalLeftoverSpawnEnergy = leftoverControllerContainer + leftoverDroppedControllerEnergy;
        return totalLeftoverSpawnEnergy;
    }
}
