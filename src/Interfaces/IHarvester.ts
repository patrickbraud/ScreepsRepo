export interface IHarvester{

    creep: Creep;

    TargetSourceID: string;
    TargetDepositID: string;

    work();

    harvest(source: Source);

    deposit(targte: Structure);
}
