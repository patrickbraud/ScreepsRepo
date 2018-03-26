import { RoomUtils } from "Mgrs/RoomUtils";

export class Tower {

    tower: StructureTower;
    //private _roomMgr: RoomMgr

    constructor(tower: StructureTower) {
        this.tower = tower;
        //this._roomMgr = roomMgr;
    }

    attackEnemies(hostiles: Creep[]) {
        if (hostiles.length > 0) {
            let closestHostiles = hostiles.sort((a: Creep, b: Creep): number => { return (RoomUtils.distanceTo(a, this.tower.pos) - RoomUtils.distanceTo(b, this.tower.pos))});
            this.tower.attack(closestHostiles[0]);
            return;
        }
    }

    repairStructures(structures: Structure[]) {
        // Only repair if we have at last 70% of our energy
        if (structures.length > 0 && this.tower.energy > (0.7 & this.tower.energyCapacity)) {
            let closestStructurese = structures.sort((a: Structure, b: Structure): number => { return (RoomUtils.distanceTo(a, this.tower.pos) - RoomUtils.distanceTo(b, this.tower.pos))});
            this.tower.repair(closestStructurese[0]);
        }
    }
}
