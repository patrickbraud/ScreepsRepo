export function containerPrototypes() {

    StructureContainer.prototype.transportersForContainer = function(transporters: Creep[], sourceContainers: {container: Container, source: Source}[]): Creep[] {

        let connectedSource: Source;
        // Find the source for this container
        for (let sourceContainer of sourceContainers) {
            if (sourceContainer.container == this.id) {
                connectedSource = sourceContainer.source;
                break;
            }
        }

        let containerTransporters: Creep[] = [];
        if (connectedSource != undefined) {
            // Find all transporters for our connected source
            for (let transporter of transporters) {
                if (transporter.memory.TargetSourceID == connectedSource.id) {
                    containerTransporters.push(transporter);
                }
            }
        }

        return containerTransporters;
    }
}
