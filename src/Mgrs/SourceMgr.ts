import { RoomMgr } from "./RoomMgr";
//import { Screep } from "Creeps/Screep";
import { CreepStatus } from "Enums/CreepEnums";
import { CreepMgr } from "./CreepMgr";

export class SourceMgr {

    private _roomManager: RoomMgr;

    public sources: Source[];

    constructor(roomMgr: RoomMgr) {
        this._roomManager = roomMgr;

        this.sources = this._roomManager.baseRoom.sourcesInRoom;

        // for (let source of this.sources) {
        //     let draw = new RoomVisual(source.room.name);
        //     let roadPath = source.sourceSpawnRoad;
        //     for (let step of roadPath) {
        //         draw.circle(step.x, step.y, {fill: 'green'});
        //     }

        //     let containerPos = source.containerPos;
        //     draw.circle(containerPos, {fill: 'blue'});
        // }
    }

    spawnNeededHarvesters(): Boolean {
        for (let source of this.sources) {

            let harvesters = source.harvesters;
            let transporters = source.transporters;
            let body: string[];
            if (harvesters.length == 0 && transporters.length == 0) {
                // starting over from scratch
                body = this._roomManager.baseRoomSpawn.createWorkerBody(1, 2, 2, [CARRY, MOVE, WORK], false);
            }
            else if (harvesters.length == 0 && transporters.length == 1) {
                body = this._roomManager.baseRoomSpawn.createWorkerBody(5, 1, 6, [WORK, MOVE, CARRY], false);
            }
            else {
                body = this._roomManager.baseRoomSpawn.createWorkerBody(5, 1, 6, [WORK, MOVE, CARRY], true)
            }

            let prespawnNeeded = this.checkHarvesterPrespawn(source, body);

            // Spawn if prespawn needed, not enough work parts
            if (prespawnNeeded != undefined || source.harvesterWorkCount < 5 && source.harvesters.length < source.freeSpaceCount) {
                this._roomManager.baseRoomSpawn.spawnHarvester(body, source);
                return true;
            }
        }
        return false;
    }

    spawnNeededTransporters(): Boolean {
        for (let source of this.sources) {
            // Only spawn transporters if we have
            if (source.harvesters.length > 0 && source.transporters.length < 5) {

                // We have max harvesters, but no transporters. Spawn one no matter what
                if (source.harvesterWorkCount >= 5 && source.transporters.length == 0) {
                    this._roomManager.baseRoomSpawn.spawnTransporter(source);
                    return true;
                }

                let body: string[];
                if (source.transporters.length == 0) {
                    body = this._roomManager.baseRoomSpawn.createBalancedBody([CARRY, MOVE], 6, false);
                }
                else {
                    body = this._roomManager.baseRoomSpawn.createBalancedBody([CARRY, MOVE], 6, true);
                }
                let newCreepCarryCapacity: number = 0;
                for (let part of body) {
                    if (part == CARRY) {
                        newCreepCarryCapacity += 50;
                    }
                }

                let sourceContainer = this._roomManager.stashMgr.getContainerForSource(source);
                let leftoverDroppedEnergy = this.getLeftoverDroppedEnergyForSource(source);
                let leftoverContainerEnergy = this.getLeftoverEnergyForContainer(sourceContainer);
                // console.log('Leftover Container Energy: ' + leftoverContainerEnergy + ' - ' + source.pos);
                // console.log('Leftover Dropped Energy: ' + leftoverDroppedEnergy);
                // console.log('Leftover Container Energy: ' + leftoverContainerEnergy);
                let totalLeftoverEnergy = (leftoverDroppedEnergy + leftoverContainerEnergy) - CreepMgr.bodyCost(body);
                if (totalLeftoverEnergy >= newCreepCarryCapacity) {
                    console.log('Leftover Source Energy: ' + totalLeftoverEnergy);
                    this._roomManager.baseRoomSpawn.spawnTransporter(source);
                    return true;
                }
            }
        }
        return false;
    }

