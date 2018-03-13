export function sourcePrototypes() {

    Object.defineProperty(Source.prototype, "maxCreepCount", {
        get: function myProperty(): number {
            let validSpaceCount: number = 0;
            /*
                x * *
                * O *
                * * y
                Start at the x, end at the y
            */
            let currentPos = new RoomPosition(this.pos.x - 1, this.pos.y - 1, this.pos.roomName);
            for (let xCount = 0; xCount < 3; xCount++, currentPos.x++) {
                for (let yCount = 0; yCount < 3; yCount++, currentPos.y++) {
                    if (currentPos != this.pos) {
                        let isValid = this.room.positionIsValid(currentPos);
                        validSpaceCount = isValid ? ++validSpaceCount : validSpaceCount;
                    }
                }
                currentPos.y -= 3;
            }
            return validSpaceCount;
        }
    });

    Object.defineProperty(Source.prototype, "creepsTargeting", {
        get: function myProperty(): Creep[] {
            let creepsTargeting = [];
            for (let creepName in Game.creeps) {
                let creep = Game.creeps[creepName];
                if (creep.memory.TargetSourceID) {
                    if (creep.memory.TargetSourceID == this.id
                        || creep.memory.MoveID == this.id) {
                        creepsTargeting.push(creep);
                    }
                }
            }
            return creepsTargeting;
        }
    });

    Object.defineProperty(Source.prototype, "harvesterCount", {
        get: function myProperty(): number {
            let harvestersTargetingSource = 0;
            for (let creep of this.creepsTargeting) {
                if (creep.memory.Role == 'harvester') {
                    harvestersTargetingSource++;
                }
            }
            return harvestersTargetingSource;
        }
    });

    Object.defineProperty(Source.prototype, "harvesterWorkCount", {
        get: function myProperty(): number {
            let totalWorkParts = 0;
            for (let creep of this.creepsTargeting) {
                if (creep.memory.Role == 'harvester') {
                    totalWorkParts += creep.partCount(WORK);
                }
            }
            return totalWorkParts;
        }
    });
}
