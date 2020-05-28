import { Colony } from "./Colony";
import { RequestType } from "./Enums/RequestType";
import { TransportMatcher } from "./Algorithms/GaleShapley";
import { CreepType } from "./Enums/CreepType";
import { Transporter } from "./Creeps/Transporter";

export class Logistics {

    colony: Colony;
    mainRoom: Room;

    transporters: Transporter[];
    transportRequests: any[];

    transporterRequestMatches: {[transporterId: string]: string;}

    constructor(colony: Colony) {

        this.colony = colony;
        this.mainRoom = colony.mainRoom;
    }

    initialize(transporters: Transporter[]) {

        let transportRequestMap = this.colony.requestManager.requests[RequestType.Transport];
        if (!transportRequestMap) transportRequestMap = {};

        this.transportRequests = Object.values(transportRequestMap);

        this.transporters = transporters
    }

    getTask(transporter: Transporter): any {

        if (!this.transporterRequestMatches) {
            
            this.transporterRequestMatches = this.createTransportMatching();
        }

        let request = this.transporterRequestMatches[transporter.creep.id];

        return this.colony.taskManager.createTransportTask(request);
    }

    createTransportMatching(): any {
        
        // Map each transporter ID with a list of request IDs sorted by highest resource delta
        let transportPrefs: {[transporterId: string]: string[]} = {};
        this.transporters.forEach(transporter => {
            
            let prefs = this.transporterPreferences(transporter);
            transportPrefs[transporter.creep.id] = prefs.map(pref => pref.request.requestId);
        });

        // Map each request ID with a list of transporter IDs sorted by highest resource delta
        let requestPrefs: {[requestId: string]: string[]} = {};
        this.transportRequests.forEach(request => {
            
            let transporterPrefs = _.sortBy(this.transporters, transporter => -1 * this.requestPreference(request, transporter));
            requestPrefs[request.requestId] = transporterPrefs.map(transporter => transporter.creep.id);
        });

        this.logTransportPreferences(transportPrefs);
        this.logRequestPreferences(requestPrefs);

        let transportMatcher = new TransportMatcher(transportPrefs, requestPrefs);
        let matches = transportMatcher.match();

        let requestMatch = _.mapValues(matches, reqID => _.find(this.transportRequests, request => request.requestId == reqID));
        //this.logMathingResults(requestMatch);

		return requestMatch;
    }

    private logTransportPreferences(transportPrefs: any) {
            
        for(let transporterId in transportPrefs) {

            console.log("--");
            console.log("TransporterId: " + transporterId);
            console.log("Prefs: " + JSON.stringify(transportPrefs[transporterId]));
            console.log("--");
        }
    }

    private logRequestPreferences(requestPrefs: any) {
            
        for(let requestId in requestPrefs) {

            console.log("--");
            console.log("RequestId: " + requestId);
            console.log("Prefs: " + JSON.stringify(requestPrefs[requestId]));
            console.log("--");
        }
    }



    private logMathingResults(matching: any) {

        let keys = Object.keys(matching);
        console.log("Keys: " + JSON.stringify(keys));
        keys.forEach(key => {

            console.log("---");
            console.log("Key: " + JSON.stringify(key));
            console.log("Value: " + JSON.stringify(matching[key]));
            console.log("---");
        });
        
    }

    private transporterPreferences(transporter: Transporter): any[] {

        // For this transporter, create a list of requests it could fulfill
        let requestOptions: {request: any, deltaResource: number, deltaTicks: number}[] = []
        this.transportRequests.forEach(request => {

            requestOptions.push(this.getTransporterDeltaResourceForRequest(transporter, request));
        });

        // sort the list of requests by delta resource / ticksToCompletion in descending order
        return _.sortBy(requestOptions, option => -1 * this.computeDeltaResourcePerTicks(option));
    }

    private requestPreference(request: any, transporter: Transporter): any {

        return this.getTransporterDeltaResourceForRequest(transporter, request);
    }

