export function spawnPrototypes() {

    StructureSpawn.prototype.spawnHarvester = function(maxWork: number, maxCarry: number, maxMove: number, targetSource: Source): number {

        let energyRequired = BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move;
        let energyAvailable = this.room.energyAvailable;

        let body: string[] = [WORK, CARRY, MOVE];
        let moveCount = 1, carryCount = 1, workCount = 1;
        for (; workCount < maxWork && energyRequired < energyAvailable; workCount++) {
            energyRequired += BODYPART_COST.work;
            body.push(WORK);
        }
        for (; carryCount < maxCarry && energyRequired < energyAvailable; carryCount++) {
            energyRequired += BODYPART_COST.carry;
            body.push(CARRY);
        }
        for (; moveCount < maxMove && energyRequired < energyAvailable; moveCount++) {
            energyRequired += BODYPART_COST.move;
            body.push(MOVE);
        }

        console.log('Energy Required: ' + energyRequired);
        console.log('Energy Available: ' + energyAvailable);
        console.log('Energy Capacity: ' + this.room.energyCapacityAvailable);
        console.log('Body generated: ' + body.toString());

        // If we created a body that is impossible to spawn with the current capacity of the room,
        // remove a WORK part until we are under the limit
        while (energyRequired > this.room.energyCapacityAvailable) {
            body.pop();
            energyRequired -= BODYPART_COST.work;
            console.log('Altered Body: ' + body.toString());
        }

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
            for (let name in Game.creeps) {
                if (name == creepName) {
                    nameExists = true;
                    break;
                }
            }
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
