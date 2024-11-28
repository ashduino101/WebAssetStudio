import dataclasses
import enum
import struct
from typing import Any


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


def read_mutation_event(buf):
    type_ = MutationEventType(buf.read(1)[0])
    version = int.from_bytes(buf.read(4), 'little', signed=False)
    data = None
    match type_:
        case MutationEventType.AddField:
            data = (
                read_node(buf),
                int.from_bytes(buf.read(2), 'little', signed=False)
            )
        case MutationEventType.DelField:
            data = buf.read(buf.read(1)[0]).decode('utf-8')
        case MutationEventType.AlignField:
            data = (
                buf.read(buf.read(1)[0]).decode('utf-8'),
                bool(buf.read(1)[0])
            )
        case _:
            print('Unsupported event', type_)

    return MutationEvent(type_, version, data)


class Node:
    def __init__(self):
        self.type_name = None
        self.name = None
        self.meta_flags = 0
        self.type_flags = 0
        self.level = 0
        self.events = []
        self.children = []

    def __repr__(self):
        s = f'{self.level * " "}{self.type_name} {self.name} -> {self.events}\n'
        for c in self.children:
            s += repr(c)
        return s


def read_node(buf, level=0):
    node = Node()
    node.type_name = buf.read(buf.read(1)[0]).decode('utf-8')
    node.name = buf.read(buf.read(1)[0]).decode('utf-8')
    node.meta_flags, node.type_flags, num_events = struct.unpack('<IBI', buf.read(9))
    node.level = level
    for _ in range(num_events):
        node.events.append(read_mutation_event(buf))
    num_children = struct.unpack('<I', buf.read(4))[0]
    for _ in range(num_children):
        node.children.append(read_node(buf, level + 1))

    return node

def main():
    with open('trees.bin', 'rb') as f:
        trees = {}
        num_types = int.from_bytes(f.read(4), 'little')
        for _ in range(num_types):
            name = f.read(f.read(1)[0]).decode('utf-8')
            tree = read_node(f)
            trees[name] = tree
        print(trees['GameObject'])


if __name__ == '__main__':
    main()
