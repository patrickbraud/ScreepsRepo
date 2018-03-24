import { RoomUtils } from "Mgrs/RoomUtils";

export function sourcePrototypes() {

    Object.defineProperty(Source.prototype, 'memory', {
        configurable: true,
        get: function() {
            if(_.isUndefined(Memory.mySourcesMemory)) {
                Memory.mySourcesMemory = {};
            }
            if(!_.isObject(Memory.mySourcesMemory)) {
                return undefined;
            }
            return Memory.mySourcesMemory[this.id] =
                    Memory.mySourcesMemory[this.id] || {};
        },
        set: function(value) {
            if(_.isUndefined(Memory.mySourcesMemory)) {
                Memory.mySourcesMemory = {};
            }
            if(!_.isObject(Memory.mySourcesMemory)) {
                throw new Error('Could not set source memory');
            }
            Memory.mySourcesMemory[this.id] = value;
        }
    });

    Object.defineProperty(Source.prototype, 'freeSpaceCount', {
        get: function (): number {
            if (this._freeSpaceCount == undefined) {
                if (this.memory.freeSpaceCount == undefined) {
                    let freeSpaceCount = 0;
                    [this.pos.x - 1, this.pos.x, this.pos.x + 1].forEach(x => {
                        [this.pos.y - 1, this.pos.y, this.pos.y + 1].forEach(y => {
                            if (Game.map.getTerrainAt(x, y, this.pos.roomName) != 'wall')
                                    freeSpaceCount++;
                                }, this);
                        }, this);
                    this.memory.freeSpaceCount = freeSpaceCount;
                }
                this._freeSpaceCount = this.memory.freeSpaceCount;
            }
            return this._freeSpaceCount;
        },
        enumerable: false,
        configurable: true
    });

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
                    if (creep.memory.TargetSourceID == this.id) {
                        creepsTargeting.push(creep);
                    }
                }
            }
            return creepsTargeting;
        }
    });

    Object.defineProperty(Source.prototype, 'harvesters', {
        get: function(): Creep[] {
            if (!this._harvesters) {
                //this._harvesters = [];
                this._harvesters = this.creepsTargeting.filter(creep => {
                    return creep.memory.Role == 'harvester';
                })
            }
            return this._harvesters;
        }
    });

    Object.defineProperty(Source.prototype, 'transporters', {
        get: function(): Creep[] {
            if (!this._transporters) {
                //this._transporters = [];
                this._transporters = this.creepsTargeting.filter(creep => {
                    return creep.memory.Role == 'transporter';
                })
            }
            return this._transporters as Creep[];
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
            let validPositions = RoomUtils.validPositions(this, ['wall']);
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
