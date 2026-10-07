param(
    [string]$TargetTitle = "Antigravity"
)

# Inyector Win32 de aborto de turno para Antigravity IDE.
# OJO CRÍTICO: El atajo nativo para cancelar lo que está haciendo el agente es CTRL + D.
# Jamás usar Ctrl+C acá porque no aborta el turno del agente en la ventana de chat.

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class Win32AgentAborter {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    public const uint KEYEVENTF_KEYUP = 0x0002;
    public const byte VK_CONTROL = 0x11; // Ctrl key
    public const byte VK_D = 0x44;       // D key

    public static IntPtr FoundHwnd = IntPtr.Zero;

    public static bool FindWindowCallback(IntPtr hWnd, IntPtr lParam) {
        StringBuilder classSb = new StringBuilder(256);
        GetClassName(hWnd, classSb, 256);
        string className = classSb.ToString();

        if (className == "Chrome_WidgetWin_1") {
            StringBuilder textSb = new StringBuilder(512);
            GetWindowText(hWnd, textSb, 512);
            string title = textSb.ToString();

            if (title.IndexOf("Antigravity", StringComparison.OrdinalIgnoreCase) >= 0) {
                FoundHwnd = hWnd;
                return false;
            }
        }
        return true;
    }

    public static bool BringToFront(IntPtr hWnd) {
        IntPtr fgHwnd = GetForegroundWindow();
        if (fgHwnd == hWnd) return true;

        uint fgThread = GetWindowThreadProcessId(fgHwnd, out _);
        uint curThread = GetCurrentThreadId();

        AttachThreadInput(curThread, fgThread, true);
        bool res = SetForegroundWindow(hWnd);
        AttachThreadInput(curThread, fgThread, false);
        return res;
    }

    public static void SendCtrlD() {
        // Presionamos Control
        keybd_event(VK_CONTROL, 0, 0, UIntPtr.Zero);
        System.Threading.Thread.Sleep(50);

        // Presionamos 'D'
        keybd_event(VK_D, 0, 0, UIntPtr.Zero);
        System.Threading.Thread.Sleep(50);

        // Soltamos 'D'
        keybd_event(VK_D, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        System.Threading.Thread.Sleep(50);

        // Soltamos Control
        keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
    }
}
"@ -ErrorAction SilentlyContinue

[Win32AgentAborter]::FoundHwnd = [IntPtr]::Zero
[Win32AgentAborter]::EnumWindows([Win32AgentAborter+EnumWindowsProc][Win32AgentAborter]::FindWindowCallback, [IntPtr]::Zero)

$targetHwnd = [Win32AgentAborter]::FoundHwnd

if ($targetHwnd -ne [IntPtr]::Zero) {
    [Win32AgentAborter]::BringToFront($targetHwnd)
    Start-Sleep -Milliseconds 150
    [Win32AgentAborter]::SendCtrlD()
    Write-Output "SUCCESS: Ctrl+D injected to Antigravity IDE ($targetHwnd)"
} else {
    Write-Output "WARNING: Antigravity IDE window not found. Skipped Win32 Ctrl+D."
}
