export interface IShift {
  id: string;
  name: string;
  sort: number;
  associatedCodes?: string[];
  payCode: number;
}

export class Shift implements IShift {
  id: string;
  name: string;
  sort: number;
  associatedCodes?: string[];
  payCode: number;

  constructor(shft?: IShift) {
    this.id = (shft) ? shft.id : '';
    this.name = (shft) ? shft.name : '';
    this.sort = (shft) ? shft.sort : 0;
    this.payCode = (shft) ? shft.payCode : 1;
    this.associatedCodes = [];
    if (shft && shft.associatedCodes) {
      shft.associatedCodes.forEach(ac => {
        this.associatedCodes?.push(ac);
      });
    }
  }

  compareTo(other?: Shift): number {
    if (other) {
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }
}

export interface IPosition {
  id: string;
  name: string;
  sort: number;
  assigned: string[];
}

export class Position implements IPosition {
  id: string;
  name: string;
  sort: number;
  assigned: string[];

  constructor(pos?: IPosition) {
    this.id = (pos) ? pos.id : '';
    this.name = (pos) ? pos.name : '';
    this.sort = (pos) ? pos.sort : 0;
    this.assigned = [];
    if (pos && pos.assigned.length > 0) {
      pos.assigned.forEach(asgn => {
        this.assigned.push(asgn);
      });
    }
  }

  compareTo(other?: Position): number {
    if (other) {
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }
}

export interface IWorkcenter {
  id: string;
  name: string;
  sort: number;
  shifts?: IShift[];
  positions?: IPosition[];
}

export class Workcenter implements IWorkcenter {
  id: string;
  name: string;
  sort: number;
  shifts?: Shift[];
  positions?: Position[];

  constructor(wc?: IWorkcenter) {
    this.id = (wc) ? wc.id : '';
    this.name = (wc) ? wc.name : '';
    this.sort = (wc) ? wc.sort : 0;
    this.shifts = [];
    if (wc && wc.shifts && wc.shifts.length > 0) {
      wc.shifts.forEach(s => {
        this.shifts?.push(new Shift(s));
      });
      this.shifts?.sort((a,b) => a.compareTo(b))
    }
    this.positions = [];
    if (wc && wc.positions && wc.positions.length > 0) {
      wc.positions.forEach(pos => {
        this.positions?.push(new Position(pos));
      });
      this.positions.sort((a,b) => a.compareTo(b));
    }
  }
}