import { Colony } from "./Colony";

export class Logistics {

    colony: Colony;

    idleWorkers: Creep[];

    constructor(colony: Colony) {

        this.colony = colony;
    }

    initialize() {

        // This has to be done after workerCheckIn
        this.idleWorkers = this.colony.creeps.filter(creep => creep.memory.jobId == undefined);
    }

    handleEnergyRequirements(energyRequired: any[], energyAvailable: any[]) {

        
    }
}