
namespace Loupedeck.ExamplePlugin
{
    using System;


    public class ToggleMuteCommand : PluginDynamicCommand
    {   

        public ToggleMuteCommand()
            : base(displayName: "", description: "Mutes and unmutes system volume", groupName: "Audio")
        {
            this.ActionImageChanged();
        }

        protected override void RunCommand(String actionParameter)
        {
            PluginLog.Info("Button pressed");
            this.ActionImageChanged();
            WebSocketServerHost.Broadcast("mute_toggled");
        }

        protected override BitmapImage GetCommandImage(String actionParameter, PluginImageSize imageSize)
        {
            using (var bitmapBuilder = new BitmapBuilder(imageSize))
            {
                // bitmapBuilder.SetBackgroundImage(PluginResources.ReadImage("MyPlugin.EmbeddedResources.MyImage.png"));
                bitmapBuilder.FillRectangle(0, 0, 128, 128, BitmapColor.Red);
                // bitmapBuilder.DrawText("My text");


                return bitmapBuilder.ToImage();
            }
        }
    
    }
}