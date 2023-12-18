import type { InvokeArgs } from '@tauri-apps/api/tauri'
import { invoke } from '@tauri-apps/api/tauri'

interface CustomTauriCommands {
  greet: {
    request: { name: string }
    response: string
  }
}

const typedInvoke: <
  Command extends keyof CustomTauriCommands,
  RequestArgs extends InvokeArgs = CustomTauriCommands[Command]['request'],
  Response = CustomTauriCommands[Command]['response'],
>(
  command: Command,
  args: RequestArgs,
) => Promise<Response> = invoke

export default typedInvoke
