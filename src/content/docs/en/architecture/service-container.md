---
title: Service Container
---

# Service Container

The **Service Container** in `Orionis Framework` is a robust solution for dependency management in your applications. Its flexible architecture allows you to register and resolve services efficiently, promoting collaboration between components without unnecessary coupling.

## Advantages of using the service container

- **Automatic dependency injection:** The container creates and manages instances for you, eliminating the need to handle dependencies manually.
- **Modular and scalable design:** Facilitates the development of clean and maintainable applications, where each component is independent and reusable.
- **Advanced lifecycle management:** Allows you to register services as *singleton*, *scoped*, or *transient*, adapting the lifecycle according to your application's requirements.
- **Intelligent dependency resolution:** Automatically analyzes and resolves the dependencies needed for each service.

The service container in `Orionis Framework` is inspired by solutions from well-known frameworks such as Laravel (PHP), Symfony (PHP), Spring (Java), and .NET Core (C#), offering an optimized experience tailored for the Orionis ecosystem.

## What is a service container?

A **service container** is a central component in software architecture that manages the creation, configuration, and lifecycle of objects and their dependencies. It acts as a centralized registry where services (classes or components) and their relationships can be defined, allowing dependencies to be injected automatically when requested.

### Main features

- **Inversion of Control (IoC):** The container takes control of object creation instead of objects creating themselves.
- **Dependency Injection (DI):** Objects receive their dependencies from the outside rather than creating them internally.
- **Automatic lifecycle management:** The container decides when to create, maintain, and destroy service instances.
- **Decoupling:** Reduces dependency between classes, making maintenance and testing easier.

## What lifecycles does the service container support?

The service container in `Orionis Framework` supports three lifecycles for registered services, adapting to different application needs:

### Singleton
A single instance of the service is created and shared throughout the application. This instance remains in memory for the entire duration of the application's execution.

**When to use:**
- Configuration services
- Logging services
- Stateless services

### Scoped
A new instance of the service is created for each specific scope or context. By default, this means one instance per HTTP request in web applications.

**When to use:**
- Services that maintain state during a request
- Authentication services
- User context services

### Transient
Each time the service is requested, a new instance is created. This is the lightest lifecycle in terms of memory management.

**When to use:**
- Lightweight, stateless services
- Calculation or processing services
- Services that do not require persistence

## What is required to register a service?

To register a service in the `Orionis Framework` service container, two mandatory components are required:

- **Contract (Interface):** Specifies the functionality the service must implement, but does not define how it is implemented. It defines "what" the service should do.
- **Implementation (Class):** Provides the concrete logic that fulfills the contract defined by the interface. It defines "how" the work is done.

### Benefits of this separation:
- **Flexibility:** Allows changing the implementation without affecting the code that uses the service
- **Testability:** Makes it easier to create mocks and stubs for unit testing
- **Maintainability:** Code becomes easier to maintain and extend

Below is a basic and clear example of how to define and register a service in the `Orionis Framework` service container.

### Service Definition

**Contract (Interface)**
```python
from abc import ABC, abstractmethod

class IEmailService(ABC):

    @abstractmethod
    def configure(self, subject: str, body: str, to: str) -> None:
        """Configures the email parameters."""
        pass

    @abstractmethod
    def send(self) -> bool:
        """Sends the email and returns True if successful."""
        pass
```

**Implementation (Class)**
```python
from module import IEmailService

class EmailService(IEmailService):

    def configure(self, subject: str, body: str, to: str) -> None:
        """Configures the email parameters."""
        self._subject = subject
        self._body = body
        self._to = to

    def send(self) -> bool:
        """Sends the email and returns True if successful."""
        # Here would go the actual sending logic using SMTP
        return True
```

**Important**: For the service registration to be successful, the implementation class must comply with the contract defined by the interface. This ensures that all expected functionalities are present and correctly implemented. If the contract is not fully met, the service container will throw an exception indicating the breach.

## How to register a service in the container?

### Singleton

To register a service with a *singleton* lifecycle, use the `singleton` method available on the application instance. With this lifecycle, a single instance of the service will be created and reused throughout the application.

#### Method signature

The signature of the `singleton` method is as follows:
```python
(method) def singleton(
    abstract: (...) -> Any,
    concrete: (...) -> Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```

#### Parameters

- **`abstract`**: The interface or abstract class that defines the service contract.
- **`concrete`**: The concrete class that implements the service.
- **`alias`** (optional): An alternative name to register the service. Must be a string.
- **`enforce_decoupling`** (optional): If set to `True`, the container will verify that the concrete class fulfills the contract defined by the interface, but without requiring direct implementation in the class, promoting greater decoupling. **Rarely used in practice**, however, `Orionis` is flexible enough to allow it.

#### Usage example

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

# Create the application instance
app: IApplication = Application()

# Register the service as singleton
app.singleton(IEmailService, EmailService)

# Start the application
app.create()
```

#### Registration with alias

If you want to use an alias to register the service:

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Register with alias (use named parameter)
app.singleton(IEmailService, EmailService, alias="EmailServiceProvider")

app.create()
```

> **Important:** The `alias` parameter must be passed as a named argument. Passing it as the third positional parameter will result in a type error.

### Scoped

To register a service with a *scoped* lifecycle, use the `scoped` method available on the application instance. With this lifecycle, a new instance of the service will be created for each specific scope or context (by default, each HTTP or Console request).

#### Method signature

The signature of the `scoped` method is as follows:
```python
(method) def scoped(
    abstract: (...) -> Any,
    concrete: (...) -> Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```
#### Parameters

The parameters are identical to those of the `singleton` method:

- **`abstract`**: The interface or abstract class that defines the service contract.
- **`concrete`**: The concrete class that implements the service.
- **`alias`** (optional): An alternative name to register the service.
- **`enforce_decoupling`** (optional): If set to `True`, the container will verify that the concrete class fulfills the contract defined by the interface, but without requiring direct implementation in the class, promoting greater decoupling. **Rarely used in practice**, however, `Orionis` is flexible enough to allow it.

#### Usage example

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Register the service as scoped
app.scoped(IEmailService, EmailService)

app.create()
```

#### Registration with alias

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Register with alias
app.scoped(IEmailService, EmailService, alias="EmailServiceProvider")

app.create()
```

### Transient

To register a service with a *transient* lifecycle, use the `transient` method available on the application instance. With this lifecycle, a new instance of the service will be created every time it is requested.

#### Method signature

The signature of the `transient` method is as follows:

```python
(method) def transient(
    abstract: (...) -> Any,
    concrete: (...) -> Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```

#### Parameters

The parameters are identical to the previous methods:

- **`abstract`**: The interface or abstract class that defines the service contract.
- **`concrete`**: The concrete class that implements the service.
- **`alias`** (optional): An alternative name to register the service.
- **`enforce_decoupling`** (optional): If set to `True`, the container will verify that the concrete class fulfills the contract defined by the interface, but without requiring direct implementation in the class, promoting greater decoupling. **Rarely used in practice**, however, `Orionis` is flexible enough to allow it.

#### Usage example

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Register the service as transient
app.transient(IEmailService, EmailService)

app.create()
```

#### Registration with alias

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Register with alias
app.transient(IEmailService, EmailService, alias="EmailServiceProvider")

app.create()
```

## Other features of the service container

Although the main methods for registering services are `singleton`, `scoped`, and `transient`, the `Orionis Framework` service container offers additional functionalities to enhance dependency management:

### Instances

You can register a specific instance of a service using the `instance` method. This is useful when you already have a created instance and want the container to use it.

#### Method signature

The signature of the `instance` method is as follows:

```python
(method) def instance(
    abstract: (...) -> Any,
    instance: Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```

#### Parameters

The parameters are identical to the previous methods:

- **`abstract`**: The interface or abstract class that defines the service contract.
- **`instance`**: The specific instance of the service you want to register, already initialized.
- **`alias`** (optional): An alternative name to register the service.
- **`enforce_decoupling`** (optional): If set to `True`, the container will verify that the concrete class fulfills the contract defined by the interface, but without requiring direct implementation in the class, promoting greater decoupling. **Rarely used in practice**, however, `Orionis` is flexible enough to allow it.

#### Is this a Singleton?

Registering a specific instance with the `instance` method can be considered similar to a singleton in the sense that the same instance is reused every time the service is requested. However, the key difference is that with `instance`, you provide the already created instance, while with `singleton`, the container is responsible for creating and managing the instance.

#### Usage example

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Register a specific instance
app.instance(IEmailService, EmailService())

app.create()
```

#### Registration with alias

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Register an instance with alias
app.instance(IEmailService, EmailService(), alias="EmailServiceProvider")

app.create()
```

### Scoped Instance

You can register a specific instance of a service with a *scoped* lifecycle using the `scopedInstance` method. This is useful when you want a particular instance to be used within a specific scope.
As you can see, this is different from `instance`, since `instance` is a global instance reused throughout the application, while `scopedInstance` is an instance reused only within a specific scope.

```python
(method) def scopedInstance(
    abstract: (...) -> Any,
    instance: Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```

#### Parameters

The parameters are identical to the previous methods:

- **`abstract`**: The interface or abstract class that defines the service contract.
- **`instance`**: The specific instance of the service you want to register, already initialized.
- **`alias`** (optional): An alternative name to register the service.
- **`enforce_decoupling`** (optional): If set to `True`, the container will verify that the concrete class fulfills the contract defined by the interface, but without requiring direct implementation in the class, promoting greater decoupling. **Rarely used in practice**, however, `Orionis` is flexible enough to allow it.

#### Usage example

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Register a specific instance as scoped
app.scopedInstance(IEmailService, EmailService())

app.create()
```
#### Registration with alias

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Register a scoped instance with alias
app.scopedInstance(IEmailService, EmailService(), alias="EmailServiceProvider")

# Start the application
app.create()
```

### Callable

Can you register a service using a function?
Yes, it is possible to register a service using a function or any *callable* object. This is useful when you need to customize the creation of the service, for example, by applying dynamic configurations or additional logic before instantiating it.

> **Recommendation:** Although *callables* offer flexibility, it is recommended to register services using classes to maintain a clear and coherent architecture. The use of functions as services should be reserved for very specific cases.

**Important limitations:**
- The container will automatically inject the dependencies required by the *callable*.
- It cannot be used with *singleton* or *scoped* lifecycles due to the dynamic nature of *callables*.

Use this option only when you really need to manually control the creation of the service.

#### Method signature

Improved usage example

Suppose you have a function that reports errors by sending an email. You can register this function as a *callable* service in the container:

```python
# app/helpers.py
def report_error(email_service: IEmailService, logger: ILoggerService, error_message: str) -> bool:
    email_service.configure(
        subject='Application Error',
        body=error_message,
        to='raulmauriciounate@gmail.com'
    )
    return email_service.send()
```

Then, register the function in the container using the `callable` method:

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication
from app.helpers import report_error

app: IApplication = Application()

# Register the function as a callable service with alias
app.callable(report_error, alias="report_error")

# Start the application
app.create()
```

This way, you can inject and reuse the `report_error` function anywhere in your application, taking advantage of the container's automatic dependency resolution.

## Best practices

To make the most of the `Orionis Framework` service container, consider the following best practices when defining and registering your services:

### 1. Interface naming
Use the "I" prefix for interfaces, followed by the service name:
```python
class IEmailService(ABC): pass
class IUserService(ABC): pass
class ILoggerService(ABC): pass
```

### 2. Use of `Service Providers`
Register related services in dedicated service providers to keep your code organized and modular.
See the [Service Providers](../service-providers) section for more details.

### 3. Choosing the correct lifecycle
- **Singleton**: For services that are expensive to create or maintain global state
- **Scoped**: For services that need to maintain state during an operation
- **Transient**: For lightweight, stateless services

### 4. Avoid circular dependencies
Make sure your services do not depend on each other in a circular way, as this can cause issues during resolution.

## How to resolve a registered service

Once a service has been registered in the service container, you can resolve and inject it anywhere in your application using the container's automatic dependency injection functionality.

### In a class constructor

**The most common way** to resolve and inject a registered service is through a class constructor. The service container will automatically analyze the required dependencies and provide the corresponding instances when a class instance is created.

This makes it very simple and clean to use services in your controllers, services, or other application components.

```python
# app/http/controllers/user_controller.py
class UserController(Controller):

    def __init__(
        self,
        email_service: IEmailService,
        logger: ILoggerService
    ) -> None:
        """
        email_service (IEmailService): Service for sending emails.
        logger (ILoggerService): Service for logging events and errors.
        """
        self._email_service = email_service
        self._logger = logger

    def sendWelcomeEmail(
        self,
        user_email: str
    ) -> bool:
        """
        Sends a welcome email to the specified user.
        Configures the email with default subject and body, and sends it to the provided email.
        Returns True if the sending was successful, False otherwise.
        """

        # Configure the already injected email service
        self._email_service.configure(
            subject='Welcome to Orionis Framework',
            body='Thank you for registering!',
            to=user_email
        )

        # Send the email and log the result
        result = self._email_service.send()

        # Log the result using the injected logging service
        if result:
            self._logger.log(f'Welcome email sent to {user_email}')
        else:
            self._logger.log(f'Failed to send welcome email to {user_email}')

        # Return the sending result
        return result
```
#### What happens here?

Well, the `Orionis Framework` dependency container automatically resolves the `IEmailService` and `ILoggerService` dependencies when an instance of `UserController` is created. There is no need to manually instantiate these services; the container injects them automatically, making dependency management easier and promoting a clean, decoupled design.

Simply create an instance of `UserController` and the container will handle the rest.

### In Class Methods

You can inject dependencies directly into your class methods using the `Orionis Framework` service container. This is especially useful for functions or methods that require specific services without needing to store them as class attributes.

Here is an example of how to do this:

```python
# app/http/controllers/user_controller.py
class UserController(Controller):

    def sendWelcomeEmail(
        self,
        email_service: IEmailService,
        user_email: str
    ) -> bool:
        """
        Sends a welcome email to the specified user.
        Configures the email with default subject and body, and sends it to the provided email.
        Returns True if the sending was successful, False otherwise.
        """

        # Configure the already injected email service
        email_service.configure(
            subject='Welcome to Orionis Framework',
            body='Thank you for registering!',
            to=user_email
        )

        # Send the email and return the result
        return email_service.send()
```

In this example, the `sendWelcomeEmail` method receives an instance of `IEmailService` as a parameter. The service container automatically injects the correct implementation when the method is called, allowing you to use the service without needing to store it as a class attribute.

You only need to pass the other required parameters to the method, and the container will manage the dependencies for you.

### Manually resolving a service

If you need to manually resolve a registered service, you can do so using the `make` method available on the application facade instance. This method allows you to obtain an instance of the service registered in the container.

You can resolve it using either the contract (interface) or the alias with which it was registered.

Example usage:

```python
from orionis.support.facades.application import Application
from module import IEmailService

# Resolve the service using the contract (interface)
email_service: IEmailService = Application.make(IEmailService)

# Resolve the service using the alias
email_service_alias: IEmailService = Application.make("EmailServiceProvider")
```

Here, we are typing the variable `email_service` as `IEmailService` to indicate that we expect an instance implementing that interface. The service container will provide the correct implementation registered previously.

### Resolving a *callable* service

You can resolve a service registered as a *callable* using the `make` method just like with other services. The service container will execute the *callable* and automatically provide the necessary dependencies.

Example usage:

```python
from orionis.support.facades.application import Application
from module import IEmailService

# Always resolve using the alias
email_service_alias = Application.make(
    "report_error",
    error_message="Error connecting to the database"
)
```

In this example, we are resolving the *callable* registered with the alias `"report_error"` and passing an error message as an additional argument. The container will automatically inject the dependencies required by the `report_error` function and execute the function with the provided parameters.

<aside aria-label="Important" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm0-8c-.83 0-1.5-.67-1.5-1.5S11.17 6 12 6s1.5.67 1.5 1.5S12.83 9 12 9z"/>
</svg>
Alert!
</p>
<div class="starlight-aside__content">
<p>When directly resolving a <strong>callable</strong>, make sure to pass additional parameters that are not container dependencies <strong>using their name</strong> in the <code>make</code> method, as shown in the example. Do not pass them as positional arguments, as this may cause unexpected errors.</p>
</div>
</aside>

## Validate service registration

If you need to check whether a service has been registered in the service container, you can use the `bound` method available on the application instance. This method allows you to verify if a specific service is registered, either by its contract (interface) or by its alias.

#### Method signature
```python
(method) def bound(
    abstract_or_alias: Any
) -> bool
```

#### Parameters
- **`abstract_or_alias`**: The interface, abstract class, or alias of the service you want to check.

#### Example usage

```python
# Check if the service is registered using the contract (interface)
is_registered = app.bound(IEmailService)

# Check if the service is registered using the alias
is_registered_alias = app.bound("EmailServiceProvider")
```

## Get a registered service

If you need to obtain detailed information about a service registered in the container, you can use the `getBinding` method available on the application instance. This method returns an instance of `orionis.container.entities.binding.Binding` that allows you to access the complete definition of the service, including its lifecycle, implementation, and other configurations.

```python
# Get the service using the contract (interface)
service = app.getBinding(IEmailService)

# Get the service using the alias
service = app.getBinding("EmailServiceProvider")

# Access the details of the registered service
print(service)

# Example of expected output
# Binding(
#     contract=...,
#     concrete=...,
#     instance=...,
#     function=...,
#     lifetime=...,
#     enforce_decoupling=...,
#     alias=...
# )
```

## Remove a registered service

If you need to remove a service registered in the service container, you can use the `drop` method available on the application instance. This method allows you to delete a specific service, either by its contract (interface) or by its alias.

<aside aria-label="Important" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm0-8c-.83 0-1.5-.67-1.5-1.5S11.17 6 12 6s1.5.67 1.5 1.5S12.83 9 12 9z"/>
</svg>
Attention!
</p>
<div class="starlight-aside__content">
<p>Use this method with caution. Removing native framework services or services that are dependencies of other components can cause serious errors in the application. Make sure you fully understand the implications before removing any registered service.</p>
</div>
</aside>

#### Method signature
```python
(method) def drop(
    self,
    abstract: Callable[..., Any] = None,
    alias: str = None
) -> bool
```

#### Parameters
- **`abstract`** (optional): The interface or abstract class of the service you want to remove.
- **`alias`** (optional): The alias of the service you want to remove.

#### Example usage

```python
# Remove the service using the contract (interface)
app.drop(abstract=IEmailService)

# Remove the service using the alias
app.drop(alias="EmailServiceProvider")
```

## Manually create a scope

In advanced scenarios, you may need to manually create a new scope. This is useful when you want to explicitly manage the lifecycle of services, especially in contexts where it is not handled automatically, such as background tasks or custom processes.

Although `Orionis Framework` automatically manages scopes in HTTP and console requests, you can manually create a new scope using the `createContext` method available on the application instance.

#### Example usage

```python
# Manually create a new scope
with app.createContext():

    # Within this block, a new scope is created
    email_service: IEmailService = app.make(IEmailService)
```

All services registered with a *scoped* lifecycle within the `with` block will share the same instance during the context's duration. When exiting the block, the scope will be closed and the *scoped* instances will be released.

Make sure you understand scope management well to avoid memory issues or references to instances that are no longer valid outside the created context.

## Resolve dependencies of a Binding

If you need to resolve the dependencies of a service registered in the container, you can use the `resolveDependencies` method available on the application instance. This way, the container will automatically analyze and resolve all the dependencies required for the specified service.

#### Method signature
```python
(method) def resolve(
        self,
        binding: Binding,
        *args,
        **kwargs
) -> Any
```

#### Parameters
- **`binding`**: The `Binding` instance representing the service registered in the container.
- **`*args`**: Additional positional arguments that may be required to resolve dependencies.
- **`**kwargs`**: Additional named arguments that may be required to resolve dependencies.

#### Example usage

```python
# Get the binding of the service
binding = app.getBinding(IEmailService)

# Resolve the dependencies of the service
email_service: IEmailService = app.resolve(binding)
```

## Call a method with dependency injection

If you need to call a specific method of a class and want the service container to automatically inject the required dependencies for that method, you can use the `call` method available on the application instance. This is especially useful when you want to execute a method without manually instantiating the class or managing its dependencies.

#### Method signature
```python
(method) def call(
    self,
    instance: Any,
    method_name: str,
    *args,
    **kwargs
) -> Any
```

#### Parameters
- **`instance`**: The instance of the class containing the method you want to call.
- **`method_name`**: The name of the method you want to execute.
- **`*args`**: Additional positional arguments that may be required for the method.
- **`**kwargs`**: Additional named arguments that may be required for the method.

#### Example usage

```python
# Create an instance of the class
user_controller = UserController()

# Call the method with dependency injection
result = app.call(user_controller, "sendWelcomeEmail", user_email="webmaster@domain.co")
```

#### Asynchronous Variant

If the method you want to call is asynchronous, you can use the `callAsync` method available on the application instance. This allows you to execute asynchronous methods with automatic dependency injection. Its signature and usage are similar to the `call` method, but it is designed to work with asynchronous functions; however, even if the method is asynchronous, the `call` method will also work correctly.

## Execute From Outside the Container

### Resolve functions (*Callable*)

In situations where you need to execute a function or method from outside the service container but still want to take advantage of automatic dependency injection, you can use the `invoke` method available on the application instance. This is useful for executing standalone functions that require services managed by the container.

#### Method signature
```python
(method) def invoke(
    self,
    fn: Callable,
    *args,
    **kwargs
) -> Any
```

#### Parameters
- **`fn`**: The function or method you want to execute.
- **`*args`**: Additional positional arguments that may be required for the function.
- **`**kwargs`**: Additional named arguments that may be required for the function.
#### Example usage

```python
# Example function to execute
def log_error(logger: ILoggerService, message: str) -> None:
    logger.error(message)

# Execute the function with dependency injection
result = app.invoke(
    log_error,
    message="Critical system error"
)
```

#### Asynchronous Variant

If the function you want to execute is asynchronous, you can use the `invokeAsync` method available on the application instance. This allows you to execute asynchronous functions with automatic dependency injection. Although the `invoke` method will also work correctly with asynchronous functions, `invokeAsync` is optimized for this purpose.

### Resolving Classes

If you need to create an instance of a class from outside the service container, but want the container to handle automatic dependency injection, you can use the `build` method available on the application instance. This is useful for instantiating classes that require services managed by the container.

#### Method signature
```python
(method) def build(
    self,
    type_: Callable[..., Any],
    *args,
    **kwargs
) -> Any
```

#### Parameters
- **`type_`**: The class you want to instantiate.
- **`*args`**: Additional positional arguments that may be required for the class constructor.
- **`**kwargs`**: Additional named arguments that may be required for the class constructor.

#### Usage example

```python
# Create an instance of UserController with dependency injection
user_controller: UserController = app.build(UserController)
```