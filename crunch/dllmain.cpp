#include <iostream>
#include "dllexport.h"

#include "crunch.h"
#include "unitycrunch.h"

#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif

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
