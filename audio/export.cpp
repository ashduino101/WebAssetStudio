//
// Created by ashduino101 on 8/13/23.
//

#include "export.h"

#include "pcm.h"

AUD_API(binout) EncodeWAV(int nchannels, int framerate, int sampwidth, void *data, int datasize) {
    return encode_wav(nchannels, framerate, sampwidth, (char*)data, datasize);
}
