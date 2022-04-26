export function roomPrototypes() {

    Object.defineProperty(Room.prototype, 'requests', {
        get: function() {
            if (!this._requests) {
                if (!this.memory.requests) {
                    this.memory.requests = {};
                }
                this._requests = this.memory.requests;
            }
            return this._requests;
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(Room.prototype, 'avgTransporterThroughput', {
        get: function() {
            if (!this._avgTransporterThroughput) {
                if (!this.memory.avgTransporterThroughput) {
                    this.memory.avgTransporterThroughput = 0;
                }
                this._avgTransporterThroughput = this.memory.avgTransporterThroughput;
            }
            return this._avgTransporterThroughput;
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(Room.prototype, 'transporterThroughputHistory', {
        get: function() {
            if (!this._transporterThroughputHistory) {
                if (!this.memory.transporterThroughputHistory) {
                    this.memory.transporterThroughputHistory = {};
                }
                this._transporterThroughputHistory = this.memory.transporterThroughputHistory;
            }
            return this._transporterThroughputHistory;
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(Room.prototype, 'tasks', {
        get: function() {
            if (!this._tasks) {
                if (!this.memory.tasks) {
                    this.memory.tasks = {};
                }
                this._tasks = this.memory.tasks;
            }
            return this._tasks;
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(Room.prototype, 'spawnQueue', {
        get: function() {
            if (!this._spawnQueue) {
                if (!this.memory.spawnQueue) {
                    this.memory.spawnQueue = {};
                }
                this._spawnQueue = this.memory.spawnQueue;
            }
            return this._spawnQueue;
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(Room.prototype, 'sourcesInRoom', {
        get: function() {
                // If we dont have the value stored locally
            if (!this._sources) {
                    // If we dont have the value stored in memory
                if (!this.memory.sourceIds) {
                        // Find the sources and store their id's in memory,
                        // NOT the full objects
                    this.memory.sourceIds = this.find(FIND_SOURCES).map((source: Source) => source.id);
                }
                // Get the source objects from the id's in memory and store them locally
                this._sources = this.memory.sourceIds.map((id: string) => Game.getObjectById(id));
            }
            // return the locally stored value
            return this._sources;
        },
        set: function(newValue) {
            // when storing in memory you will want to change the setter
            // to set the memory value as well as the local value
            this.memory.sources = newValue.map((source: Source) => source.id);
            this._sources = newValue;
        },
        enumerable: false,
        configurable: true
    });

    // Object.defineProperty(Room.prototype, 'exits', {
    //     get: function() {
    //         if(!this._exits) {
    //             if (!this.memory.exits) {
    //                 this.memory.exits = Game.map.describeExits(this.name)
    //             }
    //             this._exits = this.memory.exits;
    //         }
    //         return this._exits;
    //     }
    // });
}
