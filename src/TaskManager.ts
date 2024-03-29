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

        if (!request) return undefined;
        
        let transportTask = {
            identifier: request.identifier,
            requestId: request.requestId,
            requestType: RequestType.Transport,
            finishLocation: {},
            // ticksToCompletion: 0
        }

        // this.tasks[transportTask.identifier] = transportTask;

        return transportTask;
    }
}