    checkHarvesterPrespawn(source: Source, body: string[]): Creep {
        for (let creep of source.harvesters) {
            if (creep.memory.TicksFromSpawnToSource != undefined && creep.partCount(WORK) >= 2) {

                // Time it will take for creep to spawn and reach source
                let ticksToSpawnBody = body.length * 3;
                let ticksToSource = creep.memory.TicksFromSpawnToSource + ticksToSpawnBody + 5; // test buffer

                // Time creep will die
                let creepDeathTme = Game.time + creep.ticksToLive;

                // The time the creep will die - how long it would take a new creep there to replace it
                let preSpawnTime = creepDeathTme - ticksToSource;

                if (creep.ticksToLive == ticksToSource) {

                    console.log('Presepawn Needed');
                    console.log('ticksToSource: ' + ticksToSource);
                    console.log('creepTTL: ' + creep.ticksToLive);
                    console.log('creepDeathTime: ' + creepDeathTme);
                    console.log('preSpawnTim: ' + preSpawnTime);

                    if (this._roomManager.baseRoomSpawn.spawnCreep(body, 'test', {dryRun: true}) != OK) {
                        // spawn is busy, delay prespawn until it is finished
                        creep.memory.TicksFromSpawnToSource += 1;
                        return undefined;
                    }
                    return creep;
                }
            }
        }

        return undefined;
    }

    getSourceByID(sourceID: string): Source {
        let targetSource: Source = null;
        this.sources.forEach(source => {
            if (source.id == sourceID) {
                targetSource = source;
                return;
            }
        });
        return targetSource;
    }

    getLeftoverEnergyForContainer(container: Container) {

        let leftOverEnergy: number = 0;
        if (container != undefined) {
            // See how much energy is left over after counting for all transporters that need energy for this source
            // Get all of the transporters for this source/container
            let containerTransporters: Creep[] = container.transportersForContainer(this._roomManager.transporters, this._roomManager.stashMgr.sourceContainers)
            // Keep only the transporters that are currently collecting from this container
            containerTransporters.filter(transporter => {
                return transporter.memory.CollectionTargetID == container.id;
            })

            let currentlyCollectingCapacity: number = 0;
            for (let transporter of containerTransporters) {
                currentlyCollectingCapacity += transporter.carryCapacity;
            }
            //console.log('Collecting Capacity: ' + currentlyCollectingCapacity);

            leftOverEnergy = container.store[RESOURCE_ENERGY] - currentlyCollectingCapacity;
            //console.log('Leftover Energy: ' + leftOverEnergy);
        }
        return leftOverEnergy;
    }

    getLeftoverDroppedEnergyForSource(source: Source) {
        let leftOverEnergy: number = 0;
        let droppedEnergyForSource: number = source.droppedEnergy;
        if (droppedEnergyForSource > 0) {
            // See how much energy is left over after counting for all transporters that need energy for this source
            // Get all of the transporters for this source/container
            let sourceTransporters: Creep[] = this._roomManager.transporters.filter(transporter => {
                return transporter.memory.TargetSourceID == source.id;
            })
            // Keep only the transporters that are currently collecting (looking for energy)
            sourceTransporters = sourceTransporters.filter(transporter => {
                return transporter.memory.CollectionTargetID == CreepStatus.Collecting;
            })

            let currentlyCollectingCapacity: number = 0;
            for (let transporter of sourceTransporters) {
                currentlyCollectingCapacity += transporter.carryCapacity;
            }

            leftOverEnergy = droppedEnergyForSource- currentlyCollectingCapacity;
            // console.log('Body Generated: ' + body.toString());
            // console.log('Collecting Capacity: ' + currentlyCollectingCapacity);
            // console.log('New creep could hold: ' + newCreepCarryCapacity);
            // console.log('Total Dropped Energy: ' + droppedEnergyForSource);
            // console.log('Leftover Energy: ' + leftOverEnergy);
        }
        return leftOverEnergy;
    }
}
