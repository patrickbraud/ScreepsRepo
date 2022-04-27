import { Colony } from "./Colony";
import { RequestType } from "./Enums/RequestType";
import { TransportMatcher } from "./Algorithms/GaleShapley";
import { CreepType } from "./Enums/CreepType";
import { Transporter } from "./Creeps/Transporter";
import { object } from "lodash";

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

            let transporterList = Array.from(this.transporters);

            // DELETE THIS
            // transporterList = transporterList.filter(tp => tp.creep.memory.task != 'staging');
            // MAYBE? MAYBE NOT?? SEEMS ACTUALLY KINDA GOOD??
            // 

            this.transporterRequestMatches = this.createTransportMatching(transporterList);

            console.log("------------------------------------Transport-Map-Update---------------------------------------");
            transporterList.forEach(transporter => {
                let creepId = transporter.creep.id
                let req = this.transporterRequestMatches[creepId] as any;
                if (req){
                    console.log("| Creep: " + creepId + "\t RequestId: " + req.requestId + "\t Amount: " + req.amount + 
                        "\t\t\t- Storage: " + transporter.creep.store.getUsedCapacity(RESOURCE_ENERGY ) + " / " +  transporter.creep.store.getCapacity(RESOURCE_ENERGY));
                }
            })
            console.log("-----------------------------------------------------------------------------------------------");
        }

        let request = this.transporterRequestMatches[transporter.creep.id];

        return this.colony.taskManager.createTransportTask(request);
    }

    createTransportMatching(transporters: Transporter[]): any {
        
        // Map each transporter ID with a list of request IDs sorted by highest resource delta
        let transportPrefs: {[transporterId: string]: string[]} = {};
        transporters.forEach(transporter => {
            
            let prefs = this.transporterPreferences(transporter);
            transportPrefs[transporter.creep.id] = prefs.map(pref => pref.request.requestId);
        });

        // Map each request ID with a list of transporter IDs sorted by highest resource delta
        let requestPrefs: {[requestId: string]: string[]} = {};
        this.transportRequests.forEach(request => {
            
            let transporterPrefs = _.sortBy(transporters, transporter => -1 * this.computeDeltaResourcePerTicks(this.requestPreference(request, transporter)));
            requestPrefs[request.requestId] = transporterPrefs.map(transporter => transporter.creep.id);
        });

        //this.logTransportPreferences(transportPrefs);
        //this.logRequestPreferences(requestPrefs);

        let transportMatcher = new TransportMatcher(transportPrefs, requestPrefs);
        let matches = transportMatcher.match();

        let requestMatch = _.mapValues(matches, reqID => _.find(this.transportRequests, transportReq => transportReq.requestId == reqID));
        //this.logMathingResults(requestMatch);

		return requestMatch;
    }

    private logTransportPreferences(transportPrefs: any) {
            
        for(let transporterId in transportPrefs) {

            console.log("--");
            console.log("TransporterId: " + transporterId);
            console.log("Prefs: " + JSON.stringify(transportPrefs[transporterId], null, 2));
            console.log("--");
        }
    }

    private logRequestPreferences(requestPrefs: any) {
            
        for(let requestId in requestPrefs) {

            console.log("--");
            console.log("RequestId: " + requestId);
            console.log("Prefs: " + JSON.stringify(requestPrefs[requestId], null, 2));
            console.log("--");
        }
    }

    private transporterPreferences(transporter: Transporter): any[] {

        // For this transporter, create a list of requests it could fulfill
        let requestOptions: {request: any, deltaResource: number, deltaTicks: number}[] = []

        this.transportRequests.forEach(request => {
            let transportDeltaData = this.getTransporterDeltaResourceForRequest(transporter, request);
            requestOptions.push(transportDeltaData);

            // console.log("creep: " + transporter.creep.id + 
            // " \t- RequestPrefs: " + transportDeltaData.request.requestId + 
            // " : DeltaResource: " + transportDeltaData.deltaResource + 
            // " : DeltaTicks: " + transportDeltaData.deltaTicks + 
            // " : Delta Resource/Tick: " + this.computeDeltaResourcePerTicks(transportDeltaData));
            //if (transportDeltaData.deltaResource > 0) requestOptions.push(transportDeltaData);
        });

        // sort the list of requests by delta resource / ticksToCompletion in ascending order
        return _.sortBy(requestOptions, option => -1 * this.computeDeltaResourcePerTicks(option));
        // return _.sortBy(requestOptions, option => 1 * this.computeDeltaResourcePerTicks(option));
    }

    private requestPreference(request: any, transporter: Transporter): any {

        return this.getTransporterDeltaResourceForRequest(transporter, request);
    }

    private getTransporterDeltaResourceForRequest(transporter: Transporter, request: any): {request: any, deltaResource: number, deltaTicks: number} {
        //console.log("TransporterId: " + transporter.creep.id + " RequestId: " + request.requestId);

        // How many ticks until the transporter is available and where it will be after current task completion
        let availability = this.getAvailability(transporter);
        //console.log("Availability: " + JSON.stringify(availability));

        // How much resource the requeset will have/need after current task completion
        let predictedAmount = this.getPredictedAmount(transporter, request);
        //console.log("PredictedAmount: " + predictedAmount);

        // How much resource the trasnporter will have after current task completion
        let predictedCarry = this.getPredictedCarry(transporter, request);
        //console.log("PredictedCarry: " + predictedCarry);
        
        // The amount of resource change this transporter will have for the request
        let deltaResource;
        if (request.amount > 0) deltaResource = Math.min(predictedAmount, predictedCarry);
        else                    deltaResource = Math.min(Math.abs(predictedAmount), predictedCarry);
        //console.log("DeltaResource: " + deltaResource);

        // The number of ticks away the transporter will be from the request target after current task completion
        let requestLocation = new RoomPosition(request.location.x, request.location.y, request.location.roomName);
        let path = this.colony.mainRoom.findPath(availability.location, requestLocation);
        let deltaTicks = availability.ticks + path.length;
        //console.log("DeltaTicks: " + deltaTicks);
        //console.log("DeltaResource/Tick: " +  deltaResource / deltaTicks);
        
        return {request, deltaResource, deltaTicks};
    }

    private computeDeltaResourcePerTicks(option: any): number {

        return option.deltaResource / option.deltaTicks;
    }

    // Get info for the next availability for this transporter
    private getAvailability(transporter: Transporter): {ticks: number, location: RoomPosition} {

        if (!transporter.task) return {ticks: 0, location: transporter.creep.pos};

        let target: any = Game.getObjectById(transporter.task.requestId);
        let path = transporter.creep.room.findPath(transporter.creep.pos, target.pos);

        let ticksToCompletion = path.length;
        let finishLocation = new RoomPosition(target.pos.x, target.pos.y, target.pos.roomName);

        return {ticks: ticksToCompletion, location: finishLocation};
    }

    // The predicted amount of available resource when the request can be satisfied
    private getPredictedCarry(transporter: Transporter, request: any): number {

        let predictedCarry;
        if (request.amount > 0) predictedCarry = transporter.creep.store.getUsedCapacity(request.resourceType);
        else                    predictedCarry = transporter.creep.store.getFreeCapacity(request.resourceType);

        let task = transporter.task;
        if (!task) return predictedCarry;

        let currentRequest = this.colony.requestManager.getRequest(task.requestType, task.requestId);
        if (!currentRequest) return predictedCarry;

        // get the amount of resource the target will need when the transporter gets there
        // accounting for all other transporters target it
        let requestAmount = this.getPredictedAmount(transporter, currentRequest);

        predictedCarry += -1 * requestAmount;

        return predictedCarry;

        // if (predictedCarry <= 0) return 0;

        // return Math.min(predictedCarry, transporter.creep.store.getCapacity());
    }

    // By the time this transporter got there, how much resource the request would actually still have/need
    // Account for all other transporters targeting this request
    // Account for the delta  of the request target
    private getPredictedAmount(transporter: Transporter, request: any) {

        let transportersTargeting = this.transporters.filter(otherTransporter => (otherTransporter.task && 
                                                                                  otherTransporter.task.requestId == request.requestId && 
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