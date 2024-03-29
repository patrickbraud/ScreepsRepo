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
import { Upgrader } from "./Creeps/Upgrader";

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

    public controller: StructureController;
    public controllerReserve: RoomPosition;

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
    public upgraders: Upgrader[] = [];

    constructor(colonySpawn: StructureSpawn) {

        // Set our core colony objects
        // - Main Room
        // - Spawns
        // - Controller
        this.mainRoom = colonySpawn.room;
        this.mainSpawn = colonySpawn;
        this.colonyId = colonySpawn.memory.colonyId;
        this.controller = colonySpawn.room.controller as StructureController;
        this.controllerReserve = this.controller.getEnergyDump(this.mainSpawn);

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

        console.log('----------------------------- Requests -------------------------------------')

        // Sources update their request to maintain 5 WORK parts
        this.sources.forEach(source => {

            let currentRequest = this.requestManager.getRequest(RequestType.Harvest, source.id);
            let newRequest = source.updateRequest(currentRequest);
            if (newRequest) this.requestManager.submitRequest(newRequest);
        });
        
        // All dropped energy updates it's request listing or creates one if it doesn't exist to pick them up
        this.droppedEnergy.forEach(energy => {

            let currentRequest = this.requestManager.getRequest(RequestType.Transport, energy.id);
            let newRequest = energy.updateRequest(currentRequest, [this.controllerReserve, this.mainSpawn.energyDump]);
            if (newRequest) this.requestManager.submitRequest(newRequest);
        });

        // Spawns update their energy required request listing, or post one if it doesn't exist
        let currentRequest = this.requestManager.getRequest(RequestType.Transport, this.mainSpawn.id);
        let requestUpdate = this.mainSpawn.updateRequest(currentRequest);
        if (requestUpdate) this.requestManager.submitRequest(requestUpdate);
        else               this.requestManager.removeRequest(RequestType.Transport, this.mainSpawn.id)

        // Controllers update their energy required request listing, or post one if it doesn't exist
        let energyDumpRequest = this.requestManager.getRequest(RequestType.Transport, this.controller.id);
        let newEnergyDumpRequest = this.controller.updateEnergyRequest(energyDumpRequest, this.mainSpawn);
        if (newEnergyDumpRequest) this.requestManager.submitRequest(newEnergyDumpRequest);
        else                      this.requestManager.removeRequest(RequestType.Transport, this.controller.id)

        // Controllers update their upgrade request
        let upgradeRequest = this.requestManager.getRequest(RequestType.Upgrade, this.controller.id);
        let updateUpgradeRequest = this.controller.updateUpgradeRequest(upgradeRequest);
        if (updateUpgradeRequest) this.requestManager.submitRequest(updateUpgradeRequest);
        console.log('----------------------------------------------------------------------------')
    }

    // Creeps update their tasks and the respective request
    updateTasks() {

        // Initialize the logistics system used to manage the transporters
        this.logistics.initialize(this.transporters);

        this.harvesters.forEach(harvester => harvester.taskCheckIn());
        this.upgraders.forEach(upgrader => upgrader.taskCheckIn());

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
        this.upgraders.forEach(upgrader => upgrader.work());

        console.log('--------------------------- Transport Map ----------------------------------')
        this.transporters.forEach(transporter => transporter.work());
        console.log('----------------------------------------------------------------------------')
    }

    spawnIfNecessary() {

        if (this.harvesters.length > 0) {

            let transportRequests: {[requestId: string]: any} = this.requestManager.requests[RequestType.Transport];
            if (transportRequests) {
                let requests = Object.values(transportRequests);
                let sortedRequests = _.sortBy(requests, request => 1 * request.amount);
                
                for (let requestCount = 0; requestCount < sortedRequests.length; requestCount++){
                    let request = sortedRequests[requestCount];
                    // Request for pick-up
                    if (request.amount < 0){

                        let requestWorkers = this.transporters.filter(transporter => {
                            return transporter.task && transporter.task.requestId == request.requestId;
                        })
                        
                        if (!requestWorkers || requestWorkers.length <= 0) {

                            let dryRunResult = this.spawner.spawnTransporterDryRun(request);
                            if (dryRunResult) { 
                                this.spawner.spawnTransporter(request, dryRunResult.body);
                                return;
                            }
                        }
                    }
                }
            }
        }

        let harvestRequests = this.requestManager.requests[RequestType.Harvest];
        if (harvestRequests) {
            let requests = Object.values(harvestRequests);
            if (requests.length > 0) {
                let choice = _.max(requests, request => request.workRequired);
                if (choice) { 
                    this.spawner.spawnHarvester(choice);
                    return;
                }
            }
        }

        let upgraderRequests = this.requestManager.requests[RequestType.Upgrade];
        if (upgraderRequests) {
            let requests = Object.values(upgraderRequests);
            if (requests.length > 0) {
                let request = requests[0];
                if (request.amount > 1){
                    let dryRunResult = this.spawner.spawnUpgraderDryRun(request);
                    if (dryRunResult){ 
                        this.spawner.spawnUpgrader(request, dryRunResult.body);
                        return;
                    }
                }
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
                    case CreepType.Upgrader:
                        this.upgraders.push(new Upgrader(creep, this));
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
