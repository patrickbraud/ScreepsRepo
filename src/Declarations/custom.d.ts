interface Source {
    creepsTargeting: Creep[];
    harvesterCount: number;
    harvesterWorkCount: number;
    maxCreepCount: number;
}

interface Room {
    positionIsValid: Boolean;
    sourcesInRoom: Source[];
}

interface Creep {
    partCount(partType: string): number;
}

interface StructureSpawn {
    spawnHarvester(targetSource: Source): number;
    spawnTransporter(targetSource: Source): number;
    spawnUpgrader(body: string[]): number;
    spawnBuilder(prioritySiteID: string): number;
    createWorkerBody(maxWork: number, maxCarry: number, maxMove: number, priority: string[], waitForMax: Boolean): string[];
    createBalancedBody(balanceParts: string[], waitForMax: Boolean): string[];
    generateCreepName(role: string, colonyID: string): string;
}
