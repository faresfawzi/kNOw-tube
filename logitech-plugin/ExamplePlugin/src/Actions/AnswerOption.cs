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
            aTimer = new Timer(1000);
            // Hook up the Elapsed event for the timer. 
            aTimer.Elapsed += this.OnTimedEvent;
            aTimer.AutoReset = true;
            aTimer.Enabled = true;


            this.AddParameter("1", $"Answer 1", "Quiz Answers");
            this.AddParameter("2", $"Answer 2", "Quiz Answers");
            this.AddParameter("3", $"Answer 3", "Quiz Answers");
            this.AddParameter("4", $"Answer 4", "Quiz Answers");
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

        // This method is called when Loupedeck needs to show the command on the console or the UI.
        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize)
        {
            
            var client = new HttpClient();
            var result = client.GetStringAsync($"http://localhost:8000/action/{actionParameter}").GetAwaiter().GetResult();
            return $"{result}";
        } 
            
    }
}
