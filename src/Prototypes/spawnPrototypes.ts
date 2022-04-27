import { RequestType } from "../Enums/RequestType";

export function spawnPrototypes() {

    // Object.defineProperty(Spawn.prototype, 'memory', {
    //     configurable: true,
    //     get: function() {
    //         if(_.isUndefined(Memory.SpawnMemory)) {
    //             Memory.SpawnMemory = {};
    //         }
    //         if(!_.isObject(Memory.SpawnMemory)) {
    //             return undefined;
    //         }
    //         return Memory.SpawnMemory[this.id] =
    //                 Memory.SpawnMemory[this.id] || {};
    //     },
    //     set: function(value) {
    //         if(_.isUndefined(Memory.SpawnMemory)) {
    //             Memory.SpawnMemory = {};
    //         }
    //         if(!_.isObject(Memory.SpawnMemory)) {
    //             throw new Error('Could not set spawn memory');
    //         }
    //         Memory.SpawnMemory[this.id] = value;
    //     }
    // });

    StructureSpawn.prototype.updateRequest = function(existingRequest: any | undefined) : any | undefined {

        let missingEnergy = this.store.getFreeCapacity(RESOURCE_ENERGY);

        let newRequest = {
            requestId: this.id,
            requestType: RequestType.Transport,
            identifier: Math.floor(Math.random() * 100000000),
            // The amount of resources available
            resourceType: RESOURCE_ENERGY,
            amount: missingEnergy,
            previousAmount: 0,
            location: {x: this.pos.x, y: this.pos.y, roomName: this.pos.roomName},
            // The amount of resources added per tick
            delta: -1,
            deltaHistory: [0]
        }

        if (missingEnergy == 0) return undefined;
        if (!existingRequest) return newRequest;

        // Update the data for this request
        existingRequest.previousAmount = existingRequest.amount;
        existingRequest.amount = missingEnergy;

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

        console.log("Spawn: \t\t" + existingRequest.requestId + "\t- Amount: " + existingRequest.amount + "\t\t- Delta: " + existingRequest.delta.toPrecision(2));

        return existingRequest;
    }

    Object.defineProperty(Spawn.prototype, 'energyDump', {
        get: function (): RoomPosition {
            if (!this._energyDump) {
                // Memory undefined
                // if (!this.memory.energyDump) {

                //     this.memory.energyDump = new RoomPosition(this.pos.x, this.pos.y - 2, this.room.name);
                // }
                // this._energyDump = this.memory.energyDump;
                this._energyDump = new RoomPosition(this.pos.x, this.pos.y - 2, this.room.name);
            }
            return this._energyDump;
        },
        enumerable: false,
        configurable: true
    });

    StructureSpawn.prototype.createHarvestBody = function(): BodyPartConstant[] {

        if (this.energyCapacity == 300) return [WORK, WORK, MOVE, MOVE]

        let body: BodyPartConstant[] = []
        for (let workCount = 0; workCount < 5; workCount++) {
            body.push(WORK);
        }

        for (let carryCount = 0; carryCount < 1; carryCount++) {
            body.push(CARRY);
        }

        for (let moveCount = 0; moveCount < 6; moveCount++) {
            body.push(MOVE);
        }

        let energyRequired = (BODYPART_COST.work * 5)
                             + (BODYPART_COST.carry * 1)
                             + (BODYPART_COST.move * 6);

        let workCount = 5;
        let moveCount = 6;

        // console.log(body);
        // console.log("energyRequired: " + energyRequired)
        // console.log("energyCapacityAvailable: " + this.energyCapacity)

        while (energyRequired > this.energyCapacity)
        {
            // console.log(body);
            // console.log("energyRequired: " + energyRequired)
            // console.log("energyCapacityAvailable: " + this.energyCapacity)

            let removePart!: BodyPartConstant;

            if (moveCount > 1)      { removePart = MOVE; moveCount--; }
            else if (workCount > 4) { removePart = WORK; workCount--; }

            let index: number = body.indexOf(removePart, 0)
            if (index > -1) {

                body = body.splice(index, 1);
                energyRequired -= BODYPART_COST[removePart];
            }
        }

        return body;
    }

    StructureSpawn.prototype.createTransportBody = function(amount: number): BodyPartConstant[] {

        if (this.energyCapacity == 300) return [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE]

        return [];
    }

    StructureSpawn.prototype.generateCreepName = function(role: string, colonyId: string): string {
        let creepName = "";
        let nameExists = false;
        do {
            creepName = role + '_' + colonyId + '_' + Math.floor(Math.random() * 1000);
            nameExists = Game.creeps.hasOwnProperty(creepName);
        }
        while (nameExists);

        return creepName;
    }
}
