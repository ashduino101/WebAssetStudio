export const TinyTree = (() => {
  class Tree {
    constructor(s, options) {
      this.container = (s instanceof String) ? document.querySelector(s) : s;
      this.tree = document.createElement('ul');
      this.tree.classList.add('vtree');
      this.container.appendChild(this.tree);

      this.placeholder = options && options.placeholder;
      this._placeholder();
      this.leafs = {};
      this.tree.addEventListener('click', evt => {
        if (evt.target.classList.contains('vtree-leaf-label')) {
          this.select(evt.target.parentNode.getAttribute('data-vtree-id'));
        } else if (evt.target.classList.contains('vtree-toggle')) {
          this.toggle(evt.target.parentNode.getAttribute('data-vtree-id'));
        }
      });
      this.tree.addEventListener('dblclick', evt => {
        if (evt.target.classList.contains('vtree-leaf-label')) {
          this.toggle(evt.target.parentNode.getAttribute('data-vtree-id'));
          return;
        }
        if (evt.target.parentNode.classList.contains('vtree-leaf-label')) {
          this.toggle(evt.target.parentNode.parentNode.getAttribute('data-vtree-id'));
        }
      });

      if (options && options.contextmenu) {
        this.tree.addEventListener('contextmenu', function (evt) {
          let menu;
          document.querySelectorAll('.vtree-contextmenu').forEach(function (menu) {
            menu.parentNode.removeChild(menu);
          });
          if (evt.target.classList.contains('.vtree-leaf-label')) {
            evt.preventDefault();
            evt.stopPropagation();
            menu = document.createElement('menu');
            menu.classList.add('vtree-contextmenu');

            let rect = evt.target.getBoundingClientRect();
            menu.style.top = (evt.target.offsetTop + rect.height).toString() + "px";
            menu.style.left = evt.target.offsetLeft.toString() + "px";
            menu.style.display = 'block';

            options.contextmenu.forEach(function (item) {
              let menuItem = document.createElement('li');
              menuItem.classList.add('vtree-contextmenu-item');
              menuItem.innerHTML = item.label;
              menu.appendChild(menuItem);
              menuItem.addEventListener('click', item.action.bind(
                item,
                evt.target.parentNode.getAttribute('data-vtree-id')
              ));
            });

            evt.target.parentNode.appendChild(menu);
          }
        });

        document.addEventListener('click', function (evt) {
          if (evt.button === 2) return;
          document.querySelectorAll('.vtree-contextmenu').forEach(function (menu) {
            menu.parentNode.removeChild(menu);
          });
        });
      }
    };

    _dispatch(name, id) {
      let event;
      event = new CustomEvent('vtree-' + name, {
        bubbles: true,
        cancelable: true,
        detail: {
          id: id
        }
      });
      (this.getLeaf(id, true) || this.tree).dispatchEvent(event);
      return this;
    }

    _placeholder() {
      let p;
      if (!this.tree.children.length && this.placeholder) {
        this.tree.innerHTML = '<li class="vtree-placeholder">' + this.placeholder + '</li>';
      } else if (p = this.tree.querySelector('.vtree-placeholder')) {
        this.tree.removeChild(p);
      }
      return this;
    }

    getLeaf(id, notThrow) {
      let leaf = this.tree.querySelector('[data-vtree-id="' + id + '"]');
      if (!notThrow && !leaf) throw Error('No leaf with id "' + id + '"');
      return leaf;
    }

    getChildList(id) {
      let list;
      let parent;
      if (id) {
        parent = this.getLeaf(id);
        if (!(list = parent.querySelector('ul'))) {
          let subTree = document.createElement('ul');
          subTree.classList.add('vtree-subtree');
          list = parent.appendChild(subTree);
        }
      } else {
        list = this.tree;
      }

      return list;
    }

    add(options) {
      let id;
      let leaf = document.createElement('li');
      leaf.classList.add('vtree-leaf');

      let parentList = this.getChildList(options.parent);

      leaf.setAttribute(
        'data-vtree-id',
        id = options.id || Math.random().toString(36).substring(2)
      );

      let toggle = document.createElement('span');
      toggle.classList.add('vtree-toggle')
      leaf.appendChild(toggle);

      let label = document.createElement('a');
      label.classList.add('vtree-leaf-label');
      label.innerHTML = options.label;
      leaf.appendChild(label)

      parentList.appendChild(leaf);

      if (parentList !== this.tree) {
        parentList.parentNode.classList.add('vtree-has-children');
      }

      this.leafs[id] = options;

      if (!options.opened) {
        this.close(id);
      }

      if (options.selected) {
        this.select(id);
      }

      return this._placeholder()._dispatch('add', id);
    }

    move(id, parentId) {
      const leaf = this.getLeaf(id);
      const oldParent = leaf.parentNode;
      const newParent = this.getLeaf(parentId, true);

      if (newParent) {
        newParent.classList.add('vtree-has-children');
      }

      this.getChildList(parentId).appendChild(leaf);
      oldParent.parentNode.classList.toggle('vtree-has-children', !!oldParent.children.length);

      return this._dispatch('move', id);
    }

    remove(id) {
      const leaf = this.getLeaf(id);
      const oldParent = leaf.parentNode;
      oldParent.removeChild(leaf);
      oldParent.parentNode.classList.toggle('vtree-has-children', !!oldParent.children.length);

      return this._placeholder()._dispatch('remove', id);
    }

    open(id) {
      this.getLeaf(id).classList.remove('closed');
      return this._dispatch('open', id);
    }

    close(id) {
      this.getLeaf(id).classList.add('closed');
      return this._dispatch('close', id);
    }

    toggle(id) {
      return this[this.getLeaf(id).classList.contains('closed') ? 'open' : 'close'](id);
    }

    select(id) {
      let leaf = this.getLeaf(id);

      if (!leaf.classList.contains('vtree-selected')) {
        this.tree.querySelectorAll('li.vtree-leaf').forEach(function (leaf) {
          leaf.classList.remove('vtree-selected');
        });

        leaf.classList.add('vtree-selected');
        this._dispatch('select', id);
      }

      return this;
    }
  }
  return {
    Tree
  };
})();
