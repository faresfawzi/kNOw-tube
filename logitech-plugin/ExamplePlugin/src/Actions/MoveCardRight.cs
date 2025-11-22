
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

        // add a function that can be called from another class and sets the display name
        private String _display = "Move it";
        public void SetDisplay(String display)
        {
            this._display = display;
            this.ActionImageChanged();
        }

        // This method is called when Loupedeck needs to show the command on the console or the UI.
        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize)
        {
            WebSocketServerHost.Broadcast("getKeyText");

            return $"Hi Nandu{Environment.NewLine}{this._display}";
        }   
    }
}