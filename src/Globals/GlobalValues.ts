export namespace GlobalValues {

    // export var rooms: Room[];
    // export var roomNames: string[];

    export var spawns: {[spawnName: string]: StructureSpawn};
    export var spawnNames: string[];
    export var spawnCount: number;

    export function loadGlobals() {
        // this.rooms = Game.rooms;
        // loadRoomNames();
        loadSpawns();
        // for(let name in spawns) {
        //     console.log(name);
        // }
    }

    // function loadRoomNames() {
    //     for (let roomName in rooms) {
    //         if (rooms.hasOwnProperty(roomName)) {
    //             this.roomNames.push(roomName);
    //         }
    //     }
    // }

    export function loadSpawns() {
        spawns = Game.spawns;
        spawnCount = _.size(spawns);

        loadSpawnNames();
    }

    function loadSpawnNames() {
        spawnNames = [];
        for (let spawnName in spawns) {
            if (spawns.hasOwnProperty(spawnName)) {
                spawnNames.push(spawnName);
            }
        }
    }
}
