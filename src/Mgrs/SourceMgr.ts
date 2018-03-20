import { RoomMgr } from "./RoomMgr";
import { Screep } from "Creeps/Screep";
import { CreepStatus } from "Enums/CreepEnums";

export class SourceMgr {

    private _roomManager: RoomMgr;

    public sources: Source[];

    constructor(roomMgr: RoomMgr) {
        this._roomManager = roomMgr;

        // Later, return sources in other rooms around our base as well
        this.sources = this._roomManager.baseRoom.sourcesInRoom;
    }

    spawnNeededHarvesters(): Boolean {
        for (let source of this.sources) {
            if (source.harvesterWorkCount < 5 && source.harvesterCount < source.maxCreepCount) {
                // let neededWorkParts = 5 - source.harvesterWorkCount;
                this._roomManager.baseRoomSpawn.spawnHarvester(source);
                return true;
            }
        }
        return false;
    }

    spawnNeededTransporters(): Boolean {
        for (let source of this.sources) {
            // Only spawn transporters if we have
            if (source.harvesterCount > 0) {

                let body: string[];
                if (source.transporterCount <= 1) {
                    body = this._roomManager.baseRoomSpawn.createBalancedBody([CARRY, MOVE], false);
                }
                else {
                    body = this._roomManager.baseRoomSpawn.createBalancedBody([CARRY, MOVE], true);
                }
                let newCreepCarryCapacity: number = 0;
                for (let part of body) {
                    if (part == CARRY) {
                        newCreepCarryCapacity += 50;
                    }
                }

                let sourceContainer = this._roomManager.StashMgr.getContainerForSource(source);
                let leftoverDroppedEnergy = this.getLeftoverDroppedEnergyForSource(source);
                let leftoverContainerEnergy = this.getLeftoverEnergyForContainer(sourceContainer);
                // console.log('Leftover Dropped Energy: ' + leftoverDroppedEnergy);
                // console.log('Leftover Container Energy: ' + leftoverContainerEnergy);
                let totalLeftoverEnergy = leftoverDroppedEnergy + leftoverContainerEnergy;
                if (totalLeftoverEnergy >= newCreepCarryCapacity) {
                    console.log('Leftover Source Energy: ' + totalLeftoverEnergy);
                    this._roomManager.baseRoomSpawn.spawnTransporter(source);
                    return true;
                }
            }
        }
        return false;
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

    getBestSource(screep: Screep): Source {
        // Get all of the sources in the same room as the creep
        let sourcesInRoom = this.sources.filter( src => src.room.name == screep.creep.room.name );
        // console.log('Sources in Room');
        // console.log(sourcesInRoom);

        // Keep only the sources that have less creeps targeting them than the source has valid spaces to harvest from
        let openSources: Source[] = sourcesInRoom.filter( src => src.creepsTargeting.length < src.maxCreepCount );
        // console.log('Open Sources');
        // console.log(openSources);

        // Order the sources by linear distance to the creep
        let orderedSources: Source[] = openSources.sort(function (a, b) {return screep.distanceTo(a.pos) - screep.distanceTo(b.pos); });
        // console.log('Ordered Sources');
        // console.log(orderedSources);

        return orderedSources[0];
    }

    getLeftoverEnergyForContainer(container: Container) {

        let leftOverEnergy: number = 0;
        if (container != undefined) {
            // See how much energy is left over after counting for all transporters that need energy for this source
            // Get all of the transporters for this source/container
            let containerTransporters: Creep[] = container.transportersForContainer(this._roomManager.transporters, this._roomManager.StashMgr.sourceContainers)
            // Keep only the transporters that are currently collecting (looking for energy)
            containerTransporters.filter(transporter => {
                return transporter.memory.Status == CreepStatus.Collecting;
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
                return transporter.memory.Status == CreepStatus.Collecting;
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
