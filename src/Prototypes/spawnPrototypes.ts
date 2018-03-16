import { CreepStatus } from "Enums/CreepEnums";

export function spawnPrototypes() {

    StructureSpawn.prototype.createWorkerBody = function(maxWork: number, maxCarry: number, maxMove: number,
                                                        priority: string[], waitForMax: Boolean): string[] {
        // Add the minimum of all wanted parts
        let body: string[] = [];
        for (let baseWork = 0; baseWork < 1 && baseWork < maxWork; baseWork++) {
            body.push(WORK);
        }
        let workCount = body.length;
        for (let baseCarry = 0; baseCarry < 1 && baseCarry < maxCarry; baseCarry++) {
            body.push(CARRY);
        }
        let carryCount = body.length - workCount;
        for (let baseMove = 0; baseMove < 1 && baseMove < maxMove; baseMove++) {
            body.push(MOVE);
        }
        let moveCount = body.length - carryCount;

        let energyRequired = (BODYPART_COST.work * moveCount)
                             + (BODYPART_COST.carry * carryCount)
                             + (BODYPART_COST.move * moveCount);
        let energyAvailable = this.room.energyAvailable;

        for (let index = 0; index < priority.length; index++) {
            let bodyPart: string = priority[index];
            switch(bodyPart) {
                case WORK: {
                    for (; workCount < maxWork; workCount++) {
                        energyRequired += BODYPART_COST.work;
                        body.push(WORK);
                        if (!waitForMax && energyRequired >= energyAvailable) { break; }
                    }
                    break;
                }
                case CARRY: {
                    for (; carryCount < maxCarry; carryCount++) {
                        energyRequired += BODYPART_COST.carry;
                        body.push(CARRY);
                        if (!waitForMax && energyRequired >= energyAvailable) { break; }
                    }
                    break;
                }
                case MOVE: {
                    for (; moveCount < maxMove; moveCount++) {
                        energyRequired += BODYPART_COST.move;
                        body.push(MOVE);
                        if (!waitForMax && energyRequired >= energyAvailable) { break; }
                    }
                }
            }
        }

        console.log('Energy Required: ' + energyRequired);
        console.log('Energy Available: ' + energyAvailable);
        console.log('Energy Capacity: ' + this.room.energyCapacityAvailable);

        // If we created a body that is impossible to spawn with the current capacity of the room,
        // remove a part until we are under the limit
        while (energyRequired > this.room.energyCapacityAvailable) {
            let part = body.pop();
            energyRequired -= BODYPART_COST[part];
        }

        return body;
    };

    // StructureSpawn.prototype.balanceBodyParts = function(body: string[], balanceParts: string[]): string[] {

    //     let workCount = 0;
    //     let carryCount = 0;
    //     let moveCount = 0;
    //     for (let index = 0; index < balanceParts.length; index++) {
    //         let bodyPart: string = balanceParts[index];
    //         switch(bodyPart) {
    //             case WORK: {
    //                 workCount = body.filter(part => {
    //                     return part == WORK;
    //                 }).length;
    //             }
    //             case CARRY: {
    //                 carryCount = body.filter(part => {
    //                     return part == CARRY;
    //                 }).length;
    //             }
    //             case MOVE: {
    //                 moveCount = body.filter(part => {
    //                     return part == MOVE;
    //                 }).length;
    //             }
    //         }
    //     }

    //     let workParts = body.filter(part => {
    //         return part == WORK;
    //     })
    //     let carryParts = body.filter(part => {
    //         return part == CARRY;
    //     })
    //     let moveParts = body.filter(part => {
    //         return part == MOVE;
    //     })

    //     let baseBody = body.filter(part => {
    //         return balanceParts.fd
    //     })

    //     let partsEqual: Boolean = false;
    //     do {

    //         if (workCount > carryCount && workCount > moveCount) {
    //             body.
    //         }
    //         Math
    //     }
    //     while ()

    // }

    StructureSpawn.prototype.spawnHarvester = function(targetSource: Source): number {

        // let body: string[] = this.createWorkerBody(maxWork, maxCarry, maxMove, [WORK, CARRY, MOVE]);
        let body: string[] = this.createWorkerBody(5, 1, 1, [WORK, CARRY, MOVE], false);
        console.log('Harvester Body generated: ' + body.toString());

        let spawnHarvesterOpts = {
            Role: 'harvester',
            TargetSourceID: targetSource.id,
            TargetDepositID: 0,
            MovePath: "",
            MoveID: 0,
            PreviousPos: undefined,
            PreviousMoveResult: undefined,
            Status: CreepStatus.Harvesting,
            ColonyID: this.memory.ColonyID
        }

        let creepName = this.generateCreepName(spawnHarvesterOpts.Role, spawnHarvesterOpts.ColonyID)

        let canSpawn = this.spawnCreep(body, creepName, { dryRun: true });
        let spawnResult = canSpawn;
        if (canSpawn == OK){
            spawnResult = this.spawnCreep(body, creepName, { memory: spawnHarvesterOpts });
        }
        return spawnResult;
    };

    StructureSpawn.prototype.spawnTransporter = function(targetContainer: Container | ConstructionSite, containerBuilder: Boolean): number {

        let body: string[] = [];
        if (containerBuilder) {
            body = this.createWorkerBody(1, 2, 2, [CARRY, MOVE, WORK], false);
            console.log('ContainerTransport Body generated: ' + body.toString());
        }
        else {
            body = this.createWorkerBody(0, 3, 3, [MOVE, CARRY], true)
            console.log('Transporter Body generated: ' + body.toString());
        }

        let spawnTransporterOpts = {
            Role: 'transporter',
            TargetContainerID: targetContainer.id,
            MovePath: "",
            MoveID: 0,
            PreviousPos: undefined,
            PreviousMoveResult: undefined,
            Status: CreepStatus.Collecting,
            ColonyID: this.memory.ColonyID
        }

        let creepName = this.generateCreepName(spawnTransporterOpts.Role, spawnTransporterOpts.ColonyID)

        let canSpawn = this.spawnCreep(body, creepName, { dryRun: true });
        let spawnResult = canSpawn;
        if (canSpawn == OK){
            spawnResult = this.spawnCreep(body, creepName, { memory: spawnTransporterOpts });
        }
        return spawnResult;
    }

    StructureSpawn.prototype.generateCreepName = function(role: string, colonyID: string): string {
        let creepName = "";
        let nameExists = false;
        do {
            creepName = role + '_' + colonyID + '_' + Math.floor(Math.random() * 1000);
            nameExists = Game.creeps.hasOwnProperty(creepName);
        }
        while (nameExists);

        return creepName;
    }
}
