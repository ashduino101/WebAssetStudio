#pragma once

#include <emscripten/emscripten.h>

#if defined(_MSC_VER)
#if _MSC_VER < 1910 // MSVC 2017-
#error MSVC 2017 or later is required.
#endif
#endif

#if defined(WIN32) || defined(_WIN32) || defined(__CYGWIN__) || defined(__MINGW__)
#ifdef _T2D_DLL
#ifdef __GNUC__
#define _T2D_EXPORT __attribute__ ((dllexport))
#else
#define _T2D_EXPORT __declspec(dllexport)
#endif
#else
#ifdef __GNUC__
#define _T2D_EXPORT __attribute__ ((dllimport))
#else
#define _T2D_EXPORT __declspec(dllimport)
#endif
#endif
#define _T2D_LOCAL
#else
#if __GNUC__ >= 4
#define _AUD_EXPORT __attribute__ ((visibility ("default")))
#define _AUD_LOCAL  __attribute__ ((visibility ("hidden")))
#else
#define _T2D_EXPORT
#define _T2D_LOCAL
#endif
#endif

#ifdef __cplusplus
#ifndef _EXTERN_C_STMT
#define _EXTERN_C_STMT extern "C"
#endif
#else
#ifndef _EXTERN_C_STMT
#define _EXTERN_C_STMT
#endif
#endif

#ifndef _AUD_CALL
#if defined(WIN32) || defined(_WIN32)
#define _AUD_CALL __stdcall
#else
#define _AUD_CALL /* __cdecl */
#endif
#endif

#ifndef _EMCC_KEEPALIVE
#ifdef EMSCRIPTEN_KEEPALIVE
#define _EMCC_KEEPALIVE EMSCRIPTEN_KEEPALIVE
#else
#define _EMCC_KEEPALIVE
#endif
#endif

#if defined(_MSC_VER)
#define AUD_API(ret_type) _EXTERN_C_STMT _AUD_EXPORT ret_type _AUD_CALL
#else
#define AUD_API(ret_type) _EXTERN_C_STMT _AUD_EXPORT _AUD_CALL _EMCC_KEEPALIVE ret_type
#endif
