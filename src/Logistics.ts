import { Colony } from "./Colony";
import { JobType } from "./Enums/JobType";
import { RoomUtils } from "./RoomUtils";

export class Logistics {

    colony: Colony;

    idleWorkers: Creep[];

    transporters: Creep[];

    constructor(colony: Colony) {

        this.colony = colony;
    }

    initialize() {

        // This has to be done after workerCheckIn
        this.idleWorkers = this.colony.creeps.filter(creep => creep.memory.jobId == undefined);
        this.transporters = this.colony.creeps.filter(creep => creep.memory.jobTitle == JobType.Transport);
    }

    handleEnergyTransport(transporter: Creep) {

        
    }

    // Assign a job to a transporter who will have the highest avialable energy
    // by the time they are able to perform our request
    //
    // Job
    // [Request: 100, Location: {x, y}]
    //
    // Trasporter job list
    // [carry: 600, requestAmount: 300, requestDelta: 1, finishTick: 1000, finishLocation: {x, y}]
    // [carry: 300, requestAmount: 100, requestDelta: 1, finishTick: 2000, finishLocation: {x, y}]
    // [carry: 0, refill?]
    //
    // getTickAvailable(transporter) - the tick the transporter will be available
    // getPredictedCarry(transporter) - the predicted amount the transporter will have when it is next available

    // Transporters
    // - Update all tasks information on load AFTER job checks

    getTickAvailable(transporter: Creep): number {

        if (!transporter.memory.tasks) return Game.time;

        let taskCount = transporter.memory.tasks.length;
        if (taskCount == 0) return Game.time;

        return transporter.memory.tasks[taskCount].finishTick;
    }

    // The predicted amount of available resource when the request can be satisfied
    getPredictedCarry(transporter: Creep): number {

        let predictedCarry = transporter.store.getCapacity();

        let location = transporter.pos;

        transporter.memory.taskList.forEach(task => {
            
            // The number of ticks away 
            let distance = RoomUtils.distanceTo(location, task.finishLocation);
            // let distance = task.path.length;

            // The amount needed by the time we get there
            predictedCarry -= (task.request + (task.requestDelta * distance));

            // Update the location for the next task distance calc
            location = task.finishLocation;

            if (predictedCarry <= 0) return 0;
        });

        return predictedCarry;
    }

}