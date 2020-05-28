import { Colony } from "../Colony";

export class Screep{

    creep: Creep;
    colony: Colony;

    pathColor: string;

    constructor(creep: Creep, colony: Colony)
    {
        this.creep = creep;
        this.colony = colony;
    }

    // checkIfStuck(): boolean {
    //     let stuck: boolean = false;
    //     if ((this.checkSamePos(this.creep.memory.PreviousPos, this.creep.pos)
    //         && (this.creep.memory.PreviousMoveResult == OK
    //             || this.creep.memory.PreviousMoveResult == ERR_NOT_FOUND))
    //         && !(this.creep.fatigue > 0)) {
    //         // We need a new path
    //         stuck = true;
    //     }
    //     return stuck;
    // }

    distanceTo(pos: RoomPosition) {
        return Math.sqrt(Math.pow(pos.x - this.creep.pos.x, 2) + Math.pow(pos.y - this.creep.pos.y, 2));
    }

    checkSamePos(pos1: RoomPosition, pos2: RoomPosition) {
        return (pos1.x == pos2.x && pos1.y == pos2.y);
    }
}
