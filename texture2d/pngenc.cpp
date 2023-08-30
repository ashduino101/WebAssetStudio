#include "pngenc.h"

bool32_t encode_png(void* data, int w, int h, void* out) {
    pngWrtInfoPtr = nullptr;   /* write_info_ptr */
    p_io.pngBfr = nullptr;
    p_io.pngSiz = 0;

    pngWrtPtr = png_create_write_struct(PNG_LIBPNG_VER_STRING, nullptr, nullptr, nullptr); /* write_ptr */
    if (!pngWrtPtr) return false;
    pngWrtInfoPtr = png_create_info_struct(pngWrtPtr);
    if (!pngWrtInfoPtr) return false;
    png_set_IHDR(pngWrtPtr, pngWrtInfoPtr, w, h, 8, PNG_COLOR_TYPE_RGBA, PNG_INTERLACE_NONE, PNG_COMPRESSION_TYPE_DEFAULT, PNG_FILTER_TYPE_DEFAULT);
    auto ** row_pointers = (png_byte **) png_malloc(pngWrtPtr, h * sizeof(png_byte *));
    size_t bytesPerRow = h << 2; /* 4 Bytes per pixel */
    auto * imgBfr = (unsigned char *) calloc(1, h * bytesPerRow * sizeof(unsigned char));

    int off = 0;
    auto dat = (char*)data;
    for (int rw = 0; rw < h; rw++) {
        png_byte * rwPtr = row_pointers[rw] = (png_byte *) (imgBfr + rw * bytesPerRow);

        for (int pxl = 0, byt = 0; pxl < w; pxl++) { /* Write a black background */
            for (int clr = 0; clr < 4; clr++) {
                rwPtr[byt++] = dat[off++];
            }
        }
    }

    p_io.pngBfr = (unsigned char *) malloc(4); /* Defines final PNG data location */
    p_io.pngSiz = 4;
    png_init_io(pngWrtPtr, (png_FILE_p) &p_io);
    png_set_rows(pngWrtPtr, pngWrtInfoPtr, &row_pointers[0]);
    png_set_write_fn(pngWrtPtr, &p_io, wrtBgPng, nullptr);
    png_write_png(pngWrtPtr, pngWrtInfoPtr, PNG_TRANSFORM_IDENTITY, nullptr);
    memcpy(out, p_io.pngBfr + 4, p_io.pngSiz);
    return true;
}

void wrtBgPng(png_structp pngWrtPtr_, png_bytep data, png_size_t length) {
    auto * p = (struct libpng_inmem_write_struct *) png_get_io_ptr(pngWrtPtr_);
    p->pngBfr = (unsigned char *) realloc(p->pngBfr, p->pngSiz + length); /* From png.c */
    if (!p->pngBfr) return;
    memmove(p->pngBfr + p->pngSiz, data, length);
    p->pngSiz += length;
}
