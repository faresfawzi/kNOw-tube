
namespace Loupedeck.ExamplePlugin
{
    using System;

    public class MoveCardRight : PluginDynamicCommand
    {
        public MoveCardRight()
            : base(displayName: "Move Card Right", description: "Moves the card to the right", groupName: "Card Movement")
        {
        }

        protected override void RunCommand(String actionParameter)
        {
            PluginLog.Info("Move Card Right button pressed");

            WebSocketServerHost.Broadcast("moveRight");
        }
    }
}