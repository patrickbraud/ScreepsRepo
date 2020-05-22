import { Colony } from "./Colony";
import { JobStatus } from "./Enums/JobStatus";

export class JobBoard {

    colony: Colony;
    mainRoom: Room;

    creeps: Creep[] = [];

    jobs: {[jobId: string]: {identifier: number, jobTitle: string, body: number[], status: string}[]};

    constructor(colony: Colony) {
        this.colony = colony;
        this.mainRoom = colony.mainRoom;
        this.creeps = colony.creeps;

        this.jobs = this.mainRoom.jobs;
    }

    postJob(newJob: {jobId: string, jobTitle: string, body: number[]}) {

        let jobPost = {
            identifier: Math.floor(Math.random() * 10000000),
            jobTitle: newJob.jobTitle,
            body: newJob.body,
            status: JobStatus.Open
        };

        let existingJobs = this.jobs[newJob.jobId];
        if (existingJobs == undefined) {

            existingJobs = [jobPost];
            this.jobs[newJob.jobId] = existingJobs;
        }
        else {

            existingJobs.push(jobPost);
        }

        console.log("JobId: " + newJob.jobId + "- JobCount: " + existingJobs.length);
    }

    hireWorkers() {
        
        for (let jobId in this.jobs) {

            let jobList = this.jobs[jobId];
            if (!jobList) continue;

            jobList.forEach(jobInfo => {
                
                if (jobInfo.status == JobStatus.Open) {

                    let spawnRequest = {
                        identifier: jobInfo.identifier,
                        jobId: jobId, 
                        jobTitle: jobInfo.jobTitle, 
                        body: jobInfo.body
                    };

                    let availableWorkers = this.creeps.filter(creep => creep.memory.jobId == undefined);
                    if (availableWorkers.length <= 0) {

                        this.submitSpawnRequest(spawnRequest);
                    }
                }
            });
        }
    }

    submitSpawnRequest(request: {identifier: number, jobId: string, jobTitle: string, body: number[], }) {

        this.colony.spawner.addSpawnRequest(request);
    }

    updateJobStatus(jobId: string, identifier: number, status: string) {

        let jobList = this.jobs[jobId];
        if (!jobList) return;

        let jobToUpdate = jobList.find(job => job.identifier == identifier);
        if (!jobToUpdate) return;

        jobToUpdate.status = status;
    }

    updateJobStatusAndBody(jobId: string, identifier: number, status: string, body: BodyPartConstant[]) {

        let jobList = this.jobs[jobId];
        if (!jobList) return;

        let jobToUpdate = jobList.find(job => job.identifier == identifier);
        if (!jobToUpdate) return;

        jobToUpdate.status = status;
        jobToUpdate.body[0] = body.filter(part => part == WORK).length;
        jobToUpdate.body[1] = body.filter(part => part == CARRY).length;
        jobToUpdate.body[2] = body.filter(part => part == MOVE).length;
    }

    removeJob(jobId: string, identifier: number) {

        let jobList = this.jobs[jobId];
        if (!jobList) return;

        let index = jobList.findIndex(job => job.identifier == identifier);
        if (index == -1) {
            delete this.jobs[jobId];
        }
        else {
            jobList.splice(index, 1);
            if (jobList.length == 0) {
                delete this.jobs[jobId];
            }
        }
    }

    getJob(jobId: string, identifier: number): {identifier: number, jobTitle: string, body: number[], status: string} | undefined {

        if (!jobId) return undefined;

        let jobList = this.jobs[jobId];
        if (!jobList) return undefined;

        let jobFound = jobList.find(job => job.identifier == identifier);
        return jobFound;
    }

    getJobs(jobId: string) : {identifier: number, jobTitle: string, body: number[], status: string}[] | undefined {

        let jobList = this.jobs[jobId];
        return jobList;
    }

    workerCheckIn(worker: Creep) {

        let currentJob = this.colony.jobBoard.getJob(worker.memory.jobId, worker.memory.identifier);
        if (!currentJob) {
            worker.memory.jobId = undefined;
            worker.memory.identifier = undefined;
        }
        if (currentJob && currentJob.status == JobStatus.Spawning) {
            currentJob.status = JobStatus.Working;
        }

        return currentJob;
    }

    veryifyJobWorkers() {

        let jobIds = Object.keys(this.jobs);

        jobIds.forEach(jobId => {

            let jobList = this.jobs[jobId];

            jobList.reverse().forEach(job => {
                
                if (job.status == JobStatus.Working) {

                    let worker = this.colony.creeps.find(creep => creep.memory.jobId == jobId && creep.memory.identifier == job.identifier);
                    if (!worker) {

                        console.log("No worker found for {" + jobId + ", " + job.identifier + "}");
                        this.removeJob(jobId, job.identifier);
                    }
                }
            });
        });
    }
}
