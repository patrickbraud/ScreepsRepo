interface Memory {
}

interface Source {
    // Body is [W, C, M]
    checkHarvestJobs(currentJobs: any[] | undefined)
    : any | undefined;

    totalWorkParts: number;
    harvestLocations: {x: number, y: number}[];
}

interface Room {
    spawnRequests: {[jobId: string]: {identifier: number, jobType: string, body: number[]}[]};
    jobs: {[jobType: string]: {[jobId: string]: any[]}};
    // jobs: {[jobType: string]: {[jobId: string]: {identifier: number, jobType: string, body: number[], status: string}[]}};
    //jobs: {[jobId: string]: {identifier: number, jobType: string, body: number[], status: string}[]};
    sourcesInRoom: Source[];
    exits: {[direction: string]: string};
}

interface Creep {
    partCount(partType: string): number;
}

interface StructureSpawn {
    checkEnergyRequirements(currentJobs: any | undefined) : any | undefined;

    createHarvestBody(maxWork: number, maxCarry: number, maxMove: number): BodyPartConstant[];
    generateCreepName(role: string, colonyId: string): string;
}

interface Resource {
    updateDroppedEnergyJob(droppedEnergyJob: any[] | undefined): any | undefined;
    incomeHistory: number[];
    averageIncomePerTick: number;
}

interface StructureContainer {
}
