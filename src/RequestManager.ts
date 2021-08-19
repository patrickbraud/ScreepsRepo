import { Colony } from "./Colony";
import { RequestStatus as RequestStatus } from "./Enums/RequestStatus";
import { RequestType } from "./Enums/RequestType";

export class RequestManager {

    colony: Colony;
    mainRoom: Room;

    requests: {[requestType: string]: {[requestId: string]: any}};

    constructor(colony: Colony) {
        this.colony = colony;
        this.mainRoom = colony.mainRoom;

        this.requests = this.mainRoom.requests;
    }

    submitRequest(requestDetails: any) {
        
        let requestsOfType: {[requestId: string]: any} = this.requests[requestDetails.requestType];
        if (!requestsOfType) {
            // No requests of this type exist yet
            // Initialize its key in the dictionary
            this.requests[requestDetails.requestType] = {};
            this.requests[requestDetails.requestType][requestDetails.requestId] = requestDetails;
            return;
        }

        requestsOfType[requestDetails.requestId] = requestDetails;
        // if (!request) {
        //     // No requests exist for this requestId yet
        //     // Initialize its request list
        //     requestsOfType[requestDetails.requestId] = requestDetails;
        // }
        // else {

        //     request = requestDetails;
        //     return;
        // }

        //console.log("New Request - \trequestId: " + requestDetails.requestId + "\t- Type: " + requestDetails.requestType);
    }

    removeRequest(requestType: string, requestId: string) {

        let requestsOfType: {[requestId: string]: any} = this.requests[requestType];
        if (!requestsOfType) {
            this.requests[requestType] = undefined;
            delete this.requests[requestType];
        }

        requestsOfType[requestId] = undefined;
        delete requestsOfType[requestId];
    }

    getRequest(requestType: string, requestId: string): any | undefined {

        if (!requestId) return undefined;
        
        let requestsOfType: {[requestId: string]: any} = this.requests[requestType];
        if (!requestsOfType) return undefined;

        return requestsOfType[requestId];
    }

    cleanupHarvestRequests() {

        let harvestRequests = this.requests[RequestType.Harvest];
        if (!harvestRequests) return;

        let requests = Object.values(harvestRequests);
        requests.forEach((request: any) => {
            if (request.workRequired <= 0) this.removeRequest(RequestType.Harvest, request.requestId);
        });
    }

    cleanupTransportRequests() {

        let transportRequests = this.requests[RequestType.Transport];
        if (!transportRequests) return;

        let requests = Object.values(transportRequests);
        requests.forEach((request: any) => {

            let target = Game.getObjectById(request.requestId);
            if (!target) this.removeRequest(RequestType.Transport, request.requestId);
        });
    }
}
