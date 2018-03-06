//import { SourceManager } from "Managers/SourceManager";

export class Screep{

    creep: Creep;

    // MovePath property
    private _movePath: PathStep[];
    get MovePath(): PathStep[] {
        return this._movePath;
    }
    set MovePath(path: PathStep[]) {
        this._movePath = path;
        this.creep.memory.MovePath = Room.serializePath(path);
    }

    // MoveID Property
    private _moveID: string;
    get MoveID(): string {
        return this._moveID;
    }
    set MoveID(targetID: string) {
        this._moveID = targetID;
        this.creep.memory.MoveID = targetID;
    }

    constructor(creep: Creep)
    {
        this.creep = creep;
        this.MoveID = creep.memory.MoveID;
        if (creep.memory.MovePath != undefined) {
            this.MovePath = Room.deserializePath(creep.memory.MovePath as string);
        }
    }

    moveTo(target: any, pathColor?: string) {
        //console.log('I should be moving');

        // Check if we have a new target than the previous tick
        let newTarget: boolean = !(target.id == this.MoveID);

        // If so, update the target ID and MovePath in memory
        if (newTarget)
        {
            //console.log('New Target: ' + newTarget);
            this.updateTarget(target);
        }

        this.moveToTarget();

        if (pathColor) {
            // Draw the path from our creep to it's target
            this.printPath(pathColor);
        }
    }

    printPath(color: string) {

        let creepPosReached: boolean = false;
        for (let step1 = 0, step2 = 1; step2 < this.MovePath.length; step1++, step2++) {
            // Skip all path steps up to and including our creep position
            if (this.MovePath[step1].x == this.creep.pos.x && this.MovePath[step1].y == this.creep.pos.y) {
                creepPosReached = true;
                continue;
            }

            if (creepPosReached) {
                this.creep.room.visual.line(this.MovePath[step1].x, this.MovePath[step1].y, this.MovePath[step2].x, this.MovePath[step2].y, {color: color });
            }
        }
    }

    updateTarget(target: any) {
        this.MoveID = target.id;

        console.log('Performing FIND Operation');
        this.MovePath = this.creep.room.findPath(this.creep.pos, target.pos, { ignoreCreeps: true });
    }

    moveToTarget() {

        // if (opts != undefined) {
        //     console.log('moving by coordinates');
        //     // remove the first element, since it's our current position
        //     this.MovePath = this.MovePath.slice(1);
        //     console.log('x: ' + this.MovePath[0].x + ' y: ' + this.MovePath[0].y);
        //     let moveResults: number = this.creep.moveTo(this.MovePath[0].x, this.MovePath[0].y, opts);
        //     return moveResults;
        // }
        return this.creep.moveByPath(this.MovePath);
    }

    distanceTo(pos: RoomPosition) {
        return Math.sqrt(Math.pow(pos.x - this.creep.pos.x, 2) + Math.pow(pos.y - this.creep.pos.y, 2));
    }
}
