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
    createWorkerBody(maxWork: number, maxCarry: number, maxMove: number, priority: string[], waitForMax: Boolean): string[];
}
