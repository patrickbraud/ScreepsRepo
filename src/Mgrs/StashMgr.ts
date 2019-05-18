import { RoomMgr } from "./RoomMgr";
import { RoomUtils } from "./RoomUtils";

export class StashMgr {

    containers: Container[];
    containerConstructionSites: ConstructionSite[];

    links: Link[];
    linkConstructionSites: ConstructionSite[];

    // Source stashes
    sourceContainers: {container: Container, source: Source}[];
    sourceContainerConSites: {conSite: ConstructionSite, source: Source}[];

    sourceLinks: {link: Link, source: Source}[];
    sourceLinkConSites: {linkConSite: ConstructionSite, source: Source}[];

    // Controller stashes
    controllerContainer: Container;
    controllerContainerConSite: ConstructionSite;
    controllerContainerPosition: RoomPosition;

    controllerLink: Link;
    controllerLinkConSite: ConstructionSite;

    // Spawn stashes
    spawnContainer: Container;
    spawnContainerConSite: ConstructionSite;
    spawnEnergyDropPosition: RoomPosition;

    spawnLink: Link;
    spawnLinkConSite: ConstructionSite;

    private _roomMgr: RoomMgr;

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;
        this.sourceContainers = [];
        this.sourceContainerConSites = [];
        this.sourceLinks = [];
        this.sourceLinkConSites = [];
        this._loadStashes();
    }

    private _loadStashes() {
        this.containers = this._roomMgr.getStructuresOfType(STRUCTURE_CONTAINER) as Container[];
        this.containerConstructionSites = this._roomMgr.getConstructionSitesOfType(STRUCTURE_CONTAINER);

        this.links = this._roomMgr.getStructuresOfType(STRUCTURE_LINK) as Link[];
        this.linkConstructionSites = this._roomMgr.getConstructionSitesOfType(STRUCTURE_LINK);

        this.sourceContainers = this._roomMgr.baseRoom.sourceContainers;
        this.sourceContainerConSites = this._roomMgr.baseRoom.sourceContainerConSites;

        this.sourceLinks = this._roomMgr.baseRoom.sourceLinks;
        this.sourceLinkConSites = this._roomMgr.baseRoom.sourceLinkConSites;

        // Load our spawn/controller containers or container construction sites
        // If they don't exist, load the best position for them as a drop point
        this.loadSpawnStashes(this._roomMgr.baseRoomSpawn);
        this.loadControllerStash(this._roomMgr.baseRoomController);
    }

    createNeededStashes() {
        let controllerLevel = this._roomMgr.baseRoomController.level;
        if (controllerLevel >= 2) {

            // Check our list of all sources compared against our list of sources with containers
            // if the we find a source that isn't in our sourceContainer list, it needs a container
            for (let source of this._roomMgr.sourceMgr.sources) {

                let sourceContainer = this.getContainerForSource(source);
                if (sourceContainer == undefined) {

                    let sourceContainerConSite = this.getContainerConSiteForSource(source);
                    if (sourceContainerConSite == undefined) {
                        let conSitePos = source.containerPos;
                        source.room.createConstructionSite(conSitePos, STRUCTURE_CONTAINER);
                    }
                }

                // At 5 we get 2 links
                // Place 1 at a source, and the other at spawn
                if (controllerLevel >= 5) {
                    if (this.sourceLinks.length == 0) {

                        let sourceLink = this.getLinkForSource(source);
                        if (sourceLink == undefined) {

                            let sourceLinkConSite = this.getLinkConSiteForSource(source);
                            if (sourceLinkConSite == undefined && (this.sourceLinkConSites.length == 0 || controllerLevel >= 6)) {
                                let conSitePos = source.linkPos;
                                source.room.createConstructionSite(conSitePos, STRUCTURE_LINK);
                            }
                        }
                    }
                }
            }

            if (this.spawnContainer == undefined && this.spawnContainerConSite == undefined) {
                this._roomMgr.baseRoom.createConstructionSite(this.spawnEnergyDropPosition, STRUCTURE_CONTAINER);
            }

            if (this.spawnLink == undefined && this.spawnLinkConSite == undefined) {
                let spawnlinkPos = this._getBestSpawnStoragePosition(this._roomMgr.baseRoomSpawn, 4);
                this._roomMgr.baseRoom.createConstructionSite(spawnlinkPos, STRUCTURE_LINK);
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

        // let sourceContainerPos = source.containerPos;

        // let lookResult = source.room.lookForAt(LOOK_STRUCTURES, sourceContainerPos);

    }

    loadSpawnStashes(spawn: Spawn) {

        let bestSpawnLinkPos = this._getBestSpawnStoragePosition(spawn, 4);

        // If the best position has a link, store it
        let linkFound = _.find(this.links, function (link) { return link.pos.isEqualTo(bestSpawnLinkPos) });
        if (linkFound) {
            this.spawnLink = linkFound;
        }

        // If the best position has a container construction site, store that
        let linkConSiteFound = _.find(this.linkConstructionSites, function (link) { return link.pos.isEqualTo(bestSpawnLinkPos) });
        if (linkConSiteFound) {
            this.spawnLinkConSite = linkConSiteFound;
        }

        let bestSpawnContainerPos = this._getBestSpawnStoragePosition(spawn, 3);

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
        //let dot = new RoomVisual(controller.room.name);
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

    // Get Link Methods
    // -----------------
    getLinkForSource(source: Source): Link {
        for (let sourceLink of this.sourceLinks) {
            if (sourceLink.source.id == source.id) {
                return sourceLink.link;
            }
        }

        return undefined;
    }

    getLinkByID(linkId: string): Link {
        for (let sourceLink of this.sourceLinks) {
            if (sourceLink.link.id == linkId) {
                return sourceLink.link;
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

    getLinkConSiteForSource(source: Source): ConstructionSite {
        for (let sourceConSite of this.sourceLinkConSites) {
            if (sourceConSite.source.id == source.id) {
                return sourceConSite.linkConSite;
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

    private _getBestSpawnStoragePosition(spawn: Spawn, spacesFromCenter: number): RoomPosition {
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

        let bestSpawnStoragePos: RoomPosition;
        if (closeststashPosition.length == 2) {
            // Get the midpoint between the 2 closest stash positions
            let midPosition = RoomUtils.midPoint(closeststashPosition[0], closeststashPosition[1]);
            bestSpawnStoragePos = midPosition;
            //dot.circle(bestSpawnStoragePos, { fill: 'green' })
        }
        else {
            bestSpawnStoragePos = closeststashPosition[0];
        }

        return bestSpawnStoragePos;
    }
}

