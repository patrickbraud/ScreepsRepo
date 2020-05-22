import { Colony } from "./Colony";
import { JobStatus } from "./Enums/JobStatus";

export class Spawner {

    public colony: Colony
    public mainRoom: Room;
    public mainSpawn: StructureSpawn;

    public spawnRequests: {[jobId: string]: {identifier: number, jobTitle: string, body: number[]}[]};

    constructor(colony: Colony) {
        this.colony = colony;
        this.mainSpawn = this.colony.mainSpawn;
        this.mainRoom = this.colony.mainRoom;

        this.spawnRequests = this.mainRoom.spawnRequests;
    }

    spawnHighestPriority() {

        if (this.mainSpawn.spawning) return;
        
        let request = undefined;
        let jobId = undefined;
        for (let key in this.spawnRequests) {
            
            jobId = key;

            let requestList = this.spawnRequests[key];
            if (!requestList || requestList.length == 0) continue;;
            request = requestList[0];

            break;
        }

        if (jobId == undefined) return;
        if (request == undefined) return;

        let body: BodyPartConstant[] = [];
        switch(request.jobTitle) {
            case "Harvest": body = this.mainSpawn.createHarvesterBody(request.body[0], request.body[1], request.body[2]); break;
        }

        let workerSpawnOpts = {
            jobId: jobId,
            identifier: request.identifier
        };

        let creepName = this.mainSpawn.generateCreepName(request.jobTitle, this.mainSpawn.memory.colonyId)

        let canSpawn = this.mainSpawn.spawnCreep(body, creepName, { dryRun: true });
        if (canSpawn == OK){

            canSpawn = this.mainSpawn.spawnCreep(body, creepName, { memory: workerSpawnOpts });

            // Update the job status to Spawning and update the body with what was actually created
            this.colony.jobBoard.updateJobStatusAndBody(jobId, request.identifier, JobStatus.Spawning, body);
            
            // Remove the fulfilled  spawn request from memory
            this.removeSpawnRequest(jobId, request.identifier);
        }
        else {
            console.log("Spawn pending: ");
            console.log("JobId: " + workerSpawnOpts.jobId)
            console.log("Identifier: " + workerSpawnOpts.identifier);
            console.log("JobTitle: " + request.jobTitle)
            console.log("Body: " + body.toString());
        }
    }

    addSpawnRequest(newRequest: {identifier: number, jobId: string, jobTitle: string, body: number[]}) {

        let newSpawnRequest = {
            identifier: newRequest.identifier,
            jobTitle: newRequest.jobTitle,
            body: newRequest.body
        };

        let spawnRequestsForJob = this.spawnRequests[newRequest.jobId];

        if (spawnRequestsForJob == undefined) {
            
            spawnRequestsForJob = [newRequest];
            this.spawnRequests[newRequest.jobId] = spawnRequestsForJob;
        }
        else {
            spawnRequestsForJob.push(newSpawnRequest);
        }

        this.colony.jobBoard.updateJobStatus(newRequest.jobId, newRequest.identifier, JobStatus.SpawnQueue);
        console.log("Spawn request received: " + newRequest.jobId);
    }

    bodyPartsSpawning(jobId: string, partType: BodyPartConstant) {

        let spawning = this.spawnRequests[jobId];

        if (!spawning) return 0;

        let partCount = 0;
        spawning.forEach(request => {
            
            let bodyCount = request.body;

            let workCount = bodyCount[0];
            let carryCount = bodyCount[1];
            let moveCount = bodyCount[2];

            switch(partType) {
                case WORK: partCount += workCount; break;
                case CARRY: partCount += carryCount; break;
                case MOVE: partCount += moveCount; break;
            }
        });

        return partCount;
    }

    private removeSpawnRequest(jobId: string, identifier: number) {

        let spawnList = this.spawnRequests[jobId];
        if (!spawnList) return;

        let index = spawnList.findIndex(item => item.identifier == identifier);
        if (index == -1) {
            delete this.spawnRequests[jobId];
        }
        else {
            spawnList.splice(index, 1);
            if (spawnList.length == 0) {
                delete this.spawnRequests[jobId];
            }
        }
    }
}
