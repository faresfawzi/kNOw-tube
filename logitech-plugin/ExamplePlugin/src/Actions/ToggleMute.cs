
namespace Loupedeck.ExamplePlugin
{
    using System;

    public class ToggleMuteCommand : PluginDynamicCommand
    {
        public ToggleMuteCommand()
            : base(displayName: "Toggle Mute", description: "Mutes and unmutes system volume", groupName: "Audio")
        {
        }

        protected override void RunCommand(String actionParameter)
        {
            PluginLog.Info("Button pressed");

            WebSocketServerHost.Broadcast("mute_toggled");
        }
    }
}