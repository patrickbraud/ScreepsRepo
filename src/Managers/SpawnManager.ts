export namespace SpawnManager {

    export var spawnNames: string[] = []
    export var spawns: Spawn[];

    export function loadSpawns() {
        this.spawns = Game.spawns;
        for (let spawnName in spawns) {
            this.spawnNames.push(spawnName);
        }
    }

    export function getFirstSpawn(): Spawn {
        return spawns[spawnNames[0]];
    }
}
