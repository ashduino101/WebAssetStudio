using System;
using System.Runtime.InteropServices.JavaScript;
using System.Linq;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.IO.MemoryMappedFiles;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using System.Threading;
using System.Threading.Tasks;

using ICSharpCode.Decompiler;
using ICSharpCode.Decompiler.CSharp;
using ICSharpCode.Decompiler.TypeSystem;
using ICSharpCode.Decompiler.CSharp.ProjectDecompiler;
using ICSharpCode.Decompiler.DebugInfo;
using ICSharpCode.Decompiler.Disassembler;
using ICSharpCode.Decompiler.Metadata;
using ICSharpCode.Decompiler.Solution;

Console.WriteLine("Decompiler loaded.");


public partial class MyClass
{
    static DecompilerSettings GetSettings(PEFile module)
    {
        return new DecompilerSettings(LanguageVersion.Latest) {
            ThrowOnAssemblyResolveErrors = false,
            RemoveDeadCode = false,
            RemoveDeadStores = false,
            UseSdkStyleProjectFormat = WholeProjectDecompiler.CanUseSdkStyleProjectFormat(module),
            UseNestedDirectoriesForNamespaces = false,
        };
    }

    static CSharpDecompiler GetDecompiler(String assemblyFileName)
    {
        var module = new PEFile(assemblyFileName);
        var resolver = new UniversalAssemblyResolver(assemblyFileName, false, module.Metadata.DetectTargetFrameworkId());
        return new CSharpDecompiler(assemblyFileName, resolver, GetSettings(module));
    }

    static string DecompileInternal(string assemblyFileName, string typeName = null)
    {
        CSharpDecompiler decompiler = GetDecompiler(assemblyFileName);

        if (typeName == null)
        {
            return decompiler.DecompileWholeModuleAsString();
        }
        else
        {
            var name = new FullTypeName(typeName);
            return decompiler.DecompileTypeAsString(name);
        }
    }

    [JSExport]
    internal static string Decompile(byte[] data, string assemblyFileName, string typeName = null)
    {
        try
        {
            using (var fs = new FileStream("/" + assemblyFileName, FileMode.Create, FileAccess.Write))
            {
                fs.Write(data, 0, data.Length);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Exception caught in process: {0}", ex);
            return "ERROR";
        }
        return DecompileInternal(assemblyFileName, typeName);
    }
}
