import enum
import io
import os
import re
import struct


class Node:
    def __init__(self):
        self.version = 0
        self.level = 0
        self.type_flags = 0
        self.type_name = ""
        self.name = ""
        self.size = 0
        self.index = 0
        self.meta_flags = 0
        self.children = []
        self.child_map = {}

    def parse(self, f, strings):
        num_nodes, string_table_size = struct.unpack('<II', f.read(8))

        data = io.BytesIO(f.read(num_nodes * 24))
        string_table = f.read(string_table_size)

        parents = [self]

        for _ in range(num_nodes):
            version, level = struct.unpack('<hB', data.read(3))
            if level == 0:
                curr = self
            else:
                while len(parents) > level:
                    parents.pop()
                curr = Node()
                parents[len(parents) - 1].children.append(curr)
                parents.append(curr)

            type_flags, type_name_id, name_id, size, index, meta_flags = struct.unpack('<BiiiiI', data.read(21))

            curr.version = version
            curr.level = level
            curr.type_flags = type_flags
            curr.type_name = get_string(string_table, strings, type_name_id)
            curr.name = get_string(string_table, strings, name_id)
            curr.size = size
            curr.index = index
            curr.meta_flags = meta_flags

            if level > 0:
                parents[len(parents) - 2].child_map[curr.name] = curr

    def get(self, name):
        return self.child_map.get(name)

    def diff(self, other):
        added = {'*': []}
        removed = {'*': []}
        all_names = list(set([c.name for c in (self.children + other.children)]))
        for name in all_names:
            child = self.get(name)

            if not other.get(name):
                added['*'].append(self.get(name))
            elif not self.get(name):
                removed['*'].append(other.get(name))
            else:
                item = other.get(name)
                if len(item.children) > 0:
                    diff = child.diff(item)
                    if len(diff[0]['*']) > 0:
                        added[name] = diff[0]
                    if len(diff[1]['*']) > 0:
                        removed[name] = diff[1]

        return added, removed

    def __repr__(self, level=0):
        s = f'{"  " * level}{self.type_name} {self.name} {{v{self.version}}}\n'
        for c in self.children:
            s += c.__repr__(level=level+1)
        if (self.meta_flags & 16384) == 16384:
            s += f'{"  " * level}(align)\n'
        return s

    __str__ = __repr__


def read_cstring(f):
    s = b''
    while True:
        c = f.read(1)
        if c == b'\x00':
            break
        s += c
    return s.decode('utf-8')


def get_string(local_table, global_table, offset):
    is_local = (offset & 0x80000000) == 0
    if is_local:
        return local_table[offset:].partition(b'\x00')[0].decode('utf-8')
    return global_table[offset & 0x7fffffff:].partition(b'\x00')[0].decode('utf-8')


def load_tree(version):
    with open(f'TypeTreeDumps/StructsData/release/{version}.dat', 'rb') as f:
        version = read_cstring(f)
        with open(f'TypeTreeDumps/StringsData/2023.3.0b5.dat', 'rb') as s:
            strings = s.read()
        platform, has_type_trees, num_types = struct.unpack('<I?I', f.read(9))
        trees = []
        for _ in range(num_types):
            type_id, = struct.unpack('<I', f.read(4))
            if type_id < 0:
                f.read(0x20)
            else:
                f.read(0x10)
            tree = Node()
            tree.parse(f, strings)
            trees.append(tree)
        return trees


def version2int(version):
    types = ['', 'a', 'b', 'f']
    parts = re.findall(r'(\d+)\.(\d+)\.(\d+)(?:([abf])(\d+))?', version)[0]
    res = f'{f"{parts[0]:0>4}"[1:]}{f"{parts[1]:0>2}"[:2]}{f"{parts[2]:0>2}"[:2]}{types.index(parts[3])}{f"{parts[4]:0>2}"[:2]}'
    return int(res)


class ModificationType(enum.Enum):
    Add = 0
    Remove = 1


class Modification:
    def __init__(self, typ, node, version):
        self.type = typ
        self.node = node
        self.version = version


class TypeDefNode:
    def __init__(self, class_name):
        self.class_name = class_name
        self.modifications = []
        self.children = []
        self._map = {}

    def update(self, add, remove, version):
        self._update(add, ModificationType.Add, version)
        self._update(remove, ModificationType.Remove, version)

    def _update(self, items: dict[str, list], typ, version):
        a = items.copy()
        flat = a.pop('*')
        for i in flat:
            self.modifications.append(Modification(typ, i, version))


def main():
    trees = {}

    # versions = [[0, '5.6.7f1'], [1, '2017.1.0b1']]
    versions = []
    for f in os.listdir('TypeTreeDumps/StructsData/release'):
        versions.append([version2int(f[:-4]), f[:-4]])

    versions = sorted(versions, key=lambda i: i[0])
    initial = load_tree(versions[0][1])

    for i, v in enumerate(versions):
        if i == 0:
            old = []
        else:
            old = load_tree(versions[i - 1][1])
        new = load_tree(v[1])
        print(f'computing deltas for {v[1]}')
        for elem2 in new:
            elem2 = [i for i in new if i.type_name == 'Texture2D'][0]
            elem1 = [i for i in old if i.type_name == elem2.type_name]

            if len(elem1) == 0:
                print(f'new {elem2.type_name}')
                elem1.append(Node())
                trees[elem2.type_name] = TypeDefNode(elem2.type_name)
            elem1 = elem1[0]
            added, removed = elem2.diff(elem1)
            trees[elem2.type_name].update(added, removed, v[0])
            print(added, removed)
            # if len(added['*']) > 0 or len(added) > 1:
            #     print('ADDED ---')
            #     print(f'{str(added):<40}', elem2.type_name)
            # if len(removed['*']) > 0 or len(removed) > 1:
            #     print('REMOVED ---')
            #     print(f'{str(removed):<40}', elem2.type_name)
            break

    # cls = 'Texture2D'
    # elem1 = [i for i in old if i.type_name == cls][0]
    # elem2 = [i for i in new if i.type_name == cls][0]


if __name__ == '__main__':
    main()
