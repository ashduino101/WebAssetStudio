from __future__ import annotations

import collections
import dataclasses
import datetime
import enum
import io
import os
import re
import struct
import zlib
from typing import Any

# import tqdm

TYPE_MAP = {
    'bool': 'bool',

    'SInt8': 'i8',
    'UInt8': 'u8',
    'char': 'u8',

    'SInt16': 'i16',
    'short': 'i16',
    'UInt16': 'u16',
    'unsigned short': 'u16',

    'SInt32': 'i32',
    'int': 'i32',
    'UInt32': 'u32',
    'unsigned int': 'u32',
    'Type*': 'u32',
    'OffsetPtr': 'u32',

    'long long': 'i64',
    'SInt64': 'i64',
    'unsigned long long': 'u64',
    'UInt64': 'u64',
    'FileSize': 'u64',

    'float': 'f32',
    'double': 'f64',

    'Vector2f': 'Vector2f',
    'Vector3f': 'Vector3f',
    'Vector4f': 'Vector4f',
    'Quaternionf': 'Quaternionf',

    'ColorRGBA': 'ColorRGBA',

    'Matrix4x4f': 'Matrix4x4f',
    'GUID': 'GUID',
    'Hash128': 'Hash128',

    'TypelessData': 'TypelessData',

    'string': 'String',
}

ABSTRACT_BASES = {
    'NamedObject': 'NamedObject',
    'GameManager': 'Object',
    'LevelGameManager': 'GameManager',
    'GlobalGameManager': 'GameManager',
    'EditorExtension': 'Object',
    'Component': 'EditorExtension',
    'Renderer': 'Component',
    'Texture': 'NamedObject',
    'Collider2D': 'Behaviour',
    'Collider': 'Component',
    'Joint': 'Component',
    'RuntimeAnimatorController': 'NamedObject',
    'BaseAnimationTrack': 'NamedObject',
    'AudioBehaviour': 'Behaviour',
    'AudioFilter': 'Behaviour',
    'Motion': 'NamedObject',
    'Joint2D': 'Behaviour',
    'AnchoredJoint2D': 'Joint2D',
    'BaseVideoTexture': 'Texture',
    'PhysicsUpdateBehaviour2D': 'Behaviour',
    'Effector2D': 'Behaviour',
    'AssetImporter': 'NamedObject',
    'ModelImporter': 'AssetImporter',
    'IConstraint': 'Behaviour',
    'VisualEffectObject': 'NamedObject',
    'VisualEffectSubgraph': 'VisualEffectObject',
    'GridLayout': 'Behaviour',
    'SceneAsset': 'DefaultAsset',
    'Behaviour': 'Component'
}

class MutationEventType(enum.Enum):
    AddField = 1
    DelField = 2
    RetypeField = 3
    ReorderField = 4
    AlignField = 5



@dataclasses.dataclass
class MutationEvent:
    type: MutationEventType
    version: int
    data: Any

