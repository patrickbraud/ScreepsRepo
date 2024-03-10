interface SpawnMemory {
    // SpawnMemory: {};
    colonyId: number;
}

interface CreepMemory{
    creepType;
    requestId;
    task;
}

interface Source {
    // Body is [W, C, M]
    updateRequest(existingRequest: any | undefined): any | undefined;

    totalWorkParts: number;
    harvestLocations: { x: number, y: number }[];
}

interface Room {
    requests: { [requestType: string]: { [requestId: string]: any } };
    tasks: { [taskId: number]: any };
    //spawnRequests: {[requestId: string]: {identifier: number, requestType: string, body: number[]}[]};
    spawnQueue: { [requestType: string]: { [requestId: string]: any } }
    sourcesInRoom: Source[];
    // exits: {[direction: string]: string};
    avgTransporterThroughput: number;
    transporterThroughputHistory: { [transporterId: string]: number };
}

interface Creep {
    partCount(partType: string): number;
}

interface StructureController {
    createUpgradeBody(): BodyPartConstant[];
    getEnergyDump(spawn: StructureSpawn): RoomPosition;
    updateUpgradeRequest(existingRequest: any | undefined): any | undefined;
    updateEnergyRequest(existingRequest: any | undefined, mainSpawn: StructureSpawn): any | undefined;
}

interface StructureSpawn {
    // colonyId: number;
    energyDump: RoomPosition;
    updateRequest(existingRequest: any | undefined): any | undefined;

    createHarvestBody(): BodyPartConstant[];
    createTransportBody(amount: number): BodyPartConstant[];
    generateCreepName(role: string, colonyId: string): string;
}

interface Resource {
    updateRequest(existingRequest: any | undefined, ignoreLocations: RoomPosition[]): any | undefined;
    incomeHistory: number[];
    averageIncomePerTick: number;
}

interface StructureContainer {
}
