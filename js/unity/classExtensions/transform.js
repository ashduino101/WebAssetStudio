import {Extension} from "../extension";

export class TransformExtension extends Extension {
  constructor(transform) {
    super();
    this.transform = transform;
  }

  mapChildren() {
    this.realChildren = [];
    for (let child of this.transform.m_Children) {
      child.data.resolve();
      if (child.data.object) {
        if (child.data.object.constructor.name === 'Transform') {
          child.data.object.mapChildren();
          this.realChildren.push(child.data.object);
        } else if (child.data.object.constructor.name === 'GameObject') {
          let c = [];
          for (const ch of child.data.object.m_Components) {
            c.push(ch.data.object);
          }
          this.realChildren.push(c);
        }
      }
    }
  }
}