def serialize_mutation_event(buf: io.BytesIO, evt: MutationEvent):
    buf.write(struct.pack('<BI', evt.type.value, evt.version))
    match evt.type:
        case MutationEventType.AddField:
            evt.data[0].serialize(buf)
            buf.write(struct.pack('<H', evt.data[1]))
        case MutationEventType.DelField:
            buf.write(bytes([len(evt.data), *evt.data.encode('utf-8')]))
        case MutationEventType.AlignField:
            buf.write(bytes([len(evt.data[0]), *evt.data[0].encode('utf-8')]))
            buf.write(bytes([evt.data[1]]))
        case _:
            print('Unknown event', evt)

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
        self.events = []
        self.children = []
        self.child_map: collections.OrderedDict[str, Node] = collections.OrderedDict()
        self.deleted = False

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

    def get(self, name: str):
        return self.child_map.get(name)

    def index_of(self, name: str):
        return list(self.child_map.keys()).index(name)

    def diff(self, other: Node, version):  # other must be older
        all_names = list(set([c.name for c in (self.children + other.children)]))
        self.events += other.events
        for name in all_names:
            newer = self.get(name)
            older = other.get(name)
            if newer and not (older or (older and older.deleted)):  # newer has it but older doesn't -- added here
                self.events.append(MutationEvent(
                    MutationEventType.AddField,
                    version,
                    (newer, self.index_of(name))
                ))
                if older:
                    older.deleted = False
            elif older and not newer:  # older has it but newer doesn't -- removed after here
                if not older.deleted:
                    self.events.append(MutationEvent(
                        MutationEventType.DelField,
                        version,
                        name
                    ))
                    # make sure to keep it, though!
                    self.children.insert(other.index_of(name), older)
                    self.child_map[name] = older
                    older.deleted = True
            else:
                if len(older.children) > 0:
                    newer.diff(older, version)

                if (newer.meta_flags & 16384) and not (older.meta_flags & 16384):
                    # now aligned, previously not
                    newer.events.append(MutationEvent(
                        MutationEventType.AlignField,
                        version,
                        (name, True)
                    ))
                elif (older.meta_flags & 16384) and not (newer.meta_flags & 16384):
                    # no longer aligned
                    newer.events.append(MutationEvent(
                        MutationEventType.AlignField,
                        version,
                        (name, False)
                    ))

    def serialize(self, buf: io.BytesIO):
        buf.write(bytes([len(self.type_name), *self.type_name.encode('utf-8')]))
        buf.write(bytes([len(self.name), *self.name.encode('utf-8')]))
        buf.write(struct.pack('<IB', self.meta_flags, self.type_flags))
        buf.write(struct.pack('<I', len(self.events)))
        for evt in self.events:
            serialize_mutation_event(buf, evt)
        buf.write(struct.pack('<I', len(self.children)))
        for child in self.children:
            child.serialize(buf)



    @staticmethod
    def rustify_prop(name):
        if name.startswith('m_'):
            name = name[2:]

        n = ''
        for i, c in enumerate(name):
            # second two conditions prevent things like PathID from becoming path_i_d (should be path_id)
            if c.isupper() and (i > 1) and (not name[i - 1].isupper()):
                n += '_'
            n += c.lower()

        if n.startswith('_'):
            n = n[1:]

        # Replace indices
        idx = re.findall(r'\[\s*(\d+)]', n)
        n = re.sub(r'(\[\s*\d+])', '', n)
        if len(idx) > 0:
            g = int(idx[0])
            n += f'_{g}'

        # Replace invalid characters and duplicated
        n = n.replace(' ', '_')
        n = n.replace('?', '')
        n = n.replace(':', '')
        n = n.replace('.', '')
        n = n.replace('-', '_')
        n = n.replace('__', '_')
        n = re.sub(r'\(\w+[&*]\)', '', n)
        if n[0].isnumeric():
            n = '_' + n

        # Replace keywords
        n = re.sub('^type$', 'r#type', n)
        n = re.sub('^struct$', 'r#struct', n)
        n = re.sub('^override$', 'r#override', n)
        n = re.sub('^loop$', 'r#loop', n)

        return n

    def wrap_comparator(self, if_true, if_false):
        c = f'{{{if_true};v}}'
        if len(self.version_ranges) > 0 or len(self.align_version_ranges) > 0:
            c = 'if '
            for r in self.version_ranges:
                c += '('
                if r.start is not None:
                    c += f'{r.start} <= ver'
                if r.start is not None and r.end is not None:
                    c += f' && '
                if r.end is not None:
                    c += f'ver < {r.end}'
                c += ') || '
            c = c[:-4]
            if len(self.version_ranges) == 0:
                c = 'if true '  # TODO better logic
            c += '{' + if_true

            ac = ';if '
            for r in self.align_version_ranges:
                ac += '('
                if r.start is not None:
                    ac += f'{r.start} <= ver'
                if r.start is not None and r.end is not None:
                    ac += f' && '
                if r.end is not None:
                    ac += f'ver < {r.end}'
                ac += ') || '
            ac = ac[:-4]
            ac += '{data.align(init_length, 4);};v'

            c += ac

            c += '} else {' + if_false + '}'
        return c

    @staticmethod
    def translate_type(node):
        typ = node.type_name
        rt = TYPE_MAP.get(typ)
        if rt:
            return rt
        elif node.type_flags & 1:
            return f'Vec<{Node.translate_type(node.children[1])}>'
        elif node.type_name == 'vector':
            return Node.translate_type(node.children[0])
        elif node.type_name == 'pair':
            first = node.children[0]
            second = node.children[1]
            return f'Pair<{Node.translate_type(first)}, {Node.translate_type(second)}>'
        elif node.type_name == 'map':
            arr = node.children[0]
            val = arr.children[1]
            first = val.children[0]
            second = val.children[1]
            return f'Map<{Node.translate_type(first)}, {Node.translate_type(second)}>'
        elif node.type_name.startswith('PPtr<'):
            return 'PPtr'
        return typ

    @staticmethod
    def should_skip_bind(typ):
        return (
                (typ in ['Bytes', 'String']) or
                typ.startswith('Vec<') or
                typ.startswith('Map<') or
                typ.startswith('Pair<')
        )

    def generate_struct(self, hist):
        if self.type_name in hist:
            return hist[self.type_name]
        if self.type_name in TYPE_MAP:
            return
        struct_name = self.type_name
        if struct_name.startswith('PPtr<'):
            struct_name = 'PPtr'
        if self.type_name not in ['vector', 'pair', 'map']:
            # s = f'#[wasm_bindgen]\n' \
            s = f'#[derive(Debug, Default)]\n' \
                f'pub struct {struct_name} {{\n'
            added = set()
            for c in self.children:
                prop = self.rustify_prop(c.name)
                typ = self.translate_type(c)
                if prop in added:
                    continue
                # if Node.should_skip_bind(typ):
                #     s += '    #[wasm_bindgen(skip)]\n'
                s += f'    pub {prop}: {typ},\n'
                added.add(prop)
            s += f'}}\n\nimpl TypeDefFromBytes for {struct_name} {{\n'
            s += f'    fn from_bytes(data: &mut Bytes, ver: u32) -> {struct_name} {{\n'
            s += f'        let init_length = data.len();\n'
            s += f'        {struct_name} {{\n'
            added = set()
            for c in self.children:
                prop = self.rustify_prop(c.name)
                typ = self.translate_type(c)
                if prop in added:
                    continue
                if typ.startswith('Vec<'):
                    typ = 'Vec::' + typ[3:]
                elif typ.startswith('Pair<'):
                    typ = 'Pair::' + typ[4:]
                elif typ.startswith('Map<'):
                    typ = 'Map::' + typ[3:]
                if_true = f'let v={typ}::from_bytes(data, ver);'
                if_false = f'Default::default()'
                s += f'{prop}: {c.wrap_comparator(if_true, if_false)},\n'
                added.add(prop)
            s += f'        }}\n'
            s += f'    }}\n'
            s += f'}}\n'
            hist[struct_name] = s
        for c in self.children:
            if (
                    (len(c.children) > 0) and
                    (hist.get(c.type_name) is None) and
                    (c.type_name not in TYPE_MAP) and
                    (c.type_name not in ['vector', 'pair', 'map']) and
                    (not (c.type_flags & 1))
            ):
                c.generate_struct(hist)
            if c.type_flags & 1:
                array_type = c.children[1]
                array_type.generate_struct(hist)

            # make sure to generate inner types for overridden classes
            if c.type_name == 'vector':
                c.children[0].children[1].generate_struct(hist)
            if c.type_name == 'pair':
                c.children[0].generate_struct(hist)
                c.children[1].generate_struct(hist)
            if c.type_name == 'map':
                val = c.children[0].children[1]
                val.children[0].generate_struct(hist)
                val.children[1].generate_struct(hist)

    def __repr__(self, level=0):
        s = f'{"  " * level}{self.type_name} {self.name} {{v{self.version}}} {{{self.events}}}\n'
        for c in self.children:
            s += c.__repr__(level=level + 1)
        # if (self.meta_flags & 16384) == 16384:
        #     s += f'{"  " * level}(align {self.align_version_ranges})\n'
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
    types = ['', 'a', 'b', 'f', 'p']
    parts = re.findall(r'(\d+)\.(\d+)\.(\d+)(?:([abf])(\d+))?', version)[0]
    res = f'{f"{parts[0]:0>4}"[1:]}{f"{parts[1]:0>2}"[:2]}{f"{parts[2]:0>2}"[:2]}{types.index(parts[3])}{f"{parts[4]:0>2}"[:2]}'
    return int(res)


