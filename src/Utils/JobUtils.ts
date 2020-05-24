export class JobUtils {

    static jobBodyCost(body: number[]): number {

        let cost: number = 0;

        // WORK
        cost += (BODYPART_COST[WORK] * 100);

        // CARRY
        cost += (BODYPART_COST[CARRY] * 50);

        // MOVE 
        cost += (BODYPART_COST[MOVE] * 50);

        return cost;
    }
}