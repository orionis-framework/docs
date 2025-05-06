---
title: Reflecting on an Instance
editLink: true
outline: deep
---

# Reflecting on an Instance

In this guide, we will explore how to leverage the reflection capabilities provided by the Orionis Framework to inspect and interact with a class instance. This feature is particularly valuable for dynamically accessing attributes, invoking methods, and building advanced tools such as ORMs, API generators, or documentation utilities.

## Why Use Reflection?

Reflection enables developers to examine the structure and behavior of objects at runtime. With the Orionis Framework, you can effortlessly retrieve information about an instance’s attributes, methods, and even its class inheritance hierarchy.

## Example Class for Demonstration

To demonstrate the concepts covered in this guide, we will use the following example class:

```python
import asyncio

class BaseFakeClass:
    pass

class FakeClass(BaseFakeClass):
    """This is a test class for ReflexionInstance."""

    class_attr: str = "class_value"

    def __init__(self) -> None:
        self.public_attr = 42
        self._protected_attr = "protected"
        self.__private_attr = "private"
        self.dynamic_attr = None

    def instanceMethod(self, x: int, y: int) -> int:
        """Adds two numbers."""
        return x + y

    @property
    def computed_property(self) -> str:
        """A computed property."""
        return f"Value: {self.public_attr}"

    @classmethod
    def classMethod(cls) -> str:
        """A class method."""
        return f"Class attr: {cls.class_attr}"

    @staticmethod
    def staticMethod(text: str) -> str:
        """A static method."""
        return text.upper()

    @staticmethod
    async def staticAsyncMethod(text: str) -> str:
        """An asynchronous static method."""
        await asyncio.sleep(0.1)
        return text.upper()

    def __privateMethod(self) -> str:
        """A 'private' method."""
        return "This is private"

    def _protectedMethod(self) -> str:
        """A 'protected' method."""
        return "This is protected"

    async def asyncMethod(self) -> str:
        """An async method."""
        return "This is async"
```

## Reflecting on an Instance

### `getClassName` Method

The `getClassName` method provides a simple way to retrieve the name of an instance’s class. This is especially useful when working with dynamic or polymorphic objects.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from folder.module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the class name
class_name = reflex.getClassName()
print(class_name)  # Output: "FakeClass"
```

### `getClass` Method

The `getClass` method grants access to the class of the instantiated object. This can be useful for performing introspection or when you need to work directly with the class rather than the instance.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from folder.module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Get the class of the instance
clazz = reflex.getClass()
print(clazz)  # Output: <class 'folder.module.FakeClass'>
```

### `getModuleName` Method

The `getModuleName` method returns the name of the module where the class is defined. This is useful for identifying the code's location and improving module organization in large-scale projects.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from folder.module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the module name
module_name = reflex.getModuleName()
print(module_name)  # Output: "folder.module"
```

### `getAttributes` Method

The `getAttributes` method returns a dictionary containing all attributes of an instance, including both public and private ones. This is particularly useful for dynamically inspecting an object’s state or for building advanced tools such as serializers or debuggers.

In the following example, we use the `getAttributes` method to retrieve the attributes of a `FakeClass` instance:

```python
from orionis.luminate.support.inspection.reflection import Reflection
from folder.module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the instance attributes
attributes = reflex.getAttributes()

# Print the retrieved attributes
print(attributes)

# Output:
# {
#     "public_attr": 42,
#     "_protected_attr": "protected",
#     "__private_attr": "private",
#     "dynamic_attr": None
# }
```

### `getPublicAttributes` Method

The `getPublicAttributes` method returns a dictionary containing all public attributes of an instance. This is useful for identifying attributes that are intended for external access and manipulation.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from folder.module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the instance public attributes
attributes = reflex.getPublicAttributes()

# Print the retrieved attributes
print(attributes)

# Output:
# {
#     "public_attr": 42,
#     "dynamic_attr": None
# }
```

### `getPrivateAttributes` Method

The `getPrivateAttributes` method returns a dictionary containing all private attributes of an instance. This is useful for identifying attributes that are intended for internal use only and should not be accessed directly from outside the class.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from folder.module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the instance private attributes
attributes = reflex.getPrivateAttributes()

