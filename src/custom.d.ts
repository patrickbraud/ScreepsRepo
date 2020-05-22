interface Memory {
    spawnRequests: {[jobId: string]: {identifier: number, jobTitle: string, body: number[]}[]};
    jobs: {[jobId: string]: {identifier: number, jobTitle: string, body: number[], status: string}[]};
}

interface Source {
    // Body is [W, C, M]
    checkJobStatus(currentJobs: {identifier: number, jobTitle: string, body: number[]}[] | undefined): {identifier: number, jobId: string, jobTitle: string, body: number[] } | undefined;
    totalWorkParts: number;
    harvestLocations: {x: number, y: number}[];
}

interface Room {
    spawnRequests: {[jobId: string]: {identifier: number, jobTitle: string, body: number[]}[]};
    jobs: {[jobId: string]: {identifier: number, jobTitle: string, body: number[], status: string}[]};
    sourcesInRoom: Source[];
    exits: {[direction: string]: string};
}

interface Creep {
    partCount(partType: string): number;
}

interface StructureSpawn {
    createHarvesterBody(maxWork: number, maxCarry: number, maxMove: number): BodyPartConstant[];
    generateCreepName(role: string, colonyId: string): string;
}

interface StructureContainer {
}
