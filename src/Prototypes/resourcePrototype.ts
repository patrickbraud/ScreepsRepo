import { RequestType as RequestType } from "../Enums/RequestType";

export function resourcePrototypes() {

    // Object.defineProperty(Resource.prototype, 'memory', {
    //     configurable: true,
    //     get: function() {
    //         if(_.isUndefined(Memory.ResourceMemory)) {
    //             Memory.ResourceMemory = {};
    //         }
    //         if(!_.isObject(Memory.ResourceMemory)) {
    //             return undefined;
    //         }
    //         return Memory.ResourceMemory[this.id] =
    //                 Memory.ResourceMemory[this.id] || {};
    //     },
    //     set: function(value) {
    //         if(_.isUndefined(Memory.ResourceMemory)) {
    //             Memory.ResourceMemory = {};
    //         }
    //         if(!_.isObject(Memory.ResourceMemory)) {
    //             throw new Error('Could not set resource memory');
    //         }
    //         Memory.ResourceMemory[this.id] = value;
    //     }
    // });

    // There should only ever be one request listed to pick up energy from a location
    // Every tick, the listing will be updated with how much energy is available
    Resource.prototype.updateRequest = function(existingRequest: any | undefined, ignoreLocations: RoomPosition[]) : any | undefined{

        let thisPos = new RoomPosition(this.pos.x, this.pos.y, this.pos.roomName);

        let ignoreLocationMatches = _.filter(ignoreLocations, ignoreLocation => {
            let pos = new RoomPosition(ignoreLocation.x, ignoreLocation.y, ignoreLocation.roomName);
            return thisPos.isEqualTo(pos);
        });
        if (ignoreLocationMatches.length > 0) return undefined;

        let newRequest = {
            requestId: this.id,
            requestType: RequestType.Transport,
            identifier: Math.floor(Math.random() * 100000000),
            // The amount of resources available
            amount: -1 * this.amount,
            previousAmount: 0,
            resourceType: this.resourceType,
            location: {x: this.pos.x, y: this.pos.y, roomName: this.pos.roomName},
            // The amount of resources added per tick
            delta: 0,
            deltaHistory: [0]
        }

        if (!existingRequest) return newRequest;

        // Update the average income data for this resource request
        existingRequest.previousAmount = existingRequest.amount;
        existingRequest.amount = -1 * this.amount;

        let deltaThisTick = existingRequest.amount - existingRequest.previousAmount;

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

        console.log("DroppedEnergy: \t" + existingRequest.requestId + "\t- Amount: " + existingRequest.amount + "\t\t- Delta: " + existingRequest.delta.toPrecision(2));

        return undefined;
    }
}