# Print the retrieved attributes
print(attributes)

# Output:
# {
#     "__private_attr": "private",
# }
```

### `getProtectedAttributes` Method

The `getProtectedAttributes` method returns a dictionary containing all protected attributes of an instance. This is useful for identifying attributes that are intended for internal use within the class or by subclasses.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from folder.module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the instance protected attributes
attributes = reflex.getProtectedAttributes()

# Print the retrieved attributes
print(attributes)

# Output:
# {
#     "_protected_attr": "protected",
# }
```

### `getMethods` Method

The `getMethods` method retrieves a list of all methods defined in an instance, including both public and private ones. This is especially useful for dynamically inspecting an object’s behavior, building advanced tools such as documentation generators or code analyzers, and gaining a deeper understanding of a class’s functionality.

In the following example, we use the `getMethods` method to retrieve the methods of a `FakeClass` instance:

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the instance methods
methods = reflex.getMethods()

# Print the retrieved methods
print(methods)

# Output:
# ['__privateMethod', '__init__', '_protectedMethod', 'asyncMethod', 'classMethod', 'instanceMethod']
```

In this example, the `getMethods` method returns a list of all method names available on the instance, including protected and private ones. This allows for detailed analysis of a class's behavior and structure.

### `getProtectedMethods` Method

The `getProtectedMethods` method returns a list of all protected methods in an instance. This is helpful for identifying methods that are not intended to be accessed externally, but may still be used by subclasses or within the class itself.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the protected methods
methods = reflex.getProtectedMethods()

# Print the retrieved methods
print(methods)

# Output:
# ['_protectedMethod']
```

### `getPrivateMethods` Method

The `getPrivateMethods` method returns a list of all private methods defined in an instance. This is useful for identifying methods that are strictly intended for internal use within the class.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the private methods
methods = reflex.getPrivateMethods()

# Print the retrieved methods
print(methods)

# Output:
# ['__privateMethod']
```

### `getAsyncMethods` Method

The `getAsyncMethods` method returns a list of all asynchronous methods defined in an instance. This is useful for identifying methods that can be invoked asynchronously, which is especially relevant in applications that rely on asynchronous programming or concurrency.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the asynchronous methods
methods = reflex.getAsyncMethods()

# Print the retrieved methods
print(methods)

# Output:
# ['asyncMethod']
```

### `getSyncMethods` Method

The `getSyncMethods` method returns a list of all synchronous methods defined in an instance. This is useful for identifying methods that execute sequentially and do not involve `async` or `await`.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the synchronous methods
methods = reflex.getSyncMethods()

# Print the retrieved methods
print(methods)

# Output:
# ['__privateMethod', '__init__', '_protectedMethod', 'classMethod', 'instanceMethod']
```

### `getClassMethods` Method

The `getClassMethods` method returns a list of all class methods defined in an instance. This is helpful for identifying methods that are bound to the class rather than the instance and do not rely on instance-specific data.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the class methods
methods = reflex.getClassMethods()

# Print the retrieved methods
print(methods)

# Output:
# ['classMethod']
```

### `getStaticMethods` Method

The `getStaticMethods` method returns a list of all static methods defined in an instance. This is useful for identifying methods that do not depend on the instance's state and can be invoked without creating an object.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the static methods
methods = reflex.getStaticMethods()

# Print the retrieved methods
print(methods)

# Output:
# ['staticAsyncMethod', 'staticMethod']
```

### `getAsyncStaticMethods` Method

The `getAsyncStaticMethods` method returns a list of all asynchronous static methods defined in an instance. This is helpful for identifying methods that can be invoked asynchronously and do not rely on instance-level data.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the asynchronous static methods
methods = reflex.getAsyncStaticMethods()

# Print the retrieved methods
print(methods)

# Output:
# ['staticAsyncMethod']
```

### `getSyncStaticMethods` Method

The `getSyncStaticMethods` method returns a list of all synchronous static methods defined in an instance. This is useful for identifying static methods that execute sequentially and do not require `async` or `await`.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the synchronous static methods
methods = reflex.getSyncStaticMethods()

