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

                let srcConts: { container: Container, source: Source }[] = [];
                for (let source of this.sourcesInRoom) {
                    let pos = source.containerPos;
                    let lookResult = this.lookForAt(LOOK_STRUCTURES, pos);
                    let containerFound: Container = lookResult.find(structure => { return structure.structureType == STRUCTURE_CONTAINER });
                    if (containerFound != undefined) {
                        srcConts.push({container: containerFound, source: source})
                    }
                }
                this._sourceContainers = srcConts;
            }
            return this._sourceContainers;
        }
    });

    Object.defineProperty(Room.prototype, 'sourceLinks', {
        get: function() {
            if(!this._sourceLinks) {

                let srcLinks: { link: Link, source: Source }[] = [];
                for (let source of this.sourcesInRoom) {
                    let pos = source.linkPos;
                    let lookResult = this.lookForAt(LOOK_STRUCTURES, pos);
                    let linkFound: Link = lookResult.find(structure => { return structure.structureType == STRUCTURE_LINK });
                    if (linkFound != undefined) {
                        srcLinks.push({link: linkFound, source: source})
                    }
                }
                this._sourceLinks = srcLinks;
            }
            return this._sourceLinks;
        }
    });

    Object.defineProperty(Room.prototype, 'sourceContainerConSites', {
        get: function() {
            if(!this._sourceContainerConSites) {

                let srcConts: { conSite: ConstructionSite, source: Source }[] = [];
                for (let source of this.sourcesInRoom) {
                    let pos = source.containerPos;
                    let lookResult = this.lookForAt(LOOK_CONSTRUCTION_SITES, pos);
                    if (lookResult.length > 0 && lookResult[0].structureType == STRUCTURE_CONTAINER) {
                        srcConts.push({conSite: lookResult[0], source: source})
                    }
                }
                this._sourceContainerConSites = srcConts;
            }
            return this._sourceContainerConSites;
        }
    });

    Object.defineProperty(Room.prototype, 'sourceLinkConSites', {
        get: function() {
            if(!this._sourceLinkConSites) {

                let srcLinkConSites: { linkConSite: ConstructionSite, source: Source }[] = [];
                for (let source of this.sourcesInRoom) {
                    let pos = source.linkPos;
                    let lookResult = this.lookForAt(LOOK_CONSTRUCTION_SITES, pos);
                    if (lookResult.length > 0 && lookResult[0].structureType == STRUCTURE_LINK) {
                        srcLinkConSites.push({linkConSite: lookResult[0], source: source})
                    }
                }
                this._sourceLinkConSites = srcLinkConSites;
            }
            return this._sourceLinkConSites;
        }
    });
}
