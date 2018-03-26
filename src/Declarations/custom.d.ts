interface Source {
    memory;
    freeSpaceCount: number;
    creepsTargeting: Creep[];
    harvesters: Creep[];
    transporters: Creep[];
    harvesterWorkCount: number;
    maxCreepCount: number;
    droppedEnergy: number;

    sourceSpawnRoad: PathStep[];
    containerPos: RoomPosition;
}

interface Room {
    positionIsValid: Boolean;
    sourcesInRoom: Source[];
    sourceContainers: {container: Container, source: Source}[];
    sourceContainerConSites: {conSite: ConstructionSite, source: Source}[];
}

interface Creep {
    partCount(partType: string): number;
}

interface StructureSpawn {
    spawnHarvester(body: string[], targetSource: Source): number;
    spawnTransporter(targetSource: Source): number;
    spawnUpgrader(body: string[]): number;
    spawnBuilder(prioritySiteID: string): number;
    createWorkerBody(maxWork: number, maxCarry: number, maxMove: number, priority: string[], waitForMax: Boolean): string[];
    createBalancedBody(balanceParts: string[], maxPairs: number, waitForMax: Boolean): string[];
    generateCreepName(role: string, colonyID: string): string;
}

interface StructureContainer {
    transportersForContainer(transporters: Creep[], sourceContainers: {container: Container, source: Source}[]): Creep[];
}
