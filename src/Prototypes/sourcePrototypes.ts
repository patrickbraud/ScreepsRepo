import { RoomUtils } from "../Mgrs/RoomUtils";

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

    Object.defineProperty(Source.prototype, "creepsTargeting", {
        get: function myProperty(): Creep[] {
            if (!this._creepsTargeting) {
                let creepsTargeting = [];
                for (let creepName in Game.creeps) {
                    let creep = Game.creeps[creepName];
                    if (creep.memory.TargetSourceID) {
                        if (creep.memory.TargetSourceID == this.id) {
                            creepsTargeting.push(creep);
                        }
                    }
                }
                this._creepsTargeting = creepsTargeting
            }
            return this._creepsTargeting;
        }
    });

    Object.defineProperty(Source.prototype, 'harvesters', {
        get: function(): Creep[] {
            if (!this._harvesters) {
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
                this._transporters = this.creepsTargeting.filter(creep => {
                    return creep.memory.Role == 'transporter';
                })
            }
            return this._transporters as Creep[];
        }
    });

    Object.defineProperty(Source.prototype, "harvesterWorkCount", {
        get: function myProperty(): number {
            if (!this._harvesterWorkCount) {
                let totalWorkParts = 0;
                for (let creep of this.creepsTargeting) {
                    if (creep.memory.Role == 'harvester') {
                        totalWorkParts += creep.partCount(WORK);
                    }
                }
                this._harvesterWorkCount = totalWorkParts;
            }
            return this._harvesterWorkCount;
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

    Object.defineProperty(Source.prototype, "sourceSpawnRoad", {
        get: function myProperty(): PathStep[] {
            if (!this._sourceSpawnRoad) {
                let roomName = this.room.name;
                // Get the base spawn for the room
                let roomBaseSpawn = _.filter(Game.spawns, function(spawn) {
                    return (spawn.pos.roomName == roomName
                            && spawn.memory.ColonyID
                            && !spawn.memory.SubSpawnID);
                })
                let roadPath: PathStep[] = this.room.findPath(roomBaseSpawn[0].pos, this.pos, {ignoreCreeps: true});
                this._sourceSpawnRoad = roadPath.slice(0, roadPath.length - 1);

                // Road dot visuals can be found in the containerPos property below
            }
            return this._sourceSpawnRoad;
        }
    });

    Object.defineProperty(Source.prototype, "containerPos", {
        get: function (): RoomPosition {
            if (this._containerPos == undefined) {
                if (this.memory.containerPos == undefined) {
                    let road = this.sourceSpawnRoad;
                    let containerPos = road[road.length - 1];
                    this.memory.containerPos = containerPos;
                }
                this._containerPos = this.memory.containerPos;
            }
            // let roadDot = new RoomVisual(this.room.name);
            // for (let step = 0; step < this.sourceSpawnRoad.length; step++) {
            //     roadDot.circle(this.sourceSpawnRoad[step].x, this.sourceSpawnRoad[step].y, { fill: 'yellow' })
            // }

            // let dot = new RoomVisual(this.room.name);
            // dot.circle(this._containerPos, { fill: 'red' })
            return this.room.getPositionAt(this._containerPos.x, this._containerPos.y);
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(Source.prototype, "linkPos", {
        get: function (): RoomPosition {
            if (this._linkPos == undefined) {
                if (this.memory.linkPos == undefined) {
                    let road = this.sourceSpawnRoad;
                    let linkPos = road[road.length - 2];
                    this.memory.linkPos = linkPos;
                }
                this._linkPos = this.memory.linkPos;
            }

            // let dot = new RoomVisual(this.room.name);
            // dot.circle(this._linkPos, { fill: 'green' })
            return this.room.getPositionAt(this._linkPos.x, this._linkPos.y);
        },
        enumerable: false,
        configurable: true
    });
}