    private getTransporterDeltaResourceForRequest(transporter: Transporter, request: any): {request: any, deltaResource: number, deltaTicks: number} {

        console.log("TransporterId: " + transporter.creep.id + " RequestId: " + request.requestId);

        // How many ticks until the transporter is available and where it will be after current task completion
        let availability = this.getAvailability(transporter);
        console.log("Availability: " + JSON.stringify(availability));

        // How much resource the requeset will have/need after current task completion
        let predictedAmount = this.getPredictedRequestAmount(transporter, request);
        console.log("PredictedAmount: " + predictedAmount);

        // How much resource the trasnporter will have after current task completion
        let predictedCarry = this.getPredictedCarry(transporter);
        console.log("PredictedCarry: " + predictedCarry);
        
        // The amount of resource change this transporter will have for the request
        let deltaResource = Math.min(predictedAmount, predictedCarry);
        console.log("DeltaResource: " + deltaResource);

        // The number of ticks away the transporter will be from the request target after current task completion
        let requestLocation = new RoomPosition(request.location.x, request.location.y, request.location.roomName);
        let path = this.colony.mainRoom.findPath(availability.location, requestLocation);
        let deltaTicks = availability.ticks + path.length;
        console.log("DeltaTicks: " + deltaTicks);
        console.log("DeltaResource/Tick: " +  deltaResource / deltaTicks);
        
        return {request, deltaResource, deltaTicks};
    }

    private computeDeltaResourcePerTicks(option: any): number {

        return option.deltaResource / option.deltaTicks;
    }

    // Get info for the next availability for this transporter
    private getAvailability(transporter: Transporter): {ticks: number, location: RoomPosition} {

        if (!transporter.task) return {ticks: 0, location: transporter.creep.pos};

        let taskLocation = transporter.task.finishLocation
        let lastLocation = new RoomPosition(taskLocation.x, taskLocation.y, taskLocation.roomName);

        return {ticks: transporter.task.ticksToCompletion, location: lastLocation};
    }

    // The predicted amount of available resource when the request can be satisfied
    private getPredictedCarry(transporter: Transporter): number {

        let predictedCarry = transporter.creep.store.getCapacity();

        let task = transporter.task;
        if (!task) return predictedCarry;

        let request = this.colony.requestManager.getRequest(task.requestType, task.requestId);
        if (!request) return predictedCarry;

        // get the amount of resource the target will need when the transporter gets there
        // accounting for all other transporters target it
        let requestAmount = this.getPredictedRequestAmount(transporter, request);

        predictedCarry -= requestAmount;

        return predictedCarry;

        // if (predictedCarry <= 0) return 0;

        // return Math.min(predictedCarry, transporter.creep.store.getCapacity());
    }

    // By the time this transporter got there, how much resource the request would actually still have/need
    // Account for all other transporters targeting this request
    // Account for the delta  of the request target
    private getPredictedRequestAmount(transporter: Transporter, request: any) {

        let transportersTargeting = this.transporters.filter(otherTransporter => (otherTransporter.task && 
                                                                                  otherTransporter.requestId == request.requestId && 
                                                                                  otherTransporter.creep.id != transporter.creep.id));

        // The time it would take the transporter to get there * the delta amount of the request target 
        let requestLocation = new RoomPosition(request.location.x, request.location.y, request.location.roomName);
        let predictedDelta = request.delta * this.colony.mainRoom.findPath(transporter.creep.pos, requestLocation).length;

        // console.log("predictedAmount - tId: " + transporter.creep.id + "rId: " + request.requestId);

        // Deposit request
        if (request.amount > 0) {

            let totalDeposit = 0;
            transportersTargeting!.forEach(transporter => {
                totalDeposit += transporter.creep.store.getUsedCapacity(request.resourceType);
            });

            let predictedAmount = Math.max(request.amount + predictedDelta - totalDeposit, 0);
            // console.log("\t- Transporters: " + transportersTargeting.length + " - TotalDeposit: " + totalDeposit + " - PredictedAmount: " + predictedAmount);
            return predictedAmount;
        }
        else { // Withdrawl request

            let totalWithdrawl = 0;
            transportersTargeting!.forEach(transporter => {

                totalWithdrawl += transporter.creep.store.getFreeCapacity(request.resourceType);
            });

            let predictedAmount = Math.min(request.amount + predictedDelta + totalWithdrawl, 0)
            // console.log("\t- Transporters: " + transportersTargeting.length + " - TotalWithdrawl: " + totalWithdrawl + " - PredictedAmount: " + predictedAmount);
            return predictedAmount
        }
    }
}