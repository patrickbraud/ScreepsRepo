import { GameManager } from "./GameManager";
import { Spawner } from "./Spawner";
import { Harvester } from "./Creeps/Harvester";
import { JobBoard } from "./JobBoard";
import { JobType } from "./Enums/JobType";

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
    public jobBoard: JobBoard;

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
        this.spawner = new Spawner(this);
        this.jobBoard = new JobBoard(this);
    }

    initialize() {

        // Load all creeps for this colony
        this.initializeCreeps();

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

    checkJobStatus(){

        // Before everything checks their jobs, 
        // make sure all creeps that were previously working still exist
        this.jobBoard.verifyWorkersExist();

        // Check if all sources have a worker assigned to them
        // If not, a worker request is returned
        this.sources.forEach(source => {

            let currentJobs = this.jobBoard.getJobs(JobType.Harvest, source.id);
            let newJob = source.checkHarvestJobs(currentJobs);
            if (newJob) {
                 this.jobBoard.postJob(source.id, newJob);
            }
        });
        
        // All dropped energy updates it's job listing or creates one if it doesn't exist to pick them up
        this.droppedEnergy.forEach(energy => {

            let droppedEnergyJobs = this.jobBoard.getJobs(JobType.DroppedEnergy, energy.id);
            let currentJob = undefined;
            if (droppedEnergyJobs) currentJob = droppedEnergyJobs[0]

            let newJob = energy.updateDroppedEnergyJob(currentJob);
            if (newJob) this.jobBoard.postJob(energy.id, newJob);
        });


        // Spawns update their energy required job listing, or post one if it doesn't exist
        let spawnDeposits = this.jobBoard.getJobs(JobType.EnergyRequired, this.mainSpawn.id);
        let currentJob = undefined;
        if (spawnDeposits) currentJob = spawnDeposits[0]
        
        let newSpawnDeposit = this.mainSpawn.checkEnergyRequirements(currentJob);
        if (newSpawnDeposit) this.jobBoard.postJob(this.mainSpawn.id, newSpawnDeposit);
    }

    assignWorkers() {

        // Assigne idle and Hire any needed workers
        this.jobBoard.assignWorkers();
    }

    performJobs() {
        this.creeps.forEach(creep => {

            let job = this.jobBoard.getWorkerJob(creep);
            if (job) {
                switch (job.jobType) {

                    case "Harvest":
                        let harvester = new Harvester(creep, this);
                        harvester.work(this);
                        break;
                }
            }
        })
    }

    satisfyWorkRequests() {

        // Fulfill any worker spawn requests
        this.spawner.spawnHighestPriority();
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

                    this.jobBoard.workerCheckIn(creep);
            }
        }
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
