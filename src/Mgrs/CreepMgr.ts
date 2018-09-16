import { Harvester } from "Creeps/Harvester";
import { Upgrader } from "Creeps/Upgrader";
import { RoomMgr } from "./RoomMgr";
import { Transporter } from "Creeps/Transporter";
import { Builder } from "Creeps/Builder";
import { Distributor } from "Creeps/Distributor";

export class CreepMgr {

    private _baseSpawn: Spawn;
    private _roomMgr: RoomMgr;

    // Creeps that belong to this colony
    public creeps: Creep[] = [];
    public creepNames: string[] = [];

    public harvesters: Harvester[] = [];
    public upgraders: Upgrader[] = [];
    public transporters: Transporter[] = [];
    public builders: Builder[] = [];
    public distributors: Distributor[] = [];

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;
        this._baseSpawn = this._roomMgr.baseRoomSpawn;
        this.loadCreeps();
    }

    runCreeps() {

        this.harvesters.forEach(harvester => {
            harvester.work();
        });
        this.upgraders.forEach(upgrader =>  {
            upgrader.work();
        })
        this.transporters.forEach(transporter => {
            transporter.work();
        })
        this.builders.forEach(builder => {
            builder.work();
        })
        this.distributors.forEach(distributor => {
            distributor.work();
        })
    }

    loadCreeps() {
        // Clear dead creeps from memory
        for(let name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        for (let creepName in Game.creeps) {
            let creep = Game.creeps[creepName];
            if (!creep.spawning) {
                if (creep.memory.ColonyID == this._baseSpawn.memory.ColonyID) {
                    this.creepNames.push(creepName);
                    this.creeps.push(creep);
                }
            }
        }

        for(let name in this.creepNames) {
            let creep = this.creeps[name];
            if (creep.memory.Role == 'harvester') {
                this.harvesters.push(new Harvester(creep, this._roomMgr));
            }
            else if (creep.memory.Role == 'transporter') {
                this.transporters.push(new Transporter(creep, this._roomMgr));
            }
            else if (creep.memory.Role == 'upgrader') {
                this.upgraders.push(new Upgrader(creep, this._roomMgr));
            }
            else if (creep.memory.Role == 'builder') {
                this.builders.push(new Builder(creep, this._roomMgr));
            }
            else if (creep.memory.Role == 'distributor') {
                this.distributors.push(new Distributor(creep, this._roomMgr));
            }
        }
    }

    static bodyCost(body: string[]): number {

        let bodyCost: number = 0;

        for (let index = 0; index < body.length; index++) {
            let bodyPart: string = body[index];
            bodyCost += BODYPART_COST[bodyPart];
        }
        return bodyCost;
    }
}
