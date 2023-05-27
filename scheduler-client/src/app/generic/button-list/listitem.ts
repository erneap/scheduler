export class ListItem {
  public id: string = '';
  public label: string = '';
  sortid: number = 0;

  constructor(
    id: string,
    label: string
  ) {
    this.id = id;
    this.label = label;
  }

  compareTo(other?: ListItem): number {
    if (other) {
      return (this.sortid < other.sortid) ? -1 : 1;
    }
    return -1;
  }
}