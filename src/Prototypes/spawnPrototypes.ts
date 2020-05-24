import { JobStatus } from "../Enums/JobStatus";
import { JobType } from "../Enums/JobType";

export function spawnPrototypes() {

    StructureSpawn.prototype.checkEnergyRequirements = function(currentJob: any | undefined) : any | undefined {

        let missingEnergy = this.store.getFreeCapacity(RESOURCE_ENERGY);

        let newJob = {
            jodId: this.id,
            jobType: JobType.EnergyRequired,
            identifier: Math.floor(Math.random() * 100000000),
            // We include location for distance comparisons
            depositLocation: {x: this.pos.x, y: this.pos.y},
            requiredEnergy: missingEnergy,
            status: JobStatus.Open
        }

        if (!currentJob) return newJob;

        currentJob.requiredEnergy = missingEnergy;

        console.log("Spawn[" + this.name + "]: \t" + this.id + "\t- EnergyRequired: " + missingEnergy);

        return undefined;
    }

    // StructureSpawn.prototype.checkEnergyRequirements = function(currentJobs: any | undefined) : any | undefined {

    //     let missingEnergy = this.store.getFreeCapacity(RESOURCE_ENERGY);
    //     if (missingEnergy == 0) return undefined;

    //     if (currentJobs) {
    //         // Account for all current jobs assigned to get energy for this spawn
    //         currentJobs.forEach(job => {

    //             // If the worker in the spawn queue, then check if the
    //             // job has room to spawn with the ability to deliver more energy
    //             if (job.status == JobStatus.SpawnQueue) {

    //                 let jobBodyCost = JobUtils.jobBodyCost(job.body);
    //                 let roomEnergyCapacity = this.store.getCapacity(RESOURCE_ENERGY)

    //                 while (roomEnergyCapacity - jobBodyCost  >= 100) {

    //                     // It costs 100 energy to spawn the creep with 
    //                     // the ability to deliver 50 more energy
    //                     job.body[1] += 1;
    //                     job.body[2] += 1;
    //                     job.requiredEnergy += 50;

    //                     jobBodyCost += 100;
    //                 }

    //                 missingEnergy -= job.requiredEnergy;
    //             }
    //             else {

    //                 // If the worker is not spawning, then we should
    //                 // know exactly how much it expects to deposit
    //                 missingEnergy -= job.expectedDeposit;
    //             }
    //         });
    //     }

    //     if (missingEnergy > 0) {

    //         // Create a body JUST big enough to hold all of the energy required 
    //         // Matching CARRY to MOVE ratio to ensure constant movement on plain terrain
    //         let carryRequired = Math.ceil(missingEnergy / 50);
    //         let moveRequired = carryRequired;

    //         let body = [0, carryRequired, moveRequired];

    //         let newJob = {
    //             jodId: this.id,
    //             jobType: JobType.EnergyRequired,
    //             identifier: Math.floor(Math.random() * 100000000),
    //             // We include location for distance comparisons
    //             depositLocation: {x: this.pos.x, y: this.pos.y},
    //             requiredEnergy: missingEnergy,
    //             // The minimum body needed to satisfy this request
    //             body: body,
    //             status: JobStatus.Open
    //         }

    //         console.log("Spawn: " + this.name + "- Submitting request for [" + missingEnergy + "] energy.");

    //         return newJob;
    //     }

    //     return undefined;
    // }

    StructureSpawn.prototype.createHarvestBody = function(maxWork: number, maxCarry: number, maxMove: number): BodyPartConstant[] {

        if (this.energyCapacity == 300) return [WORK, WORK, MOVE, MOVE]

        let body: BodyPartConstant[] = []
        for (let workCount = 0; workCount < maxWork; workCount++) {
            body.push(WORK);
        }

        for (let carryCount = 0; carryCount < maxCarry; carryCount++) {
            body.push(CARRY);
        }

        for (let moveCount = 0; moveCount < maxMove; moveCount++) {
            body.push(MOVE);
        }

        let energyRequired = (BODYPART_COST.work * maxWork)
                             + (BODYPART_COST.carry * maxCarry)
                             + (BODYPART_COST.move * maxMove);

        let workCount = maxWork;
        let moveCount = maxMove;

        // console.log(body);
        // console.log("energyRequired: " + energyRequired)
        // console.log("energyCapacityAvailable: " + this.energyCapacity)

        while (energyRequired > this.energyCapacity)
        {
            // console.log(body);
            // console.log("energyRequired: " + energyRequired)
            // console.log("energyCapacityAvailable: " + this.energyCapacity)

            let removePart!: BodyPartConstant;

            if (moveCount > 1) removePart = MOVE;
            else if (workCount > 4) removePart = WORK;

            let index: number = body.indexOf(removePart, 0)
            if (index > -1) {

                body = body.splice(index, 1);
                energyRequired -= BODYPART_COST[removePart];
            }
        }

        return body;
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
