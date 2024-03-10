import { Screep } from "./Screep";
import { Colony } from "../Colony";
import { CreepType } from "../Enums/CreepType";
import { RequestType } from "../Enums/RequestType";

export class Harvester extends Screep {

    colony: Colony;

    creep: Creep;
    creepType: CreepType;

    requestId: string;
    request: any;

    task: any;
    // taskId: number;

    targetSource: Source;

    path: PathStep[];

    constructor(creep: Creep, colony: Colony) {
        super(creep, colony);

        this.colony = colony;

        this.creep = creep;
        this.creepType = creep.memory.creepType;

        // this.taskId = creep.memory.taskId;
    }

    taskCheckIn() {

        this.requestId = this.creep.memory.requestId;
        this.request = this.colony.requestManager.getRequest(RequestType.Harvest, this.requestId)

        if (!this.request) console.log("Harvester w/o request. Something Wrong");

        this.request.workRequired -= this.creep.getActiveBodyparts(WORK);
        if (this.request.workRequred < 0) this.request.workRequired = 0;

        this.targetSource = Game.getObjectById(this.requestId) as Source;
    }

    work() {

        // Harvest from our designated source
        if (this.targetSource == undefined) return;
        
        this.harvest(this.targetSource);
    }

    harvest(source: Source) {

        let harvestResult = this.creep.harvest(source);
        if (harvestResult == ERR_NOT_IN_RANGE) {

            // Move to one of the open spaces
            this.creep.moveTo(source, {ignoreCreeps: false, reusePath: 10})
        }
    }
}
