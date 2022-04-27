import { Screep } from "./Screep";
import { Colony } from "../Colony";
import { CreepType } from "../Enums/CreepType";
import { RequestType } from "../Enums/RequestType";

export class Upgrader extends Screep {

    colony: Colony;

    creep: Creep;
    creepType: CreepType;

    requestId: string;
    request: any;

    task: any;

    targetController: StructureController;

    constructor(creep: Creep, colony: Colony) {
        super(creep, colony);

        this.colony = colony;

        this.creep = creep;
        this.creepType = creep.memory.creepType;

        this.targetController = this.colony.controller;
    }

    taskCheckIn() {
        this.request = this.colony.requestManager.getRequest(RequestType.Upgrade, this.targetController.id)

        if (!this.request) console.log("Upgrader w/o request. Something Wrong");

        this.request.amount -= this.creep.getActiveBodyparts(WORK);
        if (this.request.amout < 0) this.request.amount = 0;
    }

    work() {

        if (this.targetController == undefined) return;
        
        this.upgrade(this.targetController);
    }

    upgrade(controller: StructureController) {

        if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
            this.obtainEnergy();
            return;
        }

        let upgraderResult = this.creep.upgradeController(controller);
        if (upgraderResult == ERR_NOT_IN_RANGE) {

            // Move to one of the open spaces
            this.creep.moveTo(controller, {ignoreCreeps: false, reusePath: 10})
        }
    }

    obtainEnergy(){

        // Get energy from the controler energy dump
        let dumpLoc = this.targetController.getEnergyDump(this.colony.mainSpawn);

        let energyAtDump = this.colony.mainRoom.lookForAt(LOOK_ENERGY, dumpLoc);
        let pickupResult;
        if (energyAtDump){
            pickupResult = this.creep.pickup(energyAtDump[0])

            if (pickupResult == OK) return;
        }

        if (pickupResult == ERR_NOT_IN_RANGE){
            this.creep.moveTo(dumpLoc, {ignoreCreeps: false, reusePath: 10});
            return;
        }

        console.log("Upgrader Failed Pickup: " + pickupResult);
    }
}
