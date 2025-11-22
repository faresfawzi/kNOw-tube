namespace Loupedeck.ExamplePlugin
{
    using System;

    // This class implements an example adjustment that counts the rotation ticks of a dial.

    public class NormalScroll : PluginDynamicAdjustment
    {
        // This variable holds the current value of the counter.
        private Int32 _counter = 0;

        // Initializes the adjustment class.
        // When `hasReset` is set to true, a reset command is automatically created for this adjustment.
        public NormalScroll()
            : base(displayName: "Small wheel", description: "Counts rotation ticks", groupName: "Adjustments", hasReset: true)
        {
        }

        // This method is called when the adjustment is executed.
        protected override void ApplyAdjustment(String actionParameter, Int32 diff)
        {
            this._counter += diff; // Increase or decrease the counter by the number of ticks.
            this.AdjustmentValueChanged(); // Notify the plugin service that the adjustment value has changed.
            WebSocketServerHost.Broadcast("smallWheel_" + diff.ToString());

            PluginLog.Info("Adjusted: " + diff);
        }

        // This method is called when the reset command related to the adjustment is executed.
        protected override void RunCommand(String actionParameter)
        {
            this._counter = 0; // Reset the counter.
            this.AdjustmentValueChanged(); // Notify the plugin service that the adjustment value has changed.
        }

        // Returns the adjustment value that is shown next to the dial.
        protected override String GetAdjustmentValue(String actionParameter) => this._counter.ToString();
    }
}
