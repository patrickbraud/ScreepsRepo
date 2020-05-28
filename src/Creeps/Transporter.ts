import { Colony } from "../Colony";
import { CreepType } from "../Enums/CreepType";
import { RequestType } from "../Enums/RequestType";

export class Transporter {

    colony: Colony;

    creep: Creep;
    creepType: CreepType;

    requestId: string;
    request: any;

    task: any;
    taskId: number;

    target: any;

    path: PathStep[];
    
    constructor(creep: Creep, colony: Colony) {

        this.colony = colony;

        this.creep = creep;
        this.creepType = creep.memory.creepType;

        this.taskId = creep.memory.taskId;
    }

    getTask() {

        this.task = this.creep.memory.task;
        if (!this.task) {
            this.creep.memory.task = this.colony.logistics.getTask(this);
            this.task = this.creep.memory.task;
        }
    }

    taskCheckIn() {

        this.requestId = this.task.requestId;
        this.request = this.colony.requestManager.getRequest(RequestType.Transport, this.requestId)

        this.target = Game.getObjectById(this.task.requestId);
        if (this.target!) return;

        this.path = this.creep.room.findPath(this.creep.pos, this.target.pos);
        this.task.ticksToCompletion = this.path.length;
        this.task.finishLocation = this.target.pos;

        if (this.request.amount > 0)
            this.request.amount = Math.max(this.request.amount - this.creep.store.getUsedCapacity(), 0);
        else 
            this.request.amount = Math.min(this.request.amount + this.creep.store.getFreeCapacity(), 0);
    }

    work() {

        if (!this.target) return;

        let result;
        if (this.request.amount > 0) result = this.creep.transfer(this.target, this.request.resourceType, this.creep.store.getUsedCapacity());
        else result = this.target.transfer(this.creep, this.creep.store.getFreeCapacity());

        if (result == ERR_NOT_IN_RANGE) {

            // Move to one of the open spaces
            this.creep.moveTo(this.target, {ignoreCreeps: false, reusePath: 10})
        }
    }
}