namespace Loupedeck.ExamplePlugin
{
    using System;
    using System.Timers;

    using System.Net.Http;

    

    public class AnswerCommand : PluginDynamicCommand
    {
        private static Timer aTimer;

        // Initializes the command class.
        public AnswerCommand()
            : base()
        {
            // set a timer that runs a function every second
            // Create a timer with a two second interval.
            aTimer = new Timer(250);
            // Hook up the Elapsed event for the timer. 
            aTimer.Elapsed += this.OnTimedEvent;
            aTimer.AutoReset = true;
            aTimer.Enabled = true;

            // // make a loop for 9 answers
            for (var i = 1; i <= 9; i++)
            {
                this.AddParameter(i.ToString(), $"", "Quiz Answers");
            }
        }

        private void OnTimedEvent(Object source, ElapsedEventArgs e)
        {
            this.ActionImageChanged(); // Notify the plugin service that the command display name and/or image has changed.
        }

        // This method is called when the user executes the command.
        protected override void RunCommand(String actionParameter)
        {
            PluginLog.Info($"Sending chat message: {actionParameter}");
            WebSocketServerHost.Broadcast($"option{actionParameter}");
        }

        // // This method is called when Loupedeck needs to show the command on the console or the UI.
        // protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize)
        // {
            
            
        // } 
            
        protected override BitmapImage GetCommandImage(String actionParameter, PluginImageSize imageSize)
        {
            using (var bitmapBuilder = new BitmapBuilder(imageSize))
            {
                var client = new HttpClient();
                var result = client.GetStringAsync($"http://localhost:8000/color/{actionParameter}").GetAwaiter().GetResult();

                BitmapColor? color = null;
                switch (result.ToLower())
                {
                    case "red":
                        color = BitmapColor.Red;
                        break;
                    case "green":
                        color = BitmapColor.Green;
                        break;
                    case "blue":
                        color = BitmapColor.Blue;
                        break;
                }

                if (color != null)
                {
                    bitmapBuilder.FillRectangle(0, 0, 128, 128, color.Value);
                }
                else
                {

                    var actionrResult = client.GetStringAsync($"http://localhost:8000/action/{actionParameter}").GetAwaiter().GetResult();
                    PluginLog.Info($"Getting answer text for: {actionParameter} - Result: {actionrResult}");
                    bitmapBuilder.DrawText( $"{actionrResult}");
                }

                return bitmapBuilder.ToImage();
            }
        }
    }
}
