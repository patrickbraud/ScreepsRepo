import { SourceManager } from "Managers/SourceManager";

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
        console.log('attached creep');
        if (creep.memory.MovePath == 0) {
            console.log('updating target');
            this.updateTarget(SourceManager.GetBestSource(creep));
        }
        else {
            this.MovePath = Room.deserializePath(creep.memory.MovePath);
            console.log('loaded path');
            this.MoveID = creep.memory.MoveID;
        }
        console.log('creep initialized');
    }

    moveTo(target: Structure | Source, pathColor?: string) {
        // Check if we have a new target than the previous tick
        let newTarget = !(target.id == this.MoveID);

        // If so, update the target ID and MovePath in memory
        if (newTarget)
        {
            console.log('Received new target');
            this.updateTarget(target);

            if (pathColor) {
                // Draw the path for a new target
                for (let step1 = 0, step2 = 1; step2 < this.MovePath.length; step1++, step2++) {
                    this.creep.room.visual.line(this.MovePath[step1].x, this.MovePath[step1].y, this.moveTo[step2].x, this.MovePath[step2].y, {color: pathColor });
                }
            }
        }

        this.moveToTarget();
    }

    distanceTo(pos: RoomPosition) {
        return Math.sqrt(Math.pow(pos.x - this.creep.pos.x, 2) + Math.pow(pos.y - this.creep.pos.y, 2));
    }

    updateTarget(target: Structure | Source) {
        this.MoveID = target.id;
        this.MovePath = this.creep.room.findPath(this.creep.pos, target.pos, { ignoreCreeps: true });
        console.log('targets updated');
    }

    moveToTarget() {
        return this.creep.moveByPath(this.MovePath);
    }


}
