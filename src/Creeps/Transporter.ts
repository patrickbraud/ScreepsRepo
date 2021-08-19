import { Console } from "console";
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

    target: any;

    path: PathStep[];
    
    constructor(creep: Creep, colony: Colony) {

        this.colony = colony;

        this.creep = creep;
        this.creepType = creep.memory.creepType;

        this.task = this.creep.memory.task;
    }

    taskCheckIn() {
        if (!this.task) {
            console.log("Creep: " + this.creep.id + "\t - No task assigned");
            return;
        };

        this.requestId = this.task.requestId;
        this.request = this.colony.requestManager.getRequest(RequestType.Transport, this.requestId)
        if (!this.request) {
            console.log("Creep: " + this.creep.id + "\t - Request no longer exists: " + this.requestId);
            this.creep.memory.task = undefined;
            this.task = undefined;
            return;
        }

        this.target = Game.getObjectById(this.task.requestId);
        if (!this.target) {
            console.log("Creep: " + this.creep.id + "\t - Target no longer exists: " + this.task.requestId + " : " + JSON.stringify(this.target));
            this.creep.memory.task = undefined;
            this.task = undefined;
            return;
        } 

        // this.path = this.creep.room.findPath(this.creep.pos, this.target.pos);
        // this.task.ticksToCompletion = this.path.length;
        // this.task.finishLocation = {x: this.target.pos.x, y: this.target.pos.y, roomName: this.target.pos.roomName};

        // if (this.request.amount > 0)
        //     this.request.amount -= this.creep.store.getUsedCapacity(this.request.resourceType);
        // else 
        //     this.request.amount += this.creep.store.getFreeCapacity(this.request.resourceType);
    }

    getTask() {

        if (!this.task) {
            let newTask = this.colony.logistics.getTask(this);
            if (!newTask) return;

            this.creep.memory.task = newTask
            this.task = this.creep.memory.task;
            this.taskCheckIn();
        }
    }

    work() {

        if (!this.target) {
            console.log(this.creep.id + " - No Target");
            return;
        } 

        let result;
        if (!this.request) {
             console.log(this.creep.id + " - I have a target but my request is undefined");
             return;
        }

        console.log("transporter: \t" + this.creep.id + " \t- Task Amount: " + 
        this.request.amount + " \t- Storage: " + this.creep.store.getUsedCapacity(RESOURCE_ENERGY ) + " / " +  this.creep.store.getCapacity(RESOURCE_ENERGY));

        let amountBeforeAction = this.creep.store.getUsedCapacity(this.request.resourceType);
        console.log("Before Action: " + this.creep.store.getUsedCapacity(this.request.resourceType) + " / " +  this.creep.store.getCapacity(this.request.resourceType))
        if (this.request.amount >= 0){
            
            result = this.creep.transfer(this.target, this.request.resourceType);
            // if (result == ERR_FULL) result = this.creep.transfer(this.target, this.request.resourceType);
            // console.log(this.creep.id + " - Transfer Result: " + result);
        } 
        else {
            
            result = this.creep.withdraw(this.target, this.request.resourceType);
            // console.log(this.creep.id + " - Withdraw Result: " + result);
            if (result == ERR_INVALID_TARGET) {
                result = this.creep.pickup(this.target);
                // console.log(this.creep.id + " - Pickup Result: " + result);
            }
        }

        

        if (result == ERR_NOT_IN_RANGE) {

            // Move to one of the open spaces
            let moveResult = this.creep.moveTo(this.target, {ignoreCreeps: false, reusePath: 10})
            // console.log(this.creep.id + " - MoveResult: " + moveResult);
        }

        if ((this.request.amount > 0 && this.creep.store.getUsedCapacity(this.request.resourceType) == 0) ||
            (this.request.amount < 0 && this.creep.store.getFreeCapacity(this.request.resourceType) == 0)) {
            // this.creep.memory.task = undefined;
            this.task = undefined;
            this.getTask();
        }
    }
}