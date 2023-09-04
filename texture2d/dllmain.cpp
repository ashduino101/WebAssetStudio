#include <iostream>
#include "dllexport.h"
#include "bool32_t.h"

#include "bcn.h"
#include "pvrtc.h"
#include "etc.h"
#include "atc.h"
#include "astc.h"
#include "crunch.h"
#include "unitycrunch.h"

#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif

bool bgr2rgb(void* data, int32_t width, int32_t height) {
    uint8_t* out = static_cast<uint8_t*>(data);
    for (int i = 0; i < width * height; i++) {
        int offset = i * 4;
        uint8_t b = out[offset];
        uint8_t g = out[offset + 1];
        uint8_t r = out[offset + 2];
        uint8_t a = out[offset + 3];
        out[offset] = r;
        out[offset + 1] = g;
        out[offset + 2] = b;
        out[offset + 3] = a;
    }
    return true;
}

T2D_API(bool32_t) DecodeDXT1(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_bc1(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
	return res;
}

T2D_API(bool32_t) DecodeDXT5(const void* data, int32_t width, int32_t height, void* image)
{
	bool res = decode_bc3(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodePVRTC(const void* data, int32_t width, int32_t height, void* image, bool32_t is2bpp)
{
    bool res = decode_pvrtc(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image), is2bpp ? 1 : 0);
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeETC1(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_etc1(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeETC2(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_etc2(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeETC2A1(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_etc2a1(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeETC2A8(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_etc2a8(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeEACR(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_eacr(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeEACRSigned(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_eacr_signed(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeEACRG(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_eacrg(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeEACRGSigned(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_eacrg_signed(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeBC4(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_bc4(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeBC5(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_bc5(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeBC6(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_bc6(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeBC7(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_bc7(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeATCRGB4(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_atc_rgb4(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeATCRGBA8(const void* data, int32_t width, int32_t height, void* image)
{
    bool res = decode_atc_rgba8(static_cast<const uint8_t*>(data), width, height, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(bool32_t) DecodeASTC(const void* data, int32_t width, int32_t height, int32_t blockWidth, int32_t blockHeight, void* image)
{
    bool res = decode_astc(static_cast<const uint8_t*>(data), width, height, blockWidth, blockHeight, static_cast<uint32_t*>(image));
    bgr2rgb(image, width, height);
    return res;
}

T2D_API(void) UnpackCrunch(const void* data, uint32_t dataSize, void** ppResult, uint32_t* pResultSize)
{
	void* result;
	uint32_t resultSize;

	if (ppResult != nullptr)
	{
		*ppResult = nullptr;
	}

	if (pResultSize != nullptr)
	{
		*pResultSize = 0;
	}

	if (!crunch_unpack_level(static_cast<const uint8_t*>(data), dataSize, 0, &result, &resultSize)) {
		return;
	}

	if (ppResult != nullptr)
	{
		*ppResult = result;
	}

	if (pResultSize != nullptr)
	{
		*pResultSize = resultSize;
	}
}

T2D_API(void) UnpackUnityCrunch(const void* data, uint32_t dataSize, void** ppResult, uint32_t* pResultSize)
{
	void* result;
	uint32_t resultSize;

	if (ppResult != nullptr)
	{
		*ppResult = nullptr;
	}

	if (pResultSize != nullptr)
	{
		*pResultSize = 0;
	}

	if (!unity_crunch_unpack_level(static_cast<const uint8_t*>(data), dataSize, 0, &result, &resultSize)) {
		return;
	}

	if (ppResult != nullptr)
	{
		*ppResult = result;
	}

	if (pResultSize != nullptr)
	{
		*pResultSize = resultSize;
	}
}

//EMSCRIPTEN_BINDINGS(Texture2D) {
//    emscripten::function("decodeDXT1", &DecodeDXT1);
//    emscripten::function("decodeDXT5", &DecodeDXT5);
//    emscripten::function("decodePVRTC", &DecodePVRTC);
//    emscripten::function("decodeETC1", &DecodeETC1);
//    emscripten::function("decodeETC2", &DecodeETC2);
//    emscripten::function("decodeETC2A1", &DecodeETC2A1);
//    emscripten::function("decodeETC2A8", &DecodeETC2A8);
//    emscripten::function("decodeEACR", &DecodeEACR);
//    emscripten::function("decodeEACRSigned", &DecodeEACRSigned);
//    emscripten::function("decodeEACRG", &DecodeEACRG);
//    emscripten::function("decodeEACRGSigned", &DecodeEACRGSigned);
//    emscripten::function("decodeBC4", &DecodeBC4);
//    emscripten::function("decodeBC5", &DecodeBC5);
//    emscripten::function("decodeBC6", &DecodeBC6);
//    emscripten::function("decodeBC7", &DecodeBC7);
//    emscripten::function("decodeATCRGB4", &DecodeATCRGB4);
//    emscripten::function("decodeATCRGBA8", &DecodeATCRGBA8);
//    emscripten::function("decodeASTC", &DecodeASTC);
//    emscripten::function("unpackCrunch", &UnpackCrunch);
//    emscripten::function("unpackUnityCrunch", &UnpackUnityCrunch);
//}
