import { RoomMgr } from "./RoomMgr";
import { SourceMgr } from "./SourceMgr";

export class StashMgr {

    containers: Container[];
    containerConstructionSites: ConstructionSite[];

    sourcesWithContainers: Source[];

    //storages: Storage[];

    private _roomMgr: RoomMgr;

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;
        this.sourcesWithContainers = [];

        this._loadStashes();
    }

    private _loadStashes() {
        this.containers = this._roomMgr.getStructuresOfType(STRUCTURE_CONTAINER) as Container[];
        this.containerConstructionSites = this._roomMgr.getConstructionSitesOfType(STRUCTURE_CONTAINER);
    }

    createNeededStashes() {
        if (this._roomMgr.baseRoomController.level >= 2) {
            // Create a single container for each source
            for (let source of this._roomMgr.sourceMgr.sources) {

                let containerFound: Boolean = false;
                let containerConstructionFound: Boolean = false;
                let validPositions = SourceMgr.validPositions(source);

                if (validPositions.length > 0) {
                    for (let pos of validPositions) {
                        // Check if this source has a container around it
                        containerFound = this.containers.filter(container => {
                            return container.pos.isEqualTo(pos);
                        }).length > 0;

                        // Check if this source has any container construction sites around it
                        containerConstructionFound = this.containerConstructionSites.filter(site => {
                            return site.pos.isEqualTo(pos);
                        }).length > 0;


                        if (containerFound || containerConstructionFound) {
                            if (containerFound) {
                                this.sourcesWithContainers.push(source);
                            }
                            break;
                        }
                    }
                    if (!containerFound && !containerConstructionFound) {
                        let conSitePos = this._getBestContainerPos(validPositions);
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

    private _getBestContainerPos(validPositions: RoomPosition[]) {
        let bestPos = null;
        let maxCount = 0;
        for(let pos of validPositions) {
            let maxValidPositions = this.validPositionCount(pos);
            if (bestPos == null || maxValidPositions > maxCount) {
                bestPos = pos;
                maxCount = maxValidPositions;
            }
        }
        return bestPos;
    }

    private validPositionCount(centerPos: RoomPosition) {
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
                    let isWall = SourceMgr.positionIsTerrainType(currentPos, 'wall');
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

