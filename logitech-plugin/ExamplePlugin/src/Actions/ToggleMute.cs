
namespace Loupedeck.ExamplePlugin
{
    using System;


    public class ToggleMuteCommand : PluginDynamicCommand
    {
        private readonly String _imageResourcePathThumbUp;
        private readonly String _imageResourcePathThumbDown;

        public ToggleMuteCommand()
            : base(displayName: "Toggle Mute", description: "Mutes and unmutes system volume", groupName: "Audio")
        {
            
            PluginLog.Info("ToggleMuteCommand initialized");
            // this._imageResourcePathThumbUp = PluginResources.FindFile("ThumbUp.png");
            // PluginLog.Info(this._imageResourcePathThumbUp.ToString());
            // this._imageResourcePathThumbDown = PluginResources.FindFile("ThumbDown.png");
            this.ActionImageChanged();
        }

        protected override void RunCommand(String actionParameter)
        {
            PluginLog.Info("Button pressed");
            this.ActionImageChanged();
            // print pwd
            PluginLog.Info(" bdshjbd " + Environment.CurrentDirectory);
            WebSocketServerHost.Broadcast("mute_toggled");
        }

        protected override BitmapImage GetCommandImage(String actionParameter, PluginImageSize imageSize)
        {
            // var resourcePath = true ? this._imageResourcePathThumbDown : this._imageResourcePathThumbUp;

            PluginLog.Info(" update ");
            Plugin

            return PluginResources.ReadImage("/Users/dominikglandorf/Code/EPFL/kNOw-tube/logitech-plugin/ExamplePlugin/src/Actions/images/ThumbUp.png");
        }
    }
}