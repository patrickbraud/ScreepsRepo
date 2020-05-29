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

    taskCheckIn() {

        this.task = this.creep.memory.task;
        if (!this.task) return;

        this.requestId = this.task.requestId;
        this.request = this.colony.requestManager.getRequest(RequestType.Transport, this.requestId)
        if (!this.request) {
            this.creep.memory.task = undefined;
            this.task = undefined;
            return;
        }

        this.target = Game.getObjectById(this.task.requestId);
        console.log("Target: " + this.target);
        if (!this.target) {

            this.creep.memory.task = undefined;
            this.task = undefined;
            return;
        } 

        this.path = this.creep.room.findPath(this.creep.pos, this.target.pos);
        this.creep.memory.task.ticksToCompletion = this.path.length;
        this.creep.memory.task.finishLocation = {x: this.target.pos.x, y: this.target.pos.y, roomName: this.target.pos.roomName};

        if (this.request.amount > 0)
            this.request.amount -= this.creep.store.getUsedCapacity(this.request.resourceType);
        else 
            this.request.amount += this.creep.store.getFreeCapacity(this.request.resourceType);
    }

    getTask() {

        if (!this.task) {
            this.creep.memory.task = this.colony.logistics.getTask(this);
            this.task = this.creep.memory.task;
        }
    }

    work() {

        if (!this.target) return;

        let result;
        if (this.request.amount > 0){

            result = this.creep.transfer(this.target, this.request.resourceType);
            // if (result == ERR_FULL) result = this.creep.transfer(this.target, this.request.resourceType);
        } 
        else {
            
            result = this.creep.withdraw(this.target, this.request.resourceType);
            if (result == ERR_INVALID_TARGET) result = this.creep.pickup(this.target);
        }

        console.log("ActionResult: " + result);

        if (result == ERR_NOT_IN_RANGE) {

            // Move to one of the open spaces
            let moveResult = this.creep.moveTo(this.target, {ignoreCreeps: false, reusePath: 10})
            console.log("MoveResult: " + moveResult);
        }

        if ((this.request.amount > 0 && this.creep.store.getUsedCapacity(this.request.resourceType) == 0) ||
            (this.request.amount < 0 && this.creep.store.getFreeCapacity(this.request.resourceType) == 0)) {

            this.creep.memory.task = undefined;
        }
    }
}