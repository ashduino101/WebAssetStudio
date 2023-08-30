#include <iostream>
#include "bcn.h"
#include <cstdio>

int main() {
    const uint32_t width = 512;
    const uint32_t height = 512;
    std::cout << "opening" << std::endl;
    FILE *file = fopen("../texDXT1_2.dat", "rb");
    fseek(file, 0, SEEK_END);
    long fsize = ftell(file);
    fseek(file, 0, SEEK_SET);
    std::cout << "reading" << std::endl;
    auto *data = new uint8_t[fsize];
    fread(data, fsize, 1, file);
    std::cout << "read" << std::endl;
    fclose(file);
    auto *image = new uint32_t[width*height];
    std::cout << "decoding" << std::endl;
    decode_bc1(data, width, height, image);
    std::cout << "done" << std::endl;

    FILE *out = fopen("../bc1dec_2.raw", "wb");
    fwrite(image, width*height*4, 1, out);
    fclose(out);

    return 0;
}
