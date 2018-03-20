import { RoomMgr } from "Mgrs/RoomMgr";

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
                    if (!currentPos.isEqualTo(this.pos)) {
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

    Object.defineProperty(Source.prototype, "transporterCount", {
        get: function myProperty(): number {
            let transportersTargetingSource = 0;
            for (let creep of this.creepsTargeting) {
                if (creep.memory.Role == 'transporter') {
                    transportersTargetingSource++;
                }
            }
            return transportersTargetingSource;
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

    Object.defineProperty(Source.prototype, "droppedEnergy", {
        get: function myProperty(): number {
            let validPositions = RoomMgr.validPositions(this, ['wall']);
            //console.log(validPositions);
            let droppedEnergyAmount: number = 0;
            for (let pos of validPositions) {
                let [energyFound] = this.room.lookForAt(LOOK_ENERGY, pos);
                //console.log(energyFound);
                if (energyFound != undefined) {
                    // console.log('ID: ' + energyFound.id)
                    // console.log('Resource Type: ' + energyFound.resourceType);
                    // console.log('Amount: ' + energyFound.amount);
                    droppedEnergyAmount += energyFound.amount;
                }
            }
            return droppedEnergyAmount;
        }
    });
}
