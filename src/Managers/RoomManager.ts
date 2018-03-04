import { Screep } from "Creeps/Screep";

export namespace RoomManager {

    export var rooms: Room[] = null;
    export var roomNames: string[] = [];

    export function loadRooms() {
        this.rooms = Game.rooms;

        loadRoomNames();

        for (let roomName in rooms) {
            this.roomNames.push(roomName);
        }
    }

    export function getFirstRoom(): Room {
        return rooms[this.roomNames[0]];
    }

    export function getBestDeposit(creep: Screep): Structure {
        // Get a list of structures that need energy ordered from closest to furtherst linear distance
        let sortedStructures: any = getFirstRoom().find(FIND_STRUCTURES, {
            filter: function (object) {
                return (object.structureTypee == STRUCTURE_SPAWN || object.structureType == STRUCTURE_EXTENSION)
                    && (object.energy < object.energyCapacity)
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