# Print the retrieved methods
print(methods)

# Output:
# ['staticMethod']
```

### `getPropertyNames` Method

The `getPropertyNames` method returns a list of the names of all properties defined in an instance. This is especially useful for identifying properties that can be accessed or modified directly, facilitating object introspection and dynamic manipulation.

In the following example, we use the `getPropertyNames` method to retrieve the properties of an instance of the `FakeClass`:

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the names of the instance's properties
properties = reflex.getPropertyNames()

# Print the retrieved property names
print(properties)

# Output:
# [
#   'computed_property'
# ]
```

**Note:** In Python, properties are special attributes defined using decorators like `@property`. These properties encapsulate logic that executes when getting or setting a value, making them ideal for use cases requiring controlled data access.

---

### `getProperty` Method

The `getProperty` method returns the value of a specific property of an instance. This is useful for accessing properties that may have custom logic during read or write operations.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the value of a specific property
prop = reflex.getProperty("computed_property")

# Print the value
print(prop)

# Output:
# "Value: 42"
```

---

### `getPropertySignature` Method

The `getPropertySignature` method returns the signature of a specific property of an instance. This is helpful for understanding the structure and parameters of a property without needing to inspect its implementation.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Retrieve the signature of a specific property
sign = reflex.getPropertySignature("computed_property")

# Print the property signature
print(sign)

# Output:
# "(self) -> str"
```

### `callMethod` Method

The `callMethod` method dynamically invokes a method on an instance. This is useful when you need to execute methods without knowing their names at compile time, enabling the development of generic tools or dynamic object manipulation.

This method handles both synchronous and asynchronous method execution depending on the nature of the target method.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

# Call a synchronous method
result = reflex.callMethod("instanceMethod", 1, 2)
print(result)  # Output: 3

# Call an asynchronous method
async def main():
    result = await reflex.callMethod("asyncMethod")
    print(result)  # Output: "This is async"
```

**Note:**

* If the method is **asynchronous** and called inside an event loop, it must be awaited.
* If the method is **asynchronous** and no event loop is running, a new loop will be created and executed automatically.
* If the method is **synchronous**, it will be executed immediately without `await`.

Understanding these differences is crucial to avoid runtime errors when working with both synchronous and asynchronous code.

### `getMethodSignature` Method

The `getMethodSignature` method returns the signature of a specific method of an instance. This helps to understand the parameters and return type of the method without inspecting the actual implementation.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

signature = reflex.getMethodSignature("instanceMethod")
print(signature)  # Output: "(x: int, y: int) -> int"

signature = reflex.getMethodSignature("staticMethod")
print(signature)  # Output: "(text: str) -> str"

signature = reflex.getMethodSignature("__privateMethod")
print(signature)  # Output: "() -> str"
```

### `getMethodDocstring` Method

The `getMethodDocstring` method retrieves the docstring of a specific method of an instance. This is useful to understand the purpose and usage of a method without looking at its code.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

docstring = reflex.getDocstring()
print(docstring)  # Output: "This is a test class for ReflexionInstance."
```

### `getBaseClasses` Method

The `getBaseClasses` method returns a tuple of all base classes of an instance. This is helpful for understanding class hierarchy and inheritance relationships.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

reflex = Reflection.instance(FakeClass())
base_classes = reflex.getBaseClasses()
print(base_classes)  # Output: (<class 'folder.module.BaseFakeClass'>,)
```

### `isInstanceOf` Method

The `isInstanceOf` method checks if the instance is of a specific type or a subclass thereof. This is useful for runtime type validation and enforcing interface contracts.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass, BaseFakeClass

reflex = Reflection.instance(FakeClass())
verify = reflex.isInstanceOf(BaseFakeClass)
print(verify)  # Output: True
```

### `getSourceCode` Method

The `getSourceCode` method returns the source code of the instance's class. This is particularly useful for documentation, debugging, or educational tools.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

reflex = Reflection.instance(FakeClass())
code = reflex.getSourceCode()
print(code)  # Output: "class FakeClass(BaseFakeClass): ..."
```

### `getFileLocation` Method

