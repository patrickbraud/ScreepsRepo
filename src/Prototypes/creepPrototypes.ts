export function creepPrototypes() {

    Creep.prototype.partCount = function(partType: string): number {
        let count = 0;
        for (let part of this.body) {
            if (part.type === partType) {
                count++;
            }
        }
        return count;
    };
}
