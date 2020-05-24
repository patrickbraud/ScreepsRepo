import { JobType } from "../Enums/JobType";
import { JobStatus } from "../Enums/JobStatus";

export function resourcePrototypes() {

    Object.defineProperty(Resource.prototype, 'memory', {
        configurable: true,
        get: function() {
            if(_.isUndefined(Memory.ResourceMemory)) {
                Memory.ResourceMemory = {};
            }
            if(!_.isObject(Memory.ResourceMemory)) {
                return undefined;
            }
            return Memory.ResourceMemory[this.id] =
                    Memory.ResourceMemory[this.id] || {};
        },
        set: function(value) {
            if(_.isUndefined(Memory.ResourceMemory)) {
                Memory.ResourceMemory = {};
            }
            if(!_.isObject(Memory.ResourceMemory)) {
                throw new Error('Could not set resource memory');
            }
            Memory.ResourceMemory[this.id] = value;
        }
    });

    // There should only ever be one job listed to pick up energy from a location
    // Every tick, the listing will be updated with how much energy is available
    //
    // Deposit jobs will claim energy from this listing and update it  for other deposit jobs
    //
    Resource.prototype.updateDroppedEnergyJob = function(existingJob: any | undefined) : any | undefined{

        let newJob = {
            jobId: this.id,
            jobType: JobType.DroppedEnergy,
            identifier: Math.floor(Math.random() * 100000000),
            // The amount of resources available
            amount: this.amount,
            previousAmount: 0,
            // The amount of resources added per tick
            averageIncomePerTick: 0,
            incomeHistory: [0],
            status: JobStatus.Open
        }

        if (!existingJob) return newJob;

        // Update the average income data for this resource job
        existingJob.previousAmount = existingJob.amount;
        existingJob.amount = this.amount;

        let incomeThisTick = existingJob.amount - existingJob.previousAmount;

        // Create a new moving average for this tick
        let updatedAverage = incomeThisTick;
        if (existingJob.incomeHistory.length > 0) {
            existingJob.incomeHistory.forEach((average: number) => {
                updatedAverage += average;
            });
            updatedAverage /= existingJob.incomeHistory.length;
        }

        // Keep a record of the last 100 incomes (oldest -> newest)
        if (existingJob.incomeHistory.length == 100) {
            existingJob.incomeHistory.shift();
        }

        existingJob.averageIncomePerTick = updatedAverage;
        existingJob.incomeHistory.push(incomeThisTick);

        console.log("DroppedEnergy: \t" + this.id + "\t- Amount: " + this.amount + "\t\t- Delta: " + incomeThisTick + "\t\t- AvgInc/Tick: " + updatedAverage.toPrecision(2));

        return undefined;
    }
}
