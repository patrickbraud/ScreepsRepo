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
            this.spawnQueue[newRequest.requestType] = {};
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
                    case RequestType.Upgrade:
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

        if (!harvestRequest.requestType) {
            console.log("Bad harvest spawn request: " + JSON.stringify(harvestRequest))
            if (harvestRequest.requestId)
                this.removeSpawnRequest(RequestType.Harvest, harvestRequest.requestId);
            return;
        }

        let harvestSource: Source | null = Game.getObjectById(harvestRequest.requestId);
        if (!harvestRequest) return;

        let sourceHarvesters = this.colony.harvesters.filter(harvester => harvester.requestId == harvestRequest.requestId);
        if (harvestSource!.harvestLocations.length <= sourceHarvesters.length) {
            this.colony.spawner.removeSpawnRequest(RequestType.Harvest, harvestRequest.requestId);
            return;
        }

        this.spawnCreep(harvestRequest, body, spawnOpts);
    }

    spawnTransporterDryRun(transportRequest: any): any {
        let body = this.mainSpawn.createTransportBody(Math.abs(transportRequest.amount));

        let spawnTime = CREEP_SPAWN_TIME * body.length;
        let spawnCarryParts = _.filter(body, part => part == CARRY).length
        let totalCarry = spawnCarryParts * 50;

        let distanceToRequest = this.mainRoom.findPath(this.mainSpawn.pos, transportRequest.location).length;

        let totalTimeToRequest = spawnTime + distanceToRequest;

        let expectedAmountAtArrival = transportRequest.amount + transportRequest.delta * totalTimeToRequest;

        console.log('Spawn Transporter DryRun ' + 
                    '\n\t - Amount: ' + transportRequest.amount + 
                    '\n\t - Delta: ' + transportRequest.delta + 
                    '\n\t - ArrivalTime: ' + totalTimeToRequest + 
                    '\n\t - ArrivalAmount: ' + expectedAmountAtArrival +
                    '\n\t - TotalCarry: ' + totalCarry);

        if (Math.abs(expectedAmountAtArrival) >= totalCarry) {

            console.log('Transporter Spawn IS Worth It');
            let dryRunResult = {
                shouldSpawn: true,
                body: body
            }
            return dryRunResult
        }
        
        console.log('Transporter Spawn IS NOT Worth It');
        return false;
    }

    spawnTransporter(transportRequest: any, body: BodyPartConstant[]) {

        let spawnOpts = {
            creepType: CreepType.Transporter,
        };

        if (!transportRequest.requestId || !transportRequest.requestType) {
            console.log("Bad transport spawn request: " + JSON.stringify(transportRequest));
            if (transportRequest.requestId )
                this.removeSpawnRequest(RequestType.Transport, transportRequest.requestId );
            return;
        }

        this.spawnCreep(transportRequest, body, spawnOpts);
    }

    spawnUpgraderDryRun(upgradeRequest: any) {
        let body = this.colony.controller.createUpgradeBody();

        let spawnTime = CREEP_SPAWN_TIME * body.length;
        let spawnWorkParts = _.filter(body, part => part == WORK).length
        let totalWork = spawnWorkParts;

        let distanceToRequest = this.mainRoom.findPath(this.mainSpawn.pos, upgradeRequest.location).length;

        let totalTimeToRequest = spawnTime + distanceToRequest;

        let expectedAmountAtArrival = upgradeRequest.amount + upgradeRequest.delta * totalTimeToRequest;

        console.log('Spawn Upgrader DryRun ' + 
                    '\n\t - Amount: ' + upgradeRequest.amount + 
                    '\n\t - Delta: ' + upgradeRequest.delta + 
                    '\n\t - ArrivalTime: ' + totalTimeToRequest + 
                    '\n\t - ArrivalAmount: ' + expectedAmountAtArrival +
                    '\n\t - TotalWork: ' + totalWork);

        if (Math.abs(expectedAmountAtArrival) >= totalWork) {

            console.log('Upgrader Spawn IS Worth It');
            let dryRunResult = {
                shouldSpawn: true,
                body: body
            }
            return dryRunResult
        }
        
        console.log('Upgrader Spawn IS NOT Worth It');
        return false;
    }

    spawnUpgrader(upgradeRequest: any, body: BodyPartConstant[]) {
        let spawnOpts = {
            creepType: CreepType.Upgrader,
        };

        if (!upgradeRequest.requestId || !upgradeRequest.requestType) {
            console.log("Bad upgrade spawn request: " + JSON.stringify(upgradeRequest));
            if (upgradeRequest.requestId)
                this.removeSpawnRequest(RequestType.Upgrade, upgradeRequest.requestId);
            return;
        }

        this.spawnCreep(upgradeRequest, body, spawnOpts);
    }

    spawnCreep(request: any, body: BodyPartConstant[], spawnOpts: any) {

        if (this.mainSpawn.spawning) return;
        
        let creepName = this.mainSpawn.generateCreepName(request.requestType, this.colony.colonyId.toString())

        let canSpawn = this.mainSpawn.spawnCreep(body, creepName, { dryRun: true, memory: spawnOpts });
        if (canSpawn == OK){
            this.mainSpawn.spawnCreep(body, creepName, { memory: spawnOpts });
        }
        else {
            console.log("Spawn Pending: \t" + request.requestId + "\t- requestType: " + request.requestType + "\t- Body: " + body.toString());
        }
    }
}