def main():
    trees = {}

    versions = []
    for f in os.listdir('TypeTreeDumps/StructsData/release'):
        versions.append([version2int(f[:-4]), f[:-4]])

    versions = sorted(versions, key=lambda i: i[0])

    # versions = [[version2int('3.4.0'), '3.4.0'], [version2int('2023.2.8f1'), '2023.2.8f1']]

    print('Comparing trees')

    old = None
    for i, v in enumerate(versions):
        print(f'{i}/{len(versions)}')
        if i == 0:
            old = []
        new = load_tree(v[1])
        for elem2 in new:
            elem1 = [i for i in old if i.type_name == elem2.type_name]

            if len(elem1) == 0:
                elem1.append(Node())
            elem1 = elem1[0]
            # if len(elem1.children) > 0:
            #     print(v, elem1.get('m_Component').children[0].children[1].children)
            elem2.diff(elem1, v[0])
            trees[elem2.type_name] = elem2

            # break
        old = new

    buf = io.BytesIO()
    buf.write(struct.pack('<I', len(trees)))
    for (name, tree) in trees.items():
        buf.write(bytes([len(name), *name.encode('utf-8')]))
        tree.serialize(buf)
    data = buf.getvalue()
    print(len(data))
    with open('trees.bin', 'wb') as f:
        f.write(data)
    return
    print('Generating code')

    hist = {}

    for t in trees.values():
        t.generate_struct(hist)

    code = '// Generated code. DO NOT EDIT!!!\n'
    code += f'// Created from {len(versions)} trees at {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n'

    with open('typedefs.rs', 'r') as tf:
        code += tf.read()
        code += '\n// BEGIN GENERATED CLASSES\n'

    for i in hist.values():
        # print(i)
        code += i + '\n'
        # print()

    print('Writing abstract aliases')
    code += '\n// Abstract types referenced in PPtrs\n'
    for k, v in ABSTRACT_BASES.items():
        if k not in hist:
            code += f'type {k} = {v};\n'

    with open('classes.gen.rs', 'w') as of:
        of.write(code)

    print(trees)


def test():
    def define_for_testing(nodes):
        root = Node()
        root.type_name = 'Root'
        root.name = 'root'
        def build(b, v, level=0):
            for (name, val) in v.items():
                n = Node()
                if isinstance(val, dict):
                    n.type_name = 'object'
                    build(n, val, level + 1)
                else:
                    n.type_name = val
                n.name = name
                b.children.append(n)
        build(root, nodes)
        return root

    tree_a = define_for_testing({
        'a': 'int',
        'b': 'float',
        'c': 'bool',
        'd': {
            'a': 'float',
            'b': 'string'
        }
    })
    tree_b = define_for_testing({
        'a': 'int',
        'b': 'float',
        'c': 'bool',
        'd': {
            'a': 'float',
            'b': 'string'
        }
    })
    tree_a.diff(tree_b, 1)
    print(tree_a)


if __name__ == '__main__':
    main()
    # test()
