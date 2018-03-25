import { RoomMgr } from "./RoomMgr";
import { RoomUtils } from "./RoomUtils";

export class StashMgr {

    containers: Container[];
    containerConstructionSites: ConstructionSite[];

    sourceContainers: {container: Container, source: Source}[];
    sourceContainerConSites: {conSite: ConstructionSite, source}[];

    controllerContainer: Container;
    controllerContainerConSite: ConstructionSite;
    controllerContainerPosition: RoomPosition;

    spawnContainer: Container;
    spawnContainerConSite: ConstructionSite;
    spawnEnergyDropPosition: RoomPosition;

    private _roomMgr: RoomMgr;

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;
        this.sourceContainers = [];
        this.sourceContainerConSites = [];
        this._loadStashes();
    }

    private _loadStashes() {
        this.containers = this._roomMgr.getStructuresOfType(STRUCTURE_CONTAINER) as Container[];
        this.containerConstructionSites = this._roomMgr.getConstructionSitesOfType(STRUCTURE_CONTAINER);

        if (this.containers.length > 0 || this.containerConstructionSites.length > 0) {
            // Load any container or container construction sites around our sources
            for (let source of this._roomMgr.sourceMgr.sources) {
                this.loadSourceStash(source);
            }
        }

        // Load our spawn/controller containers or container construction sites
        // If they doesn't exist, load the best position for them as a drop point
        this.loadSpawnStash(this._roomMgr.baseRoomSpawn);
        this.loadControllerStash(this._roomMgr.baseRoomController);
    }

    createNeededStashes() {
        if (this._roomMgr.baseRoomController.level >= 2) {

            // Check our list of all sources compared against our list of sources with containers
            // if the we find a source that isn't in our sourceContainer list, it needs a container
            for (let source of this._roomMgr.sourceMgr.sources) {

                let hasContainer = this.sourceContainers.find(sourceContainer => {
                    return sourceContainer.source.id == source.id;
                });

                if (hasContainer == undefined) {

                    let hasConSite = this.sourceContainerConSites.find(sourceConSite => {
                        return sourceConSite.source.id == source.id;
                    });

                    if (hasConSite == undefined) {
                        let conSitePos = this._getBestSourceContainerPos(RoomUtils.validPositions(source, ['wall']));
                        source.room.createConstructionSite(conSitePos, STRUCTURE_CONTAINER);
                    }
                }
            }

            if (this.spawnContainer == undefined && this.spawnContainerConSite == undefined) {
                this._roomMgr.baseRoom.createConstructionSite(this.spawnEnergyDropPosition, STRUCTURE_CONTAINER);
            }

            if (this.controllerContainer == undefined && this.controllerContainerConSite == undefined) {
                this._roomMgr.baseRoom.createConstructionSite(this.controllerContainerPosition, STRUCTURE_CONTAINER);
            }
        }
    }

    getSpawnContainerPos(): RoomPosition {
        if (this.spawnContainer != undefined) {
            return this.spawnContainer.pos;
        }
        else if (this.spawnContainerConSite != undefined) {
            return this.spawnContainerConSite.pos;
        }

        return this.spawnEnergyDropPosition;
    }

    getControllerContainerPos(): RoomPosition {
        if (this.controllerContainer != undefined) {
            return this.controllerContainer.pos;
        }
        else if (this.controllerContainerConSite != undefined) {
            return this.controllerContainerConSite.pos;
        }
        else if (this.controllerContainerPosition != undefined) {
            return this.controllerContainerPosition;
        }

        let possibleContainerPositions = RoomUtils.getBoxPositions(3, this._roomMgr.baseRoomController.pos);
        for (let pos of possibleContainerPositions) {
            if (!RoomUtils.positionIsTerrainType(pos, 'wall') && RoomUtils.validPositions(pos, ['wall']).length >= 7) {
                this.controllerContainerPosition = pos;
                break;
            }
        }

        return this.controllerContainerPosition;
    }

    loadSourceStash(source: Source) {
        let containerFound: Container;
        let containerConstructionFound: ConstructionSite;
        let validPositions = RoomUtils.validPositions(source, ['wall']);

        if (validPositions.length > 0) {
            // check each possible container postion around the source
            for (let pos of validPositions) {

                if (this.containers.length > 0) {
                    // Check if this source has a container around it
                    containerFound = this.containers.find(container => {
                        return container.pos.isEqualTo(pos);
                    });
                    if (containerFound) {
                        let sourceContainer = {
                            container: containerFound,
                            source: source
                        }
                        this.sourceContainers.push(sourceContainer)
                        break;
                    }
                }

                if (this.containerConstructionSites.length > 0) {
                    // Check if this source has any container construction sites around it
                    containerConstructionFound = this.containerConstructionSites.find(consite => {
                        return consite.pos.isEqualTo(pos);
                    });
                    if (containerConstructionFound) {
                        let sourceConSite = {
                            conSite: containerConstructionFound,
                            source: source
                        }
                        this.sourceContainerConSites.push(sourceConSite);
                        break;
                    }
                }
            }
        }
    }

    loadSpawnStash(spawn: Spawn) {

        let spacesFromCenter = 3;
        let boxPositions = RoomUtils.getBoxPositions(spacesFromCenter, spawn.pos);
        //let dot = new RoomVisual(spawn.room.name);
        // for (let pos of boxPositions) {
        //     dot.circle(pos, {fill: 'orange'});
        // }

        // Get a box around the spawn, and keep only the valid positions
        let validBoxPositions = _.filter(boxPositions, function(pos) { return !RoomUtils.positionIsTerrainType(pos, 'wall') });
        // Get the closest positions to our sources
        let closeststashPosition: RoomPosition[] = [];
        for (let source of this._roomMgr.sourceMgr.sources) {
             validBoxPositions.sort((a: RoomPosition, b: RoomPosition): number => { return (RoomUtils.distanceTo(a, source.pos) - RoomUtils.distanceTo(b, source.pos))});
            //dot.circle(validBoxPositions[0], {fill: 'red'});
            closeststashPosition.push(validBoxPositions[0]);
        }

        let bestSpawnContainerPos: RoomPosition;
        if (closeststashPosition.length == 2) {
            // Get the midpoint between the 2 closest stash positions
            let midPosition = RoomUtils.midPoint(closeststashPosition[0], closeststashPosition[1]);
            //dot.circle(midPosition, { fill: 'green' })
            bestSpawnContainerPos = midPosition;
        }
        else {
            bestSpawnContainerPos = closeststashPosition[0];
        }

        // If the best position has a container, store it
        let containerFound = _.find(this.containers, function (container) { return container.pos.isEqualTo(bestSpawnContainerPos) });
        if (containerFound) {
            this.spawnContainer = containerFound;
            this.spawnEnergyDropPosition = this.spawnContainer.pos;
            return;
        }

        // If the best position has a container construction site, store that
        let containerConSiteFound = _.find(this.containerConstructionSites, function (container) { return container.pos.isEqualTo(bestSpawnContainerPos) });
        if (containerConSiteFound) {
            this.spawnContainerConSite = containerConSiteFound;
            this.spawnEnergyDropPosition = this.spawnContainerConSite.pos;
            return;
        }

        // otherwise, mark the energy drop off point
        this.spawnEnergyDropPosition = bestSpawnContainerPos;
    }

    loadControllerStash(controller: Controller) {
        let spacesFromCenter = 4;
        let boxPositions = RoomUtils.getBoxPositions(spacesFromCenter, controller.pos);
        // let dot = new RoomVisual(controller.room.name);
        // for (let pos of boxPositions) {
        //     dot.circle(pos, {fill: 'orange'});
        // }

        // Get a box around the spawn, and keep only the valid positions
        let validBoxPositions = _.filter(boxPositions, function(pos) {
            return !RoomUtils.positionIsTerrainType(pos, 'wall')
                    && RoomUtils.validPositions(pos, ['wall']).length > 7
        });
        // Get the closest positions to our spawn drop point
        validBoxPositions.sort((a: RoomPosition, b: RoomPosition): number => {
            return (RoomUtils.distanceTo(a, this.spawnEnergyDropPosition) - RoomUtils.distanceTo(b, this.spawnEnergyDropPosition)
        )});
        //dot.circle(validBoxPositions[0], {fill: 'red'});


        let bestControllerContainerPos: RoomPosition = validBoxPositions[0];

        // If the best position has a container, store it
        let containerFound = _.find(this.containers, function (container) { return container.pos.isEqualTo(bestControllerContainerPos) });
        if (containerFound) {
            this.controllerContainer = containerFound;
            this.controllerContainerPosition = this.controllerContainer.pos;
            return;
        }

        // If the best position has a container construction site, store that
        let containerConSiteFound = _.find(this.containerConstructionSites, function (container) { return container.pos.isEqualTo(bestControllerContainerPos) });
        if (containerConSiteFound) {
            this.controllerContainerConSite = containerConSiteFound;
            this.controllerContainerPosition = this.controllerContainerConSite.pos
            return;
        }

        // otherwise store the position for use later
        this.controllerContainerPosition = bestControllerContainerPos;
    }

    // Get Container Methods
    // ---------------------
    getContainerByID(containerID: string): Container {
        for (let sourceContainer of this.sourceContainers) {
            if (sourceContainer.container.id == containerID) {
                return sourceContainer.container;
            }
        }

        return undefined;
    }

    getContainerForSource(source: Source): Container {
        for (let sourceContainer of this.sourceContainers) {
            if (sourceContainer.source.id == source.id) {
                return sourceContainer.container;
            }
        }

        return undefined;
    }

    // Get Construction Site methods
    // -----------------------------
    getContainerConSiteByID(conSiteID: string): ConstructionSite {
        for (let sourceConSite of this.sourceContainerConSites) {
            if (sourceConSite.conSite.id == conSiteID) {
                return sourceConSite.conSite;
            }
        }

        return undefined;
    }

    getContainerConSiteForSource(source: Source): ConstructionSite {
        for (let sourceConSite of this.sourceContainerConSites) {
            if (sourceConSite.source.id == source.id) {
                return sourceConSite.conSite;
            }
        }

        return undefined;
    }

    // Get Source Methods
    // ------------------
    getSourceForContainer(container: Container): Source {
        for (let sourceContainer of this.sourceContainers) {
            if (sourceContainer.container.id == container.id) {
                return sourceContainer.source;
            }
        }

        return undefined;
    }

    getSourceForContainerConSite(conSite: ConstructionSite) {
        for (let sourceConSite of this.sourceContainerConSites) {
            if (sourceConSite.conSite.id == conSite.id) {
                return sourceConSite.source;
            }
        }

        return undefined;
    }

    private _getBestSourceContainerPos(validPositions: RoomPosition[]) {
        let bestPos = null;
        let maxCount = 0;
        for(let pos of validPositions) {
            //let maxValidPositions = this.validPositionCount(pos, 'wall');
            let maxValidPositions = RoomUtils.validPositions(pos, ['wall']).length;
            if (bestPos == null || maxValidPositions > maxCount) {
                bestPos = pos;
                maxCount = maxValidPositions;
            }
        }
        return bestPos;
    }
}

