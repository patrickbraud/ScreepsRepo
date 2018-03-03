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
        this.MovePath = creep.memory.MovePath;
        this.MoveID = creep.memory.MoveID;
    }

    moveTo(target: Structure | Source, pathColor?: string) {
        // Check if we have a new target than the previous tick
        let newTarget = !(target.id == this.MoveID);

        // If so, update the target ID and MovePath in memory
        if (newTarget)
        {
            this.updateTarget(target);

            if (pathColor) {
                // Draw the path for a new target
                for (let step1 = 0, step2 = 1; step2 < this.MovePath.length; step1++, step2++) {
                    this.creep.room.visual.line(this.MovePath[step1].x, this.MovePath[step1].y, this.moveTo[step2].x, this.MovePath[step2].y, {color: pathColor });
                }
            }
        }

        this.MoveToTarget();
    }

    updateTarget(target: Structure | Source) {
        this.MoveID = target.id;
        this.MovePath = this.creep.room.findPath(this.creep.pos, target.pos, { ignoreCreeps: true });
    }

    MoveToTarget() {
        return this.creep.moveByPath(this.MovePath);
    }
}
