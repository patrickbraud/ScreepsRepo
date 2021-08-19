import { Colony } from "./Colony";
import { RequestStatus } from "./Enums/RequestStatus";
import { RequestType } from "./Enums/RequestType";
import { CreepType } from "./Enums/CreepType";

export class Spawner {

    public colony: Colony
    public mainRoom: Room;
    public mainSpawn: StructureSpawn;

    //public spawnRequests: {[requestId: string]: {identifier: number, requestType: string, body: number[]}[]};

    public spawnQueue: {[requestType: string]: {[requestId: string]: any}};

    constructor(colony: Colony) {
        this.colony = colony;
        this.mainSpawn = this.colony.mainSpawn;
        this.mainRoom = this.colony.mainRoom;

        this.spawnQueue = this.mainRoom.spawnQueue;
    }

    spawn() {
        
    }

    // spawnHighestPriority() {

    //     if (this.mainSpawn.spawning) return;
        
    //     let request = undefined;
    //     let requestId = undefined;
    //     for (let key in this.spawnRequests) {
            
    //         requestId = key;

    //         let requestList = this.spawnRequests[key];
    //         if (!requestList || requestList.length == 0) continue;;
    //         request = requestList[0];

    //         break;
    //     }

    //     if (requestId == undefined) return;
    //     if (request == undefined) return;

    //     let body: BodyPartConstant[] = [];
    //     switch(request.requestType) {
    //         case "Harvest": body = this.mainSpawn.createHarvestBody(request.body[0], request.body[1], request.body[2]); break;
    //     }

    //     let workerSpawnOpts = {
    //         requestType: request.requestType,
    //         requestId: requestId,
    //         identifier: request.identifier
    //     };

    //     let creepName = this.mainSpawn.generateCreepName(request.requestType, this.mainSpawn.memory.colonyId)

    //     let canSpawn = this.mainSpawn.spawnCreep(body, creepName, { dryRun: true });
    //     if (canSpawn == OK){

    //         canSpawn = this.mainSpawn.spawnCreep(body, creepName, { memory: workerSpawnOpts });

    //         // Update the request status to Spawning and update the body with what was actually created
    //         // this.colony.requestManager.updateRequestStatusAndBody(request.requestType, requestId, request.identifier, RequestStatus.Spawning, body);
            
    //         // Remove the fulfilled  spawn request from memory
    //         this.removeSpawnRequest(requestId, request.identifier);
    //     }
    //     else {
    //         console.log("SpawnPending: \t" + requestId + "\t- requestType: " + workerSpawnOpts.requestType + "\t- Body: " + body.toString());
    //     }
    // }

    submitSpawnRequest(newRequest: any) {

        let spawnsForType = this.spawnQueue[newRequest.requestType];
        if (!spawnsForType) {
            spawnsForType[newRequest.requestType] = {};
            spawnsForType = this.spawnQueue[newRequest.requestType];
        }
        
        let spawnRequest = spawnsForType[newRequest.requestId];
        if (!spawnRequest) console.log("Spawn request received: " + newRequest.requestId);

        spawnsForType[newRequest.requestId] = newRequest;
    }

    private removeSpawnRequest(requestType: string, requestId: string) {

        let spawnsForType = this.spawnQueue[requestType];
        if (!spawnsForType) {

             delete this.spawnQueue[requestType];
             return;
        }

        delete spawnsForType[requestId];
    }

    updateRequestsOfType(requestType: string) {

        let harvestSpawns = this.spawnQueue[requestType];
        if (!harvestSpawns) return;

        let spawnRequests = Object.values(harvestSpawns);
        spawnRequests.forEach(spawnRequest => {

            // Make sure there is still a matching request for this spawn
            let activeRequest = this.colony.requestManager.getRequest(requestType, spawnRequest.requestId);
            if (!activeRequest) this.removeSpawnRequest(requestType, spawnRequest.requestId);
            else {

                switch (requestType) {

                    case RequestType.Harvest:
                        activeRequest.workNeeded = Math.min(activeRequest.workNeeded - spawnRequest.workNeeded, 0);
                        break;

                    case RequestType.Transport:
                        activeRequest.amount -= Math.max(spawnRequest.amount, 0);
                }
            }
        });
    }

    spawnHarvester(harvestRequest: any) {
        let body = this.mainSpawn.createHarvestBody();

        let spawnOpts = {
            creepType: CreepType.Harvester,
            requestId: harvestRequest.requestId,
            requestType: harvestRequest.requestType,
        };

        if (!harvestRequest.requestId || !harvestRequest.requestType) {
            console.log("Bad harvest spawn request: " + JSON.stringify(harvestRequest))
            this.removeSpawnRequest(RequestType.Harvest, undefined);
            return;
        }
        this.spawnCreep(harvestRequest, body, spawnOpts);
    }

    spawnTransporter(transportRequest: any) {

        let body = this.mainSpawn.createTransportBody(Math.abs(transportRequest.amount));

        let spawnOpts = {
            creepType: CreepType.Transporter,
        };

        if (!transportRequest.requestId || !transportRequest.requestType) {
            console.log("Bad transport spawn request: " + JSON.stringify(transportRequest));
            this.removeSpawnRequest(RequestType.Transport, undefined);
            return;
        }

        this.spawnCreep(transportRequest, body, spawnOpts);
    }

    spawnCreep(request: any, body: BodyPartConstant[], spawnOpts: any) {

        if (this.mainSpawn.spawning) return;
        
        let creepName = this.mainSpawn.generateCreepName(request.requestType, this.mainSpawn.memory.colonyId)

        let canSpawn = this.mainSpawn.spawnCreep(body, creepName, { dryRun: true });
        if (canSpawn == OK){
            this.mainSpawn.spawnCreep(body, creepName, { memory: spawnOpts });
        }
        else {
            console.log("SpawnPending: \t" + request.requestId + "\t- requestType: " + request.requestType + "\t- Body: " + body.toString());
        }
    }
}
