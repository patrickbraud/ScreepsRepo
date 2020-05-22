import { Screep } from "./Screep";
import { Colony } from "../Colony";

export class Harvester extends Screep {

    jobIdentifier: number;
    jobId: string;
    jobTitle: string;

    currentJob: {identifier: number, jobTitle: string, body: number[], status: string} | undefined;

    creep: Creep;
    colony: Colony;

    constructor(creep: Creep, colony: Colony) {
        super(creep, colony);

        this.creep = creep;
        this.colony = colony;

        this.jobId = creep.memory.jobId;
        this.jobIdentifier = creep.memory.identifier;
    }

    work(colony: Colony) {

        // Harvest from our designated source
        let targetSource = colony.getSourceByID(this.jobId);
        if (targetSource == undefined) return;
        
        this.harvest(targetSource);


        
        if (this.creep.ticksToLive == 1) {
            this.creep.say("Dying");
            this.colony.jobBoard.removeJob(this.jobId, this.jobIdentifier);
        }
    }

    repairContainerIfNeeded(container: StructureContainer): Boolean {
        if (container.hits < container.hitsMax) {
            this.creep.say('🔨repair')
            this.repairContainer(container);
            return true;
        }
        return false
    }

    repairContainer(container: StructureContainer) {
        let repairResult = this.creep.repair(container);
        if (repairResult == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(container);
        }
    }

    harvest(source: Source) {

        let harvestResult = this.creep.harvest(source);
        if (harvestResult == ERR_NOT_IN_RANGE) {

            // Move to one of the open spaces
            this.creep.moveTo(source, {ignoreCreeps: false, reusePath: 10})
        }
    }

    depositIntoStructure(target: Structure) {

        let transferResult = this.creep.transfer(target, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
            //super.moveTo(target, this.pathColor);
            this.creep.moveTo(target, {ignoreCreeps: false, reusePath: 10})
        }
    }
}
