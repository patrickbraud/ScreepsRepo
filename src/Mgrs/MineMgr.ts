import { RoomMgr } from "./RoomMgr";
import { Harvester } from "../Creeps/Harvester";
import { Transporter } from "../Creeps/Transporter";

export class MineMgr {

    public Mines: any[];


    public harvesters: Harvester[] = [];
    public transporters: Transporter[] = [];

    private _roomMgr: RoomMgr;
    private _exits: {[direction: string]: string};

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;
        this._exits = this._roomMgr.exits;

        this.Mines = [];

        this.loadMines();

    }

    loadMines() {
        for (let flagName in Game.flags) {
            console.log(flagName);
            let flag: Flag = Game.flags[flagName];
            console.log(flag.pos);
            //console.log(flag.name + ": " + flag.room.name);
        }
        for (let direction in this._exits) {

            let roomName: string = this._exits[direction];
            console.log(direction + " : " + roomName);

            let exitRoom: Room = Game.rooms[roomName];
            if (exitRoom == undefined) continue;

            console.log("Mine: " + exitRoom.name);

            if (exitRoom.sourcesInRoom.length > 0) {
                this.Mines.push(exitRoom)
            }
        }
    }
}
