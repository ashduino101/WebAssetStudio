// stupid function because js_sys only supports up to call3
export function call4(func, context, arg1, arg2, arg3, arg4) {
    return func.call(context, arg1, arg2, arg3, arg4)
}