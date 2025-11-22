using WatsonWebsocket;
using Loupedeck.ExamplePlugin;

public static class WebSocketServerHost
{
    private static WatsonWsServer server;

    public static void Start()
    {
        server = new WatsonWsServer("localhost", 5005, false);

        PluginLog.Info("Server starting on ws://localhost:5005");

        server.ClientConnected += (s, e) =>
        {
            PluginLog.Info("Client connected: " + e.Client.IpPort);
        };

        server.MessageReceived += (s, e) =>
        {
            var msg = System.Text.Encoding.UTF8.GetString(e.Data.Array, e.Data.Offset, e.Data.Count);
            PluginLog.Info("Received: " + msg);

            // // get Actions objects from ExamplePluginObject
            // var MoveCardRight = ExamplePlugin.Instance.Actions.GetCommand<MoveCardRight>("Loupedeck.ExamplePlugin.MoveCardRight");
            // // Print message on button for movecardright
            // MoveCardRight.SetDisplay(msg);
            // Echo back (equivalent to LogiService behavior)
            server.SendAsync(e.Client.Guid, "Echo: " + msg);
        };

        server.Start();
    }

    public static void Stop()
    {
        server?.Stop();
    }

    public static void Broadcast(string msg)
    {
        if (server == null)
        {
            return;
        }

        foreach (var client in server.ListClients())
        {
            server.SendAsync(client.Guid, msg);
        }
    }
}
