export function roomPrototypes() {

    Room.prototype.positionIsValid = function(pos: RoomPosition): Boolean {
        let lookResult = this.lookForAt(LOOK_TERRAIN, pos);
            //console.log('x: ' + pos.x + ' y: ' + pos.y + ' - ' + lookResult.toString() + ' - ' + (lookResult.toString() != 'wall'));
            return !(lookResult.toString() == 'wall');
    }

    Object.defineProperty(Room.prototype, 'sourcesInRoom', {
        get: function() {
                // If we dont have the value stored locally
            if (!this._sources) {
                    // If we dont have the value stored in memory
                if (!this.memory.sourceIds) {
                        // Find the sources and store their id's in memory,
                        // NOT the full objects
                    this.memory.sourceIds = this.find(FIND_SOURCES).map(source => source.id);
                }
                // Get the source objects from the id's in memory and store them locally
                this._sources = this.memory.sourceIds.map(id => Game.getObjectById(id));
            }
            // return the locally stored value
            return this._sources;
        },
        set: function(newValue) {
            // when storing in memory you will want to change the setter
            // to set the memory value as well as the local value
            this.memory.sources = newValue.map(source => source.id);
            this._sources = newValue;
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(Room.prototype, 'sourceContainers', {
        get: function() {

            if(!this._sourceContainers) {

                let srcConts: { source: Source, container: Container }[] = [];
                for (let source of this.sourcesInRoom) {

                    let look = this.lookForAtArea(LOOK_STRUCTURES, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
                    for (let result = 0; result < look.length; result++) {
                        if (look[result].structure.structureType == STRUCTURE_CONTAINER) {
                            srcConts.push({source: source, container: look[result]})
                        }
                    }
                }
                this._sourceContainers = srcConts;
            }
            return this._sourceContainers;
        }
    });

    Object.defineProperty(Room.prototype, 'sourceRoads', {
        get: function() {

        }
    });
}
