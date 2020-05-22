export function spawnPrototypes() {

    StructureSpawn.prototype.createHarvesterBody = function(maxWork: number, maxCarry: number, maxMove: number): BodyPartConstant[] {

        if (this.energyCapacity == 300) return [WORK, WORK, MOVE, MOVE]

        let body: BodyPartConstant[] = []
        for (let workCount = 0; workCount < maxWork; workCount++) {
            body.push(WORK);
        }

        for (let carryCount = 0; carryCount < maxCarry; carryCount++) {
            body.push(CARRY);
        }

        for (let moveCount = 0; moveCount < maxMove; moveCount++) {
            body.push(MOVE);
        }

        let energyRequired = (BODYPART_COST.work * maxWork)
                             + (BODYPART_COST.carry * maxCarry)
                             + (BODYPART_COST.move * maxMove);

        let workCount = maxWork;
        let moveCount = maxMove;

        // console.log(body);
        // console.log("energyRequired: " + energyRequired)
        // console.log("energyCapacityAvailable: " + this.energyCapacity)

        while (energyRequired > this.energyCapacity)
        {
            // console.log(body);
            // console.log("energyRequired: " + energyRequired)
            // console.log("energyCapacityAvailable: " + this.energyCapacity)

            let removePart!: BodyPartConstant;

            if (moveCount > 1) removePart = MOVE;
            else if (workCount > 4) removePart = WORK;

            let index: number = body.indexOf(removePart, 0)
            if (index > -1) {

                body = body.splice(index, 1);
                energyRequired -= BODYPART_COST[removePart];
            }
        }

        return body;
    }

    StructureSpawn.prototype.generateCreepName = function(role: string, colonyId: string): string {
        let creepName = "";
        let nameExists = false;
        do {
            creepName = role + '_' + colonyId + '_' + Math.floor(Math.random() * 1000);
            nameExists = Game.creeps.hasOwnProperty(creepName);
        }
        while (nameExists);

        return creepName;
    }
}
