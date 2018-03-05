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
        this.MovePath = Room.deserializePath(creep.memory.MovePath);
    }

    moveTo(target: Structure | Source, pathColor?: string) {
        //console.log('I should be moving');

        // Check if we have a new target than the previous tick
        let newTarget: boolean = !(target.id == this.MoveID);
        //console.log('New Target: ' + newTarget);

        // If so, update the target ID and MovePath in memory
        if (newTarget)
        {
            this.updateTarget(target);

            if (pathColor) {
                // Draw the path for a new target
                for (let step1 = 0, step2 = 1; step2 < this.MovePath.length; step1++, step2++) {
                    this.creep.room.visual.line(this.MovePath[step1].x, this.MovePath[step1].y, this.MovePath[step2].x, this.MovePath[step2].y, {color: pathColor });
                }
            }
        }

        this.moveToTarget();
    }

    updateTarget(target: Structure | Source) {
        this.MoveID = target.id;

        console.log('Performing FIND Operation');
        this.MovePath = this.creep.room.findPath(this.creep.pos, target.pos, { ignoreCreeps: true });
    }

    moveToTarget() {
        return this.creep.moveByPath(this.MovePath);
    }

    distanceTo(pos: RoomPosition) {
        return Math.sqrt(Math.pow(pos.x - this.creep.pos.x, 2) + Math.pow(pos.y - this.creep.pos.y, 2));
    }
}
