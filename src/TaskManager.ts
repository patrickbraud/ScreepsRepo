import { Colony } from "./Colony";
import { RequestType } from "./Enums/RequestType";

export class TaskManager {

    public tasks: {[taskId: number]: any}

    private _colony: Colony;
    constructor(colony: Colony) {

        this._colony = colony;

        this.tasks = colony.mainRoom.tasks;
    }

    createTransportTask(request: any): any {

        let transportTask = {
            requestId: request.requestId,
            requestType: RequestType.Transport,
            finishLocation: {},
            ticksToCompletion: 0
        }

        return transportTask;
    }
}