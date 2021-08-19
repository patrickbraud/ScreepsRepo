import { GameManager } from "./GameManager";
import { Spawner } from "./Spawner";
import { Harvester } from "./Creeps/Harvester";
import { RequestManager } from "./RequestManager";
import { RequestType } from "./Enums/RequestType";
import { Logistics } from "./Logistics";
import { TaskManager } from "./TaskManager";
import { CreepType } from "./Enums/CreepType";
import { Transporter } from "./Creeps/Transporter";
import { request } from "http";

export class Colony {

    private _colonyId: number;
    get colonyId() {
        return this._colonyId;
    }
    set colonyId(cID: number) {
        // We found a spawn that doesn't belong to a colony yet
        if (cID == undefined) {
            cID = GameManager.colonyCount;
        }
        this._colonyId = cID;
        this.mainSpawn.memory.colonyId = cID;
    }

    // The main room of the colony
    public mainRoom: Room;

    // All remote mines outside of the colony
    public mines: Room[]

    public controller: StructureController | undefined;
    public mainSpawn: StructureSpawn;

    public creeps: Creep[] = [];
    public creepNames: string[] = [];

    public baseRoomStructures: Structure[];
    public constructionSites: ConstructionSite[];

    public extensions: StructureExtension[];
    public extensionConstructionSites: ConstructionSite[]

    public containers: StructureContainer[];
    public containerConstructionSites: ConstructionSite[]

    public links: StructureLink[]
    public linkConstructionSites: ConstructionSite[]

    public towers: StructureTower[];
    public towerConstructionSites: ConstructionSite[]

    public sources: Source[]

    public droppedResources: Resource[];
    public droppedEnergy: Resource[];

    public spawner: Spawner;
    public requestManager: RequestManager;
    public taskManager: TaskManager;
    public logistics: Logistics;

    public harvesters: Harvester[] = [];
    public transporters: Transporter[] = [];

    constructor(colonySpawn: StructureSpawn) {

        // Set our core colony objects
        // - Main Room
        // - Spawns
        // - Controller
        this.mainRoom = colonySpawn.room;
        this.mainSpawn = colonySpawn;
        this.colonyId = colonySpawn.memory.colonyId
        this.controller = colonySpawn.room.controller;

        // Create our class to handle specific functionality
        // No CPU cost should occur during construction
        this.requestManager = new RequestManager(this);
        this.taskManager = new TaskManager(this);
        this.logistics = new Logistics(this);
        this.spawner = new Spawner(this);
    }

    initialize() {

        // Get all structures/objects in the room
        this.initializeRoomObjects();

        // Get all creeps in the room
        this.initializeCreeps();
    }

    // Game objects update their requests (source/spawn/dropped resource)
    updateRequests(){

        // Sources update their request to maintain 5 WORK parts
        this.sources.forEach(source => {

            let currentRequest = this.requestManager.getRequest(RequestType.Harvest, source.id);
            let newRequest = source.updateRequest(currentRequest);
            if (newRequest) this.requestManager.submitRequest(newRequest);
        });
        
        // All dropped energy updates it's request listing or creates one if it doesn't exist to pick them up
        this.droppedEnergy.forEach(energy => {

            let currentRequest = this.requestManager.getRequest(RequestType.Transport, energy.id);
            let newRequest = energy.updateRequest(currentRequest);
            if (newRequest) this.requestManager.submitRequest(newRequest);
        });


        // Spawns update their energy required request listing, or post one if it doesn't exist
        let currentRequest = this.requestManager.getRequest(RequestType.Transport, this.mainSpawn.id);
        let newRequest = this.mainSpawn.updateRequest(currentRequest);
        if (newRequest) this.requestManager.submitRequest(newRequest);
    }

    // Creeps update their tasks and the respective request
    updateTasks() {

        // Initialize the logistics system used to manage the transporters
        this.logistics.initialize(this.transporters);

        this.harvesters.forEach(harvester => harvester.taskCheckIn());

        // Transporters update their current task info
        this.transporters.forEach(transporter => transporter.taskCheckIn());
        // Any transporter that doesn't have a task gets assigned one
        this.transporters.forEach(transporter => transporter.getTask());
    }

    // Update requests to account for what is planned to be spawned
    updateSpawnRequests() {

        this.spawner.updateRequestsOfType(RequestType.Harvest);
        this.spawner.updateRequestsOfType(RequestType.Transport);
    }

    // Clean up requests/spawns that are no longer valid
    requestCleanup() {

        this.requestManager.cleanupHarvestRequests();
        this.requestManager.cleanupTransportRequests();
    }

    runTasks() {

        this.harvesters.forEach(harvester => harvester.work());
        this.transporters.forEach(transporter => transporter.work());
    }

