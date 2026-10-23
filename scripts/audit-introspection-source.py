"""Verify the reviewed, source-backed Orionis introspection documentation snapshot.

All native Python modules are inventoried. Own public methods and implemented
dunders are counted separately from contracts, package plumbing, generated
dataclass methods, inherited helpers, private implementation state and consumers.
Use --write only after reviewing source changes; explicit symbol allowlists still
reject newly added or removed API, including during snapshot refreshes.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/introspection-api-inventory.json"

# The following declarations are expanded into explicit reviewed allowlists.
# A source update cannot silently map new symbols by refreshing this snapshot.
REVIEWED_MODULES = {
    "orionis/introspection/__init__.py": {
        "classes": {},
        "functions": [
            "__getattr__",
            "__dir__"
        ],
        "variables": [
            "__all__",
            "_EXPORTS"
        ]
    },
    "orionis/introspection/abstract/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/abstract/contracts/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/abstract/contracts/reflection.py": {
        "classes": {
            "IReflectionAbstract": {
                "methods": [
                    "getClass",
                    "getClassName",
                    "getModuleName",
                    "getModuleWithClassName",
                    "getDocstring",
                    "getBaseClasses",
                    "getSourceCode",
                    "getFile",
                    "getAnnotations",
                    "hasAttribute",
                    "getAttribute",
                    "setAttribute",
                    "removeAttribute",
                    "getAttributes",
                    "getPublicAttributes",
                    "getProtectedAttributes",
                    "getPrivateAttributes",
                    "getDunderAttributes",
                    "getMagicAttributes",
                    "hasMethod",
                    "removeMethod",
                    "getMethodSignature",
                    "getMethods",
                    "getPublicMethods",
                    "getPublicSyncMethods",
                    "getPublicAsyncMethods",
                    "getProtectedMethods",
                    "getProtectedSyncMethods",
                    "getProtectedAsyncMethods",
                    "getPrivateMethods",
                    "getPrivateSyncMethods",
                    "getPrivateAsyncMethods",
                    "getPublicClassMethods",
                    "getPublicClassSyncMethods",
                    "getPublicClassAsyncMethods",
                    "getProtectedClassMethods",
                    "getProtectedClassSyncMethods",
                    "getProtectedClassAsyncMethods",
                    "getPrivateClassMethods",
                    "getPrivateClassSyncMethods",
                    "getPrivateClassAsyncMethods",
                    "getPublicStaticMethods",
                    "getPublicStaticSyncMethods",
                    "getPublicStaticAsyncMethods",
                    "getProtectedStaticMethods",
                    "getProtectedStaticSyncMethods",
                    "getProtectedStaticAsyncMethods",
                    "getPrivateStaticMethods",
                    "getPrivateStaticSyncMethods",
                    "getPrivateStaticAsyncMethods",
                    "getDunderMethods",
                    "getMagicMethods",
                    "getProperties",
                    "getPublicProperties",
                    "getProtectedProperties",
                    "getPrivateProperties",
                    "getPropertySignature",
                    "getPropertyDocstring",
                    "constructorSignature",
                    "methodSignature",
                    "clearCache"
                ],
                "variables": []
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/abstract/reflection.py": {
        "classes": {
            "_Flags": {
                "methods": [],
                "variables": [
                    "is_dunder",
                    "is_private",
                    "is_prot",
                    "is_pub"
                ]
            },
            "ReflectionAbstract": {
                "methods": [
                    "__init__",
                    "__getitem__",
                    "__setitem__",
                    "__contains__",
                    "__delitem__",
                    "_ensureScanned",
                    "_invalidateMembers",
                    "_makeBuckets",
                    "_classifyProperty",
                    "_classifyStatic",
                    "_classifyClassMethod",
                    "_classifyCallable",
                    "_classifyDataAttr",
                    "_commitAttrBuckets",
                    "_commitMethodBuckets",
                    "_scanClass",
                    "getClass",
                    "getClassName",
                    "getModuleName",
                    "getModuleWithClassName",
                    "getDocstring",
                    "getBaseClasses",
                    "getSourceCode",
                    "getFile",
                    "getAnnotations",
                    "hasAttribute",
                    "getAttribute",
                    "setAttribute",
                    "removeAttribute",
                    "getAttributes",
                    "getPublicAttributes",
                    "getProtectedAttributes",
                    "getPrivateAttributes",
                    "getDunderAttributes",
                    "getMagicAttributes",
                    "hasMethod",
                    "removeMethod",
                    "getMethodSignature",
                    "getMethods",
                    "getPublicMethods",
                    "getPublicSyncMethods",
                    "getPublicAsyncMethods",
                    "getProtectedMethods",
                    "getProtectedSyncMethods",
                    "getProtectedAsyncMethods",
                    "getPrivateMethods",
                    "getPrivateSyncMethods",
                    "getPrivateAsyncMethods",
                    "getPublicClassMethods",
                    "getPublicClassSyncMethods",
                    "getPublicClassAsyncMethods",
                    "getProtectedClassMethods",
                    "getProtectedClassSyncMethods",
                    "getProtectedClassAsyncMethods",
                    "getPrivateClassMethods",
                    "getPrivateClassSyncMethods",
                    "getPrivateClassAsyncMethods",
                    "getPublicStaticMethods",
                    "getPublicStaticSyncMethods",
                    "getPublicStaticAsyncMethods",
                    "getProtectedStaticMethods",
                    "getProtectedStaticSyncMethods",
                    "getProtectedStaticAsyncMethods",
                    "getPrivateStaticMethods",
                    "getPrivateStaticSyncMethods",
                    "getPrivateStaticAsyncMethods",
                    "getDunderMethods",
                    "getMagicMethods",
                    "getProperties",
                    "getPublicProperties",
                    "getProtectedProperties",
                    "getPrivateProperties",
                    "getPropertySignature",
                    "getPropertyDocstring",
                    "constructorSignature",
                    "methodSignature",
                    "clearCache"
                ],
                "variables": [
                    "__slots__"
                ]
            }
        },
        "functions": [],
        "variables": [
            "_ISCORO",
            "_EXCLUDED_DUNDER_ATTRS"
        ]
    },
    "orionis/introspection/callables/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/callables/contracts/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/callables/contracts/reflection.py": {
        "classes": {
            "IReflectionCallable": {
                "methods": [
                    "getCallable",
                    "getName",
                    "getModuleName",
                    "getModuleWithCallableName",
                    "getDocstring",
                    "getSourceCode",
                    "getFile",
                    "getSignature",
                    "getDependencies",
                    "clearCache"
                ],
                "variables": [
                    "__slots__"
                ]
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/callables/reflection.py": {
        "classes": {
            "ReflectionCallable": {
                "methods": [
                    "__init__",
                    "__getitem__",
                    "__setitem__",
                    "__contains__",
                    "__delitem__",
                    "getCallable",
                    "getName",
                    "getModuleName",
                    "getModuleWithCallableName",
                    "getDocstring",
                    "getSourceCode",
                    "getFile",
                    "getSignature",
                    "getDependencies",
                    "clearCache"
                ],
                "variables": [
                    "__slots__"
                ]
            }
        },
        "functions": [],
        "variables": [
            "_UNSET"
        ]
    },
    "orionis/introspection/concretes/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/concretes/contracts/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/concretes/contracts/reflection.py": {
        "classes": {
            "IReflectionConcrete": {
                "methods": [
                    "getClass",
                    "getClassName",
                    "getModuleName",
                    "getModuleWithClassName",
                    "getDocstring",
                    "getBaseClasses",
                    "getSourceCode",
                    "getFile",
                    "getAnnotations",
                    "hasAttribute",
                    "getAttribute",
                    "setAttribute",
                    "removeAttribute",
                    "getAttributes",
                    "getPublicAttributes",
                    "getProtectedAttributes",
                    "getPrivateAttributes",
                    "getDunderAttributes",
                    "getMagicAttributes",
                    "hasMethod",
                    "setMethod",
                    "removeMethod",
                    "getMethodSignature",
                    "getMethods",
                    "getPublicMethods",
                    "getPublicSyncMethods",
                    "getPublicAsyncMethods",
                    "getProtectedMethods",
                    "getProtectedSyncMethods",
                    "getProtectedAsyncMethods",
                    "getPrivateMethods",
                    "getPrivateSyncMethods",
                    "getPrivateAsyncMethods",
                    "getPublicClassMethods",
                    "getPublicClassSyncMethods",
                    "getPublicClassAsyncMethods",
                    "getProtectedClassMethods",
                    "getProtectedClassSyncMethods",
                    "getProtectedClassAsyncMethods",
                    "getPrivateClassMethods",
                    "getPrivateClassSyncMethods",
                    "getPrivateClassAsyncMethods",
                    "getPublicStaticMethods",
                    "getPublicStaticSyncMethods",
                    "getPublicStaticAsyncMethods",
                    "getProtectedStaticMethods",
                    "getProtectedStaticSyncMethods",
                    "getProtectedStaticAsyncMethods",
                    "getPrivateStaticMethods",
                    "getPrivateStaticSyncMethods",
                    "getPrivateStaticAsyncMethods",
                    "getDunderMethods",
                    "getMagicMethods",
                    "getProperties",
                    "getPublicProperties",
                    "getProtectedProperties",
                    "getPrivateProperties",
                    "getProperty",
                    "getPropertySignature",
                    "getPropertyDocstring",
                    "getConstructorSignature",
                    "constructorSignature",
                    "methodSignature",
                    "clearCache"
                ],
                "variables": []
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/concretes/reflection.py": {
        "classes": {
            "_ScanBuffers": {
                "methods": [
                    "__init__"
                ],
                "variables": [
                    "__slots__"
                ]
            },
            "ReflectionConcrete": {
                "methods": [
                    "__init__",
                    "__getitem__",
                    "__setitem__",
                    "__contains__",
                    "__delitem__",
                    "_routeStaticMethod",
                    "_routeClassMethod",
                    "_routeProperty",
                    "_routeMethod",
                    "_routeAttribute",
                    "_scanClass",
                    "getClass",
                    "getClassName",
                    "getModuleName",
                    "getModuleWithClassName",
                    "getDocstring",
                    "getBaseClasses",
                    "getSourceCode",
                    "getFile",
                    "getAnnotations",
                    "hasAttribute",
                    "getAttribute",
                    "setAttribute",
                    "removeAttribute",
                    "getAttributes",
                    "getPublicAttributes",
                    "getProtectedAttributes",
                    "getPrivateAttributes",
                    "getDunderAttributes",
                    "getMagicAttributes",
                    "hasMethod",
                    "setMethod",
                    "removeMethod",
                    "getMethodSignature",
                    "getMethods",
                    "getPublicMethods",
                    "getPublicSyncMethods",
                    "getPublicAsyncMethods",
                    "getProtectedMethods",
                    "getProtectedSyncMethods",
                    "getProtectedAsyncMethods",
                    "getPrivateMethods",
                    "getPrivateSyncMethods",
                    "getPrivateAsyncMethods",
                    "getPublicClassMethods",
                    "getPublicClassSyncMethods",
                    "getPublicClassAsyncMethods",
                    "getProtectedClassMethods",
                    "getProtectedClassSyncMethods",
                    "getProtectedClassAsyncMethods",
                    "getPrivateClassMethods",
                    "getPrivateClassSyncMethods",
                    "getPrivateClassAsyncMethods",
                    "getPublicStaticMethods",
                    "getPublicStaticSyncMethods",
                    "getPublicStaticAsyncMethods",
                    "getProtectedStaticMethods",
                    "getProtectedStaticSyncMethods",
                    "getProtectedStaticAsyncMethods",
                    "getPrivateStaticMethods",
                    "getPrivateStaticSyncMethods",
                    "getPrivateStaticAsyncMethods",
                    "getDunderMethods",
                    "getMagicMethods",
                    "getProperties",
                    "getPublicProperties",
                    "getProtectedProperties",
                    "getPrivateProperties",
                    "getProperty",
                    "getPropertySignature",
                    "getPropertyDocstring",
                    "getConstructorSignature",
                    "constructorSignature",
                    "methodSignature",
                    "clearCache"
                ],
                "variables": []
            }
        },
        "functions": [],
        "variables": [
            "_DUNDER_ATTR_EXCLUDE"
        ]
    },
    "orionis/introspection/dependencies/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/dependencies/contracts/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/dependencies/contracts/reflection.py": {
        "classes": {
            "IReflectDependencies": {
                "methods": [
                    "constructorSignature",
                    "methodSignature",
                    "callableSignature"
                ],
                "variables": [
                    "__slots__"
                ]
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/dependencies/entities/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/dependencies/entities/argument.py": {
        "classes": {
            "Argument": {
                "methods": [
                    "__post_init__"
                ],
                "variables": [
                    "name",
                    "resolved",
                    "module_name",
                    "class_name",
                    "type",
                    "full_class_path",
                    "is_keyword_only",
                    "is_schema",
                    "default"
                ]
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/dependencies/entities/signature.py": {
        "classes": {
            "Signature": {
                "methods": [
                    "__post_init__",
                    "hasParameters",
                    "noArgumentsRequired",
                    "hasUnresolvedArguments",
                    "getResolved",
                    "getUnresolved",
                    "getAllOrdered",
                    "getPositionalOnly",
                    "getKeywordOnly",
                    "toDict",
                    "resolvedToDict",
                    "unresolvedToDict",
                    "arguments"
                ],
                "variables": [
                    "resolved",
                    "unresolved",
                    "ordered"
                ]
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/dependencies/reflection.py": {
        "classes": {
            "ReflectDependencies": {
                "methods": [
                    "__init__",
                    "constructorSignature",
                    "methodSignature",
                    "callableSignature"
                ],
                "variables": [
                    "__slots__"
                ]
            }
        },
        "functions": [
            "_get_signature",
            "_resolve_parameter_hint",
            "_resolve_future_annotations",
            "_resolve_annotation",
            "_build_dependencies",
            "_cached_resolved_signature",
            "_get_resolved_signature"
        ],
        "variables": [
            "_SKIP_NAMES",
            "_SKIP_KINDS",
            "_KEYWORD_ONLY",
            "_PARAM_EMPTY",
            "_ANY_TYPE",
            "_ANY_MODULE",
            "_ANY_NAME",
            "_ANY_FULL_PATH",
            "_STRUCT_TYPE"
        ]
    },
    "orionis/introspection/instances/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/instances/contracts/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/instances/contracts/reflection.py": {
        "classes": {
            "IReflectionInstance": {
                "methods": [
                    "getInstance",
                    "getClass",
                    "getClassName",
                    "getModuleName",
                    "getModuleWithClassName",
                    "getDocstring",
                    "getBaseClasses",
                    "getSourceCode",
                    "getFile",
                    "getAnnotations",
                    "hasAttribute",
                    "getAttribute",
                    "setAttribute",
                    "removeAttribute",
                    "getAttributes",
                    "getPublicAttributes",
                    "getProtectedAttributes",
                    "getPrivateAttributes",
                    "getDunderAttributes",
                    "getMagicAttributes",
                    "hasMethod",
                    "setMethod",
                    "removeMethod",
                    "getMethodSignature",
                    "getMethodDocstring",
                    "getMethods",
                    "getPublicMethods",
                    "getPublicSyncMethods",
                    "getPublicAsyncMethods",
                    "getProtectedMethods",
                    "getProtectedSyncMethods",
                    "getProtectedAsyncMethods",
                    "getPrivateMethods",
                    "getPrivateSyncMethods",
                    "getPrivateAsyncMethods",
                    "getPublicClassMethods",
                    "getPublicClassSyncMethods",
                    "getPublicClassAsyncMethods",
                    "getProtectedClassMethods",
                    "getProtectedClassSyncMethods",
                    "getProtectedClassAsyncMethods",
                    "getPrivateClassMethods",
                    "getPrivateClassSyncMethods",
                    "getPrivateClassAsyncMethods",
                    "getPublicStaticMethods",
                    "getPublicStaticSyncMethods",
                    "getPublicStaticAsyncMethods",
                    "getProtectedStaticMethods",
                    "getProtectedStaticSyncMethods",
                    "getProtectedStaticAsyncMethods",
                    "getPrivateStaticMethods",
                    "getPrivateStaticSyncMethods",
                    "getPrivateStaticAsyncMethods",
                    "getDunderMethods",
                    "getMagicMethods",
                    "getProperties",
                    "getPublicProperties",
                    "getProtectedProperties",
                    "getPrivateProperties",
                    "getProperty",
                    "getPropertySignature",
                    "getPropertyDocstring",
                    "constructorSignature",
                    "methodSignature",
                    "clearCache"
                ],
                "variables": []
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/instances/reflection.py": {
        "classes": {
            "ReflectionInstance": {
                "methods": [
                    "__init__",
                    "__getitem__",
                    "__setitem__",
                    "__contains__",
                    "__delitem__",
                    "_scanInstanceVars",
                    "_scanPropertyEntries",
                    "_classifyStaticEntry",
                    "_classifyClassEntry",
                    "_classifyFunctionEntry",
                    "_scanClassMembers",
                    "getInstance",
                    "getClass",
                    "getClassName",
                    "getModuleName",
                    "getModuleWithClassName",
                    "getDocstring",
                    "getBaseClasses",
                    "getSourceCode",
                    "getFile",
                    "getAnnotations",
                    "hasAttribute",
                    "getAttribute",
                    "setAttribute",
                    "removeAttribute",
                    "getAttributeDocstring",
                    "getAttributes",
                    "getPublicAttributes",
                    "getProtectedAttributes",
                    "getPrivateAttributes",
                    "getDunderAttributes",
                    "getMagicAttributes",
                    "hasMethod",
                    "setMethod",
                    "removeMethod",
                    "getMethodSignature",
                    "getMethodDocstring",
                    "getMethods",
                    "getPublicMethods",
                    "getPublicSyncMethods",
                    "getPublicAsyncMethods",
                    "getProtectedMethods",
                    "getProtectedSyncMethods",
                    "getProtectedAsyncMethods",
                    "getPrivateMethods",
                    "getPrivateSyncMethods",
                    "getPrivateAsyncMethods",
                    "getPublicClassMethods",
                    "getPublicClassSyncMethods",
                    "getPublicClassAsyncMethods",
                    "getProtectedClassMethods",
                    "getProtectedClassSyncMethods",
                    "getProtectedClassAsyncMethods",
                    "getPrivateClassMethods",
                    "getPrivateClassSyncMethods",
                    "getPrivateClassAsyncMethods",
                    "getPublicStaticMethods",
                    "getPublicStaticSyncMethods",
                    "getPublicStaticAsyncMethods",
                    "getProtectedStaticMethods",
                    "getProtectedStaticSyncMethods",
                    "getProtectedStaticAsyncMethods",
                    "getPrivateStaticMethods",
                    "getPrivateStaticSyncMethods",
                    "getPrivateStaticAsyncMethods",
                    "getDunderMethods",
                    "getMagicMethods",
                    "getProperties",
                    "getPublicProperties",
                    "getProtectedProperties",
                    "getPrivateProperties",
                    "getProperty",
                    "getPropertySignature",
                    "getPropertyDocstring",
                    "constructorSignature",
                    "methodSignature",
                    "clearCache"
                ],
                "variables": []
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/modules/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/modules/contracts/__init__.py": {
        "classes": {},
        "functions": [],
        "variables": []
    },
    "orionis/introspection/modules/contracts/reflection.py": {
        "classes": {
            "IReflectionModule": {
                "methods": [
                    "getModule",
                    "hasClass",
                    "getClass",
                    "setClass",
                    "removeClass",
                    "getClasses",
                    "getPublicClasses",
                    "getProtectedClasses",
                    "getPrivateClasses",
                    "getConstant",
                    "getConstants",
                    "getPublicConstants",
                    "getProtectedConstants",
                    "getPrivateConstants",
                    "getFunctions",
                    "getPublicFunctions",
                    "getPublicSyncFunctions",
                    "getPublicAsyncFunctions",
                    "getProtectedFunctions",
                    "getProtectedSyncFunctions",
                    "getProtectedAsyncFunctions",
                    "getPrivateFunctions",
                    "getPrivateSyncFunctions",
                    "getPrivateAsyncFunctions",
                    "getImports",
                    "getFile",
                    "getSourceCode",
                    "clearCache"
                ],
                "variables": []
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/modules/inspector.py": {
        "classes": {
            "ModuleInspector": {
                "methods": [
                    "discoverModules",
                    "_collectDirectoryModules",
                    "loadClass",
                    "fileImportsAny",
                    "discoverFrozenDataclasses"
                ],
                "variables": [
                    "__cache_resolved_classes"
                ]
            }
        },
        "functions": [],
        "variables": [
            "_EXCLUDED_DIRECTORIES",
            "_VENV_DIRECTORIES"
        ]
    },
    "orionis/introspection/modules/reflection.py": {
        "classes": {
            "ReflectionModule": {
                "methods": [
                    "__init__",
                    "__getitem__",
                    "__setitem__",
                    "__contains__",
                    "__delitem__",
                    "getModule",
                    "hasClass",
                    "getClass",
                    "setClass",
                    "removeClass",
                    "getClasses",
                    "getPublicClasses",
                    "getProtectedClasses",
                    "getPrivateClasses",
                    "getConstant",
                    "getConstants",
                    "getPublicConstants",
                    "getProtectedConstants",
                    "getPrivateConstants",
                    "getFunctions",
                    "getPublicFunctions",
                    "getPublicSyncFunctions",
                    "getPublicAsyncFunctions",
                    "getProtectedFunctions",
                    "getProtectedSyncFunctions",
                    "getProtectedAsyncFunctions",
                    "getPrivateFunctions",
                    "getPrivateSyncFunctions",
                    "getPrivateAsyncFunctions",
                    "getImports",
                    "getFile",
                    "getSourceCode",
                    "clearCache"
                ],
                "variables": []
            }
        },
        "functions": [],
        "variables": []
    },
    "orionis/introspection/reflection.py": {
        "classes": {
            "Reflection": {
                "methods": [
                    "instance",
                    "abstract",
                    "concrete",
                    "module",
                    "callable",
                    "isAbstract",
                    "isConcreteClass",
                    "isAsyncGen",
                    "isAsyncGenFunction",
                    "isAwaitable",
                    "isBuiltIn",
                    "isClass",
                    "isCode",
                    "isCoroutine",
                    "isCoroutineFunction",
                    "isDataDescriptor",
                    "isFrame",
                    "isFunction",
                    "isGenerator",
                    "isGeneratorFunction",
                    "isGetSetDescriptor",
                    "isMemberDescriptor",
                    "isMethod",
                    "isMethodDescriptor",
                    "isModule",
                    "isRoutine",
                    "isTraceback",
                    "isGeneric",
                    "isProtocol",
                    "isInstance",
                    "isTypingConstruct"
                ],
                "variables": []
            }
        },
        "functions": [],
        "variables": []
    }
}
NATIVE_TEST_FILES = ('tests/introspection/abstract/contracts/test_reflection.py',
 'tests/introspection/abstract/test_reflection.py',
 'tests/introspection/callables/contracts/test_reflection.py',
 'tests/introspection/callables/test_reflection.py',
 'tests/introspection/concretes/contracts/test_reflection.py',
 'tests/introspection/concretes/test_reflection.py',
 'tests/introspection/dependencies/contracts/test_reflection.py',
 'tests/introspection/dependencies/entities/test_argument.py',
 'tests/introspection/dependencies/entities/test_signature.py',
 'tests/introspection/dependencies/test_reflection.py',
 'tests/introspection/dependencies/test_signature_cache.py',
 'tests/introspection/instances/contracts/test_reflection.py',
 'tests/introspection/instances/test_reflection.py',
 'tests/introspection/modules/contracts/test_reflection.py',
 'tests/introspection/modules/test_inspector.py',
 'tests/introspection/modules/test_reflection.py',
 'tests/introspection/test_reflection.py')

CLASS_GUIDES = {
    "Reflection": ("introspection-reflection", "/advanced/introspection/reflection"),
    "ReflectionCallable": ("introspection-callables", "/advanced/introspection/callables"),
    "ReflectionAbstract": ("introspection-abstract-classes", "/advanced/introspection/abstract-classes"),
    "ReflectionConcrete": ("introspection-concrete-classes", "/advanced/introspection/concrete-classes"),
    "ReflectionInstance": ("introspection-instances", "/advanced/introspection/instances"),
    "ReflectDependencies": ("introspection-dependencies-and-discovery", "/advanced/introspection/dependencies-and-discovery"),
    "Signature": ("introspection-dependencies-and-discovery", "/advanced/introspection/dependencies-and-discovery"),
    "Argument": ("introspection-dependencies-and-discovery", "/advanced/introspection/dependencies-and-discovery"),
    "ReflectionModule": ("introspection-modules", "/advanced/introspection/modules"),
    "ModuleInspector": ("introspection-module-discovery", "/advanced/introspection/module-discovery"),
}
EXPECTED_CLASS_METHOD_COUNTS = {
    "Reflection": 31, "ReflectionCallable": 15, "ReflectionAbstract": 66,
    "ReflectionConcrete": 69, "ReflectionInstance": 71, "ReflectDependencies": 4,
    "Signature": 13, "Argument": 1, "ReflectionModule": 33, "ModuleInspector": 4,
}
EXPECTED_EXPORTS = [
    "ModuleInspector", "ReflectDependencies", "Reflection", "ReflectionAbstract",
    "ReflectionCallable", "ReflectionConcrete", "ReflectionInstance", "ReflectionModule",
]
INTEGRATIONS = {
    "orionis/_exports.py": {
        "symbols": ["resolve_export"],
        "references": ["/advanced/introspection"],
        "purpose": "Curated lazy imports resolve and cache only declared package exports.",
    },
    "orionis/support/entities/base.py": {
        "symbols": ["BaseEntity.getFields", "BaseEntity.toDict"],
        "references": ["/advanced/introspection/dependencies-and-discovery#signature-method-getfields"],
        "purpose": "Signature inherits getFields and overrides toDict with a shallow ordered-argument copy.",
    },
    "orionis/container/container.py": {
        "symbols": ["Container.make", "Container.call", "Container.invoke", "Container.__resolveSignature", "Container.__resolveSchemaArgument", "Container.__resolveArgument"],
        "references": ["/advanced/introspection/dependencies-and-discovery"],
        "purpose": "Actual DI supplies explicit arguments, resolves registered services/defaults and validates HTTP schemas; reflection itself only describes parameters.",
    },
    "orionis/container/entities/invocation.py": {
        "symbols": ["callable_plan", "constructor_plan", "warm_controller_plan"],
        "references": ["/advanced/introspection/dependencies-and-discovery"],
        "purpose": "Invocation plans reuse dependency metadata without retaining receivers and add constructor-local annotation resolution.",
    },
    "orionis/foundation/application.py": {
        "symbols": ["Application.__loadConfig", "Application.__loadProviders", "Application.__loadHTTPKernel", "Application.__resolveAndValidateRoutingFiles"],
        "references": ["/advanced/introspection/module-discovery"],
        "purpose": "Application configuration discovery uses ModuleInspector for frozen dataclasses.",
    },
    "orionis/console/core/loader.py": {
        "symbols": ["Loader.__loadCustomCommands"],
        "references": ["/advanced/introspection/module-discovery"],
        "purpose": "Custom command discovery scans module paths, then imports and filters locally declared command classes.",
    },
    "orionis/database/migrations/migrator.py": {
        "symbols": ["Migrator.__discover"],
        "references": ["/advanced/introspection/modules", "/advanced/introspection/module-discovery"],
        "purpose": "Migration discovery combines source scanning, module reflection and imported classes.",
    },
    "orionis/database/seeders/runner.py": {
        "symbols": ["SeederRunner.__discover"],
        "references": ["/advanced/introspection/modules", "/advanced/introspection/module-discovery"],
        "purpose": "Seeder discovery consumes module discovery/reflection rather than automatic service injection.",
    },
    "orionis/queues/manager.py": {
        "symbols": ["_discover_jobs"],
        "references": ["/advanced/introspection/module-discovery#moduleinspector-method-discovermodules"],
        "purpose": "Job registration discovers module paths, imports modules and filters locally declared non-abstract BaseJob subclasses; this consumer does not use loadClass.",
    },
    "orionis/realtime/metadata.py": {
        "symbols": ["_method_plan"],
        "references": ["/advanced/introspection/callables#reflectioncallable-method-getsignature"],
        "purpose": "Realtime separately validates remote parameter annotations after obtaining an inspect.Signature.",
    },
}


def signature(node: ast.FunctionDef | ast.AsyncFunctionDef) -> str:
    """Record normalized parameter kinds, defaults, annotations and returns."""
    result = ("async " if isinstance(node, ast.AsyncFunctionDef) else "")
    result += node.name + "(" + ast.unparse(node.args) + ")"
    return result + (" -> " + ast.unparse(node.returns) if node.returns else "")


def class_signature(node: ast.ClassDef) -> str:
    """Record class bases without importing or executing framework code."""
    bases = [ast.unparse(base) for base in node.bases]
    bases.extend(ast.unparse(item) for item in node.keywords)
    return "class " + node.name + ("(" + ", ".join(bases) + ")" if bases else "")


def declared_names(node: ast.AST) -> list[str]:
    """Return simple declaration names, excluding attribute cache assignments."""
    if isinstance(node, ast.AnnAssign):
        return [node.target.id] if isinstance(node.target, ast.Name) else []
    if isinstance(node, ast.Assign):
        return [target.id for target in node.targets if isinstance(target, ast.Name)]
    return []


def is_dunder(name: str) -> bool:
    return name.startswith("__") and name.endswith("__")


def anchor(owner: str, name: str, kind: str = "method") -> str:
    return owner.lower() + "-" + kind + "-" + name.strip("_").replace("_", "-").lower()


def extract(framework: Path) -> dict:
    """Extract only explicitly reviewed declarations and supporting checksums."""
    actual_paths = sorted(path.relative_to(framework).as_posix()
                          for path in (framework / "orionis/introspection").rglob("*.py"))
    if actual_paths != sorted(REVIEWED_MODULES):
        raise ValueError("Introspection Python module scope changed; review explicit mappings before --write.")
    tests = sorted(path.relative_to(framework).as_posix()
                   for path in (framework / "tests/introspection").rglob("test_*.py"))
    if tests != list(NATIVE_TEST_FILES):
        raise ValueError("Introspection native test scope changed; review the exact test-file list before --write.")
    hashes, trees = {}, {}

    def read(source: str) -> ast.Module:
        if source not in trees:
            text = (framework / source).read_text(encoding="utf-8").replace("\r\n", "\n")
            hashes[source] = hashlib.sha256(text.encode("utf-8")).hexdigest()
            trees[source] = ast.parse(text, filename=source)
        return trees[source]

    def entry(source: str, node: ast.AST, owner: str, kind: str, name: str | None = None) -> dict:
        page_id, destination = CLASS_GUIDES[owner]
        result = {
            "source": source, "symbol": owner + ("." + name if name else ""),
            "kind": kind, "line": node.lineno,
            "signature": signature(node) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
                else class_signature(node) if isinstance(node, ast.ClassDef) else ast.unparse(node),
            "pageId": page_id,
            "reference": destination + ("#" + anchor(owner, name, "field" if kind == "field" else "method") if name else ""),
        }
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            result["decorators"] = [ast.unparse(item) for item in node.decorator_list]
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            result["async"] = isinstance(node, ast.AsyncFunctionDef)
        return result

    entries, contracts, excluded, plumbing, state = [], [], [], [], []
    per_class, exports = {}, {}
    for source, reviewed in REVIEWED_MODULES.items():
        tree = read(source)
        classes = {node.name: node for node in tree.body if isinstance(node, ast.ClassDef)}
        functions = {node.name: node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
        variables = [name for node in tree.body for name in declared_names(node)]
        if set(classes) != set(reviewed["classes"]) or set(functions) != set(reviewed["functions"]) or variables != reviewed["variables"]:
            raise ValueError(f"Unreviewed module declarations in {source}; review explicit mappings before --write.")
        for name, node in functions.items():
            item = {"source": source, "symbol": name, "line": node.lineno,
                    "signature": signature(node)}
            if source.endswith("/__init__.py"):
                plumbing.append({**item, "reference": "/advanced/introspection",
                                 "reason": "Lazy package export hook; not a native reflector method."})
            else:
                excluded.append({**item, "reason": "Private dependency analysis helper; observable behavior is documented through public reflection methods."})
        for name, cls in classes.items():
            spec = reviewed["classes"][name]
            methods = {node.name: node for node in cls.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
            class_variables = [field for node in cls.body for field in declared_names(node)]
            if set(methods) != set(spec["methods"]) or class_variables != spec["variables"]:
                raise ValueError(f"Unreviewed class API in {source}:{name}; review explicit mappings before --write.")
            if name.startswith("_"):
                excluded.append({"source": source, "symbol": name, "line": cls.lineno,
                                 "signature": class_signature(cls),
                                 "members": [signature(node) for node in methods.values()],
                                 "fields": class_variables,
                                 "reason": "Private scan buffer/classification record; not a user-facing reflector or data entity."})
                continue
            is_contract = "/contracts/" in source
            owner = name[1:] if is_contract else name
            if owner not in CLASS_GUIDES:
                raise ValueError(f"No reviewed documentation guide for {source}:{name}.")
            target = contracts if is_contract else entries
            class_entry = entry(source, cls, owner, "contract-class" if is_contract else "class")
            class_entry["symbol"] = name
            target.append(class_entry)
            public = [node for node in methods.values() if not node.name.startswith("_") or is_dunder(node.name)]
            if not is_contract:
                if len(public) != EXPECTED_CLASS_METHOD_COUNTS[owner]:
                    raise ValueError(f"Reviewed own-method count changed: {owner}.")
                per_class[owner] = {
                    "source": source, "publicMethods": sum(not node.name.startswith("_") for node in public),
                    "implementedDunders": sum(is_dunder(node.name) for node in public),
                    "totalOwnMethods": len(public),
                }
            for method in public:
                kind = "contract-method" if is_contract else "constructor" if method.name == "__init__" else "special-method" if is_dunder(method.name) else "method"
                item = entry(source, method, owner, kind, method.name)
                item["symbol"] = name + "." + method.name
                target.append(item)
            for method in methods.values():
                if method not in public:
                    excluded.append({"source": source, "symbol": name + "." + method.name,
                                     "line": method.lineno, "signature": signature(method),
                                     "reason": "Private member scanning/classification implementation helper."})
            for node in cls.body:
                for field in declared_names(node):
                    if not field.startswith("_"):
                        if is_contract or owner not in {"Signature", "Argument"}:
                            raise ValueError(f"Unmapped public class attribute: {source}:{name}.{field}.")
                        target.append(entry(source, node, owner, "field", field))
                    else:
                        state.append({"source": source, "symbol": name + "." + field,
                                      "signature": ast.unparse(node),
                                      "reason": "Private cache or Python layout metadata; not a public functional declaration."})
        for node in tree.body:
            for name in declared_names(node):
                if not name.startswith("_"):
                    raise ValueError(f"Unmapped public module constant: {source}:{name}.")
                state.append({"source": source, "symbol": name, "signature": ast.unparse(node),
                              "reason": "Private module constant, export table or cache implementation state."})
        if source == "orionis/introspection/__init__.py":
            assignments = {name: node.value for node in tree.body for name in declared_names(node)}
            names = ast.literal_eval(assignments["__all__"])
            destinations = ast.literal_eval(assignments["_EXPORTS"])
            if names != EXPECTED_EXPORTS or set(destinations) != set(names):
                raise ValueError("Curated introspection exports changed; review explicit package imports before --write.")
            exports[source] = {"names": names, "destinations": {key: list(value) for key, value in destinations.items()}}

    integrations = []
    for source, spec in INTEGRATIONS.items():
        tree = read(source)
        declarations = {}
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                declarations[node.name] = node
            elif isinstance(node, ast.ClassDef):
                declarations.update({node.name + "." + member.name: member for member in node.body
                                     if isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef))})
        missing = set(spec["symbols"]) - set(declarations)
        if missing:
            raise ValueError(f"Reviewed integration declarations missing in {source}: {sorted(missing)}")
        integrations.append({"source": source, "purpose": spec["purpose"], "references": spec["references"],
                             "reviewedSymbols": [{"symbol": symbol, "signature": signature(declarations[symbol])}
                                                 for symbol in spec["symbols"]]})

    test_entries = []
    for source in NATIVE_TEST_FILES:
        tree = read(source)
        tests = sum(isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and member.name.startswith("test")
                    for cls in tree.body if isinstance(cls, ast.ClassDef) for member in cls.body)
        test_entries.append({"source": source, "declaredTestMethods": tests})
    counts = Counter(item["kind"] for item in entries)
    return {
        "schemaVersion": 1,
        "scope": "The complete native orionis/introspection Python package: own public methods, implemented dunders, public classes and twelve Argument/Signature fields. Contracts, generated dataclass behavior, inherited APIs, lazy exports, private helpers and reviewed framework consumers are tracked separately and never inflate the native method total. Native test declarations are a discovery snapshot, not an execution claim.",
        "nativeSources": actual_paths,
        "counts": {
            "mappedNativeDeclarations": len(entries), "publicClasses": counts["class"],
            "ownMethods": counts["method"] + counts["special-method"] + counts["constructor"],
            "publicMethods": counts["method"],
            "implementedDunders": counts["special-method"] + counts["constructor"],
            "entityFields": counts["field"], "nativePythonSources": len(actual_paths),
            "contractClasses": sum(item["kind"] == "contract-class" for item in contracts),
            "contractMethods": sum(item["kind"] == "contract-method" for item in contracts),
            "privateDeclarationsExcluded": len(excluded), "packageHooksSeparate": len(plumbing),
            "nativeTestFiles": len(test_entries),
            "declaredNativeTestMethods": sum(item["declaredTestMethods"] for item in test_entries),
        },
        "perClass": dict(sorted(per_class.items())),
        "hashes": dict(sorted(hashes.items())),
        "exports": exports,
        "contracts": contracts,
        "integrations": integrations,
        "nativeTests": {"scope": "Exactly seventeen native introspection test modules; only AST-declared test methods are counted here.", "files": test_entries},
        "excludedDeclarations": excluded,
        "internalStateExcluded": state,
        "packagePlumbing": plumbing,
        "generatedApi": [
            {"owner": "Argument", "reference": "/advanced/introspection/dependencies-and-discovery#argument-generated-protocols",
             "decorator": "dataclass(slots=True, kw_only=True, frozen=True)",
             "methods": ["__init__", "__repr__", "__eq__", "__hash__", "__setattr__", "__delattr__", "__replace__", "__getstate__", "__setstate__"],
             "note": "Generated by Python dataclasses; initialization validates through the separately counted explicit __post_init__. Hashing requires hashable field values."},
            {"owner": "Signature", "reference": "/advanced/introspection/dependencies-and-discovery#signature-generated-protocols",
             "decorator": "dataclass(frozen=True, kw_only=True)",
             "methods": ["__init__", "__repr__", "__eq__", "__hash__", "__setattr__", "__delattr__", "__replace__"],
             "note": "Generated methods are not native source declarations. Frozen fields still contain mutable dictionaries, which also make the generated hash fail for ordinary signatures."},
        ],
        "inheritedApi": [{
            "owner": "Signature", "origin": "orionis.support.entities.base.BaseEntity",
            "methods": ["getFields"],
            "reference": "/advanced/introspection/dependencies-and-discovery#signature-method-getfields",
            "note": "Inherited getFields describes dataclass fields; Signature.toDict is an explicit override and is counted among its own methods.",
        }],
        "entries": entries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", required=True, type=Path)
    parser.add_argument("--write", action="store_true", help="Refresh a reviewed snapshot; unreviewed symbols still fail.")
    args = parser.parse_args()
    try:
        actual = extract(args.framework_root.resolve())
    except (ValueError, OSError, SyntaxError) as error:
        raise SystemExit(str(error)) from error
    if args.write:
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    elif not MANIFEST.exists():
        raise SystemExit("Missing reviewed introspection inventory. Review mappings before explicitly using --write.")
    else:
        reviewed = json.loads(MANIFEST.read_text(encoding="utf-8"))
        if actual != reviewed:
            raise SystemExit("Introspection source changed: review source, signatures, mappings and guides before explicitly refreshing with --write.")
    count = actual["counts"]
    print(f"Introspection source verified: {count['ownMethods']} own methods, {count['entityFields']} fields, "
          f"{count['publicClasses']} public classes, {count['contractMethods']} contract methods, "
          f"{count['nativePythonSources']} native modules and {len(actual['hashes'])} hashed files.")


if __name__ == "__main__":
    main()
