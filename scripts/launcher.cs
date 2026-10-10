using System;
using System.Diagnostics;
using System.IO;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        string baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
        string localDataDirectory = Path.Combine(baseDirectory, ".userdata");
        Directory.CreateDirectory(localDataDirectory);

        Environment.SetEnvironmentVariable("APPDATA", localDataDirectory, EnvironmentVariableTarget.Process);
        Environment.SetEnvironmentVariable("LOCALAPPDATA", localDataDirectory, EnvironmentVariableTarget.Process);

        string corePath = Path.Combine(baseDirectory, "习惯打卡站-core.exe");
        if (!File.Exists(corePath))
        {
            return;
        }

        ProcessStartInfo startInfo = new ProcessStartInfo(corePath)
        {
            UseShellExecute = false,
            WorkingDirectory = baseDirectory,
            CreateNoWindow = true
        };

        Process.Start(startInfo);
    }
}
