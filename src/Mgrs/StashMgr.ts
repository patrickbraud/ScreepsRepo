import { RoomMgr } from "./RoomMgr";

export class StashMgr {

    containers: Container[];
    containerConstructionSites: ConstructionSite[];

    sourceContainers: {container: Container, source: Source}[];
    sourceConstructionSites: {conSite: ConstructionSite, source}[];

    private _roomMgr: RoomMgr;

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;
        this.sourceContainers = [];
        this.sourceConstructionSites = [];
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
                                this.sourceConstructionSites.push(sourceConSite);
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

                    let hasConSite = this.sourceConstructionSites.find(sourceConSite => {
                        return sourceConSite.source.id == source.id;
                    });

                    if (hasConSite == undefined) {
                        let conSitePos = this._getBestContainerPos(RoomMgr.validPositions(source, ['wall']));
                        source.room.createConstructionSite(conSitePos, STRUCTURE_CONTAINER);
                    }
                }

            }
        }
    }

    spawnNeededTransporters(): Boolean {
        let spawnRequested: Boolean = false;

        // Get all transport creeps whose target container doesn't exist anymore
        let toBeTransitioned: Creep[] = this._roomMgr.transporters.filter( creep => {
            return this.containers.find(container => {
                return container.id == creep.id;
            })
            //return !(this.containers.hasOwnProperty(creep.memory.TargetContainerID));
        })

        // If there are any container construction sites,
        // then spawn ### transporters per site. They will build
        // the site, then transition into true transporters
        for (let conSite of this.containerConstructionSites) {
            // all transporter creeps who are targeting this construction site as their container
            let containerBuilders = this._roomMgr.transporters.filter( creep => {
                return creep.memory.TargetContainerID == conSite.id;
            });

            if (containerBuilders.length < 1) {
                // Spawn container builder (transporter)
                // Work [WORK, CARRY, MOVE, CARRY, CARRY, MOVE, MOVE]
                // maxWork: 1, maxCarry: 2, maxMove: 2, priority: [CARRY, MOVE, WORK]
                // TargetContainerID = conSite.id
                spawnRequested = true;
                this._roomMgr.baseRoomSpawn.spawnTransporter(conSite, true);
                return;
            }
        }

        for (let container of this.containers) {
            // all transporter creeps who are targeting this container
            let transporters = this._roomMgr.transporters.filter( creep => {
                return creep.memory.TargetContainerID == container.id;
            });

            // Transition transporters who were targeting a container that has been finished
            let neededCreeps = 3 - transporters.length;
            for (; neededCreeps > 0 && toBeTransitioned.length > 0; neededCreeps--) {
                let transitionedCreep: Creep = toBeTransitioned.pop();
                transitionedCreep.memory.TargetContainerID = container.id;
                transporters.push(transitionedCreep);
            }

            // If we still don't have enough transporters after transitioning, spawn more
            if (transporters.length < 3) {
                // true transporter
                // Balance same # of MOVE parts as non-MOVE parts for plains
                // --------half # of MOVE parts as non-MOVE parts for roads
                // maxCarry: 5, maxMove: 5, priority: [CARRY, MOVE, WORK], balance: [MOVE, CARRY]
                // TargetContainerID = container.id
                this._roomMgr.baseRoomSpawn.spawnTransporter(container, false);
                return;
            }
        }

        return spawnRequested;
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
        for (let sourceConSite of this.sourceConstructionSites) {
            if (sourceConSite.conSite.id == conSiteID) {
                return sourceConSite.conSite;
            }
        }

        return undefined;
    }

    getContainerConSiteForSource(source: Source): ConstructionSite {
        for (let sourceConSite of this.sourceConstructionSites) {
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
        for (let sourceConSite of this.sourceConstructionSites) {
            if (sourceConSite.conSite.id == conSite.id) {
                return sourceConSite.source;
            }
        }

        return undefined;
    }

    private _getBestContainerPos(validPositions: RoomPosition[]) {
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

