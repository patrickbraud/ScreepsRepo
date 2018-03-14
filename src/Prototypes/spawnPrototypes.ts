export function spawnPrototypes() {

    StructureSpawn.prototype.createWorkerBody = function(maxWork: number, maxCarry: number, maxMove: number,
                                                                priority: string[], waitForMax: Boolean): string[] {

        let body: string[] = [];
        for (let baseWork = 0; baseWork < 1 && baseWork < maxWork; baseWork++) {
            body.push(WORK);
        }
        for (let baseCarry = 0; baseCarry < 1 && baseCarry < maxCarry; baseCarry++) {
            body.push(CARRY);
        }
        for (let baseMove = 0; baseMove < 1 && baseMove < maxMove; baseMove++) {
            body.push(MOVE);
        }
        console.log('Base Body: ' + body);

        let moveCount = 1, carryCount = 1, workCount = 1;
        let energyRequired = BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move;
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

    StructureSpawn.prototype.spawnHarvester = function(targetSource: Source): number {

        // let body: string[] = this.createWorkerBody(maxWork, maxCarry, maxMove, [WORK, CARRY, MOVE]);
        let body: string[] = this.createWorkerBody(5, 1, 1, [WORK, CARRY, MOVE], false);
        console.log('Body generated: ' + body.toString());

        let spawnHarvesterOpts = {
            Role: 'harvester',
            TargetSourceID: targetSource.id,
            TargetDepositID: 0,
            MovePath: "",
            MoveID: 0,
            PreviousPos: undefined,
            PreviousMoveResult: undefined,
            Status: 0,
            ColonyID: this.memory.ColonyID
        }

        let creepName = "";
        let nameExists = false;
        do {
            creepName = spawnHarvesterOpts.Role + '_' + spawnHarvesterOpts.ColonyID + '_' + Math.floor(Math.random() * 1000);
            nameExists = Game.creeps.hasOwnProperty(creepName);
        }
        while (nameExists);

        let canSpawn = this.spawnCreep(body, creepName, { dryRun: true });
        let spawnResult = canSpawn;
        if (canSpawn == OK){
            spawnResult = this.spawnCreep(body, creepName, { memory: spawnHarvesterOpts });
        }
        return spawnResult;
    };
}
