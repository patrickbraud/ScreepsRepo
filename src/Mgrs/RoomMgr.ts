// Manages the rooms for a colony
export class RoomMgr {

    public baseRoom: Room;
    public baseRoomSpawn: Spawn;
    public baseRoomController: Controller;
    public baseRoomStructures: Structure[];

    public extensions: Extension[];
    public containers: Container[];
    public sources: Source[] //[Source[], Room]

    constructor(baseRoomSpawn: Spawn) {
        this.baseRoom = baseRoomSpawn.room;
        this.baseRoomSpawn = baseRoomSpawn;
        this.baseRoomController = baseRoomSpawn.room.controller;
        // Later, return sources in other rooms around our base as well
        this.sources = this.baseRoom.find(FIND_SOURCES);

        // Get all structures and set the variables for reach structure type
        this.baseRoomStructures = this.baseRoom.find(FIND_STRUCTURES);
        // Get extensions
        this.extensions = this.getStructureOfType(STRUCTURE_EXTENSION) as Extension[];
        // Gt containers
        this.containers = this.getStructureOfType(STRUCTURE_CONTAINER) as Container[];
    }

    getBestSource(creep: Creep): Source {
        // Get all of the sources in the same room as the creep
        let sourcesInRoom = this.sources.filter( src => src.room.name == creep.room.name );
        console.log('Sources in Room');
        console.log(sourcesInRoom);
        // Keep only the sources that have less creeps targeting them than the source has valid spaces to harvest from
        let openSources: Source[] = sourcesInRoom.filter( src => this.creepsTargetingSource(src) < this.maxCreepCount(src) );
        console.log('Open Sources');
        console.log(openSources);
        // Order the sources by linear distance to the creep
        let checkDistance = (a, b): number => {
            { return this.distanceTo(creep, a.pos) - this.distanceTo(creep, b.pos); }
        }
        //let orderedSources: Source[] = filteredSources.sort(function (a, b) { return this.distanceTo(creep, a.pos) - this.distanceTo(creep, b.pos); });
        let orderedSources: Source[] = openSources.sort(function (a, b) { return checkDistance(a, b) });

        console.log('Ordered Sources');
        console.log(orderedSources);

        return orderedSources[0];
    }

    getSourceByID(sourceID: string): Source {
        let targetSource: Source = null;
        this.sources.forEach(source => {
            if (source.id == sourceID) {
                targetSource = source;
                return;
            }
        });
        return targetSource;
    }

    creepsTargetingSource(source: Source): number {
        let creepCount: number = 0;

        for (let creepName in Game.creeps) {
            creepCount = Game.creeps[creepName].memory.MoveID == source.id ? ++creepCount : creepCount;
        }
        //console.log(creepCount + ' creeps targeting ' + source.id);
        return creepCount;
    }

    positionIsValid(pos: RoomPosition): boolean {
        let lookResult = Game.rooms[pos.roomName].lookForAt(LOOK_TERRAIN, pos);
        //console.log('x: ' + pos.x + ' y: ' + pos.y + ' - ' + lookResult.toString() + ' - ' + (lookResult.toString() != 'wall'));
        return !(lookResult.toString() == 'wall');
    }

    distanceTo(creep: Creep, pos: RoomPosition): number {
        return Math.sqrt(Math.pow(pos.x - creep.pos.x, 2) + Math.pow(pos.y - creep.pos.y, 2));
    }

    getStructureOfType(type: string): Structure[] {
        return this.baseRoomStructures.filter(struct => {
            struct.structureType == type;
        })
    }

    maxCreepCount(source: Source): number {
        let validSpaceCount: number = 0;
         /*
            x * *
            * O *
            * * y
            Start at the x, end at the y
        */
        let currentPos = new RoomPosition(source.pos.x - 1, source.pos.y - 1, source.pos.roomName);
        for (let xCount = 0; xCount < 3; xCount++, currentPos.x++) {
            for (let yCount = 0; yCount < 3; yCount++, currentPos.y++) {
                if (currentPos != source.pos) {
                    let isValid = this.positionIsValid(currentPos);
                    validSpaceCount = isValid ? ++validSpaceCount : validSpaceCount;
                }
            }
            currentPos.y -= 3;
        }
        return validSpaceCount;
    }
}