The `getFileLocation` method returns the file path where the class of the instance is defined. This is helpful for navigating codebases and organizing modules.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

reflex = Reflection.instance(FakeClass())
file = reflex.getFileLocation()
print(file)  # Output: "/path/to/folder/module.py"
```

### `getAnnotations` Method

The `getAnnotations` method returns a dictionary containing all type annotations defined in the instance. This includes both public and private annotations, and is useful for dynamic inspection or tools like serializers and debuggers.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

reflex = Reflection.instance(FakeClass())
annotations = reflex.getAnnotations()
print(annotations)  # Output: {'class_attr': <class 'str'>}
```

### `hasAttribute` Method

The `hasAttribute` method checks whether an instance contains a specific attribute. This helps to avoid runtime errors by verifying the existence of attributes before accessing them.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

reflex = Reflection.instance(FakeClass())
print(reflex.hasAttribute("public_attr"))        # Output: True
print(reflex.hasAttribute("non_existent_attr"))  # Output: False
```

### `getAttribute` Method

The `getAttribute` method retrieves the value of a specific attribute from an instance. This is particularly useful when accessing attributes that may involve property logic or dynamic resolution.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

# Create a Reflection instance for the target object
reflex = Reflection.instance(FakeClass())

attr_value = reflex.getAttribute("public_attr")
print(attr_value)  # Output: 42
```

This method safely accesses the underlying value, even if it’s managed by a property or descriptor.

### `setAttribute` Method

The `setAttribute` method sets the value of a specific attribute on an instance. This is useful for modifying internal state, even when attributes are controlled via property setters or other custom logic.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

reflex = Reflection.instance(FakeClass())

reflex.setAttribute("new_attr", "Orionis")
attr_value = reflex.getAttribute("new_attr")
print(attr_value)  # Output: "Orionis"
```

This method supports creating or overwriting existing attributes, making it useful for injecting values or mocking behavior in test scenarios.

### `removeAttribute` Method

The `removeAttribute` method deletes a specific attribute from an instance. This is useful for cleaning up dynamic attributes or resetting the state of an object.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass

reflex = Reflection.instance(FakeClass())

reflex.setAttribute("temp_attr", "Temporary")
attr_value = reflex.getAttribute("temp_attr")
print(attr_value)  # Output: "Temporary"
```

This method allows you to remove attributes that were added dynamically or to reset the state of an object.

### `setMacro` Method

The `setMacro` method dynamically attaches a method to an instance. This enables runtime augmentation of an object’s behavior, ideal for plugin systems, mocking, or extending functionality without modifying the class definition.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass
import asyncio

reflex = Reflection.instance(FakeClass())

# Define an asynchronous macro method
async def asyncMacro(cls: FakeClass, num):
    await asyncio.sleep(0.1)
    return cls.instanceMethod(10, 12) + num

# Register the macro on the instance
reflex.setMacro("asyncMacro", asyncMacro)

# Call the macro using callMethod
result = await reflex.callMethod("asyncMacro", reflex._instance, 3)
print(result)  # Output: 25

# Define a synchronous macro method
def syncMacro(cls: FakeClass, num):
    return cls.instanceMethod(10, 12) + num

reflex.setMacro("syncMacro", syncMacro)
result = reflex.callMethod("syncMacro", reflex._instance, 2)
print(result)  # Output: 24
```

Macros can be either asynchronous or synchronous and are attached at runtime using a simple interface. They behave like native methods for the duration of their registration.

### `removeMacro` Method

The `removeMacro` method detaches a previously registered macro from an instance. This is useful for undoing dynamic changes and ensuring that objects revert to their original state.

```python
from orionis.luminate.support.inspection.reflection import Reflection
from origin_module import FakeClass
import asyncio

reflex = Reflection.instance(FakeClass())

async def asyncMacro(cls: FakeClass, num):
    await asyncio.sleep(0.1)
    return cls.instanceMethod(10, 12) + num

reflex.setMacro("asyncMacro", asyncMacro)
result = await reflex.callMethod("asyncMacro", reflex._instance, 3)
print(result)  # Output: 25

# Remove the macro from the instance
reflex.removeMacro("asyncMacro")
```