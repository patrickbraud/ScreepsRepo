import { Tower } from "./Tower";
import { RoomMgr } from "../Mgrs/RoomMgr";

export class DefenseMeasures {

    private _roomMgr: RoomMgr;

    towers: Tower[] = [];

    hostiles: Creep[] = [];

    constructor(roomMgr: RoomMgr) {
        this._roomMgr = roomMgr;
        this.loadTowers();
    }

    loadTowers() {
        for (let tower of this._roomMgr.towers) {
            this.towers.push(new Tower(tower));
        }
    }

    manageDefenses() {
        this.hostiles = this._roomMgr.baseRoom.find(FIND_HOSTILE_CREEPS);
        if (this.hostiles.length > 0) {
            this.defendRoom();
            return;
        }

        this.towersRepairStructures();
    }

    defendRoom() {

        for(let tower of this.towers) {
            tower.attackEnemies(this.hostiles);
        }
    }

    towersRepairStructures() {
        let damagedStructures = this._roomMgr.baseRoomStructures.filter(struct => {
            return struct.hits < struct.hitsMax;
        });

        if (damagedStructures.length > 0) {
            for(let tower of this.towers) {
                tower.repairStructures(damagedStructures);
            }
        }
    }
}
