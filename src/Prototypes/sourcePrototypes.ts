import { JobType } from "../Enums/JobType";
import { JobStatus } from "../Enums/JobStatus";

export function sourcePrototypes() {

    Object.defineProperty(Source.prototype, 'memory', {
        configurable: true,
        get: function() {
            if(_.isUndefined(Memory.SourceMemory)) {
                Memory.SourceMemory = {};
            }
            if(!_.isObject(Memory.SourceMemory)) {
                return undefined;
            }
            return Memory.SourceMemory[this.id] =
                    Memory.SourceMemory[this.id] || {};
        },
        set: function(value) {
            if(_.isUndefined(Memory.SourceMemory)) {
                Memory.SourceMemory = {};
            }
            if(!_.isObject(Memory.SourceMemory)) {
                throw new Error('Could not set source memory');
            }
            Memory.SourceMemory[this.id] = value;
        }
    });



    // TODO: Create a rolling average of energy harvested per tick


    Object.defineProperty(Source.prototype, 'harvestLocations', {
        get: function (): number {
            if (!this._harvestLocations) {
                // Memory undefined
                if (!this.memory.harvestLocations) {

                    // Cache undefined
                    let harvestLocations: {x: number, y: number}[] = [];

                    // Horizontal increment
                    [this.pos.x - 1, this.pos.x, this.pos.x + 1].forEach(x => {
                        // Vertical increment
                        [this.pos.y - 1, this.pos.y, this.pos.y + 1].forEach(y => {
                            let roomTerrain: RoomTerrain = Game.map.getRoomTerrain(this.room.name)
                            if (roomTerrain.get(x, y) != TERRAIN_MASK_WALL)
                                    harvestLocations.push({x, y});
                                }, this);
                        }, this);

                    this.memory.harvestLocations = harvestLocations;
                }
                this._harvestLocations = this.memory.harvestLocations;
            }
            return this._harvestLocations;
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(Source.prototype, 'totalWorkParts', {
        get: function (): number {
            if (this._totalWorkParts == undefined) {
                this._totalWorkParts = 0;
            }
            return this._totalWorkParts;
        },
        set: function(value: number): void {
            this._totalWorkParts = value;
        },
        enumerable: false,
        configurable: true
    });

    Source.prototype.checkHarvestJobs = function(currentJobs: any[] | undefined) : any | undefined {

        let maxWorkerCount = this.harvestLocations.length;

        let newJob = {
            jobId: this.id,
            jobType: JobType.Harvest,
            identifier: Math.floor(Math.random() * 100000000),
            targetId: this.id,
            body: [5, 1, 6],
            status: JobStatus.Open
        };
        
        if (!currentJobs || currentJobs.length == 0) {
            console.log("Source: " + this.id + "- Submitting request for [5] WORK parts.");
            return newJob;
        }

        currentJobs.forEach(job => {
            let workParts: number = job.body[0];
            this.totalWorkParts += workParts;
        })

        if (this.totalWorkParts < 5 && currentJobs.length < maxWorkerCount) {

            console.log("Source: " + this.id + "- Submitting request for [5] WORK parts.");
            return newJob
        }

        return undefined;
    }
}
