import { Screep } from "Creeps/Screep";

export namespace RoomManager {

    export var rooms: Room[] = null;
    export var roomNames: string[] = [];

    export function loadRooms() {
        this.rooms = Game.rooms;

        loadRoomNames();
    }

    export function getFirstRoom(): Room {
        return rooms[roomNames[0]];
    }


    export function getBestDeposit(creep: Screep): Structure {
        // Find all structures of type spawn or extension that isn't full
        // Sort by linear distance from this creep
        let sortedStructures: any = creep.creep.room.find(FIND_MY_STRUCTURES, {
            filter: function(structure) {
                return ((structure.structureType == STRUCTURE_SPAWN
                    || structure.structureType == STRUCTURE_EXTENSION)
                    && structure.energy < structure.energyCapacity);
            }
        }).sort((a: Structure, b: Structure): number => {return (creep.distanceTo(a.pos) - creep.distanceTo(b.pos))});

        return sortedStructures[0];
    }

    function loadRoomNames() {
        for (let roomName in rooms) {
            if (rooms.hasOwnProperty(roomName)) {
                roomNames.push(roomName);
            }
        }
    }
}
