import { CreepStatus } from "Enums/CreepEnums";
import { RoomMgr } from "Mgrs/RoomMgr";

export class Screep{

    creep: Creep;

    roomMgr: RoomMgr;

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

    // PreviousPos Property
    private _previousPos: RoomPosition;
    get PreviousPos(): RoomPosition {
        return this._previousPos;
    }
    set PreviousPos(pos: RoomPosition) {
        if (pos == undefined) {
            pos = this.creep.pos;
        }
        this._previousPos = pos;
        this.creep.memory.PreviousPos = pos;
    }

    // PreviousMoveResult Property
    private _previousMoveResult: number;
    get PreviousMoveResult(): number {
        return this._previousMoveResult;
    }
    set PreviousMoveResult(moveResult: number) {
        if (moveResult == undefined) {
            moveResult = OK;
        }
        this._previousMoveResult = moveResult;
        this.creep.memory.PreviousMoveResult = moveResult;
    }

    // Status property
    private _status: CreepStatus = null;
    get Status() {
        return this._status;
    }
    set Status(currentStatus: CreepStatus) {
        this._status = currentStatus;
        this.creep.memory.Status = currentStatus;
    }

    constructor(creep: Creep, roomManager: RoomMgr)
    {
        this.creep = creep;
        this.roomMgr = roomManager
        this.MoveID = creep.memory.MoveID;
        if (creep.memory.MovePath != undefined) {
            this.MovePath = Room.deserializePath(creep.memory.MovePath as string);
        }
        // console.log('PrevPos: ' + creep.memory.PreviousPos);
        this.PreviousPos = creep.memory.PreviousPos;
        this.PreviousMoveResult = creep.memory.PreviousMoveResult;
    }

    moveTo(target: any, pathColor?: string) {
        //console.log('I should be moving');

        // Check if we have a new target than the previous tick
        let newTarget: boolean = !(target.id == this.MoveID);
        let gotStuck: boolean = this.checkIfStuck()

        // If we got a new target, or our last move was considered
        // a success but we are still in the same spot, get a new path
        if (newTarget || gotStuck)
        {
            //console.log('New Target: ' + newTarget);
            this.updateTarget(target, gotStuck);
        }

        this.moveToTarget();

        if (pathColor) {
            // Draw the path from our creep to it's target
            this.printPath(pathColor);
        }
    }

    updateTarget(target: any, gotStuck: boolean) {
        // console.log('Performing FIND Operation');
        this.MoveID = target.id;

        let ignoreAllCreeps = gotStuck ? false : true;
        this.MovePath = this.creep.room.findPath(this.creep.pos, target.pos, { ignoreCreeps: ignoreAllCreeps });
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

    moveToTarget() {

        // NOTE - maybe add ability to pass FindPathOpts to our move method
        // if (opts != undefined) {
        //     console.log('moving by coordinates');
        //     // remove the first element, since it's our current position
        //     this.MovePath = this.MovePath.slice(1);
        //     console.log('x: ' + this.MovePath[0].x + ' y: ' + this.MovePath[0].y);
        //     let moveResults: number = this.creep.moveTo(this.MovePath[0].x, this.MovePath[0].y, opts);
        //     return moveResults;
        // }
        let moveResult: number = this.creep.moveByPath(this.MovePath);
        this.PreviousMoveResult = moveResult;
        this.PreviousPos = this.creep.pos;
        return moveResult;
    }

    checkIfStuck(): boolean {
        let stuck: boolean = false;
        if ((this.checkSamePos(this.creep.memory.PreviousPos, this.creep.pos)
            && (this.creep.memory.PreviousMoveResult == OK
                || this.creep.memory.PreviousMoveResult == ERR_NOT_FOUND))
            && !(this.creep.fatigue > 0)) {
            // We need a new path
            stuck = true;
        }
        return stuck;
    }

    distanceTo(pos: RoomPosition) {
        return Math.sqrt(Math.pow(pos.x - this.creep.pos.x, 2) + Math.pow(pos.y - this.creep.pos.y, 2));
    }

    checkSamePos(pos1: RoomPosition, pos2: RoomPosition) {
        return (pos1.x == pos2.x && pos1.y == pos2.y);
    }
}
