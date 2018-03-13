export function roomPrototypes() {

    Room.prototype.positionIsValid = function(pos: RoomPosition): Boolean {
        let lookResult = this.lookForAt(LOOK_TERRAIN, pos);
            //console.log('x: ' + pos.x + ' y: ' + pos.y + ' - ' + lookResult.toString() + ' - ' + (lookResult.toString() != 'wall'));
            return !(lookResult.toString() == 'wall');
    }

    Object.defineProperty(Room.prototype, 'sourcesInRoom', {
        get: function(): Source[] {
            if (!this._sourcesInRoom) {
                this._sourcesInRoom = this.find(FIND_SOURCES);
            }
            return this._sourcesInRoom;
        },
        set: function(sources: Source[]) {
            // We set the stored private variable so the next time the getter is called
            // it returns this new value
            this._sourcesInRoom = sources;
        },
    });
}
