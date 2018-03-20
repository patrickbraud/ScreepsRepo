import { RoomMgr } from "./RoomMgr";

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
            for (let source of this._roomMgr.sourceMgr.sources) {

                let containerFound: Container;
                let containerConstructionFound: ConstructionSite;
                let validPositions = RoomMgr.validPositions(source, ['wall']);

                if (validPositions.length > 0) {
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
        }
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
                        let conSitePos = this._getBestSourceContainerPos(RoomMgr.validPositions(source, ['wall']));
                        source.room.createConstructionSite(conSitePos, STRUCTURE_CONTAINER);
                    }
                }
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
        else if (this.spawnEnergyDropPosition != undefined) {
            return this.spawnEnergyDropPosition;
        }

        this.spawnEnergyDropPosition = new RoomPosition(this._roomMgr.baseRoomSpawn.pos.x, this._roomMgr.baseRoomSpawn.pos.y + 4, this._roomMgr.baseRoomSpawn.room.name);

        return this.spawnEnergyDropPosition;
    }

    getControllerContainerPos(): RoomPosition {
        if (this.controllerContainer != undefined) {
            return this.controllerContainer.pos;
        }
        else if (this.controllerContainerConSite != undefined) {
            return this.controllerContainerConSite.pos;
        }

        let possibleContainerPositions = RoomMgr.getBoxPositions(3, this._roomMgr.baseRoomController.pos);
        for (let pos of possibleContainerPositions) {
            if (!RoomMgr.positionIsTerrainType(pos, 'wall') && RoomMgr.validPositions(pos, ['wall']).length >= 7) {
                this.controllerContainerPosition = pos;
                break;
            }
        }

        return this.controllerContainerPosition;
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
            let maxValidPositions = this.validPositionCount(pos, 'wall');
            if (bestPos == null || maxValidPositions > maxCount) {
                bestPos = pos;
                maxCount = maxValidPositions;
            }
        }
        return bestPos;
    }

    private validPositionCount(centerPos: RoomPosition, invalidTerrain: string) {
        let validPositionCount: number = 0;
         /*
            x * *
            * O *
            * * y
            Start at the x, end at the y
        */
        let currentPos = new RoomPosition(centerPos.x - 1, centerPos.y - 1, centerPos.roomName);
        for (let xCount = 0; xCount < 3; xCount++, currentPos.x++) {
            for (let yCount = 0; yCount < 3; yCount++, currentPos.y++) {
                if (!currentPos.isEqualTo(centerPos)) {
                    let isWall = RoomMgr.positionIsTerrainType(currentPos, invalidTerrain);
                    if (!isWall) {
                        validPositionCount++
                    }
                }
            }
            currentPos.y -= 3;
        }
        return validPositionCount;
    }
}

