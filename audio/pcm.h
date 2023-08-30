//
// Created by ashduino101 on 8/12/23.
//

#ifndef UNITYFS_WEB_PCM_H
#define UNITYFS_WEB_PCM_H

#include "util.h"

binout encode_wav(int nchannels, int framerate, int sampwidth, char *data, int datasize);

#endif //UNITYFS_WEB_PCM_H
