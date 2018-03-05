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
        // Get a list of structures that need energy ordered from closest to furtherst linear distance
        // let sortedStructures: any = getFirstRoom().find(FIND_STRUCTURES, {
        //     filter: function (object) {
        //         return (object.structureType == STRUCTURE_SPAWN || object.structureType == STRUCTURE_EXTENSION)
        //             && (object.energy < object.energyCapacity)
        //     }
        // }).sort((a: Structure, b: Structure): number => {return (creep.distanceTo(a.pos) - creep.distanceTo(b.pos))});

        let sortedStructures: any = getFirstRoom().find(FIND_MY_STRUCTURES, {
            filter: function(structure) {
                return ((structure.structureType == STRUCTURE_SPAWN
                    || structure.structureType == STRUCTURE_EXTENSION)
                    && structure.energy < structure.energyCapacity);
            }
        }).sort((a: Structure, b: Structure): number => {return (creep.distanceTo(a.pos) - creep.distanceTo(b.pos))});

        //console.log(sortedStructures);
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
