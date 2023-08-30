//
// Created by ashduino101 on 8/12/23.
//

#include "pcm.h"

binout encode_wav(int nchannels, int framerate, int sampwidth, char *data, int datasize) {
    BinaryWriter writer;
    // Magic
    writeChars(writer, "RIFF");
    // File size
    writePrimitive(writer, 36 + datasize);
    // WAVE
    writeChars(writer, "WAVE");
    // fmt
    writeChars(writer, "fmt ");
    // size of format chunk
    writePrimitive(writer, 16);

    return getData(writer);
}
