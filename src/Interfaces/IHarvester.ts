export interface IHarvester{

    creep: Creep;

    TargetSourceID: string;
    TargetDumpID: string;

    work();

    harvest(source: Source);
}
