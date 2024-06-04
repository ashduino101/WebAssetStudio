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
using ICSharpCode.Decompiler.CSharp.Syntax;
using ICSharpCode.Decompiler.CSharp.Transforms;
using ICSharpCode.Decompiler.IL;
using System.Text.Json.Serialization;
using System.Text.Json;
using System.Xml.Linq;
using Mono.Cecil.Cil;

Console.WriteLine("Decompiler loaded.");

public class DecompilerInstance
{
    PEFile module;
    UniversalAssemblyResolver resolver;
    CSharpDecompiler decompiler;
    string filename;

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

    public DecompilerInstance(string filename, byte[] data) {
        this.filename = filename;
        try
        {
            using (var fs = new FileStream("/" + filename, FileMode.Create, FileAccess.Write))
            {
                fs.Write(data, 0, data.Length);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Exception caught in process: {0}", ex);
            throw new Exception("Error writing file");
        }

        module = new PEFile(filename);
        resolver = new UniversalAssemblyResolver(filename, false, module.Metadata.DetectTargetFrameworkId());
        decompiler = new CSharpDecompiler(filename, resolver, GetSettings(module));
    }

    public CSharpDecompiler GetInternal() {
        return decompiler;
    }
}

public class NamespaceProxy {
    public string externAlias { get; set; }
    public string fullName { get; set; }
    public string name { get; set; }
    public string parentNamespace { get; set; }
    public string[] childNamespaces { get; set; }
    public string[] types { get; set; }


    public NamespaceProxy(string externAlias, string fullName, string name, string parentNamespace, string[] childNamespaces, string[] types)
    {
        this.externAlias = externAlias;
        this.fullName = fullName;
        this.name = name;
        this.parentNamespace = parentNamespace;
        this.childNamespaces = childNamespaces;
        this.types = types;
    }
}

public class TypeDefinitionProxy {
    public string metadataName { get; set; }
    public bool isReadOnly { get; set; }
    public bool hasExtensionMethods { get; set; }
    public bool isRecord { get; set; }

    public TypeDefinitionProxy(string metadataName, bool isReadOnly, bool hasExtensionMethods, bool isRecord) {
        this.metadataName = metadataName;
        this.isReadOnly = isReadOnly;
        this.hasExtensionMethods = hasExtensionMethods;
        this.isRecord = isRecord;
    }
}

[JsonSerializable(typeof(NamespaceProxy))]
[JsonSerializable(typeof(List<NamespaceProxy>))]
[JsonSerializable(typeof(TypeDefinitionProxy))]
[JsonSerializable(typeof(List<TypeDefinitionProxy>))]
[JsonSerializable(typeof(bool))]
[JsonSerializable(typeof(int))]
[JsonSerializable(typeof(string))]
internal partial class SourceGenerationContext : JsonSerializerContext
{
}


public partial class Decompiler
{    
    static Dictionary<string, DecompilerInstance> instances = new Dictionary<string, DecompilerInstance>();  // TODO: better way to do this?

    static string NewId() {
        string guid;
        while (instances.ContainsKey(guid = Guid.NewGuid().ToString())) {}
        return guid;
    }

    static DecompilerInstance GetOrCreateDecompiler(string assemblyFileName, string id, byte[] data)
    {
        if (instances.ContainsKey(id)) {
            return instances[id];
        }
        var instance = new DecompilerInstance(assemblyFileName, data);
        instances.Add(id, instance);
        return instance;
    }

    static DecompilerInstance GetDecompiler(string id) {
        return instances[id];
    }

    [JSExport]
    internal static string New(string assemblyFileName, byte[] data) {
        var id = NewId();
        Console.WriteLine("Creating new decompiler with id " + id);
        GetOrCreateDecompiler(assemblyFileName, id, data);
        return id;
    }

    [JSExport]
    internal static string ListNamespaces(string id) {
        var dec = GetDecompiler(id).GetInternal();
        var ret = new List<NamespaceProxy>();
        var namespaces = dec.TypeSystem.RootNamespace.ChildNamespaces;
        foreach (INamespace n in namespaces) {
            ret.Add(new NamespaceProxy(n.ExternAlias, n.FullName, n.Name, n.ParentNamespace.FullName, n.ChildNamespaces.Select(x => x.FullName).ToArray(), n.Types.Select(x => x.FullName).ToArray()));
        }
        var root = dec.TypeSystem.RootNamespace;
        ret.Add(new NamespaceProxy(null, "-", "-", null, root.ChildNamespaces.Select(x => x.FullName).ToArray(), root.Types.Select(x => x.FullName).Distinct().ToArray()));
        return JsonSerializer.Serialize(ret!, SourceGenerationContext.Default.ListNamespaceProxy);
    }

    [JSExport]
    internal static string DecompileTypeAsString(string id, string type) {
        return GetDecompiler(id).GetInternal().DecompileTypeAsString(new FullTypeName(type));
    }

    [JSExport]
    internal static string DecompileWholeType(string id, string ns, string child, string type) {
        var dec = GetDecompiler(id).GetInternal();
        var nspace = (ns == "-") ? dec.TypeSystem.RootNamespace : dec.TypeSystem.GetNamespaceByFullName(ns);
        if (nspace == null) return null;
        var childNamespace = nspace.GetChildNamespace(child);
        var def = childNamespace.GetTypeDefinition(type, 0);  // TODO: params
        return dec.DecompileTypeAsString(def.FullTypeName);
    }

    // [JSExport]
    // internal static string[] ListTypes(string assemblyFileName)
    // {
    //     CSharpDecompiler decompiler = GetDecompiler(assemblyFileName).GetInternal();
    //     var classes = new List<string>();
    //     foreach (ITypeDefinition i in decompiler.TypeSystem.MainModule.TopLevelTypeDefinitions) {
    //         // Console.WriteLine(i.Name);
    //         if (i.Name == "SandboxLayoutData") {
    //             classes.Add(decompiler.DecompileTypeAsString(i.FullTypeName));
    //         }
    //     }
    //     return classes.ToArray();
    // }
}
