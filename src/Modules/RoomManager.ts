import { DistanceTo } from "Efficiency";

export namespace RoomManager {

    export var rooms: { [roomName: string]: Room }

    export function loadRooms() {
        this.rooms = Game.rooms;
    }

    export function getFirstRoom(): Room {
        return this.rooms[0];
    }

    export function getBestDeposit(creep: Creep) {
        getFirstRoom().find(FIND_STRUCTURES, {
            filter: function (object) {
                return object.structureTypee == STRUCTURE_SPAWN || object.structureType == STRUCTURE_EXTENSION;
            }
        });
    }
}
