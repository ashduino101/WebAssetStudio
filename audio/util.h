//
// Created by ashduino101 on 8/13/23.
//

#ifndef UNITYFS_WEB_UTIL_H
#define UNITYFS_WEB_UTIL_H

#include <cstdlib>
#include <cstdint>
#include <string>
#include <vector>

struct binout {
    uint64_t size;
    char* data;
};

struct BinaryWriter {
    std::vector<char> data;
};

void writeBytes(BinaryWriter writer, const char *bytes, int size);

template<typename T>
void writePrimitive(BinaryWriter writer, T val);

void writeChars(BinaryWriter writer, const std::string& chars);

binout getData(BinaryWriter writer);



#endif //UNITYFS_WEB_UTIL_H
