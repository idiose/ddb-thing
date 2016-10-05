export default class List {

  constructor({ prefix = '' } = {}) {
    this.prefix = prefix;
    this.items = [];
  }

  add(item) {
    if (!this.items.includes(item)) this.items.push(item);
    return `${this.prefix}${this.items.indexOf(item) + 1}`;
  }

  /*
  *values() {
    yield* this.items;
  }
  */

  get map() {
    return this.items.reduce((output, item, index) => ({ ...output, [`${this.prefix}${index + 1}`]: item }), {});
  }

}
