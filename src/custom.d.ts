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
    linkPos: RoomPosition;
}

interface Room {
    positionIsValid: Boolean;
    sourcesInRoom: Source[];
    exits: {[direction: string]: string};
    sourceContainers: {container: Container, source: Source}[];
    sourceContainerConSites: {conSite: ConstructionSite, source: Source}[];
    sourceLinks: {link: Link, source: Source}[];
    sourceLinkConSites: {linkConSite: ConstructionSite, source: Source}[];
}

interface Creep {
    partCount(partType: string): number;
}

interface StructureSpawn {
    spawnHarvester(body: string[], targetSource: Source): number;
    spawnTransporter(targetSource: Source): number;
    spawnUpgrader(body: string[]): number;
    spawnBuilder(prioritySiteID: string): number;
    createWorkerBody(maxWork: number, maxCarry: number, maxMove: number, priority: string[], waitForMax: Boolean): BodyPartConstant[];
    createBalancedBody(balanceParts: BodyPartConstant[], maxPairs: number, waitForMax: Boolean): BodyPartConstant[];
    generateCreepName(role: string, colonyID: string): string;
}

interface StructureContainer {
    transportersForContainer(transporters: Creep[], sourceContainers: {container: Container, source: Source}[]): Creep[];
}

// interface Container extends OwnedStructure<STRUCTURE_CONTAINER>{}
// interface Extension extends OwnedStructure<STRUCTURE_EXTENSION>{}
// interface Link extends OwnedStructure<STRUCTURE_LINK>{}
// interface Spawn extends OwnedStructure<STRUCTURE_SPAWN>{}
// interface Controller extends OwnedStructure<STRUCTURE_CONTROLLER>{}

interface Container extends StructureContainer{}
interface Extension extends StructureExtension{}
interface Link extends StructureLink{}
interface Spawn extends StructureSpawn{}
interface Controller extends StructureController{}
