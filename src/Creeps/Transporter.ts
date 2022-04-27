import { Colony } from "../Colony";
import { CreepType } from "../Enums/CreepType";
import { RequestType } from "../Enums/RequestType";
import { RoomUtils } from "../RoomUtils";

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
        // if (this.task == 'staging') return;

        if (!this.task) {
            // console.log("Creep: " + this.creep.id + "\t - No task assigned");
            // this.creep.memory.task = undefined;
            // this.task = undefined;
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
            // console.log("Creep: " + this.creep.id + "\t - Target no longer exists: " + this.task.requestId);
            this.creep.memory.task = undefined;
            this.task = undefined;
            return;
        } 

        this.task.amount = this.request.amount;

        if (this.task.amount == 0){
            this.creep.memory.task = undefined;
            this.task = undefined;
            return;
        }

        if ((this.task.amount > 0 && this.creep.store.getUsedCapacity(this.task.resourceType) <= 0) 
            || (this.task.amount < 0 && this.creep.store.getFreeCapacity(this.task.resourceType) <= 0)) {
            
            this.creep.memory.task = undefined;
            this.task = undefined;
            return;
        }
    }

    getTask() {

        if (!this.task) {
            let newTask = this.colony.logistics.getTask(this);

            this.creep.memory.task = newTask
            this.task = this.creep.memory.task;
            this.taskCheckIn();
        }
    }

    work() {

        if (!this.task) {
            // this.task = 'staging'
            // this.creep.memory.task = 'staging';
            this.moveToStaging("transporter: \t" + this.creep.id + " \t- No Valid Task, Moving to Staging");
            return;
        }

        if (!this.request) {
             this.creep.memory.task = undefined;
             this.task = undefined;
            // this.task = 'staging'
            // this.creep.memory.task = 'staging';
             this.moveToStaging("transporter: \t" + this.creep.id + " \t- Task's Request No Longer Exists, Moving to Staging");
             return;
        }

        if (!this.target) {
            this.creep.memory.task = undefined;
            this.task = undefined;
            // this.task = 'staging'
            // this.creep.memory.task = 'staging';
            this.moveToStaging("transporter: \t" + this.creep.id + " \t- Task Target No Longer Exists, Moving to Staging");
            return;
        }

        console.log("transporter: \t" + this.creep.id + " \t- Task Amount: " + 
        this.request.amount + " \t\t- Storage: " + this.creep.store.getUsedCapacity(RESOURCE_ENERGY ) + " / " +  this.creep.store.getCapacity(RESOURCE_ENERGY) +
        "\t- TTL: " + this.creep.ticksToLive);

        let result;
        if (this.request.amount >= 0){
            
            if (this.target.id == this.colony.controller.id){
                // console.log('target is a controller')
                let controllerDumpLocation: RoomPosition = new RoomPosition(this.request.location.x, this.request.location.y, this.request.location.roomName);
                // this.creep.room.visual.circle(controllerDumpLocation, {stroke: 'green'})
                if (this.creep.pos.isEqualTo(controllerDumpLocation)) {
                    // console.log('dropping for controller')
                    // result = this.creep.drop(RESOURCE_ENERGY, Math.min(this.request.amount as number, this.creep.store.getUsedCapacity(RESOURCE_ENERGY)));
                    result = this.creep.drop(RESOURCE_ENERGY);
                    // console.log('failed drop : ' + result);
                }
                else {
                    // this.creep.room.visual.circle(controllerDumpLocation, {stroke: 'green'})
                    // console.log('Moving to controller: ' + JSON.stringify(controllerDumpLocation));
                    result = this.creep.moveTo(controllerDumpLocation, {ignoreCreeps: false, reusePath: 10});
                    // console.log('failed move: ' + result);
                }
            }

            result = this.creep.transfer(this.target, this.request.resourceType);
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

        // if ((this.request.amount > 0 && this.creep.store.getUsedCapacity(this.request.resourceType) == 0) ||
        //     (this.request.amount < 0 && this.creep.store.getFreeCapacity(this.request.resourceType) == 0)) {
        //     // this.creep.memory.task = undefined;
        //     this.task = undefined;
        //     this.getTask();
        // }
    }

    energyDump(){

        let spawnDumpLocation : RoomPosition = new RoomPosition(this.colony.mainSpawn.energyDump.x, 
                                                                this.colony.mainSpawn.energyDump.y, 
                                                                this.colony.mainSpawn.energyDump.roomName);
        // console.log(JSON.stringify(this.colony.mainSpawn.energyDump));
        if (this.creep.pos.isEqualTo(spawnDumpLocation)){
            // console.log('dropping for controller')
            // result = this.creep.drop(RESOURCE_ENERGY, Math.min(this.request.amount as number, this.creep.store.getUsedCapacity(RESOURCE_ENERGY)));
            this.creep.drop(RESOURCE_ENERGY);
            // console.log('failed drop : ' + result);
            // this.creep.memory.task = undefined;
            // this.task = undefined
        }
        else {
            // console.log('Moving to controller: ' + JSON.stringify(controllerDumpLocation));
            this.creep.moveTo(spawnDumpLocation, {ignoreCreeps: false, reusePath: 10});
            // console.log('failed move: ' + result);
        }
    }

    moveToStaging(excuse: string){

        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0){
            this.energyDump();
            return;
        }

        console.log(excuse);

        let stagingPositions = RoomUtils.getBoxPositions(3, this.colony.mainSpawn.pos);

        let seed: number = +this.creep.name.substring(this.creep.name.length - 3);
        let randomPosition = this.shuffle(stagingPositions, seed)[0]

        if (this.creep.pos.isEqualTo(randomPosition)) { 
            console.log("transporter: \t" + this.creep.id + " \t- Staged");

            // this.creep.memory.task = undefined;
            // this.task = undefined

            return;
        }

        // this.creep.room.visual.circle(randomPosition, {stroke: 'red', fill: 'red'})
        let result = this.creep.moveTo(randomPosition, {ignoreCreeps: false, reusePath: 10});
        if (result != OK){
            console.log('Failed Staging Move: ' + result);
        }
    }

    shuffle(array: RoomPosition[], seed: number) {                // <-- ADDED ARGUMENT
        var m = array.length, t, i;
      
        // While there remain elements to shuffle…
        while (m) {
      
          // Pick a remaining element…
          i = Math.floor(this.random(seed) * m--);        // <-- MODIFIED LINE
      
          // And swap it with the current element.
          t = array[m];
          array[m] = array[i];
          array[i] = t;
          ++seed                                     // <-- ADDED LINE
        }
      
        return array;
      }
      
      random(seed: number) {
        var x = Math.sin(seed++) * 10000; 
        return x - Math.floor(x);
      }     
}