    spawnIfNecessary() {

        let harvestRequests = this.requestManager.requests[RequestType.Harvest];
        // console.log(JSON.stringify("Harvest Requests: " +  JSON.stringify(harvestRequests)));
        if (harvestRequests) {
            let requests = Object.values(harvestRequests);
            // console.log("Harvest Requests Values: " + JSON.stringify(requests));
            if (requests.length > 0) {
                let choice = _.max(requests, request => request.workRequired);
                // console.log("Choice: " + JSON.stringify(choice))
                if (choice) { 
                    // console.log("Choice: " + choice + "Still spawning it")
                    this.spawner.spawnHarvester(choice);
                    return;
                }
            }
        }

        if (this.harvesters.length > 0) {

            let transportRequests: {[requestId: string]: any} = this.requestManager.requests[RequestType.Transport];
            if (transportRequests) {
                let requests = Object.values(transportRequests);



                let pickupRequests = _.filter(requests, request => request.amount < 0);
                let dropOffpRequests = _.filter(requests, request => request.amount > 0);

                let totalPickup = _.sum(pickupRequests, 'amount');
                let totalDropOff = _.sum(dropOffpRequests, 'amount');
                let pickupDelta = _.sum(pickupRequests, 'delta');
                let dropOffDelta = _.sum(dropOffpRequests, 'delta');
                console.log("Total Pickup: " + totalPickup + " \tDelta: " + pickupDelta);
                console.log("Total DropOff: " + totalDropOff + " \tDelta: " + dropOffDelta);

                console.log("TransporterThroughput: " + this.logistics.avgTransporterThroughput);



                let sortedRequests = _.sortBy(requests, request => -1 * request.amount);
                
                for (let requestCount = 0; requestCount < sortedRequests.length; requestCount++){
                    let request = sortedRequests[requestCount];
                    // Request for pick-up
                    if (request.amount < 0){

                        let requestWorkers = this.transporters.filter(transporter => {
                            return transporter.task && transporter.task.requestId == request.requestId;
                        })
                        

                        // let hasWorker = _.contains(request.requestId, _.values(this.logistics.transporterRequestMatches))
                        // let workerId = this.logistics.transporterRequestMatches[request.requestId];
                        // console.log("requestId: " + request.requestId + " workers: " + requestWorkers.length);
                        if (!requestWorkers || requestWorkers.length <= 0) {
                            this.spawner.spawnTransporter(request);
                            return;
                        }
                    }
                }
                // sortedRequests.forEach(request => {

                //     // Request for pick-up
                //     if (request.amount < 0){

                //         let requestWorkers = this.transporters.filter(transporter => {
                //             return transporter.task && transporter.task.requestId == request.requestId;
                //         })

                //         // let hasWorker = _.contains(request.requestId, _.values(this.logistics.transporterRequestMatches))
                //         // let workerId = this.logistics.transporterRequestMatches[request.requestId];
                //         // console.log("requestId: " + request.requestId + " workers: " + requestWorkers.length);
                //         if (!requestWorkers || requestWorkers.length <= 0) {
                //             this.spawner.spawnTransporter(request);
                //             console.log("same");
                //             return;
                //         }
                //     }
                // });
            }
        }
    }

    private initializeCreeps()
    {
        // Clear dead creeps from memory
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        // Get creeps
        this.creeps = [];
        for (let creepName in Game.creeps) {
            let creep = Game.creeps[creepName];
            if (!creep.spawning) {
                this.creepNames.push(creepName);
                this.creeps.push(creep);

                switch (creep.memory.creepType) {

                    case CreepType.Harvester:
                        this.harvesters.push(new Harvester(creep, this));
                        break;
                    
                    case CreepType.Transporter:
                        this.transporters.push(new Transporter(creep, this));
                        break;
                }
            }
        }
    }

    initializeRoomObjects() {

        // Get all structures & construction sites
        this.baseRoomStructures = this.mainRoom.find(FIND_STRUCTURES);
        this.constructionSites = this.mainRoom.find(FIND_CONSTRUCTION_SITES);

        // Get extensions & extension construction sites
        this.extensions = this.getStructuresOfType(STRUCTURE_EXTENSION) as StructureExtension[];
        this.extensionConstructionSites = this.getConstructionSitesOfType(STRUCTURE_EXTENSION);

        // Get containers & container construction sites
        this.containers = this.getStructuresOfType(STRUCTURE_CONTAINER) as StructureContainer[];
        this.containerConstructionSites = this.getConstructionSitesOfType(STRUCTURE_CONTAINER)

        // Get links & link construction sites
        this.links = this.getStructuresOfType(STRUCTURE_LINK) as StructureLink[];
        this.linkConstructionSites = this.getConstructionSitesOfType(STRUCTURE_LINK)

        // Get towers
        this.towers = this.getStructuresOfType(STRUCTURE_TOWER) as StructureTower[];
        this.towerConstructionSites = this.getConstructionSitesOfType(STRUCTURE_TOWER);

        // Get sources
        this.sources = this.mainRoom.sourcesInRoom;

        // Get resources & split into resource types
        this.droppedResources = this.mainRoom.find(FIND_DROPPED_RESOURCES);
        this.droppedEnergy = this.getResourcesOfType(RESOURCE_ENERGY);
    }

    getSourceByID(sourceID: string): Source | undefined {
        return this.sources.find(source => source.id == sourceID)
    }

    private getStructuresOfType(type: string): Structure[] {
        return this.baseRoomStructures.filter(struct => {
            return struct.structureType == type;
        });
    }

    private getConstructionSitesOfType(type: string): ConstructionSite[] {
        return this.constructionSites.filter(site => {
            return site.structureType == type;
        });
    }

    private getResourcesOfType(type: string): Resource[] {
        return this.droppedResources.filter(resource => {
            return resource.resourceType == type;
        });
    }

    // private distanceTo(creep: Creep, pos: RoomPosition): number {
    //     return Math.sqrt(Math.pow(pos.x - creep.pos.x, 2) + Math.pow(pos.y - creep.pos.y, 2));
    // }

    // private bodyCost(body: string[]): number {

    //     let bodyCost: number = 0;

    //     for (let index = 0; index < body.length; index++) {
    //         let bodyPart: string = body[index];
    //         bodyCost += BODYPART_COST[bodyPart];
    //     }
    //     return bodyCost;
    // }
}
