export class ListItem {
  public id: string = '';
  public label: string = '';

  constructor(
    id: string,
    label: string
  ) {
    this.id = id;
    this.label = label;
  }
}