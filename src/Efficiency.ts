// Get the linear distance from a creep to a source
export function DistanceTo(pos1: Creep, pos2: RoomPosition) {
    return Math.sqrt(Math.pow(pos2.x - pos1.pos.x, 2) + Math.pow(pos2.y - pos1.pos.y, 2));
}
