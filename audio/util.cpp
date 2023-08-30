//
// Created by ashduino101 on 8/13/23.
//

#include "util.h"

void writeBytes(BinaryWriter writer, const char *bytes, int size) {
    for (int i = 0; i < size; i++) {
        writer.data.push_back(bytes[i]);
    }
}

template<typename T>
void writePrimitive(BinaryWriter writer, T val) {
    char* d = dynamic_cast<char*>(val, sizeof(val));
    writeBytes(writer, d, sizeof(val));
}

void writeChars(BinaryWriter writer, const std::string &chars) {
    writeBytes(writer, chars.data(), (int)chars.length());
}

binout getData(BinaryWriter writer) {
    return binout{writer.data.size(), writer.data.data()};
}

