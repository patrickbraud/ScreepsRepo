export function roomPrototypes() {

    Object.defineProperty(Room.prototype, 'spawnRequests', {
        get: function() {
            if (!this._spawnRequests) {
                if (!this.memory.spawnRequests) {
                    this.memory.spawnRequests = {};
                }
                this._spawnRequests = this.memory.spawnRequests;
            }
            return this._spawnRequests;
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(Room.prototype, 'jobs', {
        get: function() {
            if (!this._jobs) {
                if (!this.memory.jobs) {
                    this.memory.jobs = {};
                }
                this._jobs = this.memory.jobs;
            }
            return this._jobs;
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

    Object.defineProperty(Room.prototype, 'exits', {
        get: function() {
            if(!this._exits) {
                if (!this.memory.exits) {
                    this.memory.exits = Game.map.describeExits(this.name)
                }
                this._exits = this.memory.exits;
            }
            return this._exits;
        }
    });
}
