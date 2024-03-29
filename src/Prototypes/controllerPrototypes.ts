import { RequestType } from "../Enums/RequestType";

export function controllerPrototypes() {
    StructureController.prototype.updateUpgradeRequest = function(existingRequest: any) : any | undefined {

        let amountPerTick = 15
        if (this.level == 1) amountPerTick = 10;

        if (!existingRequest) {
            
            let requestLocation: RoomPosition = this.pos
            let newRequest = {
                requestId: this.id,
                requestType: RequestType.Upgrade,
                identifier: Math.floor(Math.random() * 100000000),
                // The amount of resources available
                resourceType: RESOURCE_ENERGY,
                amount: amountPerTick,
                previousAmount: 0,
                location: requestLocation,
                // The amount of resources added per tick
                delta: 0,
                deltaHistory: [0]
            }

            return newRequest;
        }

        existingRequest.amount = amountPerTick;

        console.log("Controller Upgrade: \t\t- Amount: " + existingRequest.amount + "\t\t- Delta: " + existingRequest.delta.toPrecision(2));

        return existingRequest;
    }

    StructureController.prototype.updateEnergyRequest = function(existingRequest: any | undefined, mainSpawn: StructureSpawn) : any | undefined {

        if (!existingRequest) {
            
            let requestLocation: RoomPosition = this.getEnergyDump(mainSpawn);
            let newRequest = {
                requestId: this.id,
                requestType: RequestType.Transport,
                identifier: Math.floor(Math.random() * 100000000),
                // The amount of resources available
                resourceType: RESOURCE_ENERGY,
                amount: 2,
                previousAmount: 0,
                existing: 0,
                previousExisting: 0,
                location: requestLocation,
                // The amount of resources added per tick
                delta: 0,
                deltaHistory: [0]
            }

            return newRequest;
        }

        if (!existingRequest.existing) existingRequest.existing = 0;

        existingRequest.previousExisting = existingRequest.existing;
        
        const found = this.room.lookForAt(LOOK_ENERGY, existingRequest.location.x, existingRequest.location.y);
        if(found.length) {
            existingRequest.existing = found[0].amount;
        }

        // Update the data for this request
        // existingRequest.previousAmount = existingRequest.amount;
        // existingRequest.amount -= (existingRequest.existing - existingRequest.previousExisting);
        existingRequest.amount += 1;

        // existingRequest.amount = Math.max(0, existingRequest.amount);
        // if (existingRequest.amount == 0) return undefined;

        let deltaThisTick = existingRequest.amount - existingRequest.previousAmount;
        // let deltaThisTick = existingRequest.existing - existingRequest.previousExisting;

        // Create a new average for this tick
        let delta = deltaThisTick;
        if (existingRequest.deltaHistory.length > 0) {
            existingRequest.deltaHistory.forEach((average: number) => {
                delta += average;
            });
            delta /= existingRequest.deltaHistory.length;
        }

        // Keep a record of the last 100 incomes (oldest -> newest)
        if (existingRequest.deltaHistory.length == 100) {
            existingRequest.deltaHistory.shift();
        }

        existingRequest.delta = delta;
        existingRequest.deltaHistory.push(deltaThisTick);

        // existingRequest.amount = Math.max(2000 - existingRequest.existing, 0); // always request whatever you need to get 2000
        existingRequest.amount = Math.max(0, Math.min(2000, Math.abs(existingRequest.amount - delta))); // tricklup to to 2000, subtracking what you have

        console.log("Controller Dump: \t\t- Amount: " + existingRequest.amount.toPrecision(4) + "\t\t- Delta: " + existingRequest.delta.toPrecision(2));

        return existingRequest;
    }

    StructureController.prototype.getEnergyDump = function(spawn: StructureSpawn) : RoomPosition {

        let path = this.room.findPath(spawn.pos, this.pos, {ignoreCreeps: true})

        let dumpPos = path[path.length - 5];

        let dumpRoomPosition = new RoomPosition(dumpPos.x, dumpPos.y, this.room.name);

        // this.room.visual.circle(dumpRoomPosition, {stroke: 'yellow'})

        return dumpRoomPosition
    }      

    StructureController.prototype.createUpgradeBody = function(): BodyPartConstant[] {

        // if (this.room.energyCapacityAvailable == 300) return [MOVE, CARRY, WORK, WORK];

        // return [];
        return [MOVE, CARRY, WORK, WORK];
    }

    // StructureController.prototype.generateCreepName = function(role: string, colonyId: string): string {
    //     let creepName = "";
    //     let nameExists = false;
    //     do {
    //         creepName = role + '_' + colonyId + '_' + Math.floor(Math.random() * 1000);
    //         nameExists = Game.creeps.hasOwnProperty(creepName);
    //     }
    //     while (nameExists);

    //     return creepName;
    // }
}
