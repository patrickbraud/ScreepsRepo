import { Colony } from "./Colony";
import { JobStatus } from "./Enums/JobStatus";
import { JobType } from "./Enums/JobType";

export class JobBoard {

    colony: Colony;
    mainRoom: Room;

    creeps: Creep[] = [];

    //jobs: {[jobType: string]: {[jobId: string]: {identifier: number, jobType: string, body: number[], status: string}[]}};
    jobs: {[jobType: string]: {[jobId: string]: any[]}};

    constructor(colony: Colony) {
        this.colony = colony;
        this.mainRoom = colony.mainRoom;
        this.creeps = colony.creeps;

        this.jobs = this.mainRoom.jobs;
    }

    postJob(jobId: string, jobDetails: any) {
        
        let jobsOfType: {[jobId: string]: any[]} = this.jobs[jobDetails.jobType];
        if (!jobsOfType) {
            // No jobs of this type exist yet
            // Initialize its key in the dictionary
            this.jobs[jobDetails.jobType] = {};
            jobsOfType = this.jobs[jobDetails.jobType];
        }

        let jobList = jobsOfType[jobId];
        if (!jobList) {
            // No jobs exist for this jobId yet
            // Initialize its job list
            jobList = [jobDetails];
            jobsOfType[jobId] = jobList;
        }
        else {
            jobList.push(jobDetails);
        }
        

        console.log("JobId: " + jobDetails.jobId + "- JobCount: " + jobList.length);
    }

    assignWorkers() {
        
        for (let jobType in this.jobs) {

            if (jobType != JobType.Harvest) continue; // <------ Temp

            let jobsOfType = this.jobs[jobType];
            if (!jobsOfType) continue;

            for (let jobId in jobsOfType) {

                let jobList = jobsOfType[jobId];
                if (!jobList) continue;

                jobList.forEach(jobInfo => {

                    let spawnRequest = {
                        identifier: jobInfo.identifier,
                        jobId: jobId, 
                        jobType: jobInfo.jobType, 
                        body: jobInfo.body
                    };
                    
                    // 
                    // TODO: Assign idle workers to open jobs
                    // TODO: Combine jobs where available
                    //
                    if (jobInfo.status == JobStatus.Open) {
                        
                        let availableWorkers = this.creeps.filter(creep => creep.memory.jobId == undefined);
                        if (availableWorkers.length <= 0) {

                            // No idle workers, we will have to spawn one
                            this.colony.spawner.addSpawnRequest(jobId, spawnRequest);
                        }
                        else {

                            // There are idle workers

                            // 
                            // TODO: If we assign an idle worker to a job that was in the spawn queue
                            //       then remove it from the spawn queue
                            //
                        }
                    }
                });
            }
        }
    }

    updateJobStatus(jobType: string, jobId: string, identifier: number, status: string) {

        let jobsOfType: {[jobId: string]: any[]} = this.jobs[jobType];
        if (!jobsOfType) return;

        let jobList: any[] = jobsOfType[jobId];
        if (!jobList) return;

        let jobToUpdate = jobList.find(job => job.identifier == identifier);
        if (!jobToUpdate) return;

        jobToUpdate.status = status;
    }

    updateJobStatusAndBody(jobType: string, jobId: string, identifier: number, status: string, body: BodyPartConstant[]) {

        let jobsOfType: {[jobId: string]: any[]} = this.jobs[jobType];
        if (!jobsOfType) return;

        let jobList = jobsOfType[jobId];
        if (!jobList) return;

        let jobToUpdate = jobList.find(job => job.identifier == identifier);
        if (!jobToUpdate) return;

        jobToUpdate.status = status;
        jobToUpdate.body[0] = body.filter(part => part == WORK).length;
        jobToUpdate.body[1] = body.filter(part => part == CARRY).length;
        jobToUpdate.body[2] = body.filter(part => part == MOVE).length;
    }

    removeJob(jobType: string, jobId: string, identifier: number) {

        let jobsOfType: {[jobId: string]: any[]} = this.jobs[jobType];
        if (!jobsOfType) return;

        let jobList = jobsOfType[jobId];
        if (!jobList) return;

        let index = jobList.findIndex(job => job.identifier == identifier);
        if (index == -1) {
            delete this.jobs[jobType][jobId];
        }
        else {
            jobList.splice(index, 1);
            if (jobList.length == 0) {
                delete this.jobs[jobType][jobId];
            }
        }
    }

    getWorkerJob(creep: Creep): any | undefined {
        return this.getJob(creep.memory.jobType, creep.memory.jobId, creep.memory.identifier);
    }

    getJob(jobType: string, jobId: string, identifier: number): any | undefined {

        if (!jobId) return undefined;

        let jobsOfType: {[jobId: string]: any[]} = this.jobs[jobType];
        if (!jobsOfType) return;

        let jobList = jobsOfType[jobId];
        if (!jobList) return undefined;

        let jobFound = jobList.find(job => job.identifier == identifier);
        return jobFound;
    }

    getJobs(jobType: string, jobId: string) : any[] | undefined{

        let jobsOfType: {[jobId: string]: any[]} = this.jobs[jobType];
        if (!jobsOfType) return undefined;

        let jobList = jobsOfType[jobId];
        return jobList;
    }

    workerCheckIn(worker: Creep) {

        let currentJob = this.colony.jobBoard.getJob(worker.memory.jobType, worker.memory.jobId, worker.memory.identifier);
        if (!currentJob) {
            worker.memory.jobId = undefined;
            worker.memory.identifier = undefined;
        }
        if (currentJob && currentJob.status == JobStatus.Spawning) {
            currentJob.status = JobStatus.Working;
        }

        return currentJob;
    }

    verifyWorkersExist() {

        // For each job type
        for (let jobType in this.jobs) {

            // Dictionary of jobs for this type
            let jobsOfType: {[jobId: string]: any[]} = this.jobs[jobType];

            // All keys of the dictionary
            let jobIds: string[] = Object.keys(jobsOfType);

            // For each key in the dictionary
            jobIds.forEach(jobId => {

                // List of jobs for this jobId
                let jobList: any[] = jobsOfType[jobId];

                jobList.reverse().forEach((job: any) => {
                    
                    if (job.jobType == JobType.DroppedEnergy) {

                        let droppedEnergy = this.colony.droppedEnergy.find(resource => resource.id == jobId);
                        if (!droppedEnergy) {

                                console.log("JOB DELETED: No resource found for {jobId: " + jobId + ", identifier: " + job.identifier + "}");
                                this.removeJob(job.jobType, jobId, job.identifier);
                        }
                    }
                    if (job.jobType == JobType.Harvest && job.status == JobStatus.Working) { 

                        let worker = this.colony.creeps.find(creep => creep.memory.jobId == jobId && creep.memory.identifier == job.identifier);
                        if (!worker) {

                            console.log("JOB DELETED: No worker found for {jobId: " + jobId + ", identifier: " + job.identifier + "}");
                            this.removeJob(job.jobType, jobId, job.identifier);
                        }
                    }
                });
            });
        }
    }

    getWorkerForJob(identifer: number): Creep | undefined {

        return this.colony.creeps.find(creep => creep.memory.identifer == identifer);
    }
}
