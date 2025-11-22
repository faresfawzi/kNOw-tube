We use the [Logi Actions SDK](https://logitech.github.io/actions-sdk-docs/)

Install Logitech Options+ from https://www.logitech.com/de-ch/software/logi-options-plus.html (Wrong link in the SDK documentation)
Install Loupedeck Software from https://loupedeck.com/downloads/

For development:
Install the latest .NET 8 SDK:

You can download it from https://dotnet.microsoft.com/download/dotnet/8.0
dotnet tool install --global LogiPluginTool
logiplugintool generate Example
cd ExamplePlugin
dotnet build

Maybe you need to create the Plugins dir

cd ~/Library/Application\ Support/Logi/LogiPluginService/ 
mkdir Plugins

In VS CODE install C# Dev Kit extension