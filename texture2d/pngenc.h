#ifndef TEXTURE2D_PNG_H
#define TEXTURE2D_PNG_H

#define PNG_SETJMP_NOT_SUPPORTED
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <png.h>
#include "bool32_t.h"

struct libpng_inmem_write_struct { /* This is from png.c */
    unsigned char * pngBfr;  /* destination memory */
    unsigned long pngSiz;  /* destination memory size (bytes) */
};

bool32_t encode_png(void* data, int w, int h, void* out);
void wrtBgPng(png_structp pngWrtPtr, png_bytep data, png_size_t length);

png_structp pngWrtPtr; /* The pointer that points the PNG write structure */
png_infop pngWrtInfoPtr; /* The pointer that points the PNG write information */
struct libpng_inmem_write_struct p_io; /* Holds the encoded PNG data */

#endif //TEXTURE2D_PNG